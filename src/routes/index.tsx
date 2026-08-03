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
          "Live polling unit observer feeds, verified citizen i-Witness reports, and free DIGEO observer training.",
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
  { value: "176,846", label: "Polling units in scope", sub: "INEC election register" },
  { value: `${TOTAL_LGAS}`, label: "Local government areas", sub: "36 States & FCT" },
  { value: "1–6", label: "Live tiles on air", sub: "Operator curated feeds" },
  { value: "2 min", label: "Evidence clip cap", sub: "GPS & NIN verified" },
];

const PILLARS = [
  {
    icon: Radio,
    title: "Live Polling Unit Feeds",
    body: "Accredited observers stream live from polling units. Tap any feed tile to expand to full screen.",
    href: "/live",
    cta: "Open live grid",
  },
  {
    icon: Camera,
    title: "Instant i-Witness Capture",
    body: "File on-the-spot 2-minute evidence clips stamped with verified coordinates and identity.",
    href: "/i-witness",
    cta: "File report",
  },
  {
    icon: GraduationCap,
    title: "DIGEO Observer Training",
    body: "6 self-paced modules on electoral law, BVAS checks, and evidence handling with accreditation.",
    href: "/training",
    cta: "Start training",
  },
  {
    icon: ShieldCheck,
    title: "Command Center Audit",
    body: "Every clip is triaged by severity and verified against checklists before publication.",
    href: "/how-it-works",
    cta: "View workflow",
  },
];

const FLOW = [
  {
    step: "01",
    title: "Capture",
    body: "Observer or citizen records an incident live on location.",
    icon: Eye,
  },
  {
    step: "02",
    title: "Seal",
    body: "GPS, NIN, timestamp, and SHA-256 hash are locked to the clip.",
    icon: Lock,
  },
  {
    step: "03",
    title: "Triage",
    body: "Command Center verifies facts against official checklists.",
    icon: FileCheck2,
  },
  {
    step: "04",
    title: "Publish",
    body: "Verified feeds broadcast on the public grid in real time.",
    icon: Radio,
  },
];

const ACCESS = [
  { open: true, label: "Watch live observer feeds on 1–6 split screen" },
  { open: true, label: "Read verified i-Witness reports and audit records" },
  { open: true, label: "Take full DIGEO observer training & exams" },
  { open: false, label: "Post comments on live feeds" },
  { open: false, label: "File verified i-Witness evidence reports" },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex justify-center">
              <DigitsMark size={80} priority className="drop-shadow-lg" />
            </div>

            <Badge
              variant="outline"
              className="mb-4 gap-2 border-primary/30 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Independent · Non-partisan · Citizen-run
            </Badge>

            <h1 className="font-display text-display font-extrabold leading-[1.05] text-foreground">
              Nigeria, watched by Nigerians
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Live observer feeds from Nigerian polling units, verified citizen i-Witness reports,
              and accredited observer training — transparent and open to everyone.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2 shadow-plate">
                <Link to="/live">
                  <Radio className="h-4 w-4" />
                  Watch live grid
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/i-witness">
                  <Camera className="h-4 w-4 text-primary" />
                  File i-Witness report
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Watching, reading &amp; training require no account. Sign in only to comment or submit
              evidence.
            </p>
          </div>

          {/* Numbers */}
          <dl className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {NUMBERS.map((item) => (
              <div key={item.label} className="plate p-4 text-center">
                <dd className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
                  {item.value}
                </dd>
                <dt className="mt-1 text-[10px] font-bold uppercase tracking-wide text-foreground">
                  {item.label}
                </dt>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="h-1.5 w-full bg-flag-gradient" aria-hidden />
      </section>

      {/* Live preview */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-display-sm font-bold">Live Grid Preview</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time feeds curated by Command Center operators.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/live">
              Full viewer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <LiveVideoGrid />
      </section>

      {/* Pillars */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mx-auto max-w-xl text-center">
            <Badge className="mb-2.5 bg-primary/12 text-primary">Core Platform</Badge>
            <h2 className="font-display text-display-sm font-bold">Four Core Tools</h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="plate-interactive flex flex-col p-5">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <pillar.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-bold">{pillar.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
                <Link
                  to={pillar.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {pillar.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-display-sm font-bold">Evidence Verification Pipeline</h2>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((item) => (
            <li key={item.step} className="plate relative overflow-hidden p-5">
              <span className="absolute right-3 top-2 font-display text-3xl font-extrabold text-primary/10">
                {item.step}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/18 text-accent-foreground dark:text-accent">
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-2.5 font-display text-sm font-bold">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Access model */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-2 bg-accent/20 text-accent-foreground dark:text-accent">
              Open Access
            </Badge>
            <h2 className="font-display text-display-sm font-bold">Transparent &amp; Accessible</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              All live feeds, reports, and training materials are freely accessible without an
              account. Account registration is only required to post comments or submit verified
              evidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild size="sm" className="gap-2">
                <Link to="/live">
                  <Eye className="h-4 w-4" />
                  Watch live
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Create free account</Link>
              </Button>
            </div>
          </div>

          <ul className="plate divide-y p-2">
            {ACCESS.map((item) => (
              <li key={item.label} className="flex items-center gap-3 px-4 py-3">
                {item.open ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-accent-foreground dark:text-accent" />
                )}
                <span className="text-xs font-medium">
                  {item.label}
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.open ? "Free" : "Sign in"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Evidence integrity */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Vault Protection",
              body: "Evidence is stored in encrypted vault storage. In-app media cache auto-clears after 24 hours for safety.",
            },
            {
              icon: MapPin,
              title: "GPS & NIN Bound",
              body: "Coordinates, timestamp, and NIN identity are cryptographic hashes tied directly to captured evidence.",
            },
            {
              icon: Users2,
              title: "Role Enforcement",
              body: "Database row-level security enforces access roles across all triage and verification steps.",
            },
          ].map((item) => (
            <article key={item.title} className="plate p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-2.5 font-display text-sm font-bold">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-navy-panel text-white">
        <div className="bg-weave">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center">
            <Sparkles className="h-8 w-8 text-brand-gold" />
            <h2 className="font-display text-display-sm font-extrabold">
              Nigeria, Watched By Nigerians
            </h2>
            <p className="max-w-xl text-xs leading-relaxed text-white/70 sm:text-sm">
              Train as an observer, file i-Witness reports, or watch the public live grid.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="default"
                className="gap-2 bg-brand-gold font-bold text-navy-deep hover:bg-brand-gold/90"
              >
                <Link to="/training">
                  <GraduationCap className="h-4 w-4" />
                  DIGEO Observer Academy
                </Link>
              </Button>
              <Button
                asChild
                size="default"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/12 hover:text-white"
              >
                <Link to="/live">Watch live grid</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
