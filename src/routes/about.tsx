import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Handshake, Rocket, ScaleIcon, ShieldCheck, Target } from "lucide-react";
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
          "DIGITs is an independent, non-partisan platform that lets Nigerians observe their own elections in real time — and holds every published claim to a verifiable standard.",
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
    title: "What we are for",
    body: "Putting a credible record of election day in citizens' hands while it is still election day. Not after the tribunal, not in a report published months later — while the queue is still outside the polling unit.",
  },
  {
    icon: Rocket,
    title: "What we do",
    body: "Train and accredit citizen observers, stream their feeds live under operator curation, collect real-time evidence from anyone in the vicinity, and publish only what survives verification.",
  },
  {
    icon: Handshake,
    title: "Who we work with",
    body: "Civil society organisations, newsrooms, and funders who want an evidence base rather than a narrative. We publish the same record to all of them at the same time.",
  },
];

const PRINCIPLES = [
  {
    title: "Non-partisan or nothing",
    body: "Observers declare non-partisanship on enrolment and are held to it. DIGITs does not endorse, predict, or characterise outcomes — not on the platform, and not on election day.",
  },
  {
    title: "Evidence over assertion",
    body: "Every published claim traces to a timestamped, geo-stamped, hash-sealed capture from a named reporter. If we cannot show where and when, we do not publish it.",
  },
  {
    title: "Openness by default",
    body: "Watching, reading and training require no account. Signing in is only for the two acts that attach a person's name to the public record: commenting, and filing evidence.",
  },
  {
    title: "Identity protected, not exposed",
    body: "A reporter's NIN proves the report is not anonymous. It is never displayed publicly, never sold, and never handed to any party or campaign.",
  },
  {
    title: "Nothing disappears quietly",
    body: "Flagged evidence is retained with the reason recorded. Role changes, approvals and publications are written to an audit log that operators cannot edit.",
  },
  {
    title: "Safety outranks the shot",
    body: "Observers are trained to withdraw from danger and report from safety. No clip is worth an injury, and no operator will ask for one.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <DigitsMark size={76} priority className="mx-auto mb-6" />
          <Badge className="mb-4 bg-primary/12 text-primary">About</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            Built so Nigerians never have to take anyone's word for it
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Nigerian elections are not short of opinions. They are short of records — timestamped,
            located, attributable records that exist before the argument starts. DIGITs exists to
            produce those.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="plate p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <ScaleIcon className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-4 font-display text-display-sm font-bold">
              Six commitments we hold ourselves to
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Each of these is implemented somewhere in the platform, not just written here.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <article key={principle.title} className="plate p-5">
                <h3 className="flex items-start gap-2 font-display text-sm font-bold">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {principle.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <Compass className="h-9 w-9 text-primary" />
        <h2 className="mt-4 font-display text-display-sm font-bold">The problem, stated plainly</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Nigeria runs elections across 176,846 polling units. Formal observation missions can
            reach a fraction of them, and their findings usually arrive after the results have been
            declared and the argument has already been settled in public.
          </p>
          <p>
            Meanwhile, almost everyone at a polling unit is carrying a camera. What has been missing
            is not footage — it is footage anyone can trust: bound to a place, bound to a time,
            bound to a name, and checked by someone whose decision is on the record.
          </p>
          <p>
            DIGITs closes that gap. Accredited observers stream under curation. Citizens capture in
            real time under constraints that make their evidence hard to fake. The Command Center
            verifies before anything is published, and every decision it makes is auditable
            afterwards.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
