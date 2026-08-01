import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollWorld } from "@/components/ui/ScrollWorld";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "From observer training to a verified feed on the public grid: how DIGITs turns what citizens witness at Nigerian polling units into an accountable public record.",
      },
      { property: "og:title", content: "How DIGITs works" },
      {
        property: "og:description",
        content: "Training, deployment, capture, triage, publication — the full DIGITs workflow.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const OBSERVER_PATH = [
  {
    n: 1,
    title: "Apply and get accredited",
    body: "Complete the DIGEO enrolment form — identity, locality, languages, availability, emergency contact — and declare non-partisanship. An observer coordinator reviews it.",
    icon: GraduationCap,
  },
  {
    n: 2,
    title: "Pass the six modules",
    body: "Electoral law, BVAS verification, EC8A arithmetic, evidence handling, conduct and safety, live broadcast. Each has an assessment with a 70% pass mark, and retakes are allowed.",
    icon: CheckCircle2,
  },
  {
    n: 3,
    title: "Receive your deployment",
    body: "A coordinator assigns you a polling unit with a reporting time, supervisor contact and a broadcast room. You accept or decline, then check in on the day from that location.",
    icon: MapPin,
  },
  {
    n: 4,
    title: "Observe, stream, file",
    body: "Go live from your unit, complete the phase checklists as the day progresses, and file incident reports the moment something needs escalating.",
    icon: Radio,
  },
];

const CITIZEN_PATH = [
  {
    n: 1,
    title: "Open DIGITs where you are",
    body: "Anyone inside the election vicinity can report — voters in the queue, party agents, residents nearby. No training or accreditation needed.",
    icon: MapPin,
  },
  {
    n: 2,
    title: "Add your NIN once",
    body: "Your 11-digit National Identity Number lives on your profile, entered once. Every report carries it, so evidence is never anonymous.",
    icon: ShieldCheck,
  },
  {
    n: 3,
    title: "Record on the spot",
    body: "Location must be on before the camera opens. Record up to two minutes, or take stills, then send. You cannot attach anything from your gallery.",
    icon: Camera,
  },
  {
    n: 4,
    title: "Save your own copy",
    body: "Download the clip to your device at capture time. Your in-app history clears after 24 hours; the vault copy stays with the Command Center.",
    icon: CheckCircle2,
  },
];

const TRIAGE = [
  {
    label: "Arrives",
    body: "The report lands in the Command Center queue with its coordinates, timestamp, category and an automatic severity score.",
  },
  {
    label: "Triaged",
    body: "A reviewer sorts by severity, checks the claim against the observation checklists for that unit, and asks for more evidence if it is thin.",
  },
  {
    label: "Verified or flagged",
    body: "Verified reports become eligible for publication. Flagged ones stay in the vault with the reason recorded — nothing is silently deleted.",
  },
  {
    label: "Published",
    body: "An operator releases the report to the public record, optionally pushing it to a grid tile with a caption. The decision is written to the audit log.",
  },
];

function HowItWorksPage() {
  return (
    <SiteLayout>
      {/* Header Banner */}
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/12 text-primary gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Workflow
          </Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            How something witnessed becomes something proven
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Experience the full election watch journey — from polling unit arrival to certified
            publication — in an interactive scroll experience below.
          </p>
        </div>
      </section>

      {/* ScrollWorld Interactive Journey */}
      <ScrollWorld />

      {/* Detailed Workflow Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {[
            { heading: "If you train as a DIGEO", steps: OBSERVER_PATH, tone: "primary" as const },
            { heading: "If you are simply there", steps: CITIZEN_PATH, tone: "accent" as const },
          ].map((column) => (
            <div key={column.heading}>
              <h2 className="font-display text-display-sm font-bold">{column.heading}</h2>
              <ol className="mt-6 space-y-3">
                {column.steps.map((step) => (
                  <li key={step.n} className="plate flex gap-4 p-5">
                    <span
                      className={
                        column.tone === "primary"
                          ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"
                          : "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/18 text-accent-foreground dark:text-accent"
                      }
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold">
                        <span className="mr-1.5 text-muted-foreground">{step.n}.</span>
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="text-center">
            <h2 className="font-display text-display-sm font-bold">
              What the Command Center does with it
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Nothing is published on the reporter's word alone. Every item passes through four
              states, and each transition is logged with the operator who made it.
            </p>
          </div>

          <ol className="mt-10 space-y-3">
            {TRIAGE.map((stage, idx) => (
              <li key={stage.label} className="plate flex items-start gap-4 p-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold">{stage.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="font-display text-display-sm font-bold">Pick your way in</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/training">
              <GraduationCap className="h-4 w-4" />
              Train as a DIGEO
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/i-witness">
              <Camera className="h-4 w-4 text-primary" />
              File what you witnessed
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
