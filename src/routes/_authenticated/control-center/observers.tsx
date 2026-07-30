import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ClipboardList, Loader2, MapPin, Users2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  Restricted,
  StatTile,
} from "@/components/control-center/PageHeader";
import { DeploymentAssignmentForm } from "@/components/forms/DeploymentAssignmentForm";
import { DigeoDispatchPanel } from "@/components/control-center/DigeoDispatchPanel";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { grantRole, listUsersWithRoles, writeAudit } from "@/lib/roles.functions";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["digeo_applications"]["Row"];
type Deployment = Database["public"]["Tables"]["digeo_deployments"]["Row"];

export const Route = createFileRoute("/_authenticated/control-center/observers")({
  component: ObserversPage,
});

type Tab = "applications" | "deployments" | "roster";

function ObserversPage() {
  const { isStaff } = useViewer();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("applications");
  const [busyId, setBusyId] = useState<string | null>(null);

  const applications = useQuery({
    queryKey: ["cc-applications"],
    queryFn: async (): Promise<Application[]> => {
      const { data, error } = await supabase
        .from("digeo_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isStaff,
  });

  const deployments = useQuery({
    queryKey: ["cc-deployments"],
    queryFn: async (): Promise<Deployment[]> => {
      const { data, error } = await supabase
        .from("digeo_deployments")
        .select("*")
        .order("election_date", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isStaff,
  });

  const roster = useQuery({
    queryKey: ["cc-users"],
    queryFn: listUsersWithRoles,
    enabled: isStaff,
  });

  async function decide(application: Application, approve: boolean, note?: string) {
    setBusyId(application.id);
    try {
      const { error } = await supabase
        .from("digeo_applications")
        .update({
          status: approve ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
          review_note: note ?? null,
        })
        .eq("id", application.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Approval is what actually grants the DIGEO role.
      if (approve) {
        try {
          await grantRole({ userId: application.user_id, role: "digeo" });
        } catch (err) {
          toast.error(
            `Application approved, but the DIGEO role could not be granted: ${
              err instanceof Error ? err.message : "unknown error"
            }`,
          );
        }

        await supabase.from("notifications").insert({
          user_id: application.user_id,
          title: "DIGEO accreditation approved",
          body: "You are accredited to observe. Deployments will appear in your Command Center.",
          kind: "success",
          link: "/control-center",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: application.user_id,
          title: "DIGEO application not approved",
          body: note ?? "Please review the requirements and apply again.",
          kind: "warning",
          link: "/control-center/training",
        });
      }

      await writeAudit({
        action: approve ? "digeo.approve" : "digeo.reject",
        entity: "digeo_applications",
        entityId: application.id,
        detail: { applicant: application.full_name, state: application.state },
      });

      toast.success(
        approve ? `${application.full_name} accredited as DIGEO.` : "Application rejected.",
      );
      qc.invalidateQueries({ queryKey: ["cc-applications"] });
      qc.invalidateQueries({ queryKey: ["cc-users"] });
      qc.invalidateQueries({ queryKey: ["cc-counts"] });
    } finally {
      setBusyId(null);
    }
  }

  if (!isStaff) return <Restricted need="Observer Coordinator or Admin" />;

  const pending = (applications.data ?? []).filter((a) =>
    ["submitted", "under_review"].includes(a.status),
  );
  const digeos = (roster.data ?? []).filter((u) => u.roles.includes("digeo"));

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "applications", label: "Applications", count: pending.length },
    { id: "deployments", label: "Deployments", count: deployments.data?.length ?? 0 },
    { id: "roster", label: "Observer roster", count: digeos.length },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Observer network"
        description="Review accreditation applications, assign polling units, and see who is deployed where."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={ClipboardList}
          tone="accent"
          label="Applications pending"
          value={pending.length}
        />
        <StatTile icon={Users2} label="Accredited DIGEOs" value={digeos.length} />
        <StatTile
          icon={MapPin}
          label="Deployments recorded"
          value={deployments.data?.length ?? 0}
          hint={`${(deployments.data ?? []).filter((d) => d.status === "checked_in").length} checked in`}
        />
      </section>

      <div
        role="tablist"
        aria-label="Observer views"
        className="flex gap-1 rounded-lg bg-muted p-1"
      >
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
            {entry.label}
            <Badge variant="outline" className="text-[9px]">
              {entry.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Applications */}
      {tab === "applications" && (
        <div className="space-y-3">
          {applications.isLoading && (
            <p className="text-sm text-muted-foreground">Loading applications…</p>
          )}

          {!applications.isLoading && (applications.data?.length ?? 0) === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="No applications yet"
              body="Citizens who complete the accreditation form in the DIGEO academy appear here for review."
            />
          )}

          {(applications.data ?? []).map((application) => {
            const busy = busyId === application.id;
            const decided = ["approved", "rejected"].includes(application.status);

            return (
              <article key={application.id} className="plate space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-sm font-bold">{application.full_name}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {application.email} · {application.phone} · NIN ending{" "}
                      {application.nin.slice(-4)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] capitalize",
                      application.status === "approved"
                        ? "bg-primary/15 text-primary"
                        : application.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-accent/20 text-accent-foreground dark:text-accent",
                    )}
                  >
                    {application.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <dl className="grid gap-3 text-[11px] sm:grid-cols-3">
                  {[
                    ["Locality", `${application.lga}, ${application.state}`],
                    ["Availability", application.availability.replace(/_/g, " ")],
                    ["Education", application.highest_education],
                    ["Languages", application.languages.join(", ")],
                    ["Party affiliated", application.is_party_affiliated ? "Yes — declared" : "No"],
                    ["Prior observation", application.has_prior_observation ? "Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-semibold capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>

                {application.is_party_affiliated && application.party_affiliation_detail && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-[11px] text-destructive">
                    <strong>Declared affiliation: </strong>
                    {application.party_affiliation_detail}
                  </p>
                )}

                {application.motivation && (
                  <p className="rounded-lg bg-muted/40 p-2.5 text-[11px] italic text-muted-foreground">
                    “{application.motivation}”
                  </p>
                )}

                {!decided && (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void decide(application, true)}
                      className="gap-1.5"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-3.5 w-3.5" />
                      )}
                      Accredit as DIGEO
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void decide(
                          application,
                          false,
                          "Did not meet the current accreditation requirements.",
                        )
                      }
                      className="gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}

                {application.review_note && (
                  <p className="border-t pt-3 text-[11px]">
                    <strong>Review note: </strong>
                    {application.review_note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Deployments */}
      {tab === "deployments" && (
        <div className="space-y-6">
          <DeploymentAssignmentForm onAssigned={() => void deployments.refetch()} />

          <section className="plate overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-display text-base font-bold">Assigned deployments</h2>
            </div>

            {(deployments.data?.length ?? 0) === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Nothing assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Election</th>
                      <th className="p-3 font-semibold">Polling unit</th>
                      <th className="p-3 font-semibold">Reporting</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(deployments.data ?? []).map((deployment) => (
                      <tr key={deployment.id} className="hover:bg-muted/25">
                        <td className="p-3 text-xs">
                          <span className="font-semibold">{deployment.election_name}</span>
                          <span className="block text-muted-foreground">
                            {deployment.election_date}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          <span className="font-semibold">{deployment.polling_unit_name}</span>
                          <span className="block text-muted-foreground">
                            {deployment.lga}, {deployment.state}
                          </span>
                        </td>
                        <td className="p-3 text-xs">{deployment.reporting_time}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {deployment.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Roster */}
      {tab === "roster" && (
        <div className="space-y-6">
          <DigeoDispatchPanel />

          <section className="plate overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-display text-base font-bold">Accredited observers</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Accounts holding the DIGEO role. Roles are managed on the Users &amp; roles screen.
              </p>
            </div>

            {digeos.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No accredited observers yet. Approve an application to add one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Observer</th>
                      <th className="p-3 font-semibold">Locality</th>
                      <th className="p-3 font-semibold">Identity</th>
                      <th className="p-3 font-semibold">Last signed in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {digeos.map((observer) => (
                      <tr key={observer.id} className="hover:bg-muted/25">
                        <td className="p-3">
                          <span className="text-xs font-semibold">{observer.display_name}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {observer.email}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {observer.lga ? `${observer.lga}, ` : ""}
                          {observer.state ?? "—"}
                        </td>
                        <td className="p-3">
                          {observer.nin_verified ? (
                            <Badge className="gap-1 bg-primary/15 text-[10px] text-primary">
                              <BadgeCheck className="h-3 w-3" />
                              NIN verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              NIN on file
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-muted-foreground">
                          {observer.last_sign_in_at
                            ? new Date(observer.last_sign_in_at).toLocaleDateString("en-NG", {
                                dateStyle: "medium",
                              })
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
