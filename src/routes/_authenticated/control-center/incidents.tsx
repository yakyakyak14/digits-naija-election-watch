import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  Siren,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Restricted } from "@/components/control-center/PageHeader";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { writeAudit } from "@/lib/roles.functions";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incident_reports"]["Row"];

export const Route = createFileRoute("/_authenticated/control-center/incidents")({
  component: IncidentsPage,
});

const STATUS_FILTERS = ["open", "triaged", "escalated", "resolved", "all"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const SEVERITY_TONE: Record<Incident["severity"], string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-accent text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

function IncidentsPage() {
  const { isStaff } = useViewer();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  const incidents = useQuery({
    queryKey: ["cc-incidents", filter],
    queryFn: async (): Promise<Incident[]> => {
      let query = supabase
        .from("incident_reports")
        .select("*")
        .order("severity", { ascending: false })
        .order("occurred_at", { ascending: false })
        .limit(120);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isStaff,
  });

  // Critical incidents should never wait for a page refresh.
  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("cc-incidents-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_reports" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["cc-incidents"] });
          qc.invalidateQueries({ queryKey: ["cc-counts"] });
          if (payload.eventType === "INSERT") {
            const row = payload.new as Incident;
            const notify = row.severity === "critical" ? toast.error : toast.info;
            notify(`${row.severity.toUpperCase()}: ${row.headline}`, {
              description: `${row.polling_unit_name} · ${row.lga}, ${row.state}`,
              duration: row.severity === "critical" ? 12_000 : 6_000,
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isStaff, qc]);

  async function setStatus(incident: Incident, status: Incident["status"], note?: string) {
    setBusyId(incident.id);
    try {
      const { error } = await supabase
        .from("incident_reports")
        .update({
          status,
          triaged_at: new Date().toISOString(),
          resolution_note: note ?? incident.resolution_note,
        })
        .eq("id", incident.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      await writeAudit({
        action: `incident.${status}`,
        entity: "incident_reports",
        entityId: incident.id,
        detail: { severity: incident.severity, type: incident.incident_type },
      });

      toast.success(`Incident marked ${status}.`);
      qc.invalidateQueries({ queryKey: ["cc-incidents"] });
    } finally {
      setBusyId(null);
    }
  }

  if (!isStaff) return <Restricted need="Reviewer, Coordinator, Operator or Admin" />;

  const rows = incidents.data ?? [];
  const criticalCount = rows.filter((r) => r.severity === "critical").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Incident triage"
        description="Structured escalations filed by observers in the field, ordered by severity. Every status change is written to the audit trail."
        actions={
          <>
            {criticalCount > 0 && (
              <Badge className="animate-live-ring gap-1.5 bg-destructive text-destructive-foreground">
                <TriangleAlert className="h-3.5 w-3.5" />
                {criticalCount} critical
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void incidents.refetch()}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", incidents.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {STATUS_FILTERS.map((option) => (
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

      {incidents.isLoading && <p className="text-sm text-muted-foreground">Loading incidents…</p>}

      {!incidents.isLoading && rows.length === 0 && (
        <EmptyState
          icon={Siren}
          title={filter === "open" ? "No open incidents" : "Nothing in this view"}
          body="Field incidents arrive here in real time, with critical ones raising a toast immediately."
        />
      )}

      <div className="space-y-3">
        {rows.map((incident) => {
          const busy = busyId === incident.id;

          return (
            <article key={incident.id} className="plate space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn("text-[10px] uppercase", SEVERITY_TONE[incident.severity])}
                    >
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {incident.incident_type.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {incident.status}
                    </Badge>
                  </div>
                  <h2 className="mt-2 font-display text-sm font-bold">{incident.headline}</h2>
                </div>

                <p className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(incident.occurred_at).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {incident.narrative}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  {incident.polling_unit_name} · {incident.lga}, {incident.state}
                </span>
                {incident.people_affected != null && (
                  <span>{incident.people_affected} people affected</span>
                )}
                {incident.security_notified && <span>Security notified</span>}
                {incident.inec_notified && <span>INEC notified</span>}
                {incident.latitude != null && incident.longitude != null && (
                  <span>
                    {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </span>
                )}
              </div>

              {incident.status !== "resolved" && incident.status !== "dismissed" && (
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {incident.status === "open" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void setStatus(incident, "triaged")}
                    >
                      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Mark triaged
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void setStatus(incident, "escalated")}
                  >
                    Escalate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void setStatus(incident, "resolved", "Resolved by Command Center")
                    }
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void setStatus(incident, "dismissed", "Dismissed after review")}
                    className="gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                </div>
              )}

              {incident.resolution_note && (
                <p className="rounded-lg bg-muted/40 p-2.5 text-[11px]">
                  <strong>Resolution: </strong>
                  {incident.resolution_note}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
