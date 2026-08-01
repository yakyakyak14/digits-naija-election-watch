/**
 * Verifies the LiveKit credentials before you rely on them.
 *
 *   npm run livekit:check
 *
 * The platform mints a token per observer and per viewer, so it needs an API
 * KEY plus its matching API SECRET. A token pasted from the LiveKit dashboard
 * cannot substitute — see the note this prints if it finds one.
 */
import crypto from "node:crypto";
import { loadEnv } from "./supabase-admin.mjs";

const { env } = await loadEnv();

const url = env.LIVEKIT_URL || env.LIVEKIT_WEBSOCKET_URL;
const key = env.LIVEKIT_API_KEY;
const secret = env.LIVEKIT_API_SECRET;

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

console.log("LiveKit credential check\n");

if (!url) fail("LIVEKIT_URL is not set.");
if (!key) fail("LIVEKIT_API_KEY is not set.");
if (!secret) fail("LIVEKIT_API_SECRET is not set.");

console.log("  url    :", url.replace(/\/\/[^.]*\./, "//<project>."));
console.log("  key    :", key);
console.log("  secret : set,", secret.length, "chars");

// If a dashboard token is lying around, use it as an oracle: re-sign its own
// payload and compare. This tells us whether the secret is the right one
// without contacting LiveKit at all.
if (env.LIVEKIT_TOKEN) {
  const [h, p, sig] = env.LIVEKIT_TOKEN.split(".");
  if (h && p && sig) {
    const mine = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    console.log("\n  A LIVEKIT_TOKEN is present. Using it to test the secret:");
    console.log("    token was issued by key:", payload.iss);
    console.log("    matches LIVEKIT_API_KEY:", payload.iss === key ? "yes" : "NO");
    console.log("    secret reproduces its signature:", mine === sig ? "yes" : "NO");
  }
}

// The real test: does the server accept a token we sign?
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: "HS256", typ: "JWT" });
const body = b64({
  iss: key,
  sub: key,
  nbf: now - 10,
  exp: now + 300,
  video: { roomList: true },
});
const token = `${head}.${body}.${crypto
  .createHmac("sha256", secret)
  .update(`${head}.${body}`)
  .digest("base64url")}`;

const http = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/$/, "");

let res;
try {
  res = await fetch(`${http}/twirp/livekit.RoomService/ListRooms`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(10_000),
  });
} catch (err) {
  fail(`Could not reach ${http} — ${err.message}`);
}

const text = await res.text();

if (res.ok) {
  const rooms = JSON.parse(text || "{}").rooms ?? [];
  console.log(`\n✓ Credentials are valid. ${rooms.length} room(s) currently open.`);
  for (const r of rooms) console.log(`    - ${r.name} (${r.numParticipants ?? 0} participants)`);
  console.log("\nPush them to the Edge Functions with:  npm run fn:deploy -- --secrets\n");
  process.exit(0);
}

if (res.status === 401) {
  console.error(`\n✗ LiveKit rejected these credentials (401 ${text.trim()}).`);
  console.error("\n  The key and secret must be a matching pair from the SAME project as the URL.");
  console.error("  LiveKit shows a secret only once, when the key is created.");
  console.error("\n  Fix: LiveKit Cloud → your project → Settings → Keys → Create key,");
  console.error("       then copy the API Key, the Secret and the WebSocket URL together.\n");
  process.exit(1);
}

fail(`Unexpected response from LiveKit: HTTP ${res.status} ${text.slice(0, 200)}`);
