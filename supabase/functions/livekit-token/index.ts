/**
 * DIGITs — LiveKit access-token minting (Supabase Edge Function).
 *
 * The LiveKit API secret never leaves this function. Tokens are HS256 JWTs
 * signed here with Web Crypto — no npm dependency, nothing to keep in step.
 *
 * Room topology:
 *   digits-live-ng    public room. Only operator-approved feeds publish here.
 *                     Viewer tokens are subscribe-only and available to anyone,
 *                     because watching never requires an account.
 *   digits-intake-ng  private room. Observers publish here first; only Control
 *                     Center operators can subscribe.
 *
 * Actions:
 *   viewer     — anonymous, subscribe-only on the public room
 *   intake     — operator, subscribe-only on the intake room
 *   publisher  — DIGEO/operator, publish rights on the room their approval allows
 *
 * Deploy: POST /v1/projects/{ref}/functions/deploy?slug=livekit-token
 * Secrets: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const PUBLIC_ROOM = "digits-live-ng";
const INTAKE_ROOM = "digits-intake-ng";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface VideoGrant {
  room: string;
  roomJoin: boolean;
  canSubscribe: boolean;
  canPublish: boolean;
  canPublishData: boolean;
  roomAdmin: boolean;
  roomCreate: boolean;
  hidden: boolean;
}

async function signToken(opts: {
  apiKey: string;
  apiSecret: string;
  identity: string;
  name: string;
  ttlSeconds: number;
  grant: VideoGrant;
  metadata?: Record<string, unknown>;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: opts.apiKey,
    sub: opts.identity,
    name: opts.name,
    nbf: now,
    exp: now + opts.ttlSeconds,
    jti: crypto.randomUUID(),
    ...(opts.metadata ? { metadata: JSON.stringify(opts.metadata) } : {}),
    video: opts.grant,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(opts.apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

function subscribeOnly(room: string): VideoGrant {
  return {
    room,
    roomJoin: true,
    canSubscribe: true,
    canPublish: false,
    canPublishData: false,
    roomAdmin: false,
    roomCreate: false,
    // Viewers are invisible in the room; observers must not see an audience list.
    hidden: true,
  };
}

function publisher(room: string): VideoGrant {
  return {
    room,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    roomAdmin: false,
    roomCreate: false,
    hidden: false,
  };
}

/** Resolves the caller from their Supabase bearer token and reads their roles. */
async function resolveCaller(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return null;

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", data.user.id);
  const roles = new Set((roleRows ?? []).map((r: { role: string }) => r.role));

  return { admin, userId: data.user.id, email: data.user.email ?? "", roles };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const livekitUrl = Deno.env.get("LIVEKIT_URL");
  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

  // No provider configured: report fallback so the grid plays recorded sources.
  if (!livekitUrl || !apiKey || !apiSecret) {
    return json({ transport: "fallback", token: null, url: null, room: null });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  try {
    // ---------------------------------------------------------- viewer token
    if (body.action === "viewer") {
      const token = await signToken({
        apiKey,
        apiSecret,
        identity: `viewer-${crypto.randomUUID()}`,
        name: "Public viewer",
        ttlSeconds: 60 * 60 * 4,
        grant: subscribeOnly(PUBLIC_ROOM),
      });
      return json({ transport: "livekit", token, url: livekitUrl, room: PUBLIC_ROOM });
    }

    const caller = await resolveCaller(req);
    if (!caller) return json({ error: "Sign in required." }, 401);

    // ---------------------------------------------------------- intake token
    if (body.action === "intake") {
      const allowed = ["super_admin", "admin", "control_center_operator"].some((r) => caller.roles.has(r));
      if (!allowed) return json({ error: "Operators only." }, 403);

      const token = await signToken({
        apiKey,
        apiSecret,
        identity: `operator-${caller.userId}`,
        name: "Control Center",
        ttlSeconds: 60 * 60 * 8,
        grant: subscribeOnly(INTAKE_ROOM),
      });
      return json({ transport: "livekit", token, url: livekitUrl, room: INTAKE_ROOM });
    }

    // ------------------------------------------------------- publisher token
    if (body.action === "publisher") {
      const allowed = ["super_admin", "admin", "control_center_operator", "digeo"].some((r) =>
        caller.roles.has(r),
      );
      if (!allowed) {
        return json(
          { error: "Only certified DIGEO observers and Control Center operators can broadcast." },
          403,
        );
      }

      const title = String(body.title ?? "").trim();
      const state = String(body.state ?? "").trim();
      const lga = String(body.lga ?? "").trim();
      if (title.length < 4 || !state || !lga) {
        return json({ error: "A title, state and LGA are required." }, 400);
      }

      const identity = `pub-${caller.userId}`;
      const now = new Date().toISOString();
      const base = {
        observer_id: caller.userId,
        observer_name: String(body.observerName ?? caller.email).slice(0, 120),
        state,
        lga,
        ward: body.ward ? String(body.ward).slice(0, 120) : null,
        polling_unit: body.pollingUnit ? String(body.pollingUnit).slice(0, 160) : null,
        stream_title: title.slice(0, 140),
        livekit_identity: identity,
        source: "livekit",
        status: "live",
        last_heartbeat_at: now,
      };

      let streamId: string | null = body.streamId ? String(body.streamId) : null;
      let isApproved = false;

      if (streamId) {
        // Scoped to the caller so nobody can retitle someone else's feed.
        const { data, error } = await caller.admin
          .from("live_streams")
          .update(base)
          .eq("id", streamId)
          .eq("observer_id", caller.userId)
          .select("id, is_approved")
          .maybeSingle();
        if (error) return json({ error: error.message }, 400);
        if (!data) return json({ error: "Stream not found." }, 404);
        isApproved = data.is_approved;
      } else {
        const { data, error } = await caller.admin
          .from("live_streams")
          .insert({ ...base, started_at: now, is_approved: false })
          .select("id, is_approved")
          .single();
        if (error) return json({ error: error.message }, 400);
        streamId = data.id;
        isApproved = data.is_approved;
      }

      // Approval decides the room; an unapproved camera never reaches the
      // public room at all.
      const room = isApproved ? PUBLIC_ROOM : INTAKE_ROOM;
      await caller.admin.from("live_streams").update({ livekit_room: room }).eq("id", streamId);

      const token = await signToken({
        apiKey,
        apiSecret,
        identity,
        name: base.observer_name,
        ttlSeconds: 60 * 60 * 12,
        grant: publisher(room),
        metadata: { streamId, state, lga, pollingUnit: base.polling_unit },
      });

      return json({ transport: "livekit", token, url: livekitUrl, room, streamId, isApproved, identity });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("livekit-token error", err);
    return json({ error: "Could not mint a token." }, 500);
  }
});
