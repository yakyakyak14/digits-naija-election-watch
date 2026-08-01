import { createFileRoute, Link } from "@tanstack/react-router";
import { Handshake, Rocket, ScaleIcon, ShieldCheck, Target } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DigitsMark } from "@/components/brand/DigitsLogo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "DIGITs is an independent, non-partisan platform that lets Nigerians observe their own elections in real time.",
      },
      { property: "og:title", content: "About DIGITs Election Watch" },
      {
        property: "og:description",
        content: "Why DIGITs exists, what it refuses to do, and how it stays non-partisan.",
      },
    ],
  }),
  component: AboutPage,
});

const PILLARS = [
  {
    icon: Target,
    title: "Mission",
    body: "Put a credible, timestamped record of election day in citizens' hands — while it's still election day.",
  },
  {
    icon: Rocket,
    title: "What We Do",
    body: "Train observers, stream live feeds, collect real-time evidence, and publish only what survives verification.",
  },
  {
    icon: Handshake,
    title: "Partners",
    body: "CSOs, newsrooms, and funders receive the same verified record simultaneously — no special access.",
  },
];

const PRINCIPLES = [
  {
    title: "Non-partisan or nothing",
    body: "Observers declare non-partisanship on enrolment. DIGITs never endorses or predicts outcomes.",
  },
  {
    title: "Evidence over assertion",
    body: "Every published claim is timestamped, geo-stamped, hash-sealed, and attributed to a named reporter.",
  },
  {
    title: "Open by default",
    body: "Watching, reading and training require no account. Sign-in is only for commenting or submitting evidence.",
  },
  {
    title: "Identity protected",
    body: "A reporter's NIN verifies identity but is never displayed publicly, sold, or shared with any party.",
  },
  {
    title: "Nothing disappears",
    body: "Flagged evidence is retained with reasons recorded. All actions are written to an immutable audit log.",
  },
  {
    title: "Safety first",
    body: "Observers are trained to withdraw from danger and report from safety. No clip is worth an injury.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <DigitsMark size={72} priority className="mx-auto mb-5" />
          <Badge className="mb-3 bg-primary/12 text-primary">About</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            Built so Nigerians never have to take anyone's word for it
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Nigeria's elections need timestamped, located, attributable records — not opinions after the fact. DIGITs exists to produce those records.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="plate p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 font-display text-base font-bold">{pillar.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mx-auto max-w-xl text-center">
            <ScaleIcon className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 font-display text-display-sm font-bold">
              Six Commitments
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <article key={principle.title} className="plate p-4">
                <h3 className="flex items-start gap-2 font-display text-sm font-bold">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {principle.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="font-display text-display-sm font-bold">Get Involved</h2>
        <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground sm:text-sm">
          Join the network as an observer, contribute evidence, or partner with DIGITs.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/get-involved">Join the network</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Partner with us</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
