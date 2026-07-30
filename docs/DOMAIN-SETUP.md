# Putting DIGITs on a free domain

Currently live at **https://digits-election-watch.vercel.app**.

This walks through moving it to a free domain from
[DigitalPlat FreeDomain](https://dash.domain.digitalplat.org/), which offers
`.dpdns.org`, `.us.kg`, `.qzz.io`, `.xx.kg` and `.qd.je`.

---

## Read this first

A free domain is a reasonable way to get a memorable address today, but be clear
about the trade-off before committing the platform's public identity to one:

- **Credibility matters here more than for most projects.** This platform asks
  Nigerians to trust it with video evidence, their NIN, and their location during
  an election. `digits-election-watch.dpdns.org` reads as less established than
  `digitselectionwatch.org`, and opponents of an observation effort will say so.
- **You do not own it.** It is a subdomain granted by a third party under their
  acceptable-use policy. It can be suspended, and you have limited recourse.
- **A real `.org` costs roughly $10–15 a year** and removes both problems.

The honest recommendation: use a free domain now to get off the `vercel.app`
address, and register a proper `.org` before the first election you cover.
Everything below works identically for either — the switch is one command.

---

## Recommended name

**`digits-election-watch.dpdns.org`**

`.dpdns.org` is the strongest of the five extensions on offer: it sits under a
real `.org`, which reads as an organisation rather than a novelty. `.us.kg`,
`.xx.kg`, `.qzz.io` and `.qd.je` all look out of place for a Nigerian civic
platform and invite exactly the credibility questions above.

All of these were unregistered when checked (no DNS records). Confirm at the
dashboard, since DNS cannot prove a name is unclaimed:

| Domain | Note |
| --- | --- |
| `digits-election-watch.dpdns.org` | First choice — matches the product name exactly |
| `digitselectionwatch.dpdns.org` | If hyphens are unwanted |
| `digits-ng.dpdns.org` | Shorter, keeps the Nigerian marker |
| `digitswatch.dpdns.org` | Shortest |

---

## Steps

### 1. Register the domain

1. Create an account at <https://dash.domain.digitalplat.org/auth/register>.
   WHOIS details (name, address, phone) are required and public by default —
   **turn on WHOIS Privacy Protection** in the dashboard straight after.
2. Register your chosen domain.
3. Leave the nameserver fields until after step 2.

### 2. DNS on Cloudflare (free plan)

1. Sign up at <https://dash.cloudflare.com/sign-up> and **Add a site** with the
   full domain, e.g. `digits-election-watch.dpdns.org`.
2. Choose the **Free** plan.
3. Add one record:

   | Type | Name | Value | Proxy status |
   | --- | --- | --- | --- |
   | CNAME | `@` | `cname.vercel-dns.com` | **DNS only** (grey cloud) |

   > The proxy must be **off**. With Cloudflare's orange cloud enabled, Vercel
   > cannot complete its certificate challenge and visitors hit a redirect loop.

4. Copy the two nameservers Cloudflare assigns, then set them on the domain in
   the DigitalPlat dashboard.
5. Propagation is usually minutes; allow up to a few hours.

### 3. Add the domain in Vercel

Project → **Settings → Domains → Add** → enter the domain. Vercel issues the TLS
certificate automatically once the CNAME resolves.

### 4. Configure the platform

One command handles everything reachable from here:

```bash
npm run domain -- digits-election-watch.dpdns.org
```

That updates `.env` (`VITE_SITE_URL`, `PUBLIC_SITE_URL`), regenerates
`robots.txt` and `sitemap.xml`, pushes the `PUBLIC_SITE_URL` function secret, and
updates **Supabase Auth's `site_url` and redirect allow-list** — the step that is
easy to forget and which otherwise sends Google sign-in and email confirmations
back to the old host.

Then in Vercel → **Settings → Environment Variables**, add:

```
VITE_SITE_URL = https://digits-election-watch.dpdns.org
```

and redeploy, so the canonical tag, Open Graph card and JSON-LD use the new
address.

Finally commit the regenerated files:

```bash
git add -A && git commit -m "chore: move to <domain>" && git push
```

### 5. Verify

```bash
curl -I https://digits-election-watch.dpdns.org          # expect 200
curl -s https://digits-election-watch.dpdns.org | grep canonical
```

Then check in a browser:

- Google sign-in completes and returns to the new domain
- The live grid loads
- A DIGEO welcome email preview shows links on the new host

---

## What lives where

| Setting | Where | Set by |
| --- | --- | --- |
| `VITE_SITE_URL` | `.env` + Vercel env vars | `npm run domain`, then Vercel by hand |
| `PUBLIC_SITE_URL` | Supabase function secrets | `npm run domain` |
| Auth `site_url` + allow-list | Supabase Auth config | `npm run domain` |
| `robots.txt`, `sitemap.xml` | `public/` | `npm run seo` |
| Canonical, OG, JSON-LD, certificate | `src/lib/site.ts` | reads `VITE_SITE_URL` |

Nothing hardcodes a domain any more — `src/lib/site.ts` is the single source of
truth, and its fallback is the real Vercel host rather than a placeholder.
