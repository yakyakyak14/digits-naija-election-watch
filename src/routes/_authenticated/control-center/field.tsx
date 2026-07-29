import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, ClipboardCheck, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/control-center/PageHeader";
import { ObservationChecklistForm } from "@/components/forms/ObservationChecklistForm";
import { IncidentReportForm } from "@/components/forms/IncidentReportForm";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Checklist = Database["public"]["Tables"]["observation_checklists"]["Row"];

export const Route = createFileRoute("/_authenticated/control-center/field")({
  component: FieldFormsPage,
});

type Tab = "checklist" | "incident" | "submitted";

function FieldFormsPage() {
  const { userId } = useViewer();
  const [tab, setTab] = useState<Tab>("checklist");

  const submitted = useQuery({
    queryKey: ["my-checklists", userId],
    queryFn: async (): Promise<Checklist[]> => {
      const { data, error } = await supabase
        .from("observation_checklists")
        .select("*")
        .order("observed_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(userId),
  });

  const TABS: { id: Tab; label: string; icon: typeof ClipboardCheck }[] = [
    { id: "checklist", label: "Observation checklist", icon: ClipboardCheck },
    { id: "incident", label: "Incident report", icon: Siren },
    { id: "submitted", label: "What I've filed", icon: Calculator },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Field forms"
        description="The structured record of what you observed. File a checklist per phase, and an incident report whenever something needs the Command Center to act."
      />

      <div role="tablist" aria-label="Field forms" className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              tab === entry.id
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{entry.label}</span>
          </button>
        ))}
      </div>

      {tab === "checklist" && (
        <ObservationChecklistForm onSubmitted={() => void submitted.refetch()} />
      )}
      {tab === "incident" && <IncidentReportForm />}

      {tab === "submitted" && (
        <section className="space-y-3">
          {submitted.isLoading && (
            <p className="text-sm text-muted-foreground">Loading your submissions…</p>
          )}

          {!submitted.isLoading && (submitted.data?.length ?? 0) === 0 && (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing filed yet"
              body="Checklists you submit appear here with their verification status."
            />
          )}

          {(submitted.data ?? []).map((checklist) => (
            <article key={checklist.id} className="plate space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold">{checklist.polling_unit_name}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {checklist.election_name} · {checklist.lga}, {checklist.state}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {checklist.phase}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[10px] capitalize",
                      checklist.status === "verified"
                        ? "bg-primary/15 text-primary"
                        : checklist.status === "flagged"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {checklist.status}
                  </Badge>
                </div>
              </div>

              {(checklist.registered_voters != null || checklist.total_votes_cast != null) && (
                <dl className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-[11px] text-muted-foreground">
                  {[
                    ["Registered", checklist.registered_voters],
                    ["Accredited", checklist.accredited_voters],
                    ["Cast", checklist.total_votes_cast],
                    ["Valid", checklist.valid_votes],
                    ["Rejected", checklist.rejected_votes],
                  ]
                    .filter(([, value]) => value != null)
                    .map(([label, value]) => (
                      <div key={String(label)} className="flex gap-1">
                        <dt>{label}:</dt>
                        <dd className="font-semibold text-foreground">{String(value)}</dd>
                      </div>
                    ))}
                </dl>
              )}

              {checklist.irregularities && (
                <p className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                  <strong className="text-foreground">Irregularities: </strong>
                  {checklist.irregularities}
                </p>
              )}

              <p className="text-[10px] text-muted-foreground">
                {new Date(checklist.observed_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
