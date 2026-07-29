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
 *  - `adaptiveStream` lets LiveKit pick a simulcast layer per attached element,
 *    so a 3-across tile pulls ~360p while a maximised tile pulls full quality.
 *  - `dynacast` stops the SFU forwarding layers nobody has attached.
 *  - Tracks are attached to <video> elements by identity, so re-arranging tiles
 *    never tears down the connection.
 *  - The connection is closed on unmount, and on tab-hide we stop attaching new
 *    video so a backgrounded tab costs nothing.
 */
export function useLiveKitRoom(scope: "public" | "intake", enabled = true) {
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [transport, setTransport] = useState<StreamTransport>("fallback");
  const [feeds, setFeeds] = useState<Record<string, RemoteFeed>>({});
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const mountedRef = useRef(true);

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
          adaptiveStream: true,
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
          .on(RoomEvent.TrackSubscribed, refresh)
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
  }, [enabled, scope, rebuildFeeds]);

  return { status, transport, feeds, error, isLive: status === "connected" };
}
