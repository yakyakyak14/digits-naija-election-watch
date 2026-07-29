import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_META, highestRoleLabel } from "@/lib/roles";
import { getMyRoles } from "@/lib/roles.functions";
import { Radio, Users2, FileWarning, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/control-center/")({
  component: OverviewPage,
});

const kpis = [
  { icon: Radio, label: "Live Streams", value: "—", hint: "Video provider not connected" },
  { icon: Users2, label: "Active DIGEOs", value: "0", hint: "Awaiting first observer" },
  { icon: FileWarning, label: "Reports Today", value: "0", hint: "Reporting module in Phase 2" },
  { icon: GraduationCap, label: "In Training", value: "0", hint: "Training module in Phase 2" },
];

function OverviewPage() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: myRoles } = useSuspenseQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          You are signed in as <strong>{highestRoleLabel(myRoles)}</strong>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <k.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-2 text-[10px] text-muted-foreground">{k.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="font-display text-lg font-semibold">Your roles & what you can do</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {myRoles.length === 0 && <Badge variant="outline">Viewer</Badge>}
          {myRoles.map((r) => <Badge key={r}>{ROLE_META[r].label}</Badge>)}
        </div>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {(myRoles.length ? myRoles : (["viewer"] as const)).flatMap((r) =>
            ROLE_META[r].capabilities.map((c) => <li key={r + c}>• {c}</li>)
          )}
        </ul>
      </Card>

      <Card className="border-dashed p-6">
        <div className="font-display text-lg font-semibold">Coming in the next phases</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>📡 <strong>Phase 3:</strong> Live observer video (LiveKit) with 1–6 tile public viewer & per-tile maximize.</li>
          <li>📝 <strong>Phase 2:</strong> DIGEO training modules with quiz + certification.</li>
          <li>🚨 <strong>Phase 2:</strong> Incident reports with evidence upload & review queue.</li>
        </ul>
      </Card>
    </div>
  );
}
