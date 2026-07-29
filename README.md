# DIGITs Nigeria Election Watch 🇳🇬

A citizen-powered, real-time digital transparency and election monitoring platform for Nigeria. Built with high resilience, live video streaming grid, trained election observer (DIGEO) certification, real-time i-Witness camera reporting, and a Control Center.

## Key Features

- **LiveKit Real-Time Observer Video Grid**: 1 to 6 split screen live public feeds from DIGITs Election Observers (DIGEO), with click-to-maximize tile views.
- **Control Center Operator Suite**: Role-gated dashboard (`super_admin`, `admin`, `control_center_operator`, `observer_coordinator`, `digeo`, `reviewer`, `viewer`), live video stream switcher, trainee verification, and incident triage.
- **i-Witness Camera Recording**: Real-time camera & microphone recording (max 2 mins), Google Places API location autocomplete dropdown, mandatory geolocation, profile NIN validation, and 24h user history auto-expiry while preserving media in Supabase cloud storage.
- **DIGEO Observer Training & Certification**: Interactive training modules, electoral code of conduct, quizzes, and automated badge/certificate generation.
- **Open Public Access**: Unauthenticated visitors can view all live feeds, maps, polling unit tallies, and training materials. Authentication is strictly required only for commenting and submitting i-Witness reports.
- **10 Advanced Enhancements**: Tally board visualizations, AI triage tags, Panic emergency distress beacon, USSD/PWA offline queue indicator, public archives, multi-lingual support (English, Hausa, Yoruba, Igbo, Pidgin), geofencing, cryptographic SHA-256 media signing, community fact-checking, and operator broadcast switcher.

## Quick Start

```bash
# Clone repository
git clone https://github.com/SirHope14/digits-naija-election-watch.git
cd digits-naija-election-watch

# Install dependencies
npm install

# Run dev server
npm run dev

# Production build
npm run build
```

---

*Built by **SirHope** of **WYN-Tech**.*
