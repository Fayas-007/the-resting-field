/**
 * Runs supabase/migrations/0001_init.sql against a real Postgres (PGlite, a
 * WASM build that runs in-process) and asserts the security properties we
 * actually care about — rather than trusting that the SQL looks right.
 *
 * This is not a substitute for the real Supabase project. PGlite has no
 * `auth` schema and no `anon`/`authenticated` roles, so those are stubbed
 * below to match Supabase's shapes. What it does prove: the DDL is valid,
 * the constraints bite, and the RLS policies grant and deny to the right
 * roles — including the subtle case where a policy's subquery is itself
 * subject to RLS.
 *
 *   node scripts/verify-schema.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
let pass = 0;
let fail = 0;

const ok = (name) => {
  pass++;
  console.log(`  PASS  ${name}`);
};
const bad = (name, detail) => {
  fail++;
  console.log(`  FAIL  ${name}\n        ${detail}`);
};

async function expectOk(name, sql) {
  try {
    await db.exec(sql);
    ok(name);
  } catch (e) {
    bad(name, e.message);
  }
}

async function expectReject(name, sql) {
  try {
    await db.exec(sql);
    bad(name, "expected this to be rejected, but it succeeded");
  } catch {
    ok(name);
  }
}

/**
 * Runs `sql` as `role`, with a stubbed JWT email, and returns the rows.
 *
 * Session-level SET, not SET LOCAL: SET LOCAL only applies inside an explicit
 * transaction and is silently a no-op outside one — which would leave every
 * query running as the superuser, who bypasses RLS entirely and makes these
 * tests pass for the wrong reason.
 */
async function asRole(role, email, sql) {
  await db.exec(`set role ${role};`);
  await db.exec(`set request.jwt.email = '${email ?? ""}';`);
  try {
    const res = await db.query(sql);
    return res.rows;
  } finally {
    await db.exec("reset role;");
  }
}

console.log("\nSupabase schema verification (PGlite)\n");

// --- Stub the bits of Supabase that PGlite doesn't ship -------------------
console.log("Stubbing Supabase environment (auth schema, anon/authenticated roles)");
await db.exec(`
  create schema if not exists auth;
  -- Supabase's auth.jwt() returns the verified JWT claims as jsonb. Here it
  -- reads a GUC we set per-test, so we can impersonate different users.
  create or replace function auth.jwt() returns jsonb language sql stable as $$
    select jsonb_build_object('email', current_setting('request.jwt.email', true));
  $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $$;
`);

// --- The actual migration -------------------------------------------------
console.log("\nRunning migration 0001_init.sql");
const migration = readFileSync("supabase/migrations/0001_init.sql", "utf8");
try {
  await db.exec(migration);
  ok("migration applies cleanly");
} catch (e) {
  bad("migration applies cleanly", e.message);
  console.log("\nAborting — nothing below can be trusted if the DDL failed.\n");
  process.exit(1);
}

// No manual grants here on purpose: the migration itself now grants schema
// usage and table access explicitly (see the comment near the top of
// 0001_init.sql about not depending on the dashboard's "Automatically expose
// new tables" toggle). If that ever regresses, the RLS tests below should
// fail with "permission denied" rather than silently passing against grants
// this script added on their behalf.

// --- Seed ----------------------------------------------------------------
console.log("\nSeeding: one admin, one pending row, one approved row");
await db.exec(`insert into public.admins (email) values ('admin@example.com');`);
await db.exec(`
  insert into public.submissions (name, epitaph, stack, status)
  values ('Pending Project', 'Never saw daylight.', 'React', 'pending'),
         ('Approved Project', 'This one made it out.', 'Vue', 'approved');
`);
ok("seed data inserted");

// --- Constraints ---------------------------------------------------------
console.log("\nConstraints");
await expectReject(
  "rejects name longer than 80 chars",
  `insert into public.submissions (name, epitaph) values (repeat('x', 81), 'e');`,
);
await expectReject(
  "rejects epitaph longer than 280 chars",
  `insert into public.submissions (name, epitaph) values ('n', repeat('x', 281));`,
);
await expectReject(
  "rejects an unknown status value",
  `insert into public.submissions (name, epitaph, status) values ('n', 'e', 'live');`,
);
await expectReject(
  "rejects an unknown ground value",
  `insert into public.submissions (name, epitaph, ground) values ('n', 'e', 'moon');`,
);
await expectReject(
  "rejects negative stars",
  `insert into public.submissions (name, epitaph, stars) values ('n', 'e', -1);`,
);
await expectOk(
  "accepts a valid row",
  `insert into public.submissions (name, epitaph, stack, stars, commits) values ('Fine', 'Valid.', 'Go', 3, 9);`,
);

// --- RLS: the whole point ------------------------------------------------
console.log("\nRow-level security");

const anonRows = await asRole("anon", null, `select name, status from public.submissions;`);
if (anonRows.length > 0 && anonRows.every((r) => r.status === "approved")) {
  ok(`anon sees only approved rows (${anonRows.length} visible)`);
} else {
  bad("anon sees only approved rows", `got: ${JSON.stringify(anonRows)}`);
}

const anonSawPending = anonRows.some((r) => r.name === "Pending Project");
if (!anonSawPending) ok("anon cannot see pending submissions");
else bad("anon cannot see pending submissions", "pending row was visible to anon");

const strangerRows = await asRole(
  "authenticated",
  "notanadmin@example.com",
  `select name, status from public.submissions;`,
);
if (strangerRows.every((r) => r.status === "approved")) {
  ok("signed-in non-admin sees only approved rows");
} else {
  bad("signed-in non-admin sees only approved rows", JSON.stringify(strangerRows));
}

const adminRows = await asRole(
  "authenticated",
  "admin@example.com",
  `select name, status from public.submissions order by name;`,
);
const adminSeesPending = adminRows.some((r) => r.name === "Pending Project");
if (adminSeesPending) {
  ok(`admin sees pending rows (${adminRows.length} total visible)`);
} else {
  bad(
    "admin sees pending rows",
    `admin saw ${adminRows.length} rows, none pending — this is the is_admin()/RLS-in-subquery trap`,
  );
}

// --- Admin write path ----------------------------------------------------
console.log("\nAdmin actions");
try {
  await asRole(
    "authenticated",
    "admin@example.com",
    `update public.submissions set status = 'approved' where name = 'Pending Project';`,
  );
  const after = await db.query(
    `select status from public.submissions where name = 'Pending Project';`,
  );
  if (after.rows[0]?.status === "approved") ok("admin can approve a pending submission");
  else bad("admin can approve a pending submission", JSON.stringify(after.rows));
} catch (e) {
  bad("admin can approve a pending submission", e.message);
}

try {
  await asRole(
    "authenticated",
    "notanadmin@example.com",
    `update public.submissions set status = 'approved' where name = 'Fine';`,
  );
  const after = await db.query(`select status from public.submissions where name = 'Fine';`);
  if (after.rows[0]?.status === "approved") {
    bad("non-admin cannot approve", "a non-admin successfully approved a submission");
  } else {
    ok("non-admin cannot approve (update silently affected no rows)");
  }
} catch {
  ok("non-admin cannot approve (update rejected)");
}

// --- Private tables are private -----------------------------------------
console.log("\nService-role-only tables");
for (const table of ["submission_rate_limits", "flag_events", "admins"]) {
  const rows = await asRole("anon", null, `select count(*)::int as n from public.${table};`).catch(
    () => null,
  );
  if (rows === null || rows[0].n === 0) {
    ok(`anon cannot read ${table}`);
  } else {
    bad(`anon cannot read ${table}`, `anon read ${rows[0].n} rows`);
  }
}

// --- Flag dedupe ---------------------------------------------------------
console.log("\nFlag de-duplication");
const target = (await db.query(`select id from public.submissions limit 1;`)).rows[0].id;
await db.exec(
  `insert into public.flag_events (submission_id, ip_hash) values ('${target}', 'hash-abc');`,
);
await expectReject(
  "same visitor cannot flag the same project twice",
  `insert into public.flag_events (submission_id, ip_hash) values ('${target}', 'hash-abc');`,
);
await expectOk(
  "a different visitor can still flag it",
  `insert into public.flag_events (submission_id, ip_hash) values ('${target}', 'hash-xyz');`,
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
