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
  room?: string;
  roomJoin?: boolean;
  canSubscribe?: boolean;
  canPublish?: boolean;
  canPublishData?: boolean;
  roomAdmin?: boolean;
  roomCreate?: boolean;
  hidden?: boolean;
  /** Server-API only: used by the credential probe, never by a client token. */
  roomList?: boolean;
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

/** Short-lived cache for the credential probe, so config calls stay cheap. */
let configCache: { ok: boolean; reason: string; at: number } | null = null;
/** Short-lived cache for the audience count. */
let statsCache: { viewers: number; publishers: number; at: number } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const livekitUrl = Deno.env.get("LIVEKIT_URL");
  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

  const configured = Boolean(livekitUrl && apiKey && apiSecret);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  /*
   * Status probe. The broadcaster asks this BEFORE showing its form, so an
   * observer is told up front that live video is unavailable instead of
   * discovering it after granting camera and location and pressing Go live.
   * Mints nothing, so it needs no auth and is safe to call on every mount.
   */
  if (body.action === "config") {
    const missing = [
      !livekitUrl ? "LIVEKIT_URL" : null,
      !apiKey ? "LIVEKIT_API_KEY" : null,
      !apiSecret ? "LIVEKIT_API_SECRET" : null,
    ].filter(Boolean);

    if (!configured) {
      return json({ transport: "fallback", missing, reason: "unset" });
    }

    /*
     * Variables being present does not mean they work. A mismatched key/secret
     * pair, or a pair belonging to a different project than LIVEKIT_URL, mints a
     * perfectly well-formed token that the server then rejects — the observer
     * would press Go live, hand over camera and location, and only then fail.
     * So actually ask LiveKit, and cache the answer briefly.
     */
    const cached = configCache;
    if (cached && Date.now() - cached.at < 60_000) {
      return json({ transport: cached.ok ? "livekit" : "fallback", missing: [], reason: cached.reason });
    }

    let ok = false;
    let reason = "ok";
    try {
      const probeToken = await signToken({
        apiKey: apiKey!,
        apiSecret: apiSecret!,
        identity: "config-probe",
        name: "config-probe",
        ttlSeconds: 60,
        grant: { roomList: true },
      });
      const httpBase = livekitUrl!.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/$/, "");
      const probe = await fetch(`${httpBase}/twirp/livekit.RoomService/ListRooms`, {
        method: "POST",
        headers: { Authorization: `Bearer ${probeToken}`, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(5000),
      });
      ok = probe.ok;
      if (!probe.ok) {
        reason = probe.status === 401 ? "rejected" : `http_${probe.status}`;
        console.error("[livekit] credential probe failed", probe.status, (await probe.text()).slice(0, 200));
      }
    } catch (err) {
      reason = "unreachable";
      console.error("[livekit] credential probe error", err);
    }

    configCache = { ok, reason, at: Date.now() };
    return json({ transport: ok ? "livekit" : "fallback", missing: [], reason });
  }

  /*
   * Audience size for the public room.
   *
   * Viewer tokens are minted `hidden: true` so thousands of watchers do not show
   * up in every other participant's room state — which also makes them
   * uncountable from the browser. The server API still sees them, so the count
   * is taken here. Publishers use a `pub-` identity and are excluded.
   *
   * Cached briefly: the grid polls this, and it must not turn into one LiveKit
   * API call per viewer per interval.
   */
  if (body.action === "stats") {
    if (!configured) return json({ viewers: 0, publishers: 0 });

    const cached = statsCache;
    if (cached && Date.now() - cached.at < 5000) {
      return json({ viewers: cached.viewers, publishers: cached.publishers });
    }

    try {
      const probeToken = await signToken({
        apiKey: apiKey!,
        apiSecret: apiSecret!,
        identity: "stats-probe",
        name: "stats-probe",
        ttlSeconds: 60,
        grant: { roomAdmin: true, room: PUBLIC_ROOM },
      });
      const httpBase = livekitUrl!.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/$/, "");
      const res = await fetch(`${httpBase}/twirp/livekit.RoomService/ListParticipants`, {
        method: "POST",
        headers: { Authorization: `Bearer ${probeToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ room: PUBLIC_ROOM }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return json({ viewers: 0, publishers: 0 });

      const payload = (await res.json()) as { participants?: Array<{ identity: string }> };
      const all = payload.participants ?? [];
      const publishers = all.filter((p) => p.identity.startsWith("pub-")).length;
      const viewers = all.length - publishers;

      statsCache = { viewers, publishers, at: Date.now() };
      return json({ viewers, publishers });
    } catch (err) {
      console.error("[livekit] stats failed", err);
      return json({ viewers: 0, publishers: 0 });
    }
  }

  // No provider configured: report fallback so the grid plays recorded sources.
  if (!configured) {
    return json({ transport: "fallback", token: null, url: null, room: null });
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
