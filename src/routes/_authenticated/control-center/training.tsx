import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ChevronDown, ChevronRight, GraduationCap, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/control-center/PageHeader";
import { DIGEOTrainingCenter } from "@/components/training/DIGEOTrainingCenter";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { listUsersWithRoles } from "@/lib/roles.functions";
import { listAssessmentResults } from "@/lib/digeo";

export const Route = createFileRoute("/_authenticated/control-center/training")({
  component: TrainingPage,
});

/**
 * Cohort progress for coordinators: every trainee, how many modules they have
 * passed, their average score, and whether a certificate has been issued.
 */
function TraineeRoster() {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-module assessment detail, so a coordinator can see HOW an accreditation
  // was earned — score and attempts per module — not just that it was.
  const results = useQuery({
    queryKey: ["cc-assessment-results"],
    queryFn: listAssessmentResults,
  });

  const roster = useQuery({
    queryKey: ["cc-training-roster"],
    queryFn: async () => {
      const [
        { data: progress, error: progressError },
        { data: modules },
        { data: certificates },
        users,
      ] = await Promise.all([
        supabase.from("digeo_trainee_progress").select("user_id, module_id, status, quiz_score"),
        supabase.from("digeo_training_modules").select("id").eq("is_published", true),
        supabase
          .from("digeo_certificates")
          .select("user_id, certificate_number, average_score, issued_at"),
        listUsersWithRoles(),
      ]);

      if (progressError) throw new Error(progressError.message);

      const moduleCount = modules?.length ?? 0;
      const byUser = new Map<string, { completed: number; scores: number[] }>();

      for (const row of progress ?? []) {
        const entry = byUser.get(row.user_id) ?? { completed: 0, scores: [] };
        if (row.status === "completed") {
          entry.completed += 1;
          entry.scores.push(row.quiz_score ?? 0);
        }
        byUser.set(row.user_id, entry);
      }

      const certificateByUser = new Map((certificates ?? []).map((c) => [c.user_id, c]));

      return {
        moduleCount,
        rows: users
          .map((user) => {
            const entry = byUser.get(user.id);
            const completed = entry?.completed ?? 0;
            const average = entry?.scores.length
              ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
              : null;
            return {
              id: user.id,
              name: user.display_name,
              email: user.email,
              locality: [user.lga, user.state].filter(Boolean).join(", ") || "—",
              completed,
              average,
              certificate: certificateByUser.get(user.id) ?? null,
              isDigeo: user.roles.includes("digeo"),
            };
          })
          // Trainees who have started come first; untouched accounts sink.
          .sort((a, b) => b.completed - a.completed || a.name.localeCompare(b.name)),
      };
    },
  });

  if (roster.isLoading) return <p className="text-sm text-muted-foreground">Loading the cohort…</p>;

  const rows = roster.data?.rows ?? [];
  const moduleCount = roster.data?.moduleCount ?? 6;
  const started = rows.filter((r) => r.completed > 0);
  const finished = rows.filter((r) => r.completed >= moduleCount);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={Users2}
          label="Trainees started"
          value={started.length}
          hint="At least one module passed"
        />
        <StatTile
          icon={GraduationCap}
          label="Curriculum complete"
          value={finished.length}
          hint={`All ${moduleCount} modules passed`}
        />
        <StatTile
          icon={Award}
          tone="accent"
          label="Certificates issued"
          value={rows.filter((r) => r.certificate).length}
        />
      </div>

      <div className="plate overflow-hidden">
        <div className="border-b p-4">
          <h2 className="font-display text-base font-bold">Trainee completion</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Live from the assessment records — completion status per trainee, not a self-report.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-semibold">Trainee</th>
                <th className="p-3 font-semibold">Locality</th>
                <th className="p-3 font-semibold">Modules</th>
                <th className="p-3 font-semibold">Average</th>
                <th className="p-3 font-semibold">Accreditation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const percent = Math.round((row.completed / Math.max(1, moduleCount)) * 100);
                const isOpen = expanded === row.id;
                const modules = results.data?.get(row.id) ?? [];

                return (
                  <>
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/25"
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                    >
                      <td className="p-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          {modules.length > 0 ? (
                            isOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )
                          ) : (
                            <span className="w-3.5" />
                          )}
                          {row.name}
                        </span>
                        <span className="block pl-5 text-[11px] text-muted-foreground">
                          {row.email}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{row.locality}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={percent} className="h-1.5 w-16" />
                          <span className="text-[11px] font-semibold">
                            {row.completed}/{moduleCount}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-xs font-semibold">
                        {row.average != null ? `${row.average}%` : "—"}
                      </td>
                      <td className="p-3">
                        {row.certificate ? (
                          <Badge className="gap-1 bg-primary/15 text-[10px] text-primary">
                            <Award className="h-3 w-3" />
                            {row.certificate.certificate_number}
                          </Badge>
                        ) : row.isDigeo ? (
                          <Badge variant="outline" className="text-[10px]">
                            DIGEO role, no certificate
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>

                    {isOpen && modules.length > 0 && (
                      <tr key={`${row.id}-detail`} className="bg-muted/20">
                        <td colSpan={5} className="p-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Assessment results by module
                          </p>
                          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {modules.map((m) => (
                              <li
                                key={m.moduleNumber}
                                className="flex items-start justify-between gap-2 rounded-lg border bg-background px-2.5 py-2"
                              >
                                <span className="min-w-0">
                                  <span className="block text-[11px] font-semibold">
                                    {m.moduleNumber}. {m.title}
                                  </span>
                                  <span className="block text-[10px] text-muted-foreground">
                                    {m.attempts} attempt{m.attempts === 1 ? "" : "s"}
                                    {m.completedAt
                                      ? ` · passed ${new Date(m.completedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                                      : " · not passed yet"}
                                  </span>
                                </span>
                                <Badge
                                  className={
                                    m.status === "completed"
                                      ? "shrink-0 bg-primary/15 text-[10px] text-primary"
                                      : "shrink-0 bg-muted text-[10px] text-muted-foreground"
                                  }
                                >
                                  {m.score ?? 0}%
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TrainingPage() {
  const { isStaff } = useViewer();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DIGEOTrainingCenter />
      {isStaff && <TraineeRoster />}
    </div>
  );
}
