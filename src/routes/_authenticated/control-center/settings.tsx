import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Antenna,
  BadgeCheck,
  Database,
  ExternalLink,
  KeyRound,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/control-center/PageHeader";
import { useViewer } from "@/hooks/useViewer";
import { getStreamingConfig } from "@/lib/streaming";
import { ROLE_META } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/control-center/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, roles, hasNin, isAdmin } = useViewer();

  const streaming = useQuery({
    queryKey: ["streaming-config"],
    queryFn: () => getStreamingConfig(),
    staleTime: 300_000,
  });

  const livekitReady = streaming.data?.transport === "livekit";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Your account, and the platform integrations this deployment depends on."
        actions={
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/account">
              <UserRound className="h-3.5 w-3.5" />
              Full profile
            </Link>
          </Button>
        }
      />

      {/* Account */}
      <section className="plate space-y-4 p-6">
        <h2 className="font-display text-base font-bold">Account</h2>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Name", profile?.display_name ?? "—"],
            ["Email", user?.email ?? "—"],
            ["State", profile?.state ?? "Not set"],
            ["LGA", profile?.lga ?? "Not set"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium">{value}</dd>
            </div>
          ))}

          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Identity verification</dt>
            <dd className="mt-1">
              {hasNin ? (
                <Badge className="gap-1 bg-primary/15 text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  NIN on file — i-Witness reporting enabled
                </Badge>
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1 border-accent/50 text-accent-foreground dark:text-accent"
                  >
                    <TriangleAlert className="h-3 w-3" />
                    No NIN on file
                  </Badge>
                  <Button asChild size="sm" variant="link" className="h-auto p-0">
                    <Link to="/account">Add it now</Link>
                  </Button>
                </span>
              )}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Roles</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {(roles.length ? roles : (["viewer"] as const)).map((role) => (
                <Badge key={role} variant="secondary">
                  {ROLE_META[role].label}
                </Badge>
              ))}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">User ID</dt>
            <dd className="mt-0.5 font-mono text-[11px] text-muted-foreground">{user?.id}</dd>
          </div>
        </dl>
      </section>

      {/* Integrations */}
      <section className="plate space-y-4 p-6">
        <h2 className="font-display text-base font-bold">Platform integrations</h2>
        <p className="text-xs text-muted-foreground">
          Read-only status. Credentials live in server environment variables and are never exposed
          to the browser.
        </p>

        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Antenna className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">LiveKit real-time video</p>
                <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                  {livekitReady
                    ? "Connected. Observer feeds are carried over WebRTC with adaptive simulcast."
                    : "Not configured. Tiles fall back to each feed's recorded source. Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to enable WebRTC."}
                </p>
              </div>
            </div>
            <Badge
              className={
                livekitReady
                  ? "bg-primary/15 text-primary"
                  : "bg-accent/20 text-accent-foreground dark:text-accent"
              }
            >
              {livekitReady ? "Connected" : "Fallback mode"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Database className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Supabase — database, auth and evidence vault
                </p>
                <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                  Row-level security on every table. Evidence sits in a private bucket served only
                  through short-lived signed URLs.
                </p>
              </div>
            </div>
            <Badge className="bg-primary/15 text-primary">Connected</Badge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Google Places — location lookup</p>
                <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                  Proxied server-side so the key never reaches a browser. Falls back to the built-in
                  Nigerian gazetteer when unavailable.
                </p>
              </div>
            </div>
            <Badge variant="outline">Server-side proxy</Badge>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="plate space-y-3 p-6">
          <h2 className="font-display text-base font-bold">Admin shortcuts</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/control-center/users">Manage users &amp; roles</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/control-center/audit">Review the audit trail</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2">
              <Link to="/live" target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
                Open the public grid
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
