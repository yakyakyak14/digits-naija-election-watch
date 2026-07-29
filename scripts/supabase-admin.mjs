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
  const env = Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [
          line.slice(0, i).trim(),
          line
            .slice(i + 1)
            .trim()
            .replace(/^"|"$/g, ""),
        ];
      }),
  );

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
