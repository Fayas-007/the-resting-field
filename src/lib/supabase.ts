import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Not fatal: the static seed data still renders, and the burial form /
  // admin page degrade to a clear "not configured" state instead of a blank
  // screen. See SETUP.md.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — live submissions, " +
      "the admin queue, and the flag button are disabled until they are. See SETUP.md.",
  );
}

/**
 * `null` when the env vars above aren't set. Every call site must handle
 * that — this is what lets the rest of the site work before the backend is
 * wired up, rather than crashing on a missing key.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
