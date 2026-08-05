import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, MonitorUp, Radio, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Restricted } from "@/components/control-center/PageHeader";
import { Field, FieldGrid, SelectControl, TextControl } from "@/components/forms/FormPrimitives";
import { LiveVideoGrid } from "@/components/video/LiveVideoGrid";
import { StreamBroadcaster } from "@/components/video/StreamBroadcaster";
import { useViewer } from "@/hooks/useViewer";
import {
  LIVE_STREAM_KEY,
  useBroadcastState,
  useLiveStreams,
  type LiveStream,
} from "@/hooks/useLiveStreams";
import { supabase } from "@/integrations/supabase/client";
import { writeAudit } from "@/lib/roles.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/control-center/live")({
  component: LiveOpsPage,
});

const SLOT_KEYS = ["slot_1", "slot_2", "slot_3", "slot_4", "slot_5", "slot_6"] as const;

function LiveOpsPage() {
  const { isBroadcastOperator, isObserver } = useViewer();
  const qc = useQueryClient();

  const streamsQuery = useLiveStreams("all");
  const broadcastQuery = useBroadcastState();

  const [tileCount, setTileCount] = useState(4);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [headline, setHeadline] = useState("");
  const [ticker, setTicker] = useState("");
  const [savingLayout, setSavingLayout] = useState(false);

  // Hydrate the layout controls from the stored broadcast state.
  useEffect(() => {
    const state = broadcastQuery.data;
    if (!state) return;
    setTileCount(state.tile_count);
    setHeadline(state.headline ?? "");
    setTicker(state.ticker_message ?? "");
    setSlots(
      Object.fromEntries(SLOT_KEYS.map((key) => [key, state[key] ?? ""])) as Record<string, string>,
    );
  }, [broadcastQuery.data]);

  const streams = streamsQuery.data ?? [];

  async function toggleApprove(stream: LiveStream) {
    const next = !stream.is_approved;

    const { error } = await supabase
      .from("live_streams")
      .update({
        is_approved: next,
        // Approval moves the publisher to the public room; the broadcaster's
        // client watches this row and reconnects there.
        livekit_room: next ? "digits-live-ng" : "digits-intake-ng",
        updated_at: new Date().toISOString(),
      })
      .eq("id", stream.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await writeAudit({
      action: next ? "stream.approve" : "stream.unapprove",
      entity: "live_streams",
      entityId: stream.id,
      detail: { observer: stream.observer_name, state: stream.state, lga: stream.lga },
    });

    toast.success(
      next
        ? `${stream.observer_name} is now on the public grid.`
        : `${stream.observer_name} removed from the public grid.`,
    );
    qc.invalidateQueries({ queryKey: LIVE_STREAM_KEY });
    void streamsQuery.refetch();
  }

  async function saveLayout() {
    setSavingLayout(true);
    try {
      const { error } = await supabase
        .from("broadcast_state")
        .update({
          tile_count: tileCount,
          headline: headline.trim() || null,
          ticker_message: ticker.trim() || null,
          slot_1: slots.slot_1 || null,
          slot_2: slots.slot_2 || null,
          slot_3: slots.slot_3 || null,
          slot_4: slots.slot_4 || null,
          slot_5: slots.slot_5 || null,
          slot_6: slots.slot_6 || null,
        })
        .eq("id", true);
      if (error) {
        toast.error(error.message);
        return;
      }

      await writeAudit({
        action: "broadcast.layout",
        entity: "broadcast_state",
        detail: { tileCount },
      });
      toast.success("Public grid layout published to every viewer.");
      void broadcastQuery.refetch();
    } finally {
      setSavingLayout(false);
    }
  }

  if (!isBroadcastOperator && !isObserver) {
    return <Restricted need="Control Center Operator, Admin or DIGEO" />;
  }

  const approvedStreams = streams.filter((s) => s.is_approved);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Live operations"
        description={
          isBroadcastOperator
            ? "Approve observer feeds, arrange the public 1–6 grid, and set the headline citizens see."
            : "Go live from your assigned polling unit. An operator decides when your feed reaches the public grid."
        }
        actions={
          <>
            <Badge className="gap-1.5 bg-live text-white">
              <Radio className="h-3.5 w-3.5" />
              {streams.filter((s) => s.status === "live").length} live
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open("/live", "_blank")}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public view
            </Button>
          </>
        }
      />

      {/* Observer broadcaster */}
      {(isObserver || isBroadcastOperator) && <StreamBroadcaster />}

      {isBroadcastOperator && (
        <>
          {/* Intake grid with approval controls */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <MonitorUp className="h-4.5 w-4.5 text-primary" />
              Intake &amp; approval
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything observers are publishing, approved or not. Approving a feed moves it to the
              public room within a round trip.
            </p>
            <LiveVideoGrid
              mode="operator"
              onToggleApprove={(stream) => void toggleApprove(stream)}
            />
          </section>

          {/* Layout publisher */}
          <section className="plate space-y-5 p-6">
            <header>
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Settings2 className="h-4.5 w-4.5 text-primary" />
                Public grid layout
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Assign approved feeds to specific tiles, or leave a slot empty to let the
                highest-priority feeds fill it. Changes reach every open viewer immediately.
              </p>
            </header>

            <Field label="Tiles on the public grid" required>
              <div
                role="radiogroup"
                aria-label="Tile count"
                className="flex gap-1 rounded-lg bg-muted p-1"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={tileCount === n}
                    onClick={() => setTileCount(n)}
                    className={cn(
                      "h-8 flex-1 rounded-md text-xs font-bold transition-colors",
                      tileCount === n
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-background hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <FieldGrid cols={3}>
              {SLOT_KEYS.slice(0, tileCount).map((key, idx) => (
                <Field key={key} label={`Tile ${idx + 1}`} htmlFor={`slot-${idx}`}>
                  <SelectControl
                    id={`slot-${idx}`}
                    value={slots[key] ?? ""}
                    onChange={(e) => setSlots((s) => ({ ...s, [key]: e.target.value }))}
                  >
                    <option value="">Auto — highest priority feed</option>
                    {approvedStreams.map((stream) => (
                      <option key={stream.id} value={stream.id}>
                        {stream.observer_name} — {stream.lga}, {stream.state}
                      </option>
                    ))}
                  </SelectControl>
                </Field>
              ))}
            </FieldGrid>

            <FieldGrid>
              <Field
                label="Grid headline"
                hint="Shown above the public grid."
                htmlFor="bs-headline"
              >
                <TextControl
                  id="bs-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Presidential election — accreditation under way nationwide"
                />
              </Field>

              <Field
                label="Ticker message"
                hint="Scrolls across the top of the public page."
                htmlFor="bs-ticker"
              >
                <TextControl
                  id="bs-ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. 412 observers checked in across 36 states and the FCT"
                />
              </Field>
            </FieldGrid>

            <div className="flex items-center justify-end border-t pt-5">
              <Button onClick={() => void saveLayout()} disabled={savingLayout} className="gap-2">
                {savingLayout ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Publish layout
              </Button>
            </div>
          </section>

          {/* Approval table */}
          <section className="plate overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
              <h2 className="font-display text-base font-bold">Feed register</h2>
              <span className="text-xs text-muted-foreground">
                {approvedStreams.length} of {streams.length} approved
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">Observer</th>
                    <th className="p-3 font-semibold">Location</th>
                    <th className="p-3 font-semibold">Title</th>
                    <th className="p-3 font-semibold">Viewers</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {streams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                        No observer feeds yet. They appear here the moment a DIGEO goes live.
                      </td>
                    </tr>
                  )}

                  {streams.map((stream) => (
                    <tr key={stream.id} className="transition-colors hover:bg-muted/25">
                      <td className="p-3 font-semibold">{stream.observer_name}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{stream.state}</span>
                        {stream.lga ? ` · ${stream.lga}` : ""}
                        {stream.polling_unit ? ` · ${stream.polling_unit}` : ""}
                      </td>
                      <td className="p-3 text-xs">{stream.stream_title}</td>
                      <td className="p-3 text-xs font-semibold">
                        {(stream.viewer_count ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {stream.is_approved ? (
                          <Badge className="bg-primary/15 text-primary">On public grid</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-accent/50 text-accent-foreground dark:text-accent"
                          >
                            Intake only
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant={stream.is_approved ? "outline" : "default"}
                          onClick={() => void toggleApprove(stream)}
                        >
                          {stream.is_approved ? "Remove" : "Approve"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
