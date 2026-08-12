# The Digital Graveyard

A municipal repository cemetery for the projects you abandoned. Every dead repo gets a
coffin; lift the lid to read its record. Visitors can bury their own — moderated before
they go live.

Built with React + Vite + TypeScript + Tailwind CSS + Framer Motion, backed by Supabase
(Postgres + Auth + Edge Functions) for submissions and moderation.

```bash
npm install
npm run dev
```

**Going live?** See [SETUP.md](SETUP.md) — it walks through the Supabase project,
Turnstile, and env vars only you can set up. The site runs and looks correct without any
of it; the burial form and `/admin` just show a clear "not configured" state until it's
done.

## Sections

| Order | Section               | What it does                                                                       |
| ----- | ---------------------- | ----------------------------------------------------------------------------------- |
| 1     | Gate                   | Full-viewport hero.                                                                 |
| 2     | Main Path              | Current projects — the static seed set plus any approved live submissions.          |
| 3     | Old Ground             | The oldest dead, on weathered wood/fog.                                             |
| 4     | Burial Ground          | The Burial Record form. Submissions are held for review, not shown immediately.     |
| 5     | Resurrection Chamber   | Press and hold to lift *The First One* out of the ground. Let go and it shuts.      |
| 6     | Footer                 | —                                                                                    |

`/admin` (not linked from the site) is the moderation queue — sign in with a magic link,
approve/reject pending submissions, review flagged ones.

## Submissions & moderation

Public submissions never touch the public pages directly. The flow:

1. The form posts to a Supabase Edge Function (`supabase/functions/submit-project`),
   which is the only thing allowed to write to the database — checks a honeypot field,
   validates and sanitizes every field server-side, rate-limits by IP (3/day), and
   optionally verifies Cloudflare Turnstile.
2. The row lands with `status: 'pending'`. Row-level security means the public API can
   only ever read `status: 'approved'` rows — this is a database guarantee, not a
   client-side filter.
3. An admin reviews it at `/admin` and approves, rejects, or deletes it.
4. Approved entries merge into Main Path alongside the static seed data.

Live entries also get a small **Report** control (`flagged: true`), surfaced in the
admin queue for review. Full schema and RLS policies are in
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — the comments
there explain the reasoning.

## The one asset you need

Save the cemetery-gate photograph as **`public/gate.png`** (or edit `GATE_PLATE` in
[`Gate.tsx`](src/components/Gate.tsx) to point elsewhere). If it's missing, the hero
falls back to pure black rather than showing a broken image. The plate is composited —
desaturated, contrast-pushed, scrimmed — so any colour in the source photo is stripped
and the page stays monochrome regardless of what image you use.

## Design

Pure black `#000` throughout, Inter for text, Instrument Serif italic for accent words,
`liquid-glass` for glass surfaces — no colour anywhere except a deliberate warm
candlelight tint in the Resurrection Chamber.

Design tokens live as HSL triplets in [`src/index.css`](src/index.css) and are wired to
Tailwind in [`tailwind.config.ts`](tailwind.config.ts). Sections share one motion rhythm
via the `fadeUp` helper in [`src/lib/animations.ts`](src/lib/animations.ts). Each of the
four grounds sections (Main Path, Old Ground, Burial Ground, Resurrection Chamber) has
its own photographic or procedural backdrop in `src/components/*Plate.tsx`.

## Content

Seed projects are plain data in [`src/data/projects.ts`](src/data/projects.ts). Live
submissions come from Supabase via [`src/lib/useApprovedProjects.ts`](src/lib/useApprovedProjects.ts)
and are merged with the seed set at render time — see
[`src/pages/Home.tsx`](src/pages/Home.tsx). Each coffin renders name → dates → epitaph →
`stack · stars★ · commits` → a repo button (`Open Repo`, or `No Repo Left` when no URL is
on file).

The Gate's `N interred` counter, its founding year, and the name-roll at its foot are all
derived live from the merged project list.
