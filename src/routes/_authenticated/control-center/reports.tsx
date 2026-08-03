import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Camera,
  Clock,
  Flag,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Restricted } from "@/components/control-center/PageHeader";
import { TextControl } from "@/components/forms/FormPrimitives";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { signedEvidenceUrl, type IWitnessReport } from "@/lib/iwitness";
import { writeAudit } from "@/lib/roles.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/control-center/reports")({
  component: ReportsQueuePage,
});

const FILTERS = ["pending", "verified", "broadcasted", "flagged", "all"] as const;
type Filter = (typeof FILTERS)[number];

const SEVERITY_TONE: Record<number, string> = {
  5: "bg-destructive text-destructive-foreground",
  4: "bg-orange-500 text-white",
  3: "bg-accent text-accent-foreground",
  2: "bg-muted text-muted-foreground",
  1: "bg-primary/15 text-primary",
};

/** Evidence lives in a private bucket, so each card resolves its own signed URL. */
function EvidencePlayer({ report }: { report: IWitnessReport }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const path = report.storage_path;

    if (!path) {
      setUrl(report.media_url ?? null);
      return;
    }

    void signedEvidenceUrl(path).then((signed) => {
      if (cancelled) return;
      if (signed) setUrl(signed);
      else setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [report.storage_path, report.media_url]);

  if (failed || (!url && !report.storage_path)) {
    return (
      <div className="flex aspect-video items-center justify-center bg-navy-deep text-xs text-muted-foreground">
        Evidence unavailable
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center bg-navy-deep">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return report.media_type === "image" ? (
    <img
      src={url}
      alt="i-Witness evidence"
      className="aspect-video w-full bg-black object-contain"
    />
  ) : (
    <video
      src={url}
      controls
      preload="metadata"
      className="aspect-video w-full bg-black object-contain"
    />
  );
}

function ReportsQueuePage() {
  const { isStaff, isBroadcastOperator } = useViewer();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});

  const reports = useQuery({
    queryKey: ["cc-iwitness", filter],
    queryFn: async (): Promise<IWitnessReport[]> => {
      let query = supabase
        .from("iwitness_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(120);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isStaff,
  });

  // New evidence lands in the queue without a refresh.
  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("cc-iwitness-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iwitness_reports" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["cc-iwitness"] });
          if (payload.eventType === "INSERT") {
            const row = payload.new as IWitnessReport;
            toast.info(`New i-Witness report from ${row.lga}, ${row.state}`, {
              description: row.description?.slice(0, 90) ?? "No description supplied.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isStaff, qc]);

  const filtered = useMemo(() => {
    const rows = reports.data ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((r) =>
      [r.reporter_name, r.state, r.lga, r.polling_unit, r.address, r.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    );
  }, [reports.data, search]);

  async function update(report: IWitnessReport, patch: Record<string, unknown>, action: string) {
    setBusyId(report.id);
    try {
      const { error } = await supabase
        .from("iwitness_reports")
        .update({ ...patch, reviewed_at: new Date().toISOString() })
        .eq("id", report.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      await writeAudit({
        action,
        entity: "iwitness_reports",
        entityId: report.id,
        detail: { state: report.state, lga: report.lga, category: report.triage_category },
      });

      qc.invalidateQueries({ queryKey: ["cc-iwitness"] });
      qc.invalidateQueries({ queryKey: ["cc-counts"] });
    } finally {
      setBusyId(null);
    }
  }

  if (!isStaff) return <Restricted need="Reviewer, Operator or Admin" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="i-Witness evidence queue"
        description="Citizen evidence with coordinates, capture time and a verified NIN attached. Nothing here is public until you release it."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => void reports.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", reports.isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                filter === option
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <label htmlFor="report-search" className="sr-only">
            Search reports
          </label>
          <TextControl
            id="report-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reporter, LGA, polling unit…"
          />
        </div>
      </div>

      {reports.isLoading && <p className="text-sm text-muted-foreground">Loading the queue…</p>}

      {!reports.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Camera}
          title={filter === "pending" ? "Queue is clear" : "Nothing matches this view"}
          body="New citizen evidence appears here the moment it is filed — no refresh needed."
        />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((report) => {
          const busy = busyId === report.id;
          const hoursLeft = report.expires_from_user_at
            ? Math.max(
                0,
                Math.round(
                  (new Date(report.expires_from_user_at).getTime() - Date.now()) / 3_600_000,
                ),
              )
            : null;

          return (
            <article key={report.id} className="plate flex flex-col overflow-hidden">
              <div className="relative">
                <EvidencePlayer report={report} />

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <Badge className={cn("text-[10px]", SEVERITY_TONE[report.severity_score ?? 1])}>
                    Severity {report.severity_score ?? 1}/5
                  </Badge>
                  <Badge className="bg-black/70 text-[10px] capitalize text-white">
                    {report.triage_category?.replace(/_/g, " ")}
                  </Badge>
                </div>

                {hoursLeft !== null && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    <Clock className="h-3 w-3 text-brand-gold" />
                    {hoursLeft}h in reporter history
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                      <Users2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {report.reporter_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      NIN ending <strong>{report.nin?.slice(-4) ?? "—"}</strong> ·{" "}
                      {new Date(report.created_at).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                    {report.status}
                  </Badge>
                </div>

                {report.description && (
                  <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                    {report.description}
                  </p>
                )}

                <p className="flex items-start gap-1.5 text-[11px] text-primary">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">
                    {report.polling_unit ? `${report.polling_unit} · ` : ""}
                    {report.lga}, {report.state}
                    {report.latitude != null && report.longitude != null && (
                      <span className="block text-muted-foreground">
                        {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                        {report.accuracy_meters ? ` (±${Math.round(report.accuracy_meters)}m)` : ""}
                      </span>
                    )}
                  </span>
                </p>

                {report.sha256_hash && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    Hash <code className="font-mono">{report.sha256_hash.slice(0, 20)}…</code>
                  </p>
                )}

                {isBroadcastOperator && report.status === "verified" && (
                  <TextControl
                    aria-label="Public caption"
                    value={captions[report.id] ?? report.public_caption ?? ""}
                    onChange={(e) => setCaptions((c) => ({ ...c, [report.id]: e.target.value }))}
                    placeholder="Public caption (optional)"
                    className="h-9 text-xs"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t bg-muted/25 p-3">
                {report.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void update(report, { status: "verified" }, "iwitness.verify")}
                      className="flex-1 gap-1.5"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-3.5 w-3.5" />
                      )}
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void update(
                          report,
                          { status: "flagged", review_note: "Flagged during triage" },
                          "iwitness.flag",
                        )
                      }
                      className="gap-1.5"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Flag
                    </Button>
                  </>
                )}

                {report.status === "verified" && isBroadcastOperator && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void update(
                        report,
                        {
                          status: "broadcasted",
                          is_public_broadcast: true,
                          public_caption: captions[report.id]?.trim() || report.description,
                        },
                        "iwitness.publish",
                      )
                    }
                    className="flex-1 gap-1.5"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Radio className="h-3.5 w-3.5" />
                    )}
                    Publish to public record
                  </Button>
                )}

                {report.status === "broadcasted" && (
                  <>
                    <Badge className="flex-1 justify-center gap-1.5 bg-primary/15 py-1.5 text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Published
                    </Badge>
                    {isBroadcastOperator && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void update(
                            report,
                            { status: "verified", is_public_broadcast: false },
                            "iwitness.unpublish",
                          )
                        }
                      >
                        Withdraw
                      </Button>
                    )}
                  </>
                )}

                {report.status === "flagged" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void update(report, { status: "pending" }, "iwitness.reopen")}
                    className="flex-1"
                  >
                    Reopen for triage
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
