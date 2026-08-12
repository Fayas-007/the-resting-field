// flag-project — lets a visitor report a live entry for admin review.
//
// Sets flagged = true on an approved submission. Anonymous, on purpose (this
// is a "something's wrong here" button, not an authenticated action) but
// guarded so the same visitor can't dogpile one project's flag repeatedly:
// flag_events has a (submission_id, ip_hash) primary key, so a second flag
// from the same visitor on the same project is just ignored.
//
// Deploy: supabase functions deploy flag-project

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  return "unknown";
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

  const id = typeof payload.id === "string" ? payload.id : "";
  if (!UUID_RE.test(id)) {
    return json({ ok: false, error: "invalid_id" }, 400);
  }

  const ip = clientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ipHash = await sha256Hex(`${salt}:${ip}`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Only ever flags rows the public can already see. Flagging a pending or
  // rejected row isn't a meaningful action and would leak its existence.
  const { data: existing, error: lookupError } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (lookupError) {
    console.error("flag lookup failed", lookupError);
    return json({ ok: false, error: "server_error" }, 500);
  }
  if (!existing) {
    return json({ ok: false, error: "not_found" }, 404);
  }

  const { error: eventError } = await supabase
    .from("flag_events")
    .insert({ submission_id: id, ip_hash: ipHash });

  if (eventError) {
    // Unique violation = this visitor already flagged this project. Treat it
    // as a quiet success rather than an error — the report already landed.
    if (eventError.code === "23505") {
      return json({ ok: true, already: true });
    }
    console.error("flag event insert failed", eventError);
    return json({ ok: false, error: "server_error" }, 500);
  }

  const { error: updateError } = await supabase
    .from("submissions")
    .update({ flagged: true, flagged_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("flag update failed", updateError);
    return json({ ok: false, error: "server_error" }, 500);
  }

  return json({ ok: true });
});
