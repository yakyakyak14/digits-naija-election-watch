# DIGITs Election Watch

Citizen observation of Nigerian elections — live observer feeds, verified i-Witness
evidence, and accredited DIGEO observer training.

Watching, reading and training require **no account**. Signing in is needed for
exactly two things: commenting on a live feed, and submitting evidence.

---

## Stack

| Layer            | Choice                                                           |
| ---------------- | ---------------------------------------------------------------- |
| App              | TanStack Router + React 19 + Vite 8 (client-rendered SPA)         |
| Styling          | Tailwind CSS v4, OKLCH design tokens, Sora + Inter                |
| Database & auth  | Supabase (PostgreSQL, RLS on every table, email + Google OAuth)    |
| Realtime         | Supabase Realtime (feeds, comments, grid layout, evidence queue)  |
| Live video       | LiveKit WebRTC — one shared room, adaptive simulcast              |
| Evidence storage | Supabase Storage, private bucket, short-lived signed URLs         |
| Server secrets   | Supabase Edge Functions (`places`, `livekit-token`)               |

There is no Node server: the app deploys as static assets. Anything that needs a
secret runs in an Edge Function, so no key ever reaches the browser.

---

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

### Environment

`.env` (never committed) holds the client keys plus the admin credentials the
tooling scripts use:

```dotenv
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=<ref>

# Tooling only — used by scripts/, never bundled
SUPABASE_PROJECT_ID=<ref>
SUPABASE_ACCESS_TOKEN=<personal access token>

# Pushed to Supabase function secrets by `npm run fn:deploy`
GOOGLE_PLACES_API=<google places key>
LIVEKIT_URL=wss://<project>.livekit.cloud
LIVEKIT_API_KEY=<livekit key>
LIVEKIT_API_SECRET=<livekit secret>
RESEND_API_KEY=<resend key>                     # required to send DIGEO email
DIGEO_MAIL_FROM=DIGITs Election Watch <digeo@yourdomain>
```

Only `VITE_*` variables reach the browser. `GOOGLE_PLACES_API` and the `LIVEKIT_*`
trio are pushed into Supabase function secrets and read only inside the Edge
Functions.

### Enabling live WebRTC video

Until the `LIVEKIT_*` secrets are set, the platform reports transport
**"Preview transport"** and each tile plays the `stream_url` recorded against that
feed. The grid, approvals, layout switching and comments all work in this mode —
only WebRTC is inert.

To switch it on:

1. Create a project at [LiveKit Cloud](https://cloud.livekit.io), or self-host.
2. Put `LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in `.env`.
   All three must come from the **same project**, copied together — LiveKit
   reveals a secret only once, at the moment the key is created.
3. `npm run livekit:check` — confirms the server accepts them before you deploy.
4. `npm run fn:deploy -- --secrets`

> **A token from the dashboard is not a substitute.** The platform mints a token
> per observer and per viewer, which requires the key *and* its secret. A pasted
> `LIVEKIT_TOKEN` carries one fixed identity, one room, and a short expiry: every
> observer would collide on the same identity, viewers would inherit publish
> rights, and the intake/public split would collapse. `LIVEKIT_TOKEN`,
> `LIVEKIT_ROOM_NAME` and `LIVEKIT_WEBSOCKET_URL` are not read by this codebase.

The transport badge on the live grid and the Command Center → Settings page both
flip to **Connected** with no code change.

### Enabling DIGEO email

Accreditation email is sent by the `send-digeo-welcome` Edge Function, which holds
the provider key so the browser never can. **Until `RESEND_API_KEY` is set, sending
returns HTTP 503 with `configured: false` and nothing is sent** — deliberately, so a
silent failure can never be mistaken for a delivered accreditation.

1. Create a key at [resend.com](https://resend.com) and verify a sending domain.
2. Add `RESEND_API_KEY` and `DIGEO_MAIL_FROM` to `.env`.
3. `npm run fn:deploy -- --secrets`

Without a verified domain Resend only delivers to the account owner's own address.
For that case the send accepts an optional `deliverTo`, so staff can route a copy
elsewhere without changing whose accreditation the email describes; redirected
sends are flagged `redirected: true` in `audit_log` and the holder is not told the
email reached them.

Operators send from **Command Center → Observers → Observer roster →
Accreditation & welcome dispatch**, which also previews the exact email and opens
any observer's certificate. Every send is written to `audit_log`.

---

## Commands

```bash
npm run dev          # dev server
npm run build        # production build to dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (prettier included)
npm run db:push      # apply supabase/migrations/*.sql (re-runnable)
npm run db:types     # regenerate src/integrations/supabase/types.ts from live schema
npm run fn:deploy    # deploy Edge Functions + push their secrets
npm run livekit:check # verify LiveKit credentials against the server
```

`npm run db:push` accepts a filter: `npm run db:push -- 20260730`.

---

## Architecture notes

### Live video topology

Two LiveKit rooms, not one room per feed:

- **`digits-intake-ng`** — every observer publishes here first. Only Command
  Center operators hold subscribe tokens for it.
- **`digits-live-ng`** — feeds an operator has approved. Public viewers get a
  subscribe-only token for this room and nothing else.

A viewer therefore holds **one** WebRTC connection regardless of how many tiles
are on screen; adaptive-stream plus simulcast pick the layer each tile needs. One
connection per tile would multiply bandwidth and handshake cost by six for no
benefit.

Approval moves a publisher between rooms: the broadcaster watches its own
`live_streams` row over Realtime and reconnects to the public room the moment
`is_approved` flips, so an unapproved camera never reaches the public room.

### Evidence pipeline

1. Capture happens **in-app only** — there is no file input anywhere, so a clip
   from the gallery cannot enter the chain.
2. Clips are hard-capped at two minutes by the recorder.
3. Coordinates, accuracy radius, capture time, verified NIN and a SHA-256 hash
   are bound to each file before upload.
4. Objects land in the private `iwitness-media` bucket under
   `<uid>/<report>/<n>.<ext>` — the path the storage RLS policy keys on.
5. Media clears from the reporter's in-app history after 24 hours
   (`expires_from_user_at`, enforced by the `my_iwitness_history` view) and is
   retained in the vault for the Command Center.
6. Nothing is public until an operator publishes it.

### Roles

Seven roles — `super_admin`, `admin`, `control_center_operator`,
`observer_coordinator`, `digeo`, `reviewer`, `viewer` — enforced by row-level
security, not by the interface:

- Admins cannot grant `admin` or `super_admin` (database policy + RPC guard).
- The last `super_admin` cannot be revoked (trigger).
- Grants and revocations go through `grant_user_role` / `revoke_user_role`, which
  write to `audit_log`.

### Nigerian reference data

`src/lib/nigeria.ts` carries all 36 states, the FCT, their geopolitical zones,
capitals and LGAs. It backs every State/LGA select and is the offline fallback for
location lookup when Places is unavailable — which matters most in the field.
Verify the LGA lists against INEC's current register before each election cycle.

---

## Repository layout

```
docs/samples/                 rendered welcome email + certificate, openable in a browser
public/brand/                 generated logo variants, PWA icons, OG card
scripts/                      Supabase Management API tooling
src/components/brand/         crest and lockup
src/components/forms/         DIGEO enrolment, deployment, checklist, incident
src/components/live/          public comment thread
src/components/reports/       i-Witness recorder
src/components/video/         grid, tile, broadcaster
src/hooks/                    auth, viewer, geolocation, streams, comments
src/lib/                      places, streaming, iwitness, training, roles, nigeria
src/routes/                   public pages + _authenticated subtree
supabase/functions/           Edge Functions (Deno)
supabase/migrations/          schema, RLS, curriculum seed
```

---

Built by **SirHope** of **WYN-Tech**.
