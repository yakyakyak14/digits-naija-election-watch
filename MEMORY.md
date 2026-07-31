# DIGITs Election Watch — project state

## What this is

A citizen election-observation platform for Nigeria: live observer feeds curated by
a Command Center, real-time i-Witness citizen evidence, and accredited DIGEO
observer training. Watching, reading and training need no account; only commenting
and submitting evidence require sign-in.

## Deployment shape (important)

The app builds as a **client-rendered SPA** (`vite build` → `dist/`, SPA rewrites in
`vercel.json`). There is **no Node server** and the TanStack Start vite plugin is
deliberately not enabled — so `createServerFn` cannot be used. Anything that needs a
secret lives in a **Supabase Edge Function**:

- `supabase/functions/places` — Google Places proxy (`GOOGLE_PLACES_API`)
- `supabase/functions/livekit-token` — LiveKit token minting (`LIVEKIT_*`)

Deploy them with `npm run fn:deploy`. Do not reintroduce `*.functions.ts` server
functions unless the deployment model changes.

## Two traps in this codebase — do not reintroduce

**1. No `shellComponent` on the root route.** The app mounts client-side with
`createRoot(document.getElementById("root"))`, so a shell that renders
`<html><head><body>` puts a whole document inside a `<div>`. The browser discards
the invalid nesting, React's tree stops matching the DOM, and
`getParentHydrationBoundary` — which runs on every discrete event to resolve the
target's fiber — never terminates. Symptom: **any keypress on any page froze the
renderer** ("Page Unresponsive"). `<HeadContent />` is rendered inside
`RootComponent` instead; React 19 hoists `title`/`meta`/`link` into `document.head`
by itself. `<Scripts />` is SSR-only and not needed — `index.html` loads the entry.

**2. Realtime topics must be unique per hook instance.** `supabase.channel(topic)`
returns the *same* channel object for a repeated topic, so a second component
subscribing to a shared name calls `.on()` after `subscribe()` and throws
`cannot add postgres_changes callbacks ... after subscribe()`. `/live` hit this
because both `LivePage` and the `LiveVideoGrid` it renders call
`useBroadcastState()`. The crash landed in the root error boundary, which silently
stripped that route's metadata. Every realtime hook now appends `useId()` to its
topic. React Query already dedupes the underlying fetch.

Both were found by driving Chrome over CDP (`puppeteer-core`) — programmatic React
state updates were fast (8 ms) while real key events wedged, which localised the
fault to the browser event path, and pausing the busy main thread produced the
spinning stack. Reach for that rather than guessing at CSS.

## Stack

- TanStack Router + React 19 + Vite 8, Tailwind CSS v4 with OKLCH tokens
- Supabase: PostgreSQL + RLS, auth (email + Google), Realtime, private Storage
- LiveKit for WebRTC video; `livekit-client` only (the server SDK was removed —
  tokens are signed inside the Edge Function with Web Crypto)
- Supabase project ref `kkodmqfehsjccduwcntv`
- Super Admin bootstrap UID `3bd31686-f95b-4a81-b690-ed7571be0d6e`

## Branding

- Single source of truth: `public/brand/*`, generated from the official crest
  (`public/digits-election-new-logo-png.png`) — trimmed, alpha-keyed, palette-
  quantised PNG + WebP at 32/48/64/128/192/256/512, a maskable PWA icon, an Apple
  touch icon, and a 1200×630 OG card.
- Palette derives## Current State
- Phase 1 & 2 completed (Nigerian theme, auth system, roles & RLS, control center scaffold).
- Features built: LiveKit 1–6 split screen video grid, DIGEO training & certification, real-time i-Witness camera recorder with Google Places API, 10 platform enhancements, and floating footer (`Built by SirHope of WYN-Tech.`).
- ReactBits Side Rays Background Integrated: Built `SideRays` component projecting dual top-corner (top-left & top-right) light beams across all pages (`/`, `/live`, `/features`, `/how-it-works`, `/about`, `/contact`, `/i-witness`, `/control-center`, `/account`, etc.) except the login page (`/auth`).
- Auth Page Performance & UI Overhaul: Isolated `SignInForm` and `SignUpForm` subcomponents for instant 0ms typing response without parent re-renders. Added interactive particle canvas background with mouse proximity connections and ambient emerald/gold orbs. Enhanced Google OAuth with `prompt: "select_account"`.
- Vercel Deployment Fix: Resolved white blank screen & peer dependency issues (`.npmrc`, `src/main.tsx`).
- Build & Typecheck: `bun run build` (3.02s, 0 errors) and `bunx tsc --noEmit` (0 errors).
- Remote repository updated and live at: https://github.com/yakyakyak14/digits-naija-election-watch.git.
or-approved feeds; public viewers get subscribe-only.

A viewer holds **one** WebRTC connection for all 1–6 tiles; adaptive-stream and
simulcast pick each tile's layer. Approval flips `is_approved`, the broadcaster sees
it over Realtime and reconnects to the public room — an unapproved camera never
reaches the public room.

Without `LIVEKIT_*` secrets the platform reports transport `fallback` and tiles play
each feed's recorded `stream_url`. Everything else (approvals, layout, comments)
still works. This is by design, not a stub.

## Evidence rules (enforced, not advertised)

- Capture is in-app only — there is no file input anywhere in the codebase.
- Two-minute hard cap per clip, enforced by the recorder.
- Location must be granted before the camera opens; coordinates, accuracy, capture
  time, verified NIN and a SHA-256 hash are bound to every file.
- Private bucket `iwitness-media`, path `<uid>/<report>/<n>.<ext>` (the storage RLS
  policy keys on the first path segment). Served only via signed URLs.
- Clears from the reporter's history after 24h via `my_iwitness_history`; retained
  in the vault for the Command Center.
- MIME types are stripped of codec parameters before upload — the bucket's
  `allowed_mime_types` list rejects `video/mp4;codecs=…`.

## Two real bugs fixed in the v2 pass

1. **Admin RLS was never satisfiable.** Migration `20260729171455` revoked EXECUTE
   on `has_role(uuid, app_role)` from `authenticated`, but the `user_roles` admin
   policies called exactly that function. Postgres evaluates policy expressions with
   the querying role's privileges, so every admin SELECT/INSERT/DELETE on
   `user_roles` failed with "permission denied for function has_role" — the Users &
   Roles screen could only ever see the caller's own rows. Replaced with argument-
   free helpers (`is_staff()`, `is_admin()`, `is_super_admin()`,
   `is_broadcast_operator()`) that read `auth.uid()` internally, so EXECUTE can be
   granted safely. See `20260730090400_fix_role_policies.sql`.
2. **Privilege escalation.** Any `admin` could insert a `super_admin` row for
   themselves; the restriction existed only in React. Now enforced in the INSERT
   policy and in `grant_user_role`, plus a trigger preventing removal of the last
   Super Admin.

## Schema (17 tables)

`profiles` (NIN, locality, language, notify flags), `user_roles`, `live_streams`,
`broadcast_state` (single row: tile count, six slots, headline, ticker),
`stream_comments` (DB rate limit: 6 per 30s), `iwitness_reports`, `iwitness_media`,
`digeo_training_modules` (6 seeded modules with multi-question assessments),
`digeo_trainee_progress`, `digeo_certificates`, `digeo_applications`,
`digeo_deployments`, `observation_checklists` (CHECK constraints reject impossible
result arithmetic), `incident_reports`, `audit_log`, `notifications`, plus the
`my_iwitness_history` view.

Realtime publication includes `live_streams`, `stream_comments`, `broadcast_state`,
`iwitness_reports`, `incident_reports`, `digeo_trainee_progress`.

## Tooling

```
npm run db:push      # apply supabase/migrations/*.sql (all re-runnable)
npm run db:types     # regenerate src/integrations/supabase/types.ts
npm run fn:deploy    # deploy Edge Functions + push secrets from .env
npm run typecheck    # tsc --noEmit
```

All three scripts use the Supabase Management API with `SUPABASE_ACCESS_TOKEN`.

## Known follow-ups

- `src/lib/nigeria.ts` carries all 774 LGAs from a standard listing — verify against
  INEC's official register before using it for deployment planning.
- Ten prioritised proposals in `docs/ROADMAP-PROPOSALS.md`.
- `.env` must stay in `.gitignore`.
