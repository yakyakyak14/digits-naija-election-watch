import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IWitnessRecorder } from "@/components/reports/IWitnessRecorder";
import { useViewer } from "@/hooks/useViewer";
import { listMyRecentReports, MAX_CLIP_SECONDS } from "@/lib/iwitness";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/i-witness")({
  head: () => ({
    meta: [
      { title: "i-Witness reporting — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Witnessed something at a Nigerian polling unit? Record it live — up to two minutes, stamped with your location and verified identity — and send it straight to the DIGITs Command Center.",
      },
      { property: "og:title", content: "i-Witness reporting — DIGITs Election Watch" },
      {
        property: "og:description",
        content:
          "Real-time citizen evidence from Nigerian polling units, verified before it is published.",
      },
    ],
  }),
  component: IWitnessPage,
});

const RULES = [
  {
    icon: Video,
    title: "Recorded here, not uploaded",
    body: `Clips are captured from your camera inside the app, up to ${MAX_CLIP_SECONDS / 60} minutes each. There is no file picker, because a file from your gallery proves nothing about when or where it was made.`,
  },
  {
    icon: MapPin,
    title: "Location on, or no report",
    body: "Your coordinates and their accuracy are bound to the evidence at the moment of capture. The camera will not open until location is granted.",
  },
  {
    icon: ShieldCheck,
    title: "One verified identity",
    body: "Your name and NIN come from your profile, entered once and never typed into a report. Anonymous evidence is not evidence.",
  },
  {
    icon: Clock,
    title: "24 hours in your history",
    body: "Media clears from your in-app history after a day, so a lost phone is not a lost identity. Save a copy to your device at capture time if you want to keep it.",
  },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  verified: "bg-primary/15 text-primary",
  broadcasted: "bg-live/15 text-live",
  flagged: "bg-destructive/15 text-destructive",
  archived: "bg-secondary text-secondary-foreground",
};

function IWitnessPage() {
  const { isSignedIn, hasNin, userId } = useViewer();
  const [recorderOpen, setRecorderOpen] = useState(false);

  const history = useQuery({
    queryKey: ["my-iwitness-history", userId],
    queryFn: listMyRecentReports,
    enabled: Boolean(userId),
  });

  const publicFeed = useQuery({
    queryKey: ["public-iwitness-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iwitness_reports")
        .select(
          "id, state, lga, polling_unit, description, triage_category, public_caption, created_at",
        )
        .eq("is_public_broadcast", true)
        .in("status", ["verified", "broadcasted"])
        .order("created_at", { ascending: false })
        .limit(9);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-4 gap-1.5 border-primary/30 bg-primary/8 text-primary"
            >
              <Camera className="h-3.5 w-3.5" />
              i-Witness
            </Badge>
            <h1 className="font-display text-display font-extrabold leading-tight">
              If you are there, you are the record
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              An i-Witness report is an eye-witness account from someone inside the election
              vicinity — a voter in the queue, a party agent, a resident across the road. You record
              what is happening, DIGITs binds it to a place, a time and a verified name, and the
              Command Center takes it from there.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setRecorderOpen(true)} className="gap-2">
                <Camera className="h-4 w-4" />
                Start an i-Witness report
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/live">
                  <Eye className="h-4 w-4" />
                  Watch the live grid
                </Link>
              </Button>
            </div>

            {!isSignedIn && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Reading is open to everyone. Filing evidence needs a free account and a NIN on your
                profile.
              </p>
            )}
            {isSignedIn && !hasNin && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-accent-foreground dark:text-accent">
                <ShieldAlert className="h-3.5 w-3.5" />
                Add your NIN in{" "}
                <Link to="/account" className="font-semibold underline">
                  profile settings
                </Link>{" "}
                to unlock reporting.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-display-sm font-bold">How reporting works</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Four constraints, each of them enforced by the app rather than left to good intentions.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((rule) => (
            <article key={rule.title} className="plate p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
                <rule.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-sm font-bold">{rule.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{rule.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* My history */}
      {isSignedIn && (
        <section className="border-y bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-display-sm font-bold">Your last 24 hours</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reports you filed today. They clear from this list after 24 hours — the evidence
                  stays in the Command Center vault.
                </p>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                {history.data?.length ?? 0} in window
              </Badge>
            </div>

            <div className="mt-6">
              {history.isLoading && (
                <p className="text-sm text-muted-foreground">Loading your reports…</p>
              )}

              {!history.isLoading && (history.data?.length ?? 0) === 0 && (
                <div className="plate flex flex-col items-center gap-2 p-10 text-center">
                  <Camera className="h-7 w-7 text-muted-foreground" />
                  <p className="font-display text-sm font-semibold">
                    Nothing filed in the last day
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    When you file a report it appears here with its review status until the 24-hour
                    window closes.
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(history.data ?? []).map((report) => (
                  <article key={report.id} className="plate space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {report.polling_unit || report.address}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {report.lga}, {report.state}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 text-[10px] capitalize",
                          STATUS_STYLE[report.status ?? "pending"] ?? STATUS_STYLE.pending,
                        )}
                      >
                        {report.status}
                      </Badge>
                    </div>

                    {report.description && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t pt-2 text-[10px] text-muted-foreground">
                      <span className="capitalize">
                        {report.triage_category?.replace(/_/g, " ")}
                      </span>
                      <span>
                        {report.expires_from_user_at
                          ? `${Math.max(
                              0,
                              Math.round(
                                (new Date(report.expires_from_user_at).getTime() - Date.now()) /
                                  3_600_000,
                              ),
                            )}h left in history`
                          : ""}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Public record */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-display-sm font-bold">Cleared for the public record</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Reports the Command Center has verified and released. Everything else stays in the vault
          until it is checked.
        </p>

        <div className="mt-6">
          {(publicFeed.data?.length ?? 0) === 0 ? (
            <div className="plate flex flex-col items-center gap-2 p-10 text-center">
              <ShieldCheck className="h-7 w-7 text-muted-foreground" />
              <p className="font-display text-sm font-semibold">No published reports yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Verified citizen evidence appears here during and after election days.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(publicFeed.data ?? []).map((report) => (
                <article key={report.id} className="plate space-y-2 p-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm font-semibold">
                    {report.polling_unit || `${report.lga}, ${report.state}`}
                  </p>
                  <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                    {report.public_caption || report.description}
                  </p>
                  <p className="border-t pt-2 text-[10px] capitalize text-muted-foreground">
                    {report.triage_category?.replace(/_/g, " ")} ·{" "}
                    {new Date(report.created_at).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {recorderOpen && (
        <IWitnessRecorder
          onClose={() => setRecorderOpen(false)}
          onFiled={() => void history.refetch()}
        />
      )}
    </SiteLayout>
  );
}
