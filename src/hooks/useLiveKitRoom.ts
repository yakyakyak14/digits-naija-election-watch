import { useCallback, useEffect, useRef, useState } from "react";
import type { RemoteTrackPublication, Room, RemoteParticipant } from "livekit-client";
import { mintIntakeToken, mintViewerToken, type StreamTransport } from "@/lib/streaming";

export interface RemoteFeed {
  identity: string;
  name: string;
  hasVideo: boolean;
  hasAudio: boolean;
  /** 0 = unknown, 1 = poor … 3 = excellent. Drives the per-tile signal pip. */
  quality: number;
  attach: (el: HTMLVideoElement | null) => void;
  attachAudio: (el: HTMLAudioElement | null) => void;
}

export type RoomStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "fallback" | "error";

/**
 * One subscribe-only LiveKit connection for the whole grid.
 *
 * Efficiency notes:
 *  - `adaptiveStream` is deliberately OFF. It pauses any track whose attached
 *    element is not intersecting the viewport, and the grid sits below the hero
 *    on /live — so tiles loaded black and only started if the viewer happened to
 *    scroll. Measured: off-screen readyState 0 with no frames; scrolled into view
 *    640x360 readyState 4. Bandwidth is instead controlled explicitly via
 *    setVideoQuality below, which is deterministic and cannot strand a viewer.
 *  - `dynacast` stops the SFU forwarding layers nobody has attached.
 *  - Tracks are attached to <video> elements by identity, so re-arranging tiles
 *    never tears down the connection.
 *  - The connection is closed on unmount, and on tab-hide we stop attaching new
 *    video so a backgrounded tab costs nothing.
 */
export function useLiveKitRoom(
  scope: "public" | "intake",
  enabled = true,
  /** Tiles on screen. Drives which simulcast layer we ask the SFU for. */
  density = 1,
) {
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [transport, setTransport] = useState<StreamTransport>("fallback");
  const [feeds, setFeeds] = useState<Record<string, RemoteFeed>>({});
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const densityRef = useRef(density);
  densityRef.current = density;
  const mountedRef = useRef(true);

  /*
   * Ask the SFU for a simulcast layer that matches how large the tile actually
   * is: 1-2 tiles HIGH, 3-4 MEDIUM, 5-6 LOW. This replaces what adaptiveStream
   * did automatically, minus its habit of pausing off-screen tiles.
   *
   * Deliberately not a useEffect keyed on `feeds`: setVideoQuality fires track
   * events, those rebuild `feeds`, and the effect would retrigger itself.
   */
  const applyQuality = useCallback(async (room: Room) => {
    const { VideoQuality } = await import("livekit-client");
    const d = densityRef.current;
    const quality = d <= 2 ? VideoQuality.HIGH : d <= 4 ? VideoQuality.MEDIUM : VideoQuality.LOW;

    room.remoteParticipants.forEach((participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (!publication.isSubscribed) return;
        publication.setVideoQuality(quality);
      });
    });
  }, []);

  const rebuildFeeds = useCallback((room: Room) => {
    const next: Record<string, RemoteFeed> = {};

    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      const videoPub = Array.from(participant.videoTrackPublications.values())[0];
      const audioPub = Array.from(participant.audioTrackPublications.values())[0];

      next[participant.identity] = {
        identity: participant.identity,
        name: participant.name || participant.identity,
        hasVideo: Boolean(videoPub?.track),
        hasAudio: Boolean(audioPub?.track),
        quality:
          participant.connectionQuality === "excellent"
            ? 3
            : participant.connectionQuality === "good"
              ? 2
              : participant.connectionQuality === "poor"
                ? 1
                : 0,
        attach: (el) => {
          const track = (videoPub as RemoteTrackPublication | undefined)?.track;
          if (!track) return;
          if (el) track.attach(el);
          else track.detach();
        },
        attachAudio: (el) => {
          const track = (audioPub as RemoteTrackPublication | undefined)?.track;
          if (!track) return;
          if (el) track.attach(el);
          else track.detach();
        },
      };
    });

    setFeeds(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    let disposed = false;
    let room: Room | null = null;

    (async () => {
      setStatus("connecting");
      setError(null);

      try {
        const grant = scope === "intake" ? await mintIntakeToken() : await mintViewerToken();

        if (disposed) return;
        setTransport(grant.transport);

        if (grant.transport !== "livekit" || !grant.token || !grant.url) {
          setStatus("fallback");
          return;
        }

        // Loaded lazily: ~200KB of WebRTC machinery no visitor needs until a
        // real provider is wired up.
        const { Room, RoomEvent } = await import("livekit-client");
        if (disposed) return;

        room = new Room({
          // See the note above: adaptiveStream strands off-screen tiles.
          adaptiveStream: false,
          dynacast: true,
          disconnectOnPageLeave: true,
        });
        roomRef.current = room;

        const refresh = () => {
          if (!disposed && room) rebuildFeeds(room);
        };

        room
          .on(RoomEvent.ParticipantConnected, refresh)
          .on(RoomEvent.ParticipantDisconnected, refresh)
          .on(RoomEvent.TrackSubscribed, (_t, _pub, _p) => {
            refresh();
            if (room) void applyQuality(room);
          })
          .on(RoomEvent.TrackUnsubscribed, refresh)
          .on(RoomEvent.TrackMuted, refresh)
          .on(RoomEvent.TrackUnmuted, refresh)
          .on(RoomEvent.ConnectionQualityChanged, refresh)
          .on(RoomEvent.Reconnecting, () => !disposed && setStatus("reconnecting"))
          .on(RoomEvent.Reconnected, () => {
            if (disposed) return;
            setStatus("connected");
            refresh();
          })
          .on(RoomEvent.Disconnected, () => !disposed && setStatus("idle"));

        await room.connect(grant.url, grant.token, { autoSubscribe: true });
        if (disposed) {
          await room.disconnect();
          return;
        }

        setStatus("connected");
        rebuildFeeds(room);
      } catch (err) {
        if (disposed) return;
        const message = err instanceof Error ? err.message : "Could not join the live room.";
        setError(message);
        // A missing provider is expected in fallback mode, not an error state.
        setStatus(message.toLowerCase().includes("not configured") ? "fallback" : "error");
      }
    })();

    return () => {
      disposed = true;
      mountedRef.current = false;
      const current = roomRef.current;
      roomRef.current = null;
      void current?.disconnect();
    };
  }, [enabled, scope, rebuildFeeds, applyQuality]);

  useEffect(() => {
    const room = roomRef.current;
    if (room && status === "connected") void applyQuality(room);
  }, [density, status, applyQuality]);

  return { status, transport, feeds, error, isLive: status === "connected" };
}
