import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DIGEOCertificateBadge } from "./DIGEOCertificateBadge";
import { DigeoApplicationForm } from "@/components/forms/DigeoApplicationForm";
import { useViewer } from "@/hooks/useViewer";
import {
  getMyCertificate,
  issueCertificate,
  listModules,
  listMyProgress,
  parseKeyPoints,
  parseQuiz,
  recordAttempt,
  type TrainingModule,
} from "@/lib/training";
import { cn } from "@/lib/utils";

type Tab = "curriculum" | "application";

/** Renders **bold** spans without pulling in a markdown runtime. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={idx} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * Module body renderer. Content is authored as a small fixed subset of markdown
 * (headings, lists, tables, bold, block quotes) in the curriculum migration, so
 * it is formatted here rather than shipping a full markdown parser to every
 * visitor.
 */
function ModuleBody({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => markdown.split(/\n\n+/), [markdown]);

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-display text-sm font-bold text-foreground">
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-display text-base font-bold text-foreground">
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-primary bg-primary/5 py-2 pl-4 text-xs italic text-foreground/90"
            >
              {inline(trimmed.replace(/^>\s?/gm, ""))}
            </blockquote>
          );
        }
        if (trimmed.startsWith("|")) {
          const rows = trimmed.split("\n").filter((r) => !/^\|[\s|:-]+\|$/.test(r));
          const [header, ...body] = rows.map((r) =>
            r
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim()),
          );
          return (
            <div key={idx} className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {header?.map((cell) => (
                      <th key={cell} className="p-2 text-left font-semibold">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b last:border-0">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 align-top text-muted-foreground">
                          {inline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (/^(\d+\.|-)\s/m.test(trimmed)) {
          const ordered = /^\d+\.\s/.test(trimmed);
          const items = trimmed.split("\n").map((line) => line.replace(/^(\d+\.|-)\s*/, ""));
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag
              key={idx}
              className={cn(
                "space-y-1.5 pl-5 text-xs text-muted-foreground",
                ordered ? "list-decimal" : "list-disc",
              )}
            >
              {items.map((item, itemIdx) => (
                <li key={itemIdx}>{inline(item)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={idx} className="text-xs leading-relaxed text-muted-foreground">
            {inline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function DIGEOTrainingCenter() {
  const { user, displayName, profile, isSignedIn } = useViewer();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("curriculum");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [grading, setGrading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const modulesQuery = useQuery({
    queryKey: ["digeo-modules"],
    queryFn: listModules,
    staleTime: 300_000,
  });
  const progressQuery = useQuery({
    queryKey: ["digeo-progress", user?.id],
    queryFn: listMyProgress,
    enabled: Boolean(user?.id),
  });
  const certificateQuery = useQuery({
    queryKey: ["digeo-certificate", user?.id],
    queryFn: getMyCertificate,
    enabled: Boolean(user?.id),
  });

  const modules = modulesQuery.data ?? [];
  const progress = progressQuery.data ?? [];
  const active: TrainingModule | null =
    modules.find((m) => m.id === activeId) ?? modules[0] ?? null;

  const completedIds = useMemo(
    () => new Set(progress.filter((p) => p.status === "completed").map((p) => p.module_id)),
    [progress],
  );
  const percentComplete = modules.length
    ? Math.round((completedIds.size / modules.length) * 100)
    : 0;
  const allComplete = modules.length > 0 && completedIds.size === modules.length;

  const averageScore = useMemo(() => {
    const scores = progress.filter((p) => p.status === "completed").map((p) => p.quiz_score ?? 0);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }, [progress]);

  const quiz = active ? parseQuiz(active) : [];
  const keyPoints = active ? parseKeyPoints(active) : [];
  const activeProgress = progress.find((p) => p.module_id === active?.id);
  const activeComplete = active ? completedIds.has(active.id) : false;

  function selectModule(id: string) {
    setActiveId(id);
    setAnswers({});
    setResult(null);
  }

  async function submitQuiz() {
    if (!active || quiz.length === 0 || grading) return;
    if (Object.keys(answers).length < quiz.length) {
      toast.error("Answer every question before submitting.");
      return;
    }

    setGrading(true);
    try {
      const correct = quiz.reduce(
        (sum, q, idx) => sum + (answers[idx] === q.correctIndex ? 1 : 0),
        0,
      );
      const score = Math.round((correct / quiz.length) * 100);
      const passMark = active.pass_mark ?? 70;
      const passed = score >= passMark;

      if (isSignedIn) {
        const outcome = await recordAttempt({
          moduleId: active.id,
          score,
          passMark,
          answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [String(k), v])),
        });
        setResult({ score, passed: outcome.passed });
        await progressQuery.refetch();
      } else {
        setResult({ score, passed });
        try {
          localStorage.setItem(
            `digeo-guest-progress-${active.id}`,
            JSON.stringify({ score, passed, timestamp: Date.now() }),
          );
        } catch (_) {}
      }

      if (passed) {
        toast.success(
          `Module ${active.module_number} passed with ${score}%. ${
            !isSignedIn ? "Sign in to save this to your accreditation record." : ""
          }`,
        );
      } else {
        toast.error(`${score}% — you need ${passMark}% to pass. Review the module and try again.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record your attempt.");
    } finally {
      setGrading(false);
    }
  }

  async function claimCertificate() {
    if (claiming) return;
    setClaiming(true);
    try {
      await issueCertificate({
        fullName: displayName,
        state: profile?.state ?? "Nigeria",
        lga: profile?.lga ?? null,
        averageScore,
      });
      await certificateQuery.refetch();
      qc.invalidateQueries({ queryKey: ["digeo-certificate"] });
      setShowCertificate(true);
      toast.success("Certificate issued.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not issue the certificate.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="plate flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold sm:text-2xl">DIGEO academy</h1>
            <Badge className="bg-primary/15 text-primary">Official curriculum</Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Six modules, each with an assessment you must pass at {modules[0]?.pass_mark ?? 70}%.
            Retakes are unlimited. Finish all six to be issued a numbered accreditation certificate.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Progress
            </p>
            <p className="font-display text-xl font-extrabold text-primary">{percentComplete}%</p>
            <p className="text-[10px] text-muted-foreground">
              {completedIds.size}/{modules.length} modules
            </p>
          </div>
          <div className="w-24">
            <Progress value={percentComplete} className="h-2.5" />
          </div>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Academy sections"
        className="flex gap-1 rounded-lg bg-muted p-1"
      >
        {[
          { id: "curriculum" as Tab, label: "Curriculum & assessments", icon: BookOpen },
          { id: "application" as Tab, label: "Accreditation application", icon: ClipboardList },
        ].map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              tab === entry.id
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "application" ? (
        isSignedIn ? (
          <DigeoApplicationForm />
        ) : (
          <div className="plate p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-sm font-semibold">Sign in to apply</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              You can read the whole curriculum without an account. Applying for accreditation needs
              one.
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <nav aria-label="Training modules" className="space-y-2">
            {modulesQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading curriculum…</p>
            )}

            {modules.map((module) => {
              const done = completedIds.has(module.id);
              const isActive = active?.id === module.id;
              const attempt = progress.find((p) => p.module_id === module.id);

              return (
                <button
                  key={module.id}
                  onClick={() => selectModule(module.id)}
                  aria-current={isActive}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary/6 shadow-xs"
                      : "bg-card hover:bg-accent/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Module {module.module_number} · {module.category}
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-bold leading-snug">{module.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {module.description}
                  </p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {module.duration_minutes} min
                    {attempt?.quiz_score ? ` · best ${attempt.quiz_score}%` : ""}
                    {attempt?.attempts
                      ? ` · ${attempt.attempts} attempt${attempt.attempts > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </button>
              );
            })}

            {allComplete && (
              <div className="rounded-xl border border-accent/50 bg-accent/10 p-4 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-accent-foreground dark:text-accent" />
                <p className="mt-2 text-xs font-bold">All six modules complete</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Average score {Math.round(averageScore)}%.
                </p>
                {certificateQuery.data ? (
                  <Button
                    size="sm"
                    className="mt-3 w-full gap-1.5"
                    onClick={() => setShowCertificate(true)}
                  >
                    <Award className="h-4 w-4" />
                    View certificate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="mt-3 w-full gap-1.5"
                    disabled={claiming}
                    onClick={() => void claimCertificate()}
                  >
                    {claiming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                    Claim certificate
                  </Button>
                )}
              </div>
            )}
          </nav>

          {active && (
            <div className="space-y-5">
              <article className="plate space-y-5 p-6">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                  <div>
                    <Badge className="mb-2 bg-primary/12 text-primary">
                      Module {active.module_number} of {modules.length}
                    </Badge>
                    <h2 className="font-display text-lg font-bold sm:text-xl">{active.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{active.description}</p>
                  </div>
                  {activeComplete && (
                    <Badge className="gap-1 bg-primary text-primary-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passed {activeProgress?.quiz_score}%
                    </Badge>
                  )}
                </header>

                {keyPoints.length > 0 && (
                  <ul className="grid gap-2 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
                    {keyPoints.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <ModuleBody markdown={active.content_markdown} />
              </article>

              {quiz.length > 0 && (
                <section className="plate space-y-5 p-6">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-display text-sm font-bold">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      Assessment · {quiz.length} questions · pass at {active.pass_mark ?? 70}%
                    </h3>
                    {result && (
                      <Badge
                        className={
                          result.passed
                            ? "gap-1 bg-primary text-primary-foreground"
                            : "gap-1 bg-destructive text-destructive-foreground"
                        }
                      >
                        {result.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {result.score}%
                      </Badge>
                    )}
                  </header>

                  <ol className="space-y-5">
                    {quiz.map((question, qIdx) => {
                      const chosen = answers[qIdx];
                      const revealed = result !== null;

                      return (
                        <li key={qIdx} className="space-y-2">
                          <p className="text-xs font-semibold">
                            <span className="mr-1.5 text-muted-foreground">{qIdx + 1}.</span>
                            {question.question}
                          </p>

                          <div className="space-y-1.5">
                            {question.options.map((option, oIdx) => {
                              const isChosen = chosen === oIdx;
                              const isCorrect = question.correctIndex === oIdx;

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={revealed}
                                  onClick={() => setAnswers((a) => ({ ...a, [qIdx]: oIdx }))}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
                                    revealed &&
                                      isCorrect &&
                                      "border-primary bg-primary/10 font-semibold",
                                    revealed &&
                                      isChosen &&
                                      !isCorrect &&
                                      "border-destructive bg-destructive/8",
                                    !revealed &&
                                      isChosen &&
                                      "border-primary bg-primary/8 font-semibold",
                                    !revealed &&
                                      !isChosen &&
                                      "hover:border-primary/40 hover:bg-accent/10",
                                  )}
                                >
                                  <span>{option}</span>
                                  {revealed && isCorrect && (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                  )}
                                  {revealed && isChosen && !isCorrect && (
                                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {revealed && question.explanation && (
                            <p className="rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                              {question.explanation}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <p className="text-[11px] text-muted-foreground">
                      {Object.keys(answers).length}/{quiz.length} answered
                    </p>
                    {result ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAnswers({});
                          setResult(null);
                        }}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {result.passed ? "Review again" : "Retake assessment"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void submitQuiz()}
                        disabled={grading}
                        className="gap-2"
                      >
                        {grading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {isSignedIn ? "Submit assessment" : "Submit assessment (Guest)"}
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {showCertificate && certificateQuery.data && (
        <DIGEOCertificateBadge
          fullName={certificateQuery.data.full_name}
          state={certificateQuery.data.state}
          lga={certificateQuery.data.lga}
          certificateNumber={certificateQuery.data.certificate_number}
          issuedAt={certificateQuery.data.issued_at}
          averageScore={certificateQuery.data.average_score}
          qrHash={certificateQuery.data.qr_code_hash}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
