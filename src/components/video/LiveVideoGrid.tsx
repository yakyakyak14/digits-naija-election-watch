import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX, ShieldCheck, MapPin, Eye, Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ObserverStream {
  id: string;
  observerName: string;
  state: string;
  lga: string;
  pollingUnit: string;
  title: string;
  videoUrl: string;
  isApproved: boolean;
  tileSlot: number;
  viewers: number;
  status: "live" | "paused" | "offline";
}

// Fallback high-quality mock live streams for demonstration when live observer feeds are connecting
const MOCK_OBSERVER_STREAMS: ObserverStream[] = [
  {
    id: "stream-1",
    observerName: "Amina Bello (DIGEO #042)",
    state: "Kano",
    lga: "Nasarawa",
    pollingUnit: "PU 012 - Giginyu Primary School",
    title: "Voter Accreditation & Queue Monitoring",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isApproved: true,
    tileSlot: 1,
    viewers: 1420,
    status: "live",
  },
  {
    id: "stream-2",
    observerName: "Chidi Okonkwo (DIGEO #108)",
    state: "Enugu",
    lga: "Enugu North",
    pollingUnit: "PU 004 - Independence Layout",
    title: "INEC BVAS Result Sheet Upload Observation",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    isApproved: true,
    tileSlot: 2,
    viewers: 980,
    status: "live",
  },
  {
    id: "stream-3",
    observerName: "Babatunde Adeleke (DIGEO #215)",
    state: "Lagos",
    lga: "Ikeja",
    pollingUnit: "PU 018 - Allen Avenue Secretariat",
    title: "Ballot Counting & Agent Signature Verification",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    isApproved: true,
    tileSlot: 3,
    viewers: 2310,
    status: "live",
  },
  {
    id: "stream-4",
    observerName: "Fatima Yusuf (DIGEO #077)",
    state: "Kaduna",
    lga: "Kaduna North",
    pollingUnit: "PU 009 - Unguwan Rimi Market",
    title: "Peaceful Sorting of Presidential Ballots",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    isApproved: true,
    tileSlot: 4,
    viewers: 860,
    status: "live",
  },
  {
    id: "stream-5",
    observerName: "Emeka Nwosu (DIGEO #319)",
    state: "Rivers",
    lga: "Port Harcourt",
    pollingUnit: "PU 022 - GRA Phase 2 Center",
    title: "Collation Center Security & Transparency Check",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoykit.mp4",
    isApproved: true,
    tileSlot: 5,
    viewers: 1750,
    status: "live",
  },
  {
    id: "stream-6",
    observerName: "Grace Danjuma (DIGEO #154)",
    state: "FCT Abuja",
    lga: "Abuja Municipal (AMAC)",
    pollingUnit: "PU 001 - Garki Model Primary School",
    title: "Public Result Declaration Announcement",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    isApproved: true,
    tileSlot: 6,
    viewers: 3100,
    status: "live",
  },
];

interface LiveVideoGridProps {
  streams?: ObserverStream[];
  initialTileCount?: number;
  isAdminControl?: boolean;
  onToggleApprove?: (streamId: string) => void;
}

export function LiveVideoGrid({
  streams = MOCK_OBSERVER_STREAMS,
  initialTileCount = 4,
  isAdminControl = false,
  onToggleApprove,
}: LiveVideoGridProps) {
  const [tileCount, setTileCount] = useState<number>(initialTileCount);
  const [maximizedStream, setMaximizedStream] = useState<ObserverStream | null>(null);
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});

  const activeStreams = streams.slice(0, tileCount);

  const toggleMute = (id: string) => {
    setMutedStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine grid CSS layout based on tile count
  const getGridClass = () => {
    switch (tileCount) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
      case 5:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 6:
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className="space-y-4">
      {/* Tile Count Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500 animate-pulse" />
          <span className="font-display font-semibold text-sm text-foreground">
            Control Center Live Observer Grid
          </span>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
            {activeStreams.length} Feeds Broadcasting
          </Badge>
        </div>

        {/* 1 to 6 Split Screen Buttons */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <span className="text-xs text-muted-foreground px-2 font-medium">Split View:</span>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setTileCount(num)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                tileCount === num
                  ? "bg-primary text-primary-foreground shadow-xs scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {num} Tile{num > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      <div className={`grid gap-4 ${getGridClass()}`}>
        {activeStreams.map((stream, idx) => {
          const isMuted = mutedStates[stream.id] ?? true;
          return (
            <div
              key={stream.id}
              className="group relative overflow-hidden rounded-xl border bg-black shadow-md transition-all hover:border-emerald-500/50"
            >
              {/* Top Banner Overlay */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    LIVE TILE #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-white drop-shadow-xs truncate max-w-[140px] sm:max-w-[180px]">
                    {stream.observerName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-black/60 text-emerald-400 border border-emerald-500/40 backdrop-blur-xs text-[10px] gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    {stream.state}, {stream.lga}
                  </Badge>
                </div>
              </div>

              {/* Video Element */}
              <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                <video
                  src={stream.videoUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between">
                <div className="space-y-0.5 text-white pr-2">
                  <p className="text-xs font-bold leading-tight line-clamp-1">{stream.title}</p>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    {stream.pollingUnit}
                  </p>
                </div>

                {/* Controls (Mute, Maximize) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleMute(stream.id)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => setMaximizedStream(stream)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors"
                    title="Maximize to Full Screen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  {isAdminControl && onToggleApprove && (
                    <Button
                      size="sm"
                      variant={stream.isApproved ? "default" : "destructive"}
                      onClick={() => onToggleApprove(stream.id)}
                      className="text-[10px] h-7 px-2"
                    >
                      {stream.isApproved ? "Approved" : "Approve"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Maximized Modal */}
      {maximizedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900/90 px-6 py-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  MAXIMIZED OBSERVER STREAM
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">{maximizedStream.observerName}</h3>
                  <p className="text-xs text-emerald-400 font-medium">{maximizedStream.state} State ({maximizedStream.lga} LGA) — {maximizedStream.pollingUnit}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMaximizedStream(null)}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Minimize2 className="h-5 w-5 mr-1" />
                Close Fullscreen
              </Button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src={maximizedStream.videoUrl}
                autoPlay
                controls
                className="h-full w-full object-contain"
              />
            </div>

            {/* Info Footer */}
            <div className="flex items-center justify-between bg-slate-900 px-6 py-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-white font-medium">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  {maximizedStream.viewers.toLocaleString()} Public Viewers Connected
                </span>
                <span className="text-slate-400">Stream Title: <strong className="text-white">{maximizedStream.title}</strong></span>
              </div>
              <Badge className="bg-emerald-600 text-white font-semibold">
                DIGEO Verified Observer Stream
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
