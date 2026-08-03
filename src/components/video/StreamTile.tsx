import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  MapPin,
  PictureInPicture2,
  Radio,
  ShieldCheck,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Volume2,
  VolumeX,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LiveStream } from "@/hooks/useLiveStreams";
import type { RemoteFeed } from "@/hooks/useLiveKitRoom";

interface StreamTileProps {
  stream: LiveStream;
  feed?: RemoteFeed;
  index: number;
  /** Tiles across the row — used to pick a sane <video> resolution hint. */
  density: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onMaximize: () => void;
  compact?: boolean;
  children?: React.ReactNode;
}

function QualityPip({ quality, live }: { quality: number; live: boolean }) {
  if (!live) return <WifiOff className="h-3 w-3 text-muted-foreground" aria-label="Feed offline" />;
  if (quality >= 3)
    return <SignalHigh className="h-3 w-3 text-emerald-400" aria-label="Excellent signal" />;
  if (quality === 2)
    return <SignalMedium className="h-3 w-3 text-amber-300" aria-label="Good signal" />;
  return <SignalLow className="h-3 w-3 text-orange-400" aria-label="Weak signal" />;
}

/**
 * A single grid tile. Binds to a LiveKit participant track when one is
 * available, otherwise plays the feed's recorded `stream_url`. Video elements
 * only ever hold one source at a time so a tile never decodes twice.
 */
export function StreamTile({
  stream,
  feed,
  index,
  density,
  isMuted,
  onToggleMute,
  onMaximize,
  compact = false,
  children,
}: StreamTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [pipSupported, setPipSupported] = useState(false);

  const hasLiveTrack = Boolean(feed?.hasVideo);
  const fallbackSrc = stream.stream_url ?? stream.hls_url ?? null;

  useEffect(() => {
    setPipSupported(typeof document !== "undefined" && "pictureInPictureEnabled" in document);
  }, []);

  // Attach / detach the WebRTC track. Detaching on unmount is what lets
  // adaptive-stream stop pulling layers for tiles that left the grid.
  useEffect(() => {
    if (!feed) return;
    const el = videoRef.current;
    feed.attach(el);
    return () => feed.attach(null);
  }, [feed, feed?.hasVideo]);

  useEffect(() => {
    if (!feed) return;
    const el = audioRef.current;
    feed.attachAudio(el);
    return () => feed.attachAudio(null);
  }, [feed, feed?.hasAudio]);

  async function togglePip() {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement === el) await document.exitPictureInPicture();
      else await el.requestPictureInPicture();
    } catch {
      /* user gesture rejected or unsupported codec — nothing to recover */
    }
  }

  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-navy-deep shadow-plate",
        "transition-colors focus-within:border-primary/60 hover:border-primary/50",
      )}
    >
      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 bg-gradient-to-b from-black/85 via-black/35 to-transparent p-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
              stream.status === "live" ? "bg-live animate-live-ring" : "bg-slate-600",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {stream.status === "live" ? "Live" : stream.status}
          </span>
          <span className="truncate text-[11px] font-semibold text-white drop-shadow">
            {compact ? `#${index + 1}` : stream.observer_name}
          </span>
        </div>

        {!compact && (
          <Badge className="shrink-0 gap-1 border border-white/20 bg-black/55 text-[10px] text-emerald-300 backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5" />
            <span className="max-w-[9rem] truncate">
              {stream.state}
              {stream.lga ? `, ${stream.lga}` : ""}
            </span>
          </Badge>
        )}
      </div>

      {/* Video surface */}
      <div className="relative aspect-video w-full bg-black">
        {hasLiveTrack || fallbackSrc ? (
          <video
            ref={videoRef}
            src={hasLiveTrack ? undefined : (fallbackSrc ?? undefined)}
            poster={stream.thumbnail_url ?? undefined}
            autoPlay
            loop={!hasLiveTrack}
            muted={isMuted}
            playsInline
            // Small tiles never need to buffer aggressively.
            preload={density > 2 ? "metadata" : "auto"}
            className="h-full w-full object-cover"
            aria-label={`${stream.observer_name} — ${stream.stream_title}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Radio className="h-7 w-7 animate-pulse" />
            <span className="text-[11px] font-medium">Waiting for observer signal…</span>
          </div>
        )}
        {hasLiveTrack && <audio ref={audioRef} autoPlay muted={isMuted} className="hidden" />}
      </div>

      {/* Footer */}
      <figcaption className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2.5">
        <div className="min-w-0 space-y-0.5 pr-1 text-white">
          <p className="line-clamp-1 text-[11px] font-bold leading-tight">{stream.stream_title}</p>
          {!compact && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-400" />
              <span className="truncate">{stream.polling_unit ?? "Polling unit pending"}</span>
              <QualityPip quality={feed?.quality ?? 0} live={hasLiveTrack} />
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? `Unmute ${stream.observer_name}` : `Mute ${stream.observer_name}`}
            className="grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/85"
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>

          {pipSupported && !compact && (
            <button
              type="button"
              onClick={() => void togglePip()}
              title="Pop out"
              aria-label={`Pop out ${stream.observer_name}`}
              className="hidden h-7 w-7 place-items-center rounded-lg bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/85 sm:grid"
            >
              <PictureInPicture2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onMaximize}
            title="Maximise"
            aria-label={`Maximise ${stream.observer_name}`}
            className="grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/85"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {children}
        </div>
      </figcaption>
    </figure>
  );
}
