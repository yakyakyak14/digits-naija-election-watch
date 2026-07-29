import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Eye, GraduationCap, Handshake, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIGEO_CURRICULUM_OUTLINE } from "@/lib/training";

export const Route = createFileRoute("/get-involved")({
  head: () => ({
    meta: [
      { title: "Get involved — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Train as an accredited DIGEO election observer, file citizen evidence as an i-Witness, or partner with DIGITs as a CSO, newsroom or funder.",
      },
      { property: "og:title", content: "Get involved with DIGITs Election Watch" },
      {
        property: "og:description",
        content: "Three ways to take part in Nigeria's citizen election observation network.",
      },
    ],
  }),
  component: GetInvolvedPage,
});

const PATHS = [
  {
    icon: GraduationCap,
    title: "Become an accredited DIGEO",
    commitment: "Around two hours of training, then one election day",
    body: "Six modules, six assessments, one numbered certificate. Accredited observers get a polling unit assignment, a broadcast slot on the public grid, and a supervisor to escalate to.",
    cta: { to: "/control-center/training", label: "Open the academy" },
    primary: true,
  },
  {
    icon: Camera,
    title: "Report as an i-Witness",
    commitment: "Two minutes, wherever you are",
    body: "No training, no accreditation. If you are inside an election vicinity and something is happening, record it in-app and send it to the Command Center with your verified identity attached.",
    cta: { to: "/i-witness", label: "File a report" },
  },
  {
    icon: Handshake,
    title: "Partner or fund",
    commitment: "Ongoing",
    body: "CSOs, newsrooms and funders get the same verified record at the same time as everyone else, plus coordination on deployment coverage in the localities you care about.",
    cta: { to: "/contact", label: "Talk to us" },
  },
];

const ELIGIBILITY = [
  "18 years or older, with a valid NIN",
  "A smartphone that can record video",
  "No party membership, office, or campaign role",
  "Willing to stay at one polling unit for the day",
  "Able to read and write in English (other languages welcome in addition)",
];

function GetInvolvedPage() {
  return (
    <SiteLayout>
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/12 text-primary">Take part</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            Three ways in. All of them matter.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            You do not have to be an expert to make an election more transparent. You have to be
            present, honest, and willing to put what you saw on the record.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {PATHS.map((path) => (
            <article
              key={path.title}
              className={
                path.primary
                  ? "plate-interactive flex flex-col border-primary/40 p-6 ring-brand"
                  : "plate-interactive flex flex-col p-6"
              }
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <path.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">{path.title}</h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {path.commitment}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {path.body}
              </p>
              <Button
                asChild
                className="mt-5 gap-1.5"
                variant={path.primary ? "default" : "outline"}
              >
                <Link to={path.cta.to}>
                  {path.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-display-sm font-bold">The DIGEO curriculum</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Six modules, each ending in an assessment you must pass at 70%. Take them in any
              order, retake any of them, and finish at your own pace — the whole curriculum is free
              and open, accredited or not.
            </p>

            <ol className="mt-6 space-y-3">
              {DIGEO_CURRICULUM_OUTLINE.map((module) => (
                <li key={module.number} className="plate flex items-start gap-4 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">
                    {module.number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold">{module.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{module.summary}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {module.category} · {module.minutes} min
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-5">
            <div className="plate p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                Who can be accredited
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {ELIGIBILITY.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="plate p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Eye className="h-4.5 w-4.5 text-primary" />
                Not ready to commit?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Watching is the entry point, and it is genuinely useful. A grid with an audience is
                a grid people behave in front of.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/live">Watch the live grid</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
