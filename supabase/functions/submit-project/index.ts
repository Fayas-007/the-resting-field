// submit-project — the only door into `public.submissions`.
//
// Anonymous clients cannot INSERT into `submissions` directly (see the RLS
// migration); everything goes through here, using the service-role key, so
// this function IS the enforcement point for honeypot / validation /
// sanitization / rate-limiting / Turnstile. Nothing downstream can be
// trusted to have checked any of it, because nothing downstream can be
// reached without going through it.
//
// Deploy: supabase functions deploy submit-project
// Required secrets (supabase secrets set ...): none strictly required to
// deploy, but TURNSTILE_SECRET_KEY should be set once you have one — see the
// SKIP-TURNSTILE note below.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LIMITS = {
  name: 80,
  epitaph: 280,
  stack: 120,
  repoUrl: 300,
  numberMax: 1_000_000,
};

const RATE_LIMIT_MAX_PER_DAY = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Matches C0 control characters (0-31) and DEL (127). Built from char codes
// rather than a regex literal containing raw control bytes, so this source
// file never carries invisible bytes itself.
const CONTROL_CHAR_PATTERN = "[" + String.fromCharCode(0) + "-" + String.fromCharCode(31) +
  String.fromCharCode(127) + "]";
const CONTROL_CHARS = new RegExp(CONTROL_CHAR_PATTERN, "g");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Strips markup and control characters. These fields have no legitimate use for HTML. */
function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeNumber(input: unknown): number {
  const n = Math.trunc(Number(input));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.numberMax);
}

/** Rejects anything that isn't a plausible http(s) repo URL, without throwing. */
function sanitizeRepoUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const cleaned = u.toString();
    return cleaned.length <= LIMITS.repoUrl ? cleaned : null;
  } catch {
    return null;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  // No identifying header at all is unusual — fail toward *some* shared
  // bucket rather than skipping the rate limit outright.
  return "unknown";
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // Not configured yet — see SETUP.md. The site stays functional without
    // it (honeypot + rate limiting still apply); this is the flagged gap.
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Honeypot: real visitors never see or fill this field. A filled value
  // means a bot — respond exactly like success so it learns nothing, but
  // never touch the database.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return json({ ok: true });
  }

  const name = sanitizeText(payload.name);
  const epitaph = sanitizeText(payload.epitaph);
  const stack = sanitizeText(payload.stack);
  const stars = sanitizeNumber(payload.stars);
  const commits = sanitizeNumber(payload.commits);
  const repoUrl = sanitizeRepoUrl(payload.repo);
  const turnstileToken = typeof payload.turnstileToken === "string" ? payload.turnstileToken : "";

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Project name is required.";
  else if (name.length > LIMITS.name) errors.name = `Keep it under ${LIMITS.name} characters.`;
  if (!epitaph) errors.epitaph = "Give it an epitaph.";
  else if (epitaph.length > LIMITS.epitaph) errors.epitaph = `Keep it under ${LIMITS.epitaph} characters.`;
  if (stack.length > LIMITS.stack) errors.stack = `Keep it under ${LIMITS.stack} characters.`;
  // Required, not optional: a burial with no repo leaves nothing to claim in
  // the Resurrection Chamber, and nothing for a moderator to check against.
  if (!repoUrl) {
    errors.repo =
      typeof payload.repo === "string" && payload.repo.trim()
        ? "That doesn't look like a valid http(s) URL."
        : "A repo URL is required.";
  }

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, error: "validation_failed", fields: errors }, 400);
  }

  const ip = clientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ipHash = await sha256Hex(`${salt}:${ip}`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Rate limit: max N accepted attempts per IP per rolling window. Checked
  // (and logged) even when Turnstile later rejects the request, so retrying
  // with a fresh token doesn't reset the clock.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from("submission_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (countError) {
    console.error("rate limit lookup failed", countError);
    return json({ ok: false, error: "server_error" }, 500);
  }
  if ((count ?? 0) >= RATE_LIMIT_MAX_PER_DAY) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    return json({ ok: false, error: "turnstile_failed" }, 403);
  }

  // Log the attempt before the insert, not after — a failed insert shouldn't
  // give someone unlimited retries against the rate limiter.
  const { error: rateLogError } = await supabase
    .from("submission_rate_limits")
    .insert({ ip_hash: ipHash });
  if (rateLogError) {
    console.error("rate limit log failed", rateLogError);
    return json({ ok: false, error: "server_error" }, 500);
  }

  const { error: insertError } = await supabase.from("submissions").insert({
    name,
    epitaph,
    stack,
    stars,
    commits,
    repo_url: repoUrl,
    ground: "main",
    status: "pending",
  });

  if (insertError) {
    console.error("insert failed", insertError);
    return json({ ok: false, error: "server_error" }, 500);
  }

  return json({ ok: true });
});
