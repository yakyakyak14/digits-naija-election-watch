import { supabase } from "@/integrations/supabase/client";

/**
 * Client for the `livekit-token` Edge Function.
 *
 * The LiveKit API secret lives only in that function's environment, so token
 * minting is always a round trip — never something the browser can forge.
 *
 * Topology (see supabase/functions/livekit-token/index.ts):
 *   digits-live-ng    public room, approved feeds only, subscribe-only viewers
 *   digits-intake-ng  private intake room, operators subscribe
 *
 * A viewer therefore holds ONE WebRTC connection no matter how many tiles are on
 * screen; LiveKit's adaptive-stream and simulcast machinery handles per-tile
 * quality. One connection per tile would multiply bandwidth by six for nothing.
 */

export const PUBLIC_ROOM = "digits-live-ng";
export const INTAKE_ROOM = "digits-intake-ng";

export type StreamTransport = "livekit" | "fallback";

export interface TokenGrant {
  transport: StreamTransport;
  token: string | null;
  url: string | null;
  room: string | null;
  streamId?: string;
  isApproved?: boolean;
  identity?: string;
}

const FALLBACK: TokenGrant = { transport: "fallback", token: null, url: null, room: null };

/**
 * Reads the real message out of a failed function call. supabase-js reports any
 * non-2xx as a generic FunctionsHttpError and puts the response on `context`;
 * without unwrapping it, a 403 about roles is indistinguishable from the
 * provider being offline.
 */
async function describeError(error: Error): Promise<string> {
  const response = (error as { context?: Response }).context;
  if (response && typeof response.json === "function") {
    const parsed = (await response.json().catch(() => null)) as { error?: string } | null;
    if (parsed?.error) return parsed.error;
  }
  return error.message;
}

/**
 * `degrade` is the difference between watching and broadcasting.
 *
 * Viewers must degrade: if the provider is down the grid still renders recorded
 * sources, and an error toast would be noise. A publisher must NOT degrade —
 * swallowing the response turned "you do not hold the DIGEO role" into "live
 * video is not switched on", which sent an observer chasing a configuration
 * problem that did not exist.
 */
async function invoke(
  body: Record<string, unknown>,
  { degrade = true }: { degrade?: boolean } = {},
): Promise<TokenGrant> {
  const { data, error } = await supabase.functions.invoke<TokenGrant & { error?: string }>(
    "livekit-token",
    { body },
  );

  if (error) {
    const detail = await describeError(error);
    console.error("[livekit-token]", detail);
    if (!degrade) throw new Error(detail);
    return FALLBACK;
  }
  if (!data) {
    if (!degrade) throw new Error("The streaming service did not respond.");
    return FALLBACK;
  }
  if (data.error) throw new Error(data.error);

  return data;
}

export type StreamingReason = "ok" | "unset" | "rejected" | "unreachable" | string;

export interface StreamingStatus {
  transport: StreamTransport;
  /** Env var names still missing, for staff. Never values. */
  missing: string[];
  /**
   * Why streaming is unavailable:
   *   unset       the variables are not set
   *   rejected    they are set but LiveKit refused them (mismatched pair, or a
   *               pair belonging to a different project than LIVEKIT_URL)
   *   unreachable LIVEKIT_URL did not respond
   */
  reason: StreamingReason;
}

/**
 * Whether live video is switched on, asked before any camera or location
 * permission is requested. Mints no token, so it is cheap and unauthenticated.
 */
export async function getStreamingStatus(): Promise<StreamingStatus> {
  const { data, error } = await supabase.functions.invoke<StreamingStatus>("livekit-token", {
    body: { action: "config" },
  });
  if (error || !data) return { transport: "fallback", missing: [], reason: "unreachable" };
  return {
    transport: data.transport ?? "fallback",
    missing: data.missing ?? [],
    reason: data.reason ?? "unset",
  };
}

/** Subscribe-only token for the public grid. Works without an account. */
export function mintViewerToken() {
  return invoke({ action: "viewer" });
}

/** Subscribe-only token for the intake room. Operators only. */
export function mintIntakeToken() {
  return invoke({ action: "intake" });
}

export interface PublisherRequest {
  title: string;
  observerName: string;
  state: string;
  lga: string;
  ward?: string;
  pollingUnit?: string;
  streamId?: string;
}

/** A publisher grant is only returned when it is complete and usable. */
export interface PublisherGrant {
  token: string;
  url: string;
  room: string;
  streamId: string;
  isApproved: boolean;
  identity: string;
}

/**
 * Publisher token for a DIGEO observer or operator. Creates or refreshes the
 * observer's live_streams row and returns the room their approval state allows.
 */
export async function mintPublisherToken(request: PublisherRequest): Promise<PublisherGrant> {
  const grant = await invoke({ action: "publisher", ...request }, { degrade: false });

  if (
    grant.transport !== "livekit" ||
    !grant.token ||
    !grant.url ||
    !grant.room ||
    !grant.streamId
  ) {
    // Plain language: this surfaces to an observer standing at a polling unit,
    // not to whoever administers the deployment.
    throw new Error(
      "Live video is not switched on for this platform yet, so your broadcast could not start. Your report forms and i-Witness capture still work.",
    );
  }

  return {
    token: grant.token,
    url: grant.url,
    room: grant.room,
    streamId: grant.streamId,
    isApproved: grant.isApproved ?? false,
    identity: grant.identity ?? "",
  };
}

/** Marks a feed ended so it leaves the grid immediately rather than on timeout. */
export async function endBroadcast(streamId: string) {
  const { error } = await supabase
    .from("live_streams")
    .update({ status: "ended", ended_at: new Date().toISOString(), is_approved: false })
    .eq("id", streamId);
  if (error) throw new Error(error.message);
}

/**
 * Reports whether WebRTC transport is available, without minting a real token.
 * Used by the Settings screen and the grid's transport badge.
 */
export async function getStreamingConfig(): Promise<{
  transport: StreamTransport;
  url: string | null;
  publicRoom: string;
  intakeRoom: string;
}> {
  const grant = await mintViewerToken();
  return {
    transport: grant.transport,
    url: grant.url,
    publicRoom: PUBLIC_ROOM,
    intakeRoom: INTAKE_ROOM,
  };
}
