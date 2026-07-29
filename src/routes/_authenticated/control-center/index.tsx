import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_META, highestRoleLabel } from "@/lib/roles";
import { getMyRoles } from "@/lib/roles.functions";
import { Radio, Users2, FileWarning, GraduationCap, ShieldCheck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/control-center/")({
  component: OverviewPage,
});

const kpis = [
  { icon: Radio, label: "Live Observer Streams", value: "6 Feeds", hint: "1–6 Split Screen Matrix Active" },
  { icon: Users2, label: "Active DIGEO Observers", value: "342", hint: "Across 36 States + FCT" },
  { icon: FileWarning, label: "i-Witness Reports", value: "28", hint: "Verified in Cloud Storage" },
  { icon: GraduationCap, label: "Certified DIGEOs", value: "158", hint: "Accreditation Badges Issued" },
];

function OverviewPage() {
  const { data: myRoles = ["viewer"] } = useSuspenseQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Control Center Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <strong className="text-foreground">{highestRoleLabel(myRoles)}</strong>. Welcome back!
          </p>
        </div>
        <Badge className="bg-emerald-600 text-white font-semibold flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Platform Active
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 space-y-2 border hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <k.icon className="h-5 w-5 text-emerald-600" />
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{k.value}</div>
            <div className="text-xs font-semibold text-muted-foreground">{k.label}</div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300">{k.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <div className="font-display text-lg font-semibold text-foreground">Your Roles & Capabilities</div>
        <div className="flex flex-wrap gap-2">
          {myRoles.length === 0 && <Badge variant="outline">Viewer</Badge>}
          {myRoles.map((r) => (
            <Badge key={r} className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
              {ROLE_META[r].label}
            </Badge>
          ))}
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground leading-relaxed">
          {(myRoles.length ? myRoles : (["viewer"] as const)).flatMap((r) =>
            ROLE_META[r].capabilities.map((c) => <li key={r + c}>• {c}</li>)
          )}
        </ul>
      </Card>
    </div>
  );
}
