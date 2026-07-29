import { useState } from "react";
import { BookOpen, CheckCircle2, Award, PlayCircle, HelpCircle, ShieldCheck, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DIGEOCertificateBadge } from "./DIGEOCertificateBadge";
import { toast } from "sonner";

export interface TrainingModule {
  id: string;
  number: number;
  title: string;
  category: string;
  durationMinutes: number;
  summary: string;
  contentMarkdown: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

const DIGEO_MODULES: TrainingModule[] = [
  {
    id: "mod-1",
    number: 1,
    title: "Electoral Act 2022 & DIGEO Rights",
    category: "Legal Framework",
    durationMinutes: 15,
    summary: "Understanding observer legal protections, access to polling units, and statutory boundaries.",
    contentMarkdown: `### Module 1: Electoral Act 2022 & Observer Rights

As a DIGITs Election Observer (DIGEO), you possess legal rights under Section 43 of the Electoral Act 2022 to observe voting, accreditation, counting, and result declaration.

Key Conduct Mandates:
1. Display your official DIGEO accreditation badge prominently.
2. Do not interfere with INEC officials, voters, or security personnel.
3. Record real-time video/photo evidence from an unobtrusive distance.
4. Report incidents immediately using the DIGITs i-Witness recorder.`,
    quiz: {
      question: "Which section of the Electoral Act 2022 covers election observation rights?",
      options: ["Section 12", "Section 43", "Section 84", "Section 105"],
      correctIndex: 1,
    },
  },
  {
    id: "mod-2",
    number: 2,
    title: "INEC BVAS Verification & Accreditation Protocol",
    category: "Technical Observation",
    durationMinutes: 20,
    summary: "Monitoring Bimodal Voter Accreditation System (BVAS) operation and voter queue management.",
    contentMarkdown: `### Module 2: BVAS Verification & Accreditation

The Bimodal Voter Accreditation System (BVAS) is critical for voter authentication.

Key Monitoring Steps:
1. Verify BVAS zero-print certificate at 8:30 AM before voting commences.
2. Monitor facial and fingerprint scanning protocols.
3. Track manual accreditation fallbacks (which require form EC8A entry).
4. Record any BVAS battery or network failure incidents via live stream.`,
    quiz: {
      question: "When should the BVAS zero-print certificate be verified by observers?",
      options: ["After polls close", "At 8:30 AM before voting begins", "During counting", "At night"],
      correctIndex: 1,
    },
  },
  {
    id: "mod-3",
    number: 3,
    title: "Ballot Counting & EC8A Result Verification",
    category: "Result Transparency",
    durationMinutes: 25,
    summary: "Verifying result counting, Form EC8A signatures, and IReV upload confirmation.",
    contentMarkdown: `### Module 3: Ballot Counting & Form EC8A Verification

Form EC8A is the primary polling unit result document.

Key Verification Guidelines:
1. Ensure all party agents sign Form EC8A.
2. Compare physical vote tallies against recorded figures on Form EC8A.
3. Take a clear photograph of Form EC8A and upload via the DIGITs app.
4. Verify immediate upload of Form EC8A to the INEC Result Viewing (IReV) portal.`,
    quiz: {
      question: "What is the primary document used to record polling unit election results?",
      options: ["Form EC40G", "Form EC8A", "Form EC25B", "Form EC9"],
      correctIndex: 1,
    },
  },
];

export function DIGEOTrainingCenter() {
  const [activeModule, setActiveModule] = useState<TrainingModule>(DIGEO_MODULES[0]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>(["mod-1"]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [showCertificate, setShowCertificate] = useState(false);

  const isCurrentCompleted = completedModuleIds.includes(activeModule.id);
  const totalModules = DIGEO_MODULES.length;
  const progressPercent = Math.round((completedModuleIds.length / totalModules) * 100);

  const handleSelectAnswer = (moduleNum: string, optionIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [moduleNum]: optionIdx }));
  };

  const handleCompleteModule = () => {
    const selectedIdx = selectedQuizAnswers[activeModule.id];
    if (selectedIdx === undefined) {
      toast.error("Please answer the module quiz question before completing.");
      return;
    }

    if (selectedIdx !== activeModule.quiz.correctIndex) {
      toast.error("Incorrect answer. Please review the module material and try again.");
      return;
    }

    if (!completedModuleIds.includes(activeModule.id)) {
      const nextCompleted = [...completedModuleIds, activeModule.id];
      setCompletedModuleIds(nextCompleted);
      toast.success(`Module ${activeModule.number} passed & completed successfully!`);

      if (nextCompleted.length === totalModules) {
        setShowCertificate(true);
        toast.success("Congratulations! You have completed all DIGEO training modules. Certificate issued!", {
          duration: 6000,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">DIGEO Training & Certification Academy</h1>
            <Badge className="bg-emerald-600 text-white font-semibold">Official Curriculum</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete all 3 modules to receive your accredited DIGEO Election Observer Badge & Certificate.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg border">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Progress</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{progressPercent}% Completed</p>
          </div>
          <div className="h-10 w-24">
            <Progress value={progressPercent} className="h-3" />
          </div>
        </div>
      </div>

      {/* Main Module Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Module Selection Navigation */}
        <div className="space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
            Training Modules ({completedModuleIds.length}/{totalModules})
          </h2>

          <div className="space-y-2">
            {DIGEO_MODULES.map((mod) => {
              const isDone = completedModuleIds.includes(mod.id);
              const isActive = activeModule.id === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Module {mod.number} · {mod.category}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {mod.durationMinutes} mins
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{mod.summary}</p>
                </button>
              );
            })}
          </div>

          {/* Certificate Trigger Button */}
          {completedModuleIds.length === totalModules && (
            <Button
              onClick={() => setShowCertificate(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md py-5"
            >
              <Award className="h-5 w-5" />
              View Official DIGEO Certificate
            </Button>
          )}
        </div>

        {/* Module Content & Quiz Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
                  Module {activeModule.number} of {totalModules}
                </Badge>
                <h2 className="font-display text-xl font-bold">{activeModule.title}</h2>
              </div>

              {isCurrentCompleted && (
                <Badge className="bg-emerald-600 text-white font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Module Completed
                </Badge>
              )}
            </div>

            {/* Reading Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="bg-muted/40 p-4 rounded-lg border whitespace-pre-line text-sm">
                {activeModule.contentMarkdown}
              </div>
            </div>

            {/* Assessment Quiz */}
            <div className="rounded-xl border bg-secondary/30 p-5 space-y-4">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                <HelpCircle className="h-4 w-4 text-emerald-600" />
                Module Assessment Quiz
              </div>

              <p className="text-xs sm:text-sm font-semibold text-foreground">{activeModule.quiz.question}</p>

              <div className="space-y-2">
                {activeModule.quiz.options.map((opt, oIdx) => {
                  const isSelected = selectedQuizAnswers[activeModule.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(activeModule.id, oIdx)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-xs sm:text-sm font-medium border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold"
                          : "bg-background hover:bg-accent text-foreground"
                      }`}
                    >
                      <span>{opt}</span>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-emerald-600 bg-emerald-600 text-white" : ""}`}>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleCompleteModule}
                  disabled={isCurrentCompleted}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {isCurrentCompleted ? "Completed" : "Submit Quiz & Complete Module"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <DIGEOCertificateBadge
          fullName="Chukwuemeka Dan"
          state="Lagos"
          certificateNumber="DIGEO-2026-9814"
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
