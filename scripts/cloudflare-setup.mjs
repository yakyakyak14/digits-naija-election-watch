/**
 * Configures Cloudflare for the platform domain in one command.
 *
 *   npm run cf
 *
 * Does everything Cloudflare-side that would otherwise be dashboard clicking:
 *   1. finds or creates the zone, and prints the nameservers to set at DigitalPlat
 *   2. imports every record from docs/dns/<domain>.zone (run `npm run dns` first)
 *   3. enables Email Routing
 *   4. creates info@<domain> -> the forwarding address
 *
 * It cannot delegate the nameservers — that is done in the DigitalPlat dashboard,
 * which publishes no API — and it cannot click the confirmation link Cloudflare
 * emails to the destination address. Both are reported at the end.
 *
 * Requires CLOUDFLARE_API_TOKEN with, on this zone:
 *   Zone:Read, Zone:Edit, DNS:Edit, Email Routing Rules:Edit,
 *   plus Account:Zone:Create if the zone does not exist yet.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv, ROOT } from "./supabase-admin.mjs";

const API = "https://api.cloudflare.com/client/v4";

const { env } = await loadEnv();
const token = env.CLOUDFLARE_API_TOKEN ?? env.CLOUDFLARE_ACCESS_TOKEN;
const SITE = (env.VITE_SITE_URL ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const FORWARD_TO = process.env.FORWARD_TO ?? "yakyakyak1414@gmail.com";

if (!token) {
  console.error("CLOUDFLARE_API_TOKEN is not set in .env");
  process.exit(1);
}
if (!SITE) {
  console.error("VITE_SITE_URL is not set in .env");
  process.exit(1);
}

async function cf(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!body.success) {
    const messages = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join("; ");
    throw new Error(messages || `HTTP ${res.status}`);
  }
  return body.result;
}

// ------------------------------------------------------------ 0. token check
try {
  const verified = await cf("/user/tokens/verify");
  console.log(`[ok]   token active (${verified.status})`);
} catch (err) {
  console.error(`\n✗ Cloudflare rejected the token: ${err.message}\n`);
  console.error("A Cloudflare API Token is 40 characters with no prefix. Create one at");
  console.error("  https://dash.cloudflare.com/profile/api-tokens  ->  Create Token");
  console.error("     -> Edit zone DNS template, then add these permissions:");
  console.error("        Zone   | Zone           | Read");
  console.error("        Zone   | DNS            | Edit");
  console.error("        Zone   | Email Routing Rules | Edit");
  console.error("        Account| Zone           | Create   (only if the zone is not added yet)");
  console.error("     Zone Resources: Include -> Specific zone -> your domain\n");
  console.error("Nothing was changed.");
  process.exit(1);
}

// ------------------------------------------------------------------ 1. zone
let zone = (await cf(`/zones?name=${encodeURIComponent(SITE)}`))[0];

if (!zone) {
  console.log(`[..]   zone ${SITE} not found, creating`);
  const accounts = await cf("/accounts");
  if (!accounts.length) throw new Error("Token cannot see any account; add Account:Zone:Create.");
  zone = await cf("/zones", {
    method: "POST",
    body: JSON.stringify({ name: SITE, account: { id: accounts[0].id }, type: "full" }),
  });
  console.log(`[ok]   zone created`);
} else {
  console.log(`[ok]   zone found (status: ${zone.status})`);
}

console.log(`\n       Nameservers to set at DigitalPlat:`);
for (const ns of zone.name_servers ?? []) console.log(`         ${ns}`);
console.log();

// ------------------------------------------------------------- 2. DNS records
const zoneFile = path.join(ROOT, "docs/dns", `${SITE}.zone`);
const text = await fs.readFile(zoneFile, "utf8").catch(() => null);
if (!text) {
  console.error(`Missing ${zoneFile}. Run: npm run dns`);
  process.exit(1);
}

/** Parses the generated BIND file. Deliberately narrow — it only reads our own output. */
function parseZone(source) {
  const records = [];
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith(";")) continue;

    const m = /^(\S+)\s+\d+\s+IN\s+(A|AAAA|CNAME|MX|TXT)\s+(.+)$/.exec(line);
    if (!m) continue;

    const [, fqdn, type, rest] = m;
    const name = fqdn.replace(/\.$/, "");
    let priority;
    let value = rest.trim();

    if (type === "MX") {
      const mx = /^(\d+)\s+(.+)$/.exec(value);
      priority = Number(mx[1]);
      value = mx[2];
    }
    if (type === "TXT") value = value.replace(/^"(.*)"$/s, "$1").replace(/\\"/g, '"');
    value = type === "TXT" ? value : value.replace(/\.$/, "");

    records.push({ type, name, content: value, ...(priority !== undefined ? { priority } : {}) });
  }
  return records;
}

const desired = parseZone(text);
const existing = await cf(`/zones/${zone.id}/dns_records?per_page=200`);

let created = 0;
let updated = 0;
let unchanged = 0;

for (const record of desired) {
  const match = existing.find(
    (e) =>
      e.type === record.type &&
      e.name === record.name &&
      (record.type !== "MX" || e.content === record.content),
  );

  // GitHub Pages needs the proxy off until its certificate is issued.
  const payload = { ...record, ttl: 1, proxied: false };

  if (!match) {
    await cf(`/zones/${zone.id}/dns_records`, { method: "POST", body: JSON.stringify(payload) });
    created += 1;
    console.log(`[ok]   + ${record.type.padEnd(5)} ${record.name}`);
  } else if (
    match.content !== record.content ||
    (record.priority ?? null) !== (match.priority ?? null)
  ) {
    await cf(`/zones/${zone.id}/dns_records/${match.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    updated += 1;
    console.log(`[ok]   ~ ${record.type.padEnd(5)} ${record.name}`);
  } else {
    unchanged += 1;
  }
}
console.log(`[ok]   DNS: ${created} created, ${updated} updated, ${unchanged} already correct\n`);

// --------------------------------------------------------- 3. email routing
/*
 * Email Routing needs permissions the DNS-only token does not carry, so probe
 * first and say so plainly. An earlier version caught every error here and
 * printed "already enabled", which reported success for an authentication
 * failure — the reader had no way to tell a configured mailbox from a missing
 * permission.
 */
let routingReady = false;
try {
  const routing = await cf(`/zones/${zone.id}/email/routing`);
  routingReady = Boolean(routing.enabled);
  console.log(`[ok]   Email Routing ${routingReady ? "already enabled" : "available, enabling"}`);
  if (!routingReady) {
    await cf(`/zones/${zone.id}/email/routing/enable`, { method: "POST" });
    routingReady = true;
    console.log("[ok]   Email Routing enabled");
  }
} catch (err) {
  const denied = /authentication|permission|denied/i.test(err.message);
  console.log(
    denied
      ? "[!]    Email Routing SKIPPED — the token lacks Email Routing permission"
      : `[!]    Email Routing SKIPPED — ${err.message}`,
  );
}

// Destination addresses must be verified before a rule can use them.
const accountId = zone.account?.id;
try {
  if (!routingReady) throw new Error("Email Routing not configured");
  const destinations = await cf(`/accounts/${accountId}/email/routing/addresses`);
  if (!destinations.some((d) => d.email === FORWARD_TO)) {
    await cf(`/accounts/${accountId}/email/routing/addresses`, {
      method: "POST",
      body: JSON.stringify({ email: FORWARD_TO }),
    });
    console.log(
      `[ok]   destination ${FORWARD_TO} added — Cloudflare has emailed it a confirmation link`,
    );
  } else {
    const d = destinations.find((x) => x.email === FORWARD_TO);
    console.log(
      `[ok]   destination ${FORWARD_TO} (${d.verified ? "verified" : "AWAITING CONFIRMATION"})`,
    );
  }
} catch (err) {
  console.log(`[!]    destination step: ${err.message}`);
}

const address = `info@${SITE}`;
try {
  if (!routingReady) throw new Error("Email Routing not configured");
  const rules = await cf(`/zones/${zone.id}/email/routing/rules`);
  const already = rules.find((r) => (r.matchers ?? []).some((m) => m.value === address));
  if (!already) {
    await cf(`/zones/${zone.id}/email/routing/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: `Forward ${address}`,
        enabled: true,
        matchers: [{ type: "literal", field: "to", value: address }],
        actions: [{ type: "forward", value: [FORWARD_TO] }],
      }),
    });
    console.log(`[ok]   rule created: ${address} -> ${FORWARD_TO}`);
  } else {
    console.log(`[ok]   rule already exists: ${address}`);
  }
} catch (err) {
  console.log(`[!]    rule step: ${err.message}`);
}

if (!routingReady) {
  console.log(`
To let this script finish the mailbox, add these to the token at
https://dash.cloudflare.com/profile/api-tokens and re-run \`npm run cf\`:

    Zone    | Email Routing Rules     | Edit
    Account | Email Routing Addresses | Edit

Or do it by hand: Cloudflare -> Email -> Email Routing -> Enable, then
create ${`info@${SITE}`} -> ${FORWARD_TO}.`);
}

console.log(`
Remaining, and not scriptable:

  1. DigitalPlat dashboard -> set the two nameservers listed above.
     https://dash.domain.digitalplat.org/

  2. Open the confirmation email Cloudflare sent to ${FORWARD_TO} and click the
     link. The forwarding rule stays inactive until you do.

  3. GitHub -> Settings -> Pages -> Custom domain -> ${SITE}
     Enable "Enforce HTTPS" once the certificate is issued.

  4. When Resend reports the domain Verified:
       EMAIL_FROM="DIGITs Election Watch <info@${SITE}>"
       npm run fn:deploy -- --secrets

Then check:  curl -I https://${SITE}
`);
