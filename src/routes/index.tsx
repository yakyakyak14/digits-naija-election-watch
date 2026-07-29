import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  GraduationCap,
  Lock,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DigitsMark } from "@/components/brand/DigitsLogo";
import { LiveVideoGrid } from "@/components/video/LiveVideoGrid";
import { TOTAL_LGAS } from "@/lib/nigeria";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DIGITs Election Watch — Nigeria, watched by Nigerians" },
      {
        name: "description",
        content:
          "See Nigerian elections as they happen: live feeds from accredited observers, citizen i-Witness evidence verified before publication, and free DIGEO observer training. No account needed to watch.",
      },
      { property: "og:title", content: "DIGITs Election Watch — Nigeria, watched by Nigerians" },
      {
        property: "og:description",
        content:
          "Live observer feeds, verified citizen evidence, and accredited observer training — open to every Nigerian.",
      },
    ],
  }),
  component: HomePage,
});

const NUMBERS = [
  { value: "176,846", label: "Polling units in scope", sub: "Every unit in the INEC register" },
  { value: `${TOTAL_LGAS}`, label: "Local government areas", sub: "36 states and the FCT" },
  { value: "1–6", label: "Live tiles on air", sub: "Curated by Command Center operators" },
  { value: "2 min", label: "Maximum evidence clip", sub: "Short, decisive, verifiable" },
];

const PILLARS = [
  {
    icon: Radio,
    title: "Watch the polling unit, not the press release",
    body: "Accredited DIGEO observers broadcast live from their assigned units. Operators place up to six feeds on the public grid; tap any tile to fill your screen. Watching costs nothing and asks nothing of you.",
    href: "/live",
    cta: "Open the live grid",
  },
  {
    icon: Camera,
    title: "If you are there, you are the record",
    body: "Anyone inside an election vicinity can file an i-Witness report: record on the spot, up to two minutes, stamped with your coordinates and verified identity. No gallery uploads — evidence has to be made in the moment.",
    href: "/i-witness",
    cta: "File a report",
  },
  {
    icon: GraduationCap,
    title: "Train, get accredited, get deployed",
    body: "Six modules on electoral law, BVAS verification, EC8A arithmetic, evidence handling, conduct and live broadcast. Pass the assessments and your DIGEO certificate is issued with a verifiable accreditation number.",
    href: "/get-involved",
    cta: "Start DIGEO training",
  },
  {
    icon: ShieldCheck,
    title: "Nothing reaches the public unchecked",
    body: "Every feed and every clip passes through the Command Center. Operators triage by severity, verify against the arithmetic, and decide what is published — with each decision written to an audit trail.",
    href: "/how-it-works",
    cta: "See the workflow",
  },
];

const FLOW = [
  {
    step: "01",
    title: "Someone sees something",
    body: "An observer at their assigned unit, or any citizen inside the election vicinity, opens DIGITs and starts recording.",
    icon: Eye,
  },
  {
    step: "02",
    title: "It is stamped and sealed",
    body: "Coordinates, timestamp, verified NIN and a content hash are attached at capture. The clip uploads to a private evidence vault.",
    icon: Lock,
  },
  {
    step: "03",
    title: "The Command Center triages",
    body: "Operators sort by severity, cross-check the numbers, and escalate what matters. Nothing is published on the reporter's word alone.",
    icon: FileCheck2,
  },
  {
    step: "04",
    title: "Nigeria watches",
    body: "Verified feeds and cleared evidence go to the public grid within minutes, and the record stays available after the count.",
    icon: Radio,
  },
];

const ACCESS = [
  { open: true, label: "Watch every live feed and switch between 1–6 tiles" },
  { open: true, label: "Read verified i-Witness reports and the public record" },
  { open: true, label: "Take the full DIGEO training curriculum" },
  { open: true, label: "Install the app from Play Store, App Store or as a PWA" },
  { open: false, label: "Comment on a live feed" },
  { open: false, label: "File an i-Witness report with your evidence" },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <DigitsMark size={84} priority className="drop-shadow-lg" />
            </div>

            <Badge
              variant="outline"
              className="mb-5 gap-2 border-primary/30 bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Independent · Non-partisan · Citizen-run
            </Badge>

            <h1 className="font-display text-display font-extrabold leading-[1.05] text-foreground">
              Nigeria, watched by <span className="text-gradient-green">Nigerians</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Elections are won and lost in the minutes nobody records. DIGITs puts trained
              observers and ordinary citizens on the same platform — live from the polling unit,
              verified before publication, and on the public record for good.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2 shadow-plate">
                <Link to="/live">
                  <Radio className="h-4 w-4" />
                  Watch live now
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/i-witness">
                  <Camera className="h-4 w-4 text-primary" />
                  File an i-Witness report
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No account needed to watch, read or train. You only sign in to comment or submit
              evidence.
            </p>
          </div>

          {/* Numbers */}
          <dl className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {NUMBERS.map((item) => (
              <div key={item.label} className="plate p-5 text-center">
                <dd className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
                  {item.value}
                </dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-foreground">
                  {item.label}
                </dt>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="h-1.5 w-full bg-flag-gradient" aria-hidden />
      </section>

      {/* Live preview */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="font-display text-display-sm font-bold">On air right now</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The public grid, exactly as the Command Center has it configured. Change the tile
              count, maximise any feed, or open the full viewer with the live conversation
              alongside.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-1.5">
            <Link to="/live">
              Full viewer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <LiveVideoGrid />
      </section>

      {/* Pillars */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-3 bg-primary/12 text-primary">What DIGITs actually does</Badge>
            <h2 className="font-display text-display-sm font-bold">Four jobs, done properly</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Not a dashboard of promises. Each of these is a working part of the platform you can
              use today.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="plate-interactive flex flex-col p-6">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                  <pillar.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-bold">{pillar.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
                <Link
                  to={pillar.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {pillar.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-sm font-bold">
            From the queue to the public record
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Four steps, usually inside a few minutes on election day.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((item) => (
            <li key={item.step} className="plate relative overflow-hidden p-6">
              <span className="absolute right-4 top-3 font-display text-4xl font-extrabold text-primary/10">
                {item.step}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/18 text-accent-foreground dark:text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Access model */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-3 bg-accent/20 text-accent-foreground dark:text-accent">
              Open by default
            </Badge>
            <h2 className="font-display text-display-sm font-bold">
              Transparency you don't have to sign up for
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A transparency platform that hides behind a signup form isn't transparent. Everything
              you can watch, read or learn on DIGITs is open to anyone with a browser — on the web,
              or through the app from the Play Store, the App Store, or installed straight from this
              page.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              We ask for an account in exactly two places: posting a comment, and submitting
              evidence. Both attach your name to a public record, so both need to be accountable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link to="/live">
                  <Eye className="h-4 w-4" />
                  Start watching
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/auth">Create a free account</Link>
              </Button>
            </div>
          </div>

          <ul className="plate divide-y p-2">
            {ACCESS.map((item) => (
              <li key={item.label} className="flex items-start gap-3 px-4 py-3.5">
                {item.open ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground dark:text-accent" />
                )}
                <span className="text-sm">
                  {item.label}
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.open ? "No account" : "Sign in"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Evidence integrity */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Yours for 24 hours, ours for the record",
              body: "Media clears from your in-app history after a day so a lost phone is not a lost identity. The evidence itself stays in the private vault where only the Command Center can reach it.",
            },
            {
              icon: MapPin,
              title: "Every claim is placed",
              body: "Location must be on before the camera opens. Coordinates, accuracy radius and capture time are bound to the file, and a SHA-256 hash makes later edits detectable.",
            },
            {
              icon: Users2,
              title: "Roles, not free-for-all",
              body: "Seven roles from Super Admin to Viewer, enforced in the database rather than the interface. Operators curate the grid; reviewers verify evidence; nobody can quietly promote themselves.",
            },
          ].map((item) => (
            <article key={item.title} className="plate p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-navy-panel text-white">
        <div className="bg-weave">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-20 text-center">
            <Sparkles className="h-9 w-9 text-brand-gold" />
            <h2 className="font-display text-display-sm font-extrabold">
              An election nobody is watching is an election nobody can dispute
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Train as an observer, file what you witness, or simply watch and hold the record.
              Every role matters, and every one of them is open to you.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-brand-gold font-bold text-navy-deep hover:bg-brand-gold/90"
              >
                <Link to="/get-involved">
                  <GraduationCap className="h-4 w-4" />
                  Become a certified DIGEO
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/12 hover:text-white"
              >
                <Link to="/live">Watch the live grid</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
