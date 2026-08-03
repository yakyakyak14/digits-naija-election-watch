import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LocalVideoTrack, Room } from "livekit-client";
import {
  CircleStop,
  Eye,
  Loader2,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  SatelliteDish,
  SwitchCamera,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGrid, SelectControl, TextControl } from "@/components/forms/FormPrimitives";
import { useViewer } from "@/hooks/useViewer";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import {
  endBroadcast,
  getRoomStats,
  getStreamingStatus,
  mintPublisherToken,
  PUBLIC_ROOM,
} from "@/lib/streaming";
import { lgasForState, STATE_NAMES } from "@/lib/nigeria";
import { cn } from "@/lib/utils";

type Status = "idle" | "starting" | "live" | "stopping" | "error";

/**
 * Observer-side broadcaster.
 *
 * Publishes into the private intake room first. When an operator approves the
 * feed, the row's `is_approved` flips, this component sees it over Supabase
 * Realtime, mints a token for the public room and reconnects — so an unapproved
 * camera never reaches the room public viewers can subscribe to.
 */
export function StreamBroadcaster() {
  const { user, displayName, profile, isObserver, isBroadcastOperator, isAdmin } = useViewer();
  const geo = useGeolocation();

  /*
   * Asked before anything else. Live video needs a WebRTC provider; when one is
   * not configured the observer is told here, up front, rather than after
   * granting camera and location and pressing Go live.
   */
  const streaming = useQuery({
    queryKey: ["streaming-status"],
    queryFn: getStreamingStatus,
    staleTime: 120_000,
  });
  const providerReady = streaming.data?.transport === "livekit";

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [room, setRoom] = useState<string>("");
  const [isApproved, setIsApproved] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [micOn, setMicOn] = useState(true);

  // Audience size for the public room, counted by the SFU (viewers are hidden
  // from each other, so a publisher cannot count them locally either).
  const stats = useQuery({
    queryKey: ["live-room-stats"],
    queryFn: getRoomStats,
    refetchInterval: 10_000,
    enabled: status === "live" && isApproved,
  });
  const viewers = stats.data?.viewers ?? 0;
  const [elapsed, setElapsed] = useState(0);

  const [title, setTitle] = useState("");
  const [stateName, setStateName] = useState(profile?.state ?? "");
  const [lga, setLga] = useState(profile?.lga ?? "");
  const [ward, setWard] = useState(profile?.ward ?? "");
  const [pollingUnit, setPollingUnit] = useState(profile?.polling_unit ?? "");

  const previewRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const roomRef = useRef<Room | null>(null);
  const trackRef = useRef<LocalVideoTrack | null>(null);

  const canBroadcast = isObserver || isBroadcastOperator;

  const teardown = useCallback(async () => {
    trackRef.current?.detach();
    trackRef.current = null;
    const current = roomRef.current;
    roomRef.current = null;
    await current?.disconnect();
  }, []);

  useEffect(() => () => void teardown(), [teardown]);

  /*
   * Keep the screen awake while broadcasting. An observer props the phone up and
   * leaves it: without this the display sleeps, and on most phones that suspends
   * the capture pipeline and the feed goes black at the polling unit.
   */
  useEffect(() => {
    if (status !== "live") return;

    let released = false;
    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* denied or unsupported — broadcasting still works */
      }
    };
    void acquire();

    // Browsers drop the lock whenever the tab is hidden; take it again on return.
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
    };
  }, [status]);

  // Elapsed broadcast time.
  useEffect(() => {
    if (status !== "live") {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [status]);

  /** Connects (or reconnects) the publisher to whichever room approval allows. */
  const connect = useCallback(
    async (targetRoomHint?: string) => {
      // Going live is a claim about a place: hold the location gate before the
      // camera is published, same as the i-Witness recorder.
      if (!geo.fix) await geo.request();

      const grant = await mintPublisherToken({
        title: title.trim(),
        observerName: displayName,
        state: stateName,
        lga,
        ward: ward.trim() || undefined,
        pollingUnit: pollingUnit.trim() || undefined,
        streamId: streamId ?? undefined,
      });

      const { Room, RoomEvent, createLocalTracks } = await import("livekit-client");

      await teardown();

      const next = new Room({ adaptiveStream: false, dynacast: true, disconnectOnPageLeave: true });
      roomRef.current = next;

      next.on(RoomEvent.Disconnected, () => setStatus((s) => (s === "stopping" ? "idle" : s)));

      await next.connect(grant.url, grant.token);

      const tracks = await createLocalTracks({
        audio: true,
        video: { facingMode: facing, resolution: { width: 1280, height: 720 } },
      });

      for (const track of tracks) {
        await next.localParticipant.publishTrack(track, {
          // Simulcast so the SFU can hand small tiles a cheap layer.
          simulcast: true,
        });
        if (track.kind === "video") {
          trackRef.current = track as LocalVideoTrack;
          if (previewRef.current) (track as LocalVideoTrack).attach(previewRef.current);
        }
      }

      setStreamId(grant.streamId);
      setRoom(targetRoomHint ?? grant.room);
      setIsApproved(grant.isApproved);
      setStatus("live");
      return grant;
    },
    [displayName, facing, geo, lga, pollingUnit, stateName, streamId, teardown, title, ward],
  );

  async function goLive() {
    if (!providerReady) {
      toast.error("Live video is not switched on for this platform yet.");
      return;
    }
    if (!title.trim() || !stateName || !lga) {
      toast.error("Add a title, state and LGA before going live.");
      return;
    }

    setStatus("starting");
    setError(null);
    try {
      const grant = await connect();
      toast.success(
        grant.isApproved
          ? "You are live on the public grid."
          : "You are live into the Command Center. An operator will approve you for the public grid.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start the broadcast.";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }

  function toggleMic() {
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    setMicOn(next);
    void room.localParticipant.setMicrophoneEnabled(next);
    toast.info(next ? "Microphone on" : "Microphone muted");
  }

  async function stop() {
    setStatus("stopping");
    try {
      await teardown();
      if (streamId) await endBroadcast(streamId);
      toast.success("Broadcast ended.");
    } finally {
      setStreamId(null);
      setIsApproved(false);
      setStatus("idle");
    }
  }

  // Watch our own row: when an operator approves us, move to the public room.
  useEffect(() => {
    if (!streamId || status !== "live") return;

    const channel = supabase
      .channel(`my-stream-${streamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_streams", filter: `id=eq.${streamId}` },
        (payload) => {
          const row = payload.new as { is_approved: boolean; status: string };
          if (row.is_approved === isApproved) return;

          setIsApproved(row.is_approved);
          if (row.is_approved) {
            toast.success("Approved — moving your feed to the public grid.");
            void connect(PUBLIC_ROOM).catch(() =>
              toast.error("Could not switch to the public room."),
            );
          } else {
            toast.info("Removed from the public grid; still streaming to the Command Center.");
            void connect().catch(() => undefined);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [streamId, status, isApproved, connect]);

  if (!user) return null;

  if (!canBroadcast) {
    return (
      <div className="plate p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-display text-sm font-semibold">
          Broadcasting is for accredited observers
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Complete the DIGEO curriculum and get your accreditation approved to broadcast from a
          polling unit.
        </p>
      </div>
    );
  }

  const lgaOptions = lgasForState(stateName);
  const live = status === "live";
  // Keep the live controls up while tearing down, so pressing "End broadcast"
  // doesn't flip the button back to "Go live" mid-teardown.
  const showLiveControls = status === "live" || status === "stopping";

  return (
    <section className="plate space-y-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Radio className={cn("h-5 w-5", live ? "animate-pulse text-live" : "text-primary")} />
            Broadcast from your polling unit
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Your feed goes to the Command Center first. An operator decides whether it appears on
            the public grid — keep streaming either way.
          </p>
        </div>

        {live && (
          <Badge
            className={
              isApproved
                ? "gap-1.5 bg-live text-white"
                : "gap-1.5 bg-accent/25 text-accent-foreground dark:text-accent"
            }
          >
            <Wifi className="h-3 w-3" />
            {isApproved ? "On public grid" : "Command Center only"}
          </Badge>
        )}
      </header>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "h-full w-full object-cover",
            // Mirror the SELF-VIEW on the front camera only, the way a mirror or
            // any video-call app behaves — without it, moving left appears to
            // move right and framing yourself feels inverted. The rear camera is
            // never mirrored, and this is CSS on the local preview only, so what
            // viewers receive is unaffected either way.
            facing === "user" && "-scale-x-100",
          )}
        />
        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Radio className="h-8 w-8" />
            <span className="text-xs font-medium">Camera preview appears when you go live</span>
          </div>
        )}
        {live && (
          <>
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-live px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
              <span className="ml-1 font-mono tabular-nums">
                {String(Math.floor(elapsed / 3600)).padStart(2, "0")}:
                {String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </span>
            </span>

            {/* Who is actually watching — the reason to keep the camera steady. */}
            <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Eye className="h-3 w-3 text-emerald-400" />
              {isApproved ? `${viewers} watching` : "Command Center only"}
            </span>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMic}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                title={micOn ? "Mute microphone" : "Unmute microphone"}
                className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur-sm hover:bg-black/85"
              >
                {micOn ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4 text-destructive" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFacing((f) => (f === "environment" ? "user" : "environment"));
                  void connect(room).catch(() => toast.error("Could not switch camera."));
                }}
                aria-label="Switch camera"
                title="Switch camera"
                className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur-sm hover:bg-black/85"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            </div>

            {facing === "user" && (
              <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
                Front camera · preview mirrored, viewers see it unmirrored
              </span>
            )}
          </>
        )}
      </div>

      {/* Provider unavailable — say so before any permission is requested. */}
      {streaming.isSuccess && !providerReady && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4">
          <SatelliteDish className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground dark:text-accent" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">Live video is not switched on yet</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Broadcasting needs a video provider that has not been connected to this platform yet,
              so Go live is unavailable. Everything else still works — file i-Witness evidence,
              complete your observation checklists, and submit incident reports as normal.
            </p>
            {isAdmin && (
              <p className="pt-1 text-[11px] text-muted-foreground">
                <span className="font-semibold">Admin:</span>{" "}
                {streaming.data.reason === "rejected" ? (
                  <>
                    LiveKit rejected the credentials. The API key and secret must come from the same
                    LiveKit project as{" "}
                    <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_URL</code> — re-copy both
                    from that project&apos;s Keys page, then run{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      npm run fn:deploy -- --secrets
                    </code>
                    .
                  </>
                ) : streaming.data.reason === "unreachable" ? (
                  <>
                    <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_URL</code> did not
                    respond. Check the host is correct and the project is running.
                  </>
                ) : (
                  <>
                    set{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {streaming.data.missing.join(", ") ||
                        "LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET"}
                    </code>{" "}
                    in <code className="rounded bg-muted px-1 py-0.5">.env</code>, then run{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      npm run fn:deploy -- --secrets
                    </code>
                    .
                  </>
                )}{" "}
                See the LiveKit section of the README.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <FieldGrid>
        <Field
          label="Stream title"
          required
          hint="What viewers see under the tile."
          htmlFor="bc-title"
        >
          <TextControl
            id="bc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={live}
            placeholder="e.g. Accreditation and queue at PU 012"
          />
        </Field>

        <Field label="Polling unit" htmlFor="bc-pu">
          <TextControl
            id="bc-pu"
            value={pollingUnit}
            onChange={(e) => setPollingUnit(e.target.value)}
            disabled={live}
            placeholder="e.g. PU 012, Giginyu Primary School"
          />
        </Field>

        <Field label="State" required htmlFor="bc-state">
          <SelectControl
            id="bc-state"
            value={stateName}
            onChange={(e) => {
              setStateName(e.target.value);
              setLga("");
            }}
            disabled={live}
          >
            <option value="">Select a state…</option>
            {STATE_NAMES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectControl>
        </Field>

        <Field label="LGA" required htmlFor="bc-lga">
          <SelectControl
            id="bc-lga"
            value={lga}
            onChange={(e) => setLga(e.target.value)}
            disabled={live || lgaOptions.length === 0}
          >
            <option value="">{lgaOptions.length ? "Select an LGA…" : "Pick a state first"}</option>
            {lgaOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </SelectControl>
        </Field>

        <Field label="Ward" htmlFor="bc-ward">
          <TextControl
            id="bc-ward"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={live}
            placeholder="Optional"
          />
        </Field>
      </FieldGrid>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-[11px] text-muted-foreground">
          Never frame a ballot being marked. Start at a stable quality — the platform adapts upward
          on its own.
        </p>

        {showLiveControls ? (
          <Button
            variant="destructive"
            onClick={() => void stop()}
            disabled={status === "stopping"}
            className="gap-2"
          >
            {status === "stopping" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleStop className="h-4 w-4" />
            )}
            End broadcast
          </Button>
        ) : (
          <Button onClick={() => void goLive()} disabled={status === "starting"} className="gap-2">
            {status === "starting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radio className="h-4 w-4" />
            )}
            Go live
          </Button>
        )}
      </div>
    </section>
  );
}
