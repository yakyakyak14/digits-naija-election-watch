import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio,
  ShieldCheck,
  FileCheck2,
  MonitorPlay,
  Users2,
  MapPinned,
  Bell,
  ClipboardCheck,
  Lock,
  LayoutDashboard,
  Camera,
  Languages,
  AlertTriangle,
  Database,
  BarChart3,
  Flame,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — DIGITs Nigeria Election Watch" },
      {
        name: "description",
        content:
          "Explore the 10 core platform enhancements of DIGITs Nigeria Election Watch: Live 1-6 video grid, real-time i-Witness camera recording, DIGEO training certification, and Control Center operator matrix.",
      },
      { property: "og:title", content: "DIGITs Nigeria Platform Features" },
      {
        property: "og:description",
        content: "Complete feature set for transparent election monitoring across all 36 States & FCT.",
      },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  {
    icon: MonitorPlay,
    title: "1. Live 1–6 Observer Video Grid",
    body: "Real-time observer streams broadcasted directly from trained DIGEOs. Select 1, 2, 3, 4, 5, or 6 split tiles with full screen click-to-maximize.",
    highlight: "LiveKit Real-Time Player",
    link: "/live",
  },
  {
    icon: ShieldCheck,
    title: "2. Control Center Operator Switcher",
    body: "Role-gated operator console (Super Admin, Admin, Operator, DIGEO, Viewer) allowing operators to approve observer streams for public broadcast.",
    highlight: "Operator Control Panel",
    link: "/auth",
  },
  {
    icon: Camera,
    title: "3. i-Witness Camera Recorder & Google Places",
    body: "Real-time camera & microphone recording (max 2 mins), Google Places API location autocomplete dropdown, mandatory geolocation, NIN validation, and 24h user history auto-expiry.",
    highlight: "Real-Time Verification",
    link: "/",
  },
  {
    icon: ClipboardCheck,
    title: "4. DIGEO Observer Training & Certification",
    body: "Interactive training modules, electoral legal framework guidelines, quizzes, and downloadable observer certificates with QR badges.",
    highlight: "Accreditation Academy",
    link: "/get-involved",
  },
  {
    icon: BarChart3,
    title: "5. Real-Time Polling Unit Tally Board",
    body: "Live polling unit vote aggregation, voter turnout statistics, and BVAS zero-print verification logs across all 36 States + FCT.",
    highlight: "Electoral Analytics",
  },
  {
    icon: Flame,
    title: "6. AI-Assisted Incident Triage & Severity Score",
    body: "Automated categorisation (Logistics delay, Peaceful observation, Violence, Vote-buying) with 1–5 severity scoring for instant response.",
    highlight: "Automated Triage",
  },
  {
    icon: AlertTriangle,
    title: "7. Panic & Emergency Observer Alert",
    body: "One-touch panic distress beacon for DIGEO observers streaming location coordinates directly to Control Center emergency dispatchers.",
    highlight: "Emergency Beacon",
  },
  {
    icon: Database,
    title: "8. Public Incident Archive & Evidence Vault",
    body: "Searchable historical record of verified i-Witness media reports and observer video feeds stored securely in cloud storage.",
    highlight: "Historical Archive",
  },
  {
    icon: Languages,
    title: "9. Multi-Lingual Support (EN, HA, YO, IG, PI)",
    body: "Accessible interface supporting English, Hausa, Yoruba, Igbo, and Nigerian Pidgin for seamless nationwide participation.",
    highlight: "Multilingual Access",
  },
  {
    icon: CheckCircle2,
    title: "10. Community Fact-Checking & Vote Verification",
    body: "Crowd-sourced evidence verification system allowing voters to upvote, corroborate, and confirm local polling unit reports.",
    highlight: "Community Fact-Check",
  },
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
          Platform Architecture & Capabilities
        </Badge>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl text-foreground tracking-tight">
          10 Core Platform Enhancements
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Engineered for verifiability, high resilience, real-time video streaming, and verified citizen participation across Nigeria.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6 space-y-4 border hover:border-emerald-500/40 transition-all hover:shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <f.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  {f.highlight}
                </Badge>
              </div>

              <h2 className="font-display text-lg font-bold text-foreground">{f.title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>

            {f.link && (
              <div className="pt-2 border-t">
                <Button asChild size="sm" variant="ghost" className="text-emerald-600 dark:text-emerald-400 font-semibold p-0 hover:bg-transparent">
                  <Link to={f.link} className="flex items-center gap-1">
                    <span>Explore Feature</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </section>
    </SiteLayout>
  );
}
