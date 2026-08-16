// admin-login — gates magic-link sign-in to emails in `admins`.
//
// Supabase Auth's signInWithOtp will happily email a link to *any* address;
// RLS on `submissions` already stops a non-admin from seeing anything once
// signed in, but a stray magic link landing in a stranger's inbox is still
// unwanted. This checks `admins` first and only triggers the email for a
// match — the response is identical either way, so this endpoint can't be
// used to enumerate who's an admin.
//
// Deploy: supabase functions deploy admin-login

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://the-resting-field.vercel.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
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

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  // Same response whether or not the email is an admin — an error here
  // would itself confirm the address isn't on the list.
  if (!email) return json({ ok: true });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  if (admin) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${SITE_URL}/admin` },
    });
    if (error) console.error("admin magic link failed", error);
  }

  return json({ ok: true });
});
