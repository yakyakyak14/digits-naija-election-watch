import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Radio, FileCheck2, Users2, ArrowRight, Vote, Eye, Zap, Camera, Video, Sparkles, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IWitnessRecorderModal } from "@/components/reports/IWitnessRecorderModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const stats = [
  { value: "176,846", label: "Polling Units Covered" },
  { value: "500K+", label: "Citizen Monitors" },
  { value: "1–6 Tiles", label: "Live Observer Streams" },
  { value: "36 + FCT", label: "States Monitored" },
];

const features = [
  { icon: Radio, title: "1–6 Live Observer Video Grid", desc: "Real-time observer streams curated from trained DIGEO observers across Nigeria. Maximizable tile views with split screen control." },
  { icon: Camera, title: "i-Witness Camera Recording", desc: "Real-time camera & microphone recording (max 2 mins) with Google Places location search, NIN validation, and 24h auto-expiry." },
  { icon: Users2, title: "DIGEO Observer Certification", desc: "Structured training modules, electoral guidelines, and official accreditation badges for verified citizen observers." },
  { icon: Eye, title: "Control Center Operator Suite", desc: "Multi-role management for Admins and Control Operators to publish feeds, triage reports, and manage public screen splits." },
];

function HomePage() {
  const { user } = useAuth();
  const [isIWitnessOpen, setIsIWitnessOpen] = useState(false);

  const handleOpenIWitness = () => {
    if (!user) {
      toast.info("Please sign in to submit an authenticated i-Witness report with your NIN.", {
        action: {
          label: "Sign in",
          onClick: () => (window.location.href = "/auth"),
        },
      });
      return;
    }
    setIsIWitnessOpen(true);
  };

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-radial">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              DIGITs Nigeria Election Watch 🇳🇬
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl text-foreground tracking-tight">
              Transparent Democracy Through <span className="text-emerald-600 dark:text-emerald-400">Real-Time Observation</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              DIGITs is a citizen-powered election transparency platform designed to empower Nigerian democracy through real-time observer streams, trained observer certification (DIGEO), and verified i-Witness reports.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
                <Link to="/live">
                  <Video className="h-4 w-4 text-red-400 animate-pulse" />
                  View Live 1–6 Video Streams
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleOpenIWitness}
                className="border-emerald-600/30 text-emerald-800 dark:text-emerald-200 font-semibold gap-2"
              >
                <Camera className="h-4 w-4 text-emerald-600" />
                Submit i-Witness Report
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-emerald-500/10 bg-card/60 backdrop-blur-xs p-6 text-center shadow-xs">
                <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400 md:text-4xl">{s.value}</div>
                <div className="mt-1 text-xs uppercase font-semibold tracking-wide text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
        <div className="h-1.5 w-full bg-flag-gradient" />
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 space-y-12">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
            Citizen Verification Engine
          </Badge>
          <h2 className="font-display text-3xl font-bold md:text-4xl text-foreground">Built For Total Electoral Transparency</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Every feature is engineered for immediate verifiability, real-time accountability, and public accessibility across Nigeria.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="p-6 space-y-3 border hover:border-emerald-500/40 transition-all hover:shadow-md">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-emerald-950 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center">
          <ShieldCheck className="h-12 w-12 text-emerald-400" />
          <h2 className="font-display text-3xl font-bold md:text-4xl">Every Eye Counts. Every Vote Matters.</h2>
          <p className="max-w-2xl text-slate-300 text-sm sm:text-base">
            Join thousands of trained observers and citizens building Nigeria's most transparent election observation network.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
              <Link to="/get-involved">Become a Certified DIGEO <Zap className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-900">
              <Link to="/auth">Control Center Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* i-Witness Recorder Modal */}
      {isIWitnessOpen && (
        <IWitnessRecorderModal
          isOpen={isIWitnessOpen}
          onClose={() => setIsIWitnessOpen(false)}
          userProfile={user ? { display_name: user.email?.split("@")[0] } : undefined}
        />
      )}
    </SiteLayout>
  );
}
