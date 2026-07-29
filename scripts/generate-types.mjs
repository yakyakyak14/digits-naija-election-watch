/**
 * Regenerates src/integrations/supabase/types.ts from the live schema.
 *
 *   npm run db:types
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv, managementFetch, ROOT } from "./supabase-admin.mjs";

const { ref, token } = await loadEnv();

const payload = await managementFetch(
  token,
  `https://api.supabase.com/v1/projects/${ref}/types/typescript?included_schemas=public`,
);

if (!payload?.types) {
  console.error("Unexpected response from the types endpoint.");
  process.exit(1);
}

const banner =
  "// Generated from the live Supabase schema. Do not edit by hand.\n// Refresh with: npm run db:types\n\n";
const target = path.join(ROOT, "src/integrations/supabase/types.ts");

await fs.writeFile(target, banner + payload.types, "utf8");
console.log(
  `Wrote ${path.relative(ROOT, target)} (${(banner + payload.types).split("\n").length} lines).`,
);
