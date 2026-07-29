/**
 * Deploys supabase/functions/<slug>/index.ts through the Supabase Management
 * API, and pushes the function secrets they need from .env.
 *
 *   npm run fn:deploy                 # every function
 *   npm run fn:deploy -- places       # one function
 *   npm run fn:deploy -- --secrets    # push secrets only
 *
 * Secrets pushed when present in .env:
 *   GOOGLE_PLACES_API     — used by the `places` function
 *   LIVEKIT_URL           — used by `livekit-token`
 *   LIVEKIT_API_KEY       — used by `livekit-token`
 *   LIVEKIT_API_SECRET    — used by `livekit-token`
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv, managementFetch, ROOT } from "./supabase-admin.mjs";

const SECRET_NAMES = ["GOOGLE_PLACES_API", "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"];

const { env, ref, token } = await loadEnv();
const args = process.argv.slice(2);
const secretsOnly = args.includes("--secrets");
const wanted = args.filter((a) => !a.startsWith("--"));

// ------------------------------------------------------------------- secrets
const secrets = SECRET_NAMES.filter((name) => env[name]).map((name) => ({
  name,
  value: env[name],
}));

if (secrets.length > 0) {
  await managementFetch(token, `https://api.supabase.com/v1/projects/${ref}/secrets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(secrets),
  });
  console.log(`[ok]   secrets pushed: ${secrets.map((s) => s.name).join(", ")}`);
}

const missing = SECRET_NAMES.filter((name) => !env[name]);
if (missing.length > 0) {
  console.log(`[note] not set in .env, skipped: ${missing.join(", ")}`);
}

if (secretsOnly) process.exit(0);

// ----------------------------------------------------------------- functions
const dir = path.join(ROOT, "supabase/functions");
const entries = await fs.readdir(dir, { withFileTypes: true });
let slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
if (wanted.length) slugs = slugs.filter((slug) => wanted.includes(slug));

for (const slug of slugs) {
  const file = path.join(dir, slug, "index.ts");
  const source = await fs.readFile(file);

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify({ entrypoint_path: "index.ts", name: slug, verify_jwt: false })], {
      type: "application/json",
    }),
  );
  form.append("file", new Blob([source], { type: "application/typescript" }), "index.ts");

  try {
    const result = await managementFetch(
      token,
      `https://api.supabase.com/v1/projects/${ref}/functions/deploy?slug=${slug}`,
      { method: "POST", body: form },
    );
    console.log(`[ok]   ${slug} → ${result.status} v${result.version}`);
  } catch (err) {
    console.error(`[FAIL] ${slug}\n${err.message}`);
    process.exit(1);
  }
}

console.log(`\nDeployed ${slugs.length} function(s) to ${ref}.`);
