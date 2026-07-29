/**
 * Applies supabase/migrations/*.sql in filename order through the Supabase
 * Management API. Every migration in this repo is written to be re-runnable
 * (IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT), so re-applying is safe.
 *
 *   npm run db:push              # all migrations
 *   npm run db:push -- 20260730  # only migrations matching a substring
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv, ROOT, runSql } from "./supabase-admin.mjs";

const { ref, token } = await loadEnv();
const only = process.argv.slice(2);
const dir = path.join(ROOT, "supabase/migrations");

let files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
if (only.length) files = files.filter((f) => only.some((needle) => f.includes(needle)));

if (files.length === 0) {
  console.log("No migrations matched.");
  process.exit(0);
}

for (const file of files) {
  const sql = await fs.readFile(path.join(dir, file), "utf8");
  try {
    await runSql(token, ref, sql);
    console.log(`[ok]   ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}\n${err.message}`);
    process.exit(1);
  }
}

console.log(`\nApplied ${files.length} migration(s) to ${ref}.`);
