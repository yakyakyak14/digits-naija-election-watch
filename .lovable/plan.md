
## Phase 1 scope (this build)

Ship a solid foundation you can log into and steer from. Video streaming, training forms, and reports come in later phases.

### 1. Nigerian-theme design system
- Palette in `src/styles.css` (oklch tokens): Nigerian green `#008751`, white, warm gold accent `#D4AF37`, deep charcoal for text. Applied to shadcn tokens (primary, accent, ring).
- Typography: Sora (display) + Inter (body), loaded via `<link>` in `__root.tsx`.
- Reusable gradients + subtle patterns evoking the Nigerian flag without being kitschy.

### 2. Public landing site (redesign of digitstrack)
Split into routes, each with its own SEO `head()`:
- `/` — hero, stats (10M+ users, 500K monitors, 176K polling units), CTAs
- `/about` — vision / mission / impact / problem
- `/how-it-works` — 4-step process (Register & Train → Observe → Report → Verify)
- `/features` — enumerated platform features (incl. live observer streams, incident reports, verified data)
- `/get-involved` — path to become DIGEO + citizen monitor
- `/contact`
- Mobile-first, responsive nav with sheet menu.

### 3. Roles system (Supabase migration)
- `app_role` enum: `super_admin`, `admin`, `control_center_operator`, `observer_coordinator`, `digeo` (trained observer), `reviewer`, `viewer`
- `user_roles` table (FK to `auth.users`, unique on `(user_id, role)`)
- `has_role(_user_id, _role)` SECURITY DEFINER function
- Bootstrap: seed `super_admin` for uid `3bd31686-f95b-4a81-b690-ed7571be0d6e` (yakyakyak1414@gmail.com)
- `profiles` table (display_name, phone, state, lga, avatar_url) + trigger on signup
- Full RLS + GRANTs per platform standards

### 4. Auth + Control Center shell
- `/auth` — email/password + Google (already configured in Supabase)
- `_authenticated/` gated subtree (integration-managed layout)
- `/control-center` dashboard with sidebar navigation:
  - Overview (KPIs)
  - Live Streams *(placeholder — "Video provider not connected yet")*
  - Observers (DIGEO directory)
  - Incident Reports *(placeholder table)*
  - Training *(placeholder)*
  - Users & Roles — Super Admin can grant/revoke roles from any user
  - Settings
- Every sidebar item shows a role-based badge ("Requires: Admin") and hides items the user can't access.
- Role limitations panel visible on the login page and inside Control Center so users know what each role can do.

### 5. Structure

```text
src/
  routes/
    __root.tsx                    # fonts, meta, sidebar shell wrapper
    index.tsx                     # landing
    about.tsx, how-it-works.tsx, features.tsx, get-involved.tsx, contact.tsx
    auth.tsx                      # login/signup + role explainer
    _authenticated/
      route.tsx                   # (integration-managed gate)
      control-center.tsx          # layout w/ sidebar + outlet
      control-center/
        index.tsx                 # overview
        live.tsx                  # video placeholder
        observers.tsx
        reports.tsx
        training.tsx
        users.tsx                 # role management (super_admin/admin)
        settings.tsx
  components/
    site/  (Nav, Footer, Hero, Stats, etc.)
    control-center/ (Sidebar, RoleBadge, RoleGuard, UsersTable)
  lib/
    roles.ts, roles.functions.ts  # server fns for role grants
```

### 6. Deferred to later phases (confirmed with you)
- **Phase 2:** Training module (multi-step DIGEO application, quizzes, certificate), Incident Reports (submission + review queue with evidence upload)
- **Phase 3:** Live video (LiveKit/Daily) — observer capture, admin routing, 1/2/3/4/5/6-tile public viewer with per-viewer maximize
- **Phase 4:** Public transparency dashboard, real-time results feed

---

## 10 suggested improvements (pick any)

1. **PWA + offline queue** for DIGEO to submit reports where network is poor; sync when back online.
2. **USSD / SMS fallback** for incident reporting via a Twilio/Termii number for citizens without smartphones.
3. **Polling-unit geofencing** — DIGEO reports auto-tagged with PU code + GPS; alerts if observer is >X km from assigned PU.
4. **Cryptographic report signing** — each report signed with observer's device key; tamper-evident public ledger.
5. **Community verification** — 2+ independent DIGEO must corroborate an incident before it goes public (weighted by reputation).
6. **AI-assisted triage** — Lovable AI classifies incoming reports (violence, logistics, vote-buying), flags duplicates, suggests severity.
7. **Live results tally board** per state/LGA/PU with variance alerts vs INEC official numbers.
8. **Multilingual UI + TTS** — English, Hausa, Yoruba, Igbo, Pidgin; audio playback of key content for low-literacy users.
9. **Observer safety panic button** — one-tap SOS to Control Center with live location + auto stream start.
10. **Post-election transparency archive** — permanent, searchable public record of every verified report, tally, and stream clip, exportable as evidence.

Tell me which of the 10 you want folded into Phase 2/3, and I'll build Phase 1 as scoped above.
