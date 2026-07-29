import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Camera,
  ClipboardCheck,
  Database,
  Fingerprint,
  Gauge,
  GraduationCap,
  Languages,
  Layers,
  MonitorPlay,
  ScrollText,
  ShieldCheck,
  Siren,
  Users2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Platform capabilities — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "What DIGITs ships today: a LiveKit observer grid, real-time i-Witness evidence capture, DIGEO training and certification, an operator Command Center, and database-enforced roles.",
      },
      { property: "og:title", content: "Platform capabilities — DIGITs Election Watch" },
      {
        property: "og:description",
        content:
          "Live observer grid, verified citizen evidence, DIGEO certification and a curated Command Center.",
      },
    ],
  }),
  component: FeaturesPage,
});

const SHIPPED = [
  {
    icon: MonitorPlay,
    title: "1–6 tile live observer grid",
    body: "One WebRTC connection carries every tile, so moving between one and six feeds costs nothing extra. Adaptive simulcast pulls a low layer for small tiles and full quality for a maximised one. Any tile can fill the screen; Esc returns you to the grid.",
    link: { to: "/live", label: "Open the grid" },
  },
  {
    icon: Layers,
    title: "Operator-curated broadcast switching",
    body: "Observers publish into a private intake room only Command Center operators can see. Approving a feed moves it to the public room and assigns a tile slot, and the change reaches every open viewer within a round trip.",
    link: { to: "/control-center", label: "Command Center" },
  },
  {
    icon: Camera,
    title: "Real-time i-Witness capture",
    body: "Two-minute clips and stills recorded in-app only — no gallery picker exists. Coordinates, accuracy radius, capture time, verified NIN and a SHA-256 hash are bound to every file before it leaves the device.",
    link: { to: "/i-witness", label: "File a report" },
  },
  {
    icon: Database,
    title: "Private evidence vault with 24-hour user expiry",
    body: "Media lands in a private bucket served only through short-lived signed URLs. It clears from the reporter's in-app history after 24 hours and is retained for the Command Center, the only place it can be reviewed or released.",
  },
  {
    icon: GraduationCap,
    title: "DIGEO training, assessment and certification",
    body: "Six modules covering electoral law, BVAS verification, EC8A arithmetic, evidence handling, conduct and live broadcast — each with a multi-question assessment and a 70% pass mark. Passing all six issues a numbered certificate.",
    link: { to: "/get-involved", label: "Start training" },
  },
  {
    icon: ClipboardCheck,
    title: "Structured field forms",
    body: "Enrolment application, deployment assignment, phase-by-phase observation checklist and field incident report. The checklist rejects impossible arithmetic in the database: accreditation cannot exceed registration, votes cannot exceed accreditation.",
  },
  {
    icon: Fingerprint,
    title: "Database-enforced roles",
    body: "Seven roles from Super Admin to Viewer, enforced by row-level security. Admins cannot mint Admins, the last Super Admin cannot be removed, and every grant is written to an audit trail.",
  },
  {
    icon: Users2,
    title: "Live public conversation",
    body: "Anyone can read the thread beside the grid. Posting needs an account and is rate limited to six messages per thirty seconds in the database. Operators can hide a message without erasing the record of it.",
    link: { to: "/live", label: "Join the thread" },
  },
];

const ROADMAP = [
  {
    icon: Gauge,
    title: "Polling-unit tally board",
    body: "Live turnout and result aggregation from verified observation checklists, with the three arithmetic checks applied automatically per unit, LGA and state.",
  },
  {
    icon: Siren,
    title: "Observer panic beacon",
    body: "One-touch distress signal streaming an observer's live coordinates and identity to the Command Center, with an escalation path to their coordinator.",
  },
  {
    icon: ScrollText,
    title: "Public evidence archive",
    body: "A searchable, permanent record of released reports and feeds so a disputed unit can be revisited months after the count.",
  },
  {
    icon: Languages,
    title: "Hausa, Yoruba, Igbo and Pidgin",
    body: "Full interface translation so participation is not limited to English speakers.",
  },
  {
    icon: BellRing,
    title: "Push alerts by locality",
    body: "Opt-in notifications when a critical incident is verified in a state or LGA you follow.",
  },
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/12 text-primary">Platform</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            What DIGITs actually ships
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Eight working capabilities, then the honest roadmap. Nothing on the first list is a
            mock-up — you can use all of it today.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <h2 className="font-display text-display-sm font-bold">Shipped and working</h2>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {SHIPPED.map((feature) => (
            <article key={feature.title} className="plate-interactive flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <Badge
                  variant="outline"
                  className="border-primary/40 text-[10px] font-bold text-primary"
                >
                  Live
                </Badge>
              </div>

              <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>

              {feature.link && (
                <Link
                  to={feature.link.to}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {feature.link.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-3 border-accent/50 text-accent-foreground dark:text-accent"
            >
              Roadmap
            </Badge>
            <h2 className="font-display text-display-sm font-bold">
              Next, and not pretending otherwise
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              These are designed and scheduled, not built. They are listed here rather than on the
              shipped side.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((item) => (
              <article key={item.title} className="plate p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/18 text-accent-foreground dark:text-accent">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-sm font-bold">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-display text-display-sm font-bold">
          Everything here is open to watch
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The grid, the public record and the training curriculum all work without an account.
          Signing in only unlocks commenting and evidence submission.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/live">Watch live</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/how-it-works">See the workflow</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
