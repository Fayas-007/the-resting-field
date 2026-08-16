# Going live: what you need to do

Everything in this repo is written and wired up. The pieces below can only be
done by you — they need accounts, secrets, or decisions that aren't mine to
make. Nothing on the site breaks if you skip a step; each one degrades to a
clear "not configured" message instead of crashing (see **Current state
without any setup** at the bottom).

## 1. Create a Supabase project (required for moderation to work at all)

1. Sign up / log in at [supabase.com](https://supabase.com) and create a new
   project. Free tier is enough for this.
2. In the SQL Editor, paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates the `submissions`, `admins`, `submission_rate_limits`, and
   `flag_events` tables with row-level security already locked down — public
   visitors can only ever read `status = 'approved'` rows, and cannot write
   directly at all. Read the comments at the top of that file; they explain
   why it's structured this way.
3. In **Project Settings → API**, copy the **Project URL** and **anon
   public** key.
4. Add them to your `.env` (copy `.env.example` to `.env` first):
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## 2. Make yourself an admin

In the SQL Editor, run:
```sql
insert into public.admins (email) values ('you@example.com');
```
Use the email you'll sign into `/admin` with. That's the entire access
control — the `admins` table is what an RLS policy checks, not a role or a
hardcoded email in code, so you add/remove admins by editing this one table.

Email sign-in (magic link / OTP) is enabled by default on new Supabase
projects. If you've changed your auth settings, confirm **Email** provider →
**Enable email provider** is on, under Authentication → Providers.

## 3. Deploy the two Edge Functions

These are what actually enforce validation, the honeypot, rate limiting, and
Turnstile — the client cannot write to `submissions` directly, on purpose.

With the [Supabase CLI](https://supabase.com/docs/guides/cli):
```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy submit-project
supabase functions deploy flag-project
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for
every deployed function — you don't set those yourself.

Recommended secret (improves the privacy of stored rate-limit hashes; the
functions work without it, falling back to the service-role key as salt
material):
```bash
supabase secrets set IP_HASH_SALT=$(openssl rand -hex 32)
```

No CLI? Paste each function's `index.ts` into the Dashboard's Edge Functions
editor instead — same result.

## 4. Cloudflare Turnstile (recommended before going public)

**You need to create this yourself — I can't generate it for you.**

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add
   site**. Any plan works, Turnstile itself is free.
2. You'll get two keys:
   - **Site key** → the production key is committed as a public fallback in
     `src/lib/turnstile.ts`, and you can override it with
     `VITE_TURNSTILE_SITE_KEY` in `.env` if you ever rotate it. This one is
     public by design, safe to ship in the bundle.
   - **Secret key** → set as an Edge Function secret, never in `.env`:
     ```bash
     supabase secrets set TURNSTILE_SECRET_KEY=your-secret-key
     ```

**Until you do this, the form still works** — honeypot + the 3/day IP rate
limit are both active regardless. Turnstile is the third layer, not the only
one. `submit-project` skips verification entirely (rather than failing
closed) when `TURNSTILE_SECRET_KEY` isn't set, specifically so launching
without it is a real option, not a broken one.

## 5. Deploy the frontend

The Vite app is a static build — deployable to Vercel, Netlify, Cloudflare
Pages, GitHub Pages, or anywhere else that serves static files. All dynamic
behaviour lives in Supabase, not in the frontend host, so the choice of host
doesn't matter here.

Whichever you pick, set these as environment variables in its dashboard (not
committed — see below):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TURNSTILE_SITE_KEY   (optional override, see step 4)
VITE_ADMIN_EMAIL          (optional — UI copy only, see note below)
```

One router thing to check with your host: this is a single-page app using
client-side routing (`/admin`, and the 404 page). Static hosts need a
rewrite rule sending unknown paths to `index.html` — Netlify/Vercel do this
automatically for Vite projects; Cloudflare Pages needs a `_redirects` file
(`/* /index.html 200`) if you don't already have one.

Once you know your real domain, add it as an Open Graph URL tag in
`index.html` (I left this out rather than ship a placeholder that would show
the wrong link in previews):
```html
<meta property="og:url" content="https://your-real-domain.com/" />
```

## 6. `.gitignore` — already handled, worth double-checking once

`.env`, `.env.*` (except `.env.example`) are gitignored. Before your first
commit with real keys, run `git status` and confirm no `.env` file is staged
— gitignore only stops files that aren't already tracked.

---

## About `VITE_ADMIN_EMAIL`

This is display text only (it's not currently read by any component, it's
scaffolding for if you want to show "signed in as" copy before login) — the
real access control is the `admins` table + Supabase's row-level security
from step 2. Anyone can read `VITE_*` variables out of the shipped JS bundle,
so nothing security-relevant should ever go in one; this project doesn't put
anything there that would matter if read.

## Current state without any setup

Right now, with no `.env` at all: the site's static seed data (the original
hand-authored coffins) renders exactly as before. The burial form shows
"Submissions are offline" and its submit button is disabled. `/admin` shows
"Supabase isn't configured yet" instead of a broken login form. No crashes,
no infinite spinners, no silent failures — every gap fails into a message
that says what's missing.

## Rate limiting, honeypot, and validation — enforced where

All three live in `supabase/functions/submit-project/index.ts`, which is the
*only* way a row can be inserted into `submissions` (there's no public
INSERT policy — see the migration). Client-side validation in
`BurialGround.tsx` exists purely for instant feedback; it is never the
security boundary, and the server re-checks everything independently.

- **Honeypot**: hidden `website` field, off-screen and unreachable by Tab. A
  filled value gets a fake-success response with no DB write.
- **Rate limit**: 3 accepted attempts per IP-hash per rolling 24h, tracked in
  `submission_rate_limits` (never exposed to any client, service-role only).
- **Validation/sanitization**: required fields, max lengths (name 80,
  epitaph 280, stack 120, repo URL 300), numeric bounds, HTML/control-char
  stripping, and a real `http(s)` URL check on the repo field — all
  server-side, all in that one function.
