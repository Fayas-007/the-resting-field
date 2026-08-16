// Public Turnstile site key for the production widget. This is safe to ship in
// the client bundle; the matching secret stays in Supabase as TURNSTILE_SECRET_KEY.
export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "0x4AAAAAAEQidwVFQ690bHRa";
