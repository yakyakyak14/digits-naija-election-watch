/**
 * Points the whole platform at a new domain, in one command.
 *
 *   npm run domain -- digits-election-watch.dpdns.org
 *
 * What this configures automatically:
 *   1. .env             VITE_SITE_URL and PUBLIC_SITE_URL
 *   2. public/          robots.txt and sitemap.xml (regenerated)
 *   3. Supabase         PUBLIC_SITE_URL function secret (used by the DIGEO email)
 *   4. Supabase Auth    site_url and the redirect allow-list, so Google OAuth and
 *                       email confirmation return to the new host instead of
 *                       bouncing to the old one
 *
 * What it cannot do, and prints as remaining steps: registering the domain,
 * Cloudflare DNS, and adding the domain in Vercel — all three need interactive
 * sign-in to accounts this script has no credentials for.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnv, managementFetch, ROOT } from "./supabase-admin.mjs";

const run = promisify(execFile);

const input = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!input) {
  console.error("Usage: npm run domain -- <your-domain>\n");
  console.error("Example: npm run domain -- digits-election-watch.dpdns.org");
  process.exit(1);
}

const SITE = (/^https?:\/\//.test(input) ? input : `https://${input}`).replace(/\/+$/, "");
const HOST = SITE.replace(/^https?:\/\//, "");

const { env, ref, token } = await loadEnv();

// ----------------------------------------------------------------- 1. .env
const envPath = path.join(ROOT, ".env");
let envText = await fs.readFile(envPath, "utf8");

function upsert(text, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
}

envText = upsert(envText, "VITE_SITE_URL", SITE);
envText = upsert(envText, "PUBLIC_SITE_URL", SITE);
await fs.writeFile(envPath, envText, "utf8");
console.log(`[ok]   .env               VITE_SITE_URL + PUBLIC_SITE_URL -> ${SITE}`);

// ------------------------------------------------------- 2. robots + sitemap
await run(process.execPath, [path.join(ROOT, "scripts/generate-seo.mjs"), SITE]);
console.log("[ok]   public/            robots.txt + sitemap.xml regenerated");

// ---------------------------------------------------- 3. function secret
await managementFetch(token, `https://api.supabase.com/v1/projects/${ref}/secrets`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([{ name: "PUBLIC_SITE_URL", value: SITE }]),
});
console.log("[ok]   Supabase secret    PUBLIC_SITE_URL updated");

// ------------------------------------------------------------ 4. auth URLs
const current = await managementFetch(
  token,
  `https://api.supabase.com/v1/projects/${ref}/config/auth`,
);

// Keep every existing entry: the Vercel URL and localhost must stay valid.
const existing = String(current.uri_allow_list ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const wanted = [SITE, `${SITE}/**`, "http://localhost:5173", "http://localhost:5173/**"];
const allowList = [...new Set([...existing, ...wanted])].join(",");

await managementFetch(token, `https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ site_url: SITE, uri_allow_list: allowList }),
});
console.log("[ok]   Supabase Auth      site_url + redirect allow-list updated");

// ------------------------------------------------------------- what's left
console.log(`
Remaining steps — these need interactive sign-in and cannot be scripted:

  1. Register the domain
     https://dash.domain.digitalplat.org/  ->  register "${HOST}"

  2. Point DNS at Vercel (Cloudflare free plan)
     Add the site, then create ONE record:

       Type   Name   Value                    Proxy
       CNAME  @      cname.vercel-dns.com     DNS only (grey cloud)

     Proxy MUST be off. With Cloudflare's orange cloud on, Vercel cannot issue a
     certificate and you get a redirect loop.

     Then set the DigitalPlat nameservers to the two Cloudflare gives you.

  3. Add the domain in Vercel
     Project -> Settings -> Domains -> Add -> ${HOST}

  4. Add the env var in Vercel
     Project -> Settings -> Environment Variables
       VITE_SITE_URL = ${SITE}
     Then redeploy so the canonical, OG and JSON-LD tags pick it up.

  5. Google OAuth
     https://console.cloud.google.com/apis/credentials
     Add to Authorised redirect URIs:
       ${process.env.SUPABASE_URL ?? env.SUPABASE_URL}/auth/v1/callback
     (unchanged if already set — Supabase handles the callback, not your domain)

  6. Commit and push, then verify:
       curl -I ${SITE}
`);
