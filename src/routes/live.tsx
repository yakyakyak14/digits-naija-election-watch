import { createFileRoute } from "@tanstack/react-router";
import { Info, Radio } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { LiveVideoGrid } from "@/components/video/LiveVideoGrid";
import { LiveChatPanel } from "@/components/live/LiveChatPanel";
import { useBroadcastState } from "@/hooks/useLiveStreams";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live observer grid — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Watch up to six live feeds from accredited DIGEO observers at Nigerian polling units, curated in real time by the DIGITs Command Center. Free, no account required.",
      },
      { property: "og:title", content: "Live observer grid — DIGITs Election Watch" },
      {
        property: "og:description",
        content: "Six live tiles from Nigerian polling units, curated by the Command Center.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { data: state } = useBroadcastState();

  return (
    <SiteLayout>
      {/* Ticker */}
      {state?.ticker_message && (
        <div className="marquee-mask overflow-hidden border-b bg-navy-deep py-2 text-white">
          <div className="animate-ticker flex w-max gap-12 whitespace-nowrap text-xs font-medium">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex items-center gap-12" aria-hidden={copy === 1}>
                <span className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-live" />
                  {state.ticker_message}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <header className="relative overflow-hidden rounded-2xl bg-navy-panel p-6 text-white shadow-lifted sm:p-8">
          <div className="bg-weave absolute inset-0" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="animate-live-ring gap-1.5 bg-live font-bold text-white">
                  <Radio className="h-3.5 w-3.5" />
                  Public broadcast
                </Badge>
                <Badge variant="outline" className="border-white/25 bg-white/5 text-emerald-300">
                  DIGEO observer network
                </Badge>
              </div>

              <h1 className="font-display text-display-sm font-extrabold">
                {state?.headline ?? "Live from polling units across Nigeria"}
              </h1>

              <p className="text-sm leading-relaxed text-white/70">
                Feeds come straight from accredited DIGEO observers in the field. A Command Center
                operator decides which ones reach this grid — nothing here is unreviewed, and
                nothing is edited.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-xs backdrop-blur-sm">
              <p className="font-semibold uppercase tracking-wider text-white/60">Grid controls</p>
              <ul className="mt-2 space-y-1 text-white/75">
                <li>· Pick 1–6 tiles in the toolbar</li>
                <li>· Maximise any tile, Esc to exit</li>
                <li>· Audio starts muted on every tile</li>
              </ul>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <LiveVideoGrid />
          <LiveChatPanel channel="public-live" />
        </div>

        <aside className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Watching is open to everyone.</strong> You only need
            an account to join the conversation or to file your own i-Witness evidence — everything
            else on this page works without signing in.
          </p>
        </aside>
      </div>
    </SiteLayout>
  );
}
