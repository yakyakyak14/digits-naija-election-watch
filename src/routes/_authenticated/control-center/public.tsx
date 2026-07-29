import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/control-center/PageHeader";
import { LiveVideoGrid } from "@/components/video/LiveVideoGrid";
import { LiveChatPanel } from "@/components/live/LiveChatPanel";
import { useBroadcastState } from "@/hooks/useLiveStreams";

export const Route = createFileRoute("/_authenticated/control-center/public")({
  component: PublicPreviewPage,
});

function PublicPreviewPage() {
  const { data: state } = useBroadcastState();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Public preview"
        description="Exactly what a citizen sees right now, including the live conversation. Layout is controlled from Live operations."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("/live", "_blank")}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open the real page
          </Button>
        }
      />

      <div className="plate p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Current public headline
            </p>
            <p className="mt-1 font-display text-base font-bold">
              {state?.headline ?? "Live from polling units across Nigeria"}
            </p>
            {state?.ticker_message && (
              <p className="mt-1 text-xs text-muted-foreground">Ticker: {state.ticker_message}</p>
            )}
          </div>
          <Badge variant="outline">{state?.tile_count ?? 4} tiles</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <LiveVideoGrid />
        <LiveChatPanel channel="public-live" />
      </div>
    </div>
  );
}
