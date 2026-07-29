import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LiveVideoGrid } from "@/components/video/LiveVideoGrid";
import { Radio, ShieldCheck, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/live")({
  component: PublicLiveBroadcastPage,
});

function PublicLiveBroadcastPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Hero Banner */}
        <div className="rounded-2xl border bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white font-bold px-3 py-1 flex items-center gap-1.5 animate-pulse">
                  <Radio className="h-4 w-4" />
                  REAL-TIME PUBLIC BROADCAST
                </Badge>
                <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 bg-emerald-950/40">
                  DIGEO Network 🇳🇬
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
                Live Election Observer Video Grid
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Direct live video streams broadcasted from trained DIGEO Election Observers at Polling Units across Nigeria. Approved in real-time from our Central Control Center.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-xs">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Live Split Display</p>
                <p className="text-xs text-emerald-400 flex items-center justify-center sm:justify-start gap-1 font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Select 1, 2, 3, 4, 5, or 6 Split Tiles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Alert Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 text-emerald-900 dark:text-emerald-200">
          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold">Interactive Video Grid Features:</p>
            <p className="text-emerald-800 dark:text-emerald-300">
              Click or tap on any video tile to <strong>Maximize to Fullscreen</strong>. Use the split view toolbar below to customize your observer monitoring matrix in real-time.
            </p>
          </div>
        </div>

        {/* Live Video Grid Component */}
        <LiveVideoGrid initialTileCount={4} />
      </main>

      <SiteFooter />
    </div>
  );
}
