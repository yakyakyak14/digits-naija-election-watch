import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Eye,
  GraduationCap,
  Radio,
  ShieldCheck,
  Siren,
  Users2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, StatTile } from "@/components/control-center/PageHeader";
import { useViewer } from "@/hooks/useViewer";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { supabase } from "@/integrations/supabase/client";
import { highestRoleLabel, ROLE_META } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/control-center/")({
  component: OverviewPage,
});

/** Head-only count queries — cheap enough to run together on every load. */
async function loadCounts() {
  const [pendingReports, openIncidents, criticalIncidents, certified, applications, deployments] =
    await Promise.all([
      supabase
        .from("iwitness_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("incident_reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "triaged"]),
      supabase
        .from("incident_reports")
        .select("id", { count: "exact", head: true })
        .eq("severity", "critical")
        .in("status", ["open", "triaged"]),
      supabase
        .from("digeo_certificates")
        .select("id", { count: "exact", head: true })
        .is("revoked_at", null),
      supabase
        .from("digeo_applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review"]),
      supabase
        .from("digeo_deployments")
        .select("id", { count: "exact", head: true })
        .eq("status", "checked_in"),
    ]);

  return {
    pendingReports: pendingReports.count ?? 0,
    openIncidents: openIncidents.count ?? 0,
    criticalIncidents: criticalIncidents.count ?? 0,
    certified: certified.count ?? 0,
    applications: applications.count ?? 0,
    checkedIn: deployments.count ?? 0,
  };
}

function OverviewPage() {
  const { roles, displayName, isStaff, isBroadcastOperator } = useViewer();
  const streams = useLiveStreams("all");
  const counts = useQuery({
    queryKey: ["cc-counts"],
    queryFn: loadCounts,
    refetchInterval: 60_000,
  });

  const liveStreams = (streams.data ?? []).filter((s) => s.status === "live");
  const approved = liveStreams.filter((s) => s.is_approved);
  const totalViewers = liveStreams.reduce((sum, s) => sum + (s.viewer_count ?? 0), 0);

  const shortcuts = [
    {
      to: "/control-center/live",
      label: "Live operations",
      body: "Approve feeds, set the grid layout, go live from the field.",
      icon: Radio,
      show: true,
    },
    {
      to: "/control-center/reports",
      label: "i-Witness queue",
      body: `${counts.data?.pendingReports ?? 0} awaiting review.`,
      icon: Camera,
      show: isStaff,
    },
    {
      to: "/control-center/incidents",
      label: "Incidents",
      body: `${counts.data?.openIncidents ?? 0} open, ${counts.data?.criticalIncidents ?? 0} critical.`,
      icon: Siren,
      show: isStaff,
    },
    {
      to: "/control-center/observers",
      label: "Observers",
      body: `${counts.data?.applications ?? 0} applications to review.`,
      icon: Users2,
      show: isStaff,
    },
    {
      to: "/control-center/field",
      label: "Field forms",
      body: "Observation checklists and incident reports.",
      icon: ClipboardList,
      show: true,
    },
    {
      to: "/control-center/training",
      label: "DIGEO academy",
      body: "Curriculum, assessments and accreditation.",
      icon: GraduationCap,
      show: true,
    },
  ].filter((shortcut) => shortcut.show);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={`Signed in as ${highestRoleLabel(roles)}. Every number below comes from the live database.`}
        actions={
          <>
            <Badge className="gap-1.5 bg-primary/15 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Platform active
            </Badge>
            {isBroadcastOperator && (
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/control-center/live">
                  <Radio className="h-3.5 w-3.5" />
                  Open live ops
                </Link>
              </Button>
            )}
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Radio}
          tone="live"
          label="Feeds live now"
          value={liveStreams.length}
          hint={`${approved.length} approved for the public grid`}
        />
        <StatTile
          icon={Eye}
          label="Public viewers"
          value={totalViewers.toLocaleString()}
          hint="Across all approved feeds"
        />
        <StatTile
          icon={Camera}
          tone="accent"
          label="i-Witness pending"
          value={counts.data?.pendingReports ?? "—"}
          hint="Awaiting triage in the vault"
        />
        <StatTile
          icon={Siren}
          tone={counts.data?.criticalIncidents ? "live" : "muted"}
          label="Open incidents"
          value={counts.data?.openIncidents ?? "—"}
          hint={`${counts.data?.criticalIncidents ?? 0} marked critical`}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={GraduationCap}
          label="Certified DIGEOs"
          value={counts.data?.certified ?? "—"}
          hint="Active accreditations"
        />
        <StatTile
          icon={Users2}
          label="Applications to review"
          value={counts.data?.applications ?? "—"}
          hint="Submitted or under review"
        />
        <StatTile
          icon={CheckCircle2}
          label="Observers checked in"
          value={counts.data?.checkedIn ?? "—"}
          hint="At their assigned polling unit"
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-bold">Jump to</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              className="plate-interactive flex items-start gap-3 p-4"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <shortcut.icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {shortcut.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {shortcut.body}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="plate p-6">
        <h2 className="font-display text-base font-bold">What your roles let you do</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(roles.length ? roles : (["viewer"] as const)).map((role) => (
            <Badge key={role} className="bg-primary/12 text-primary">
              {ROLE_META[role].label}
            </Badge>
          ))}
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {(roles.length ? roles : (["viewer"] as const)).flatMap((role) =>
            ROLE_META[role].capabilities.map((capability) => (
              <li key={role + capability} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {capability}
              </li>
            )),
          )}
        </ul>
      </section>
    </div>
  );
}
