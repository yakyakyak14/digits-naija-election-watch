import { useEffect, useMemo, useState } from "react";
import {
  Antenna,
  CheckCircle2,
  Eye,
  Minimize2,
  Radio,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamTile } from "./StreamTile";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import {
  resolveGridTiles,
  useBroadcastState,
  useLiveStreams,
  type LiveStream,
} from "@/hooks/useLiveStreams";
import { cn } from "@/lib/utils";

const GRID_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

interface LiveVideoGridProps {
  /** "public" renders the curated grid; "operator" adds approval controls and shows intake feeds. */
  mode?: "public" | "operator";
  onToggleApprove?: (stream: LiveStream) => void;
  className?: string;
}

export function LiveVideoGrid({ mode = "public", onToggleApprove, className }: LiveVideoGridProps) {
  const scope = mode === "operator" ? "all" : "public";
  const streamsQuery = useLiveStreams(scope);
  const broadcastQuery = useBroadcastState();
  const room = useLiveKitRoom(mode === "operator" ? "intake" : "public");

  const [tileOverride, setTileOverride] = useState<number | null>(null);
  const [maximized, setMaximized] = useState<string | null>(null);
  const [muted, setMuted] = useState<Record<string, boolean>>({});

  // Memoised so the `?? []` fallback doesn't hand useMemo a fresh array each
  // render, which would re-resolve the grid (and re-key the tiles) constantly.
  const streams = useMemo(() => streamsQuery.data ?? [], [streamsQuery.data]);
  const state = broadcastQuery.data ?? null;

  const tiles = useMemo(
    () => resolveGridTiles(streams, state, tileOverride ?? undefined),
    [streams, state, tileOverride],
  );

  const tileCount = tiles.length || (tileOverride ?? state?.tile_count ?? 4);
  const maximizedStream = tiles.find((t) => t.id === maximized) ?? null;

  // Esc always leaves the maximised view, matching every other video player.
  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMaximized(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximized]);

  const totalViewers = streams.reduce((sum, s) => sum + (s.viewer_count ?? 0), 0);
  const liveCount = streams.filter((s) => s.status === "live").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-plate">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-live/10 px-2 py-1 text-xs font-bold text-live">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            {liveCount} live
          </span>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Eye className="h-3 w-3" />
            {totalViewers.toLocaleString()} watching
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-[11px]",
              room.transport === "livekit"
                ? "border-primary/40 text-primary"
                : "border-accent/50 text-accent-foreground dark:text-accent",
            )}
            title={
              room.transport === "livekit"
                ? "Sub-second WebRTC transport via LiveKit"
                : "Live video provider not configured — tiles play each feed's recorded source"
            }
          >
            <Antenna className="h-3 w-3" />
            {room.transport === "livekit"
              ? room.status === "connected"
                ? "WebRTC connected"
                : room.status === "reconnecting"
                  ? "Reconnecting…"
                  : "Connecting…"
              : "Preview transport"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Number of tiles"
            className="flex items-center gap-0.5 rounded-lg bg-muted p-1"
          >
            <span className="px-1.5 text-[11px] font-semibold text-muted-foreground">Tiles</span>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={tileCount === n}
                onClick={() => setTileOverride(n)}
                className={cn(
                  "h-7 w-7 rounded-md text-xs font-bold transition-all",
                  tileCount === n
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Refresh feeds"
            aria-label="Refresh feeds"
            onClick={() => void streamsQuery.refetch()}
          >
            <RefreshCw className={cn("h-4 w-4", streamsQuery.isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {room.status === "error" && room.error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {room.error}
        </p>
      )}

      {/* Grid */}
      {tiles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-16 text-center">
          <Radio className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-display font-semibold">No feeds on air right now</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {mode === "operator"
                ? "Observer feeds appear here the moment a DIGEO goes live from the field."
                : "The Command Center publishes observer feeds here on election days. Follow the i-Witness stream in the meantime."}
            </p>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-3 sm:gap-4", GRID_CLASS[tileCount] ?? GRID_CLASS[4])}>
          {tiles.map((stream, idx) => (
            <StreamTile
              key={stream.id}
              stream={stream}
              feed={stream.livekit_identity ? room.feeds[stream.livekit_identity] : undefined}
              index={idx}
              density={tileCount}
              isMuted={muted[stream.id] ?? true}
              onToggleMute={() => setMuted((m) => ({ ...m, [stream.id]: !(m[stream.id] ?? true) }))}
              onMaximize={() => setMaximized(stream.id)}
            >
              {mode === "operator" && onToggleApprove && (
                <button
                  type="button"
                  onClick={() => onToggleApprove(stream)}
                  title={stream.is_approved ? "Remove from public grid" : "Approve for public grid"}
                  className={cn(
                    "grid h-7 place-items-center rounded-lg px-2 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm transition-colors",
                    stream.is_approved
                      ? "bg-primary/90 text-primary-foreground hover:bg-primary"
                      : "bg-black/55 text-white hover:bg-black/85",
                  )}
                >
                  {stream.is_approved ? "On air" : "Approve"}
                </button>
              )}
            </StreamTile>
          ))}
        </div>
      )}

      {/* Maximised view */}
      {maximizedStream && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${maximizedStream.observer_name} maximised`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 backdrop-blur-md sm:p-6"
        >
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-primary/30 bg-navy-deep shadow-lifted">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded bg-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    On air
                  </span>
                  <h3 className="truncate font-display text-sm font-bold text-white sm:text-base">
                    {maximizedStream.observer_name}
                  </h3>
                </div>
                <p className="mt-0.5 truncate text-xs text-emerald-300">
                  {maximizedStream.state}
                  {maximizedStream.lga ? ` · ${maximizedStream.lga} LGA` : ""}
                  {maximizedStream.polling_unit ? ` · ${maximizedStream.polling_unit}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMaximized(null)}
                className="shrink-0 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Minimize2 className="mr-1.5 h-4 w-4" />
                Close
              </Button>
            </div>

            <StreamTile
              stream={maximizedStream}
              feed={
                maximizedStream.livekit_identity
                  ? room.feeds[maximizedStream.livekit_identity]
                  : undefined
              }
              index={0}
              density={1}
              isMuted={muted[maximizedStream.id] ?? true}
              onToggleMute={() =>
                setMuted((m) => ({ ...m, [maximizedStream.id]: !(m[maximizedStream.id] ?? true) }))
              }
              onMaximize={() => setMaximized(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-slate-300 sm:px-6">
              <span className="flex items-center gap-1.5 font-medium text-white">
                <Eye className="h-4 w-4 text-emerald-400" />
                {(maximizedStream.viewer_count ?? 0).toLocaleString()} watching
              </span>
              <span className="truncate">{maximizedStream.stream_title}</span>
              <Badge className="gap-1 bg-primary font-semibold text-primary-foreground">
                {maximizedStream.is_approved ? (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Verified DIGEO feed
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" /> Awaiting approval
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {mode === "operator" && streams.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {streams.filter((s) => s.is_approved).length} of {streams.length} feeds approved for the
          public grid.
        </p>
      )}
    </div>
  );
}
