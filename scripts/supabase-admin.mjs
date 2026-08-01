import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Reads .env without a dependency. These scripts talk to the Supabase
 * Management API, so they need SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN.
 */
export async function loadEnv() {
  const raw = await fs.readFile(path.join(ROOT, ".env"), "utf8").catch(() => "");

  const entries = [];
  const glued = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;

    const i = line.indexOf("=");
    const name = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();

    /*
     * Catch a missing newline between two variables:
     *   LIVEKIT_URL=wss://x.livekit.cloudLIVEKIT_API_KEY=API...
     * Pasting into .env drops the break surprisingly often. Left alone it both
     * corrupts the first value and makes the second variable vanish, which
     * surfaces far away as an unexplained auth failure. Split it and warn.
     */
    const embedded = /(?<![A-Z0-9_])([A-Z][A-Z0-9_]{2,})=/.exec(value);
    if (embedded && embedded.index > 0) {
      const head = value.slice(0, embedded.index);
      const tail = value.slice(embedded.index);
      const j = tail.indexOf("=");
      glued.push(`${name} + ${tail.slice(0, j)}`);
      value = head.replace(/"$/, "");
      entries.push([tail.slice(0, j).trim(), tail.slice(j + 1).trim().replace(/^"|"$/g, "")]);
    }

    entries.push([name, value.replace(/^"|"$/g, "")]);
  }

  if (glued.length > 0) {
    console.warn(
      `[env] Missing newline in .env between: ${glued.join(", ")}. ` +
        `Parsed them apart for this run — fix the file so the values are not corrupted.`,
    );
  }

  const env = Object.fromEntries(entries);

  const merged = { ...env, ...process.env };
  const ref = merged.SUPABASE_PROJECT_ID;
  const token = merged.SUPABASE_ACCESS_TOKEN;

  if (!ref || !token) {
    console.error("Missing SUPABASE_PROJECT_ID or SUPABASE_ACCESS_TOKEN in .env");
    process.exit(1);
  }

  return { env: merged, ref, token };
}

export async function managementFetch(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function runSql(token, ref, sql) {
  return managementFetch(token, `https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
}
