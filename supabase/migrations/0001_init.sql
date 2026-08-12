-- The Digital Graveyard — moderation schema
--
-- Design notes:
--   * Nothing here trusts the client. Anonymous visitors get exactly one
--     capability: SELECT rows where status = 'approved'. That's what makes
--     "pending entries never render on public pages" a database guarantee
--     instead of a client-side filter someone could bypass by reading the
--     JS bundle.
--   * There is deliberately NO public INSERT policy on `submissions`. Every
--     write goes through the submit-project edge function, which is the one
--     place honeypot/validation/rate-limit/Turnstile checks live, and which
--     writes using the service-role key (bypasses RLS on purpose — it's the
--     trusted gate, not a bypass of one).
--   * IP hashes never live on `submissions` itself, because that table has a
--     public read policy. They live in `submission_rate_limits` /
--     `flag_events`, which carry no policies at all — service-role only.
--   * Run this once against a fresh Supabase project's SQL editor, or via
--     `supabase db push` if you're using the CLI.
--   * This migration grants table access explicitly rather than relying on
--     the dashboard's "Automatically expose new tables" toggle. That toggle
--     controls default privileges for tables created *after* it's set, which
--     means the same migration run against two projects with different
--     toggle states would end up with different access — a security-relevant
--     outcome that shouldn't depend on a checkbox someone might not notice.
--     `service_role` (what the Edge Functions use) bypasses RLS and grants
--     both, and needs neither — everything below is for `anon` /
--     `authenticated`, i.e. what browsers can reach directly.

-- No extensions required: gen_random_uuid() has been in Postgres core since
-- v13, and Supabase runs 15+. Not depending on pgcrypto keeps this migration
-- runnable anywhere, including a bare Postgres for testing.

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin allow-list. A row here is what makes an authenticated Supabase user
-- an admin — not a role, not a hardcoded email in a policy. Add/remove access
-- by adding/removing a row.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

alter table public.admins enable row level security;
-- No policies AND no grants: reachable only via the Supabase dashboard/SQL
-- editor or the service role. anon/authenticated get no table-level
-- privilege at all, so even is_admin()'s SECURITY DEFINER bypass (below) is
-- the *only* path in — there's nothing to grant here.

-- ---------------------------------------------------------------------------
-- Admin check, as a SECURITY DEFINER function.
--
-- This indirection is load-bearing, not stylistic. RLS is enforced inside
-- subqueries in policy expressions too, so a policy that inlined
-- `exists (select 1 from public.admins ...)` would hit `admins`' own RLS,
-- find no policy granting SELECT, get zero rows, and evaluate false for
-- everyone — including real admins. The failure is silent: you sign in and
-- the moderation queue is simply always empty.
--
-- SECURITY DEFINER runs the lookup as the function's owner, bypassing RLS on
-- `admins` for this one narrow purpose. search_path is pinned so the function
-- can't be redirected at a look-alike table on a different schema.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Submissions. Doubles as the moderation queue (status = 'pending') and the
-- live public data (status = 'approved'). 'rejected' rows are kept for audit
-- rather than deleted outright; use the admin Delete action to actually purge.
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  epitaph text not null,
  stack text not null default '',
  stars integer not null default 0,
  commits integer not null default 0,
  repo_url text,
  ground text not null default 'main',
  status text not null default 'pending',
  flagged boolean not null default false,
  flagged_at timestamptz,
  created_at timestamptz not null default now(),

  constraint submissions_ground_check check (ground in ('main', 'old')),
  constraint submissions_status_check check (status in ('pending', 'approved', 'rejected')),
  -- Mirrors the limits enforced in submit-project/index.ts. Belt and braces:
  -- even a row inserted by a future service-role script can't sneak past.
  constraint submissions_name_len check (char_length(name) between 1 and 80),
  constraint submissions_epitaph_len check (char_length(epitaph) between 1 and 280),
  constraint submissions_stack_len check (char_length(stack) <= 120),
  constraint submissions_repo_len check (repo_url is null or char_length(repo_url) <= 300),
  constraint submissions_stars_range check (stars between 0 and 1000000),
  constraint submissions_commits_range check (commits between 0 and 1000000)
);

create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_ground_idx on public.submissions (ground, status);
create index if not exists submissions_flagged_idx on public.submissions (flagged) where flagged = true;

alter table public.submissions enable row level security;

-- Public: approved rows only. This is the actual enforcement point.
create policy "public can read approved submissions"
  on public.submissions for select
  using (status = 'approved');

-- Admins: full read/write, gated by membership in public.admins rather than
-- a role, so access can be revoked without touching policy SQL. Goes through
-- is_admin() — see the note on that function for why it can't be inlined.
create policy "admins can read all submissions"
  on public.submissions for select
  to authenticated
  using (public.is_admin());

create policy "admins can update submissions"
  on public.submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete submissions"
  on public.submissions for delete
  to authenticated
  using (public.is_admin());

-- No INSERT policy at all — anon and authenticated both get denied by
-- default. Only the service role (submit-project function) can create rows.

-- Table-level grants. RLS then narrows what each of these can actually see
-- or touch — anon's SELECT is filtered to approved rows by the policy
-- above; authenticated's UPDATE/DELETE are filtered to is_admin() by the
-- policies above. No INSERT grant to either role, matching "no public
-- INSERT policy": there would be nothing for such a policy to permit.
grant select on public.submissions to anon, authenticated;
grant update, delete on public.submissions to authenticated;

-- ---------------------------------------------------------------------------
-- Rate limiting. One row per accepted submission attempt (not per success —
-- see the function). ip_hash is sha256(ip + a server-only salt), never the
-- raw address. No RLS policies: service-role only, never read by the client.
-- ---------------------------------------------------------------------------
create table if not exists public.submission_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists submission_rate_limits_lookup_idx
  on public.submission_rate_limits (ip_hash, created_at);

alter table public.submission_rate_limits enable row level security;
-- No policies and no grants: service-role only, same reasoning as `admins`.

-- ---------------------------------------------------------------------------
-- Flag guard. One row per (submission, visitor) flag — the flag-project
-- function checks for an existing row before honouring a new report, so the
-- same visitor can't dogpile a single project's flag count.
-- ---------------------------------------------------------------------------
create table if not exists public.flag_events (
  submission_id uuid not null references public.submissions (id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  primary key (submission_id, ip_hash)
);

alter table public.flag_events enable row level security;
-- No policies and no grants: service-role only, same reasoning as `admins`.
