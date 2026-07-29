# DIGITs Nigeria Election Watch — Global Memory & Project State

## Project Overview
DIGITs Nigeria Election Watch is a citizen-powered transparency platform empowering Nigerian democracy through real-time election monitoring, trained election observers (DIGEO), live video streaming, and verified i-Witness incident reporting.

## Key Technical Specifications & Stack
- **Framework**: TanStack Start / React 19 / Vite / TypeScript
- **Styling**: Tailwind CSS v4 + Vanilla CSS + Sora & Inter typography + Nigerian Flag Gradient & OKLCH Theme (`#008751`, gold, deep green)
- **Database & Auth**: Supabase (PostgreSQL, RLS, Auth via Email & Google OAuth)
- **Super Admin Bootstrap**: `3bd31686-f95b-4a81-b690-ed7571be0d6e` (`yakyakyak1414@gmail.com`)
- **Real-Time Video**: LiveKit streaming integration with 1–6 split screen public grid and Control Center broadcast controller
- **i-Witness Reporting**: Real-time camera & mic recorder (max 2 mins), Google Places API location autocomplete, mandatory geolocation, profile NIN validation, Supabase Storage persistence, and 24h user history auto-expiry
- **DIGEO Observer System**: Interactive training modules, electoral guidelines, practice quizzes, certificate generator, and badge verification

## Branding & Compliance Rules
- No Lovable branding, components, logos, or telemetry.
- Brand logo: Coat of Arms shield with DIGITs Nigeria Election Watch typography.
- Footer requirement: `Built by SirHope of WYN-Tech.` with floating CSS keyframe animation for **SirHope** and **WYN-Tech**.
- `.env` must always be listed in `.gitignore`.

## Current State
- Phase 1 & 2 completed (Nigerian theme, auth system, roles & RLS, control center scaffold).
- Features built: LiveKit 1–6 split screen video grid, DIGEO training & certification, real-time i-Witness camera recorder with Google Places API, 10 platform enhancements, and floating footer (`Built by SirHope of WYN-Tech.`).
- Auth Page Performance & UI Overhaul: Isolated `SignInForm` and `SignUpForm` subcomponents for instant 0ms typing response without parent re-renders. Added interactive particle canvas background with mouse proximity connections and ambient emerald/gold orbs. Enhanced Google OAuth with `prompt: "select_account"`.
- Vercel Deployment Fix: Resolved white blank screen & peer dependency issues (`.npmrc`, `src/main.tsx`).
- Build & Typecheck: `bun run build` (2.63s, 0 errors) and `bunx tsc --noEmit` (0 errors).
- Remote repository updated and live at: https://github.com/yakyakyak14/digits-naija-election-watch.git.

