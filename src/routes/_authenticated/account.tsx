import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  Calendar,
  Camera,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Radio,
  Save,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LocationAutocomplete,
  type ResolvedLocation,
} from "@/components/common/LocationAutocomplete";
import { StreamBroadcaster } from "@/components/video/StreamBroadcaster";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { highestRoleLabel, ROLE_META } from "@/lib/roles";
import { lgasForState, NIGERIAN_LANGUAGES, STATE_NAMES } from "@/lib/nigeria";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — DIGITs Election Watch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

const NIN_PATTERN = /^[0-9]{11}$/;

function AccountPage() {
  const { user, profile, deployment, application, roles, isStaff, isObserver, hasNin, loading, refetchProfile } = useViewer();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [nin, setNin] = useState("");
  const [stateName, setStateName] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");
  const [address, setAddress] = useState<ResolvedLocation>({ address: "" });
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);

  // Hydrate the form once the profile arrives.
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setPhone(profile.phone ?? "");
    setNin(profile.nin ?? "");
    setStateName(profile.state ?? "");
    setLga(profile.lga ?? "");
    setWard(profile.ward ?? "");
    setPollingUnit(profile.polling_unit ?? "");
    setAddress({
      address: profile.address ?? "",
      latitude: profile.latitude ?? undefined,
      longitude: profile.longitude ?? undefined,
    });
    setLanguage(profile.preferred_language ?? "en");
  }, [profile]);

  const ninDirty = nin !== (profile?.nin ?? "");
  const ninValid = nin === "" || NIN_PATTERN.test(nin);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;

    if (!ninValid) {
      toast.error("A NIN is exactly 11 digits.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          phone: phone.trim() || null,
          nin: nin.trim() || null,
          state: stateName || null,
          lga: lga || null,
          ward: ward.trim() || null,
          polling_unit: pollingUnit.trim() || null,
          address: address.address.trim() || null,
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
          preferred_language: language,
          email: user.email ?? null,
        })
        .eq("id", user.id);

      if (error) {
        toast.error(
          error.message.includes("profiles_nin_unique")
            ? "That NIN is already registered to another account."
            : error.message,
        );
        return;
      }

      toast.success("Profile saved.");
      await refetchProfile();
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/", replace: true });
  }

  const lgaOptions = lgasForState(stateName);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        {/* Header */}
        <header className="plate flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <UserRound className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold">{displayName || "Your account"}</h1>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isObserver && (
              <Badge className="gap-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold">
                <Award className="h-3.5 w-3.5" />
                Accredited DIGEO Observer
              </Badge>
            )}
            <Badge variant="secondary">{highestRoleLabel(roles)}</Badge>
            {hasNin ? (
              <Badge className="gap-1 bg-primary/15 text-primary">
                <BadgeCheck className="h-3 w-3" />
                NIN on file
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-accent/50 text-accent-foreground dark:text-accent"
              >
                <TriangleAlert className="h-3 w-3" />
                NIN missing
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={() => void signOut()} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* DIGEO Observer Field Station & Live Stream Console */}
        {isObserver && (
          <section className="space-y-6">
            {/* Deployment Card */}
            {deployment && (
              <div className="plate space-y-4 border-emerald-500/30 bg-emerald-950/10 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-emerald-500 text-slate-950 font-bold">
                      <MapPin className="h-3.5 w-3.5" />
                      Assigned Polling Unit
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase font-mono font-semibold">
                      {deployment.election_name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs uppercase font-mono">
                    Status: {deployment.status}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Polling Unit</p>
                    <p className="font-display text-base font-bold text-foreground">
                      {deployment.polling_unit_name}
                      {deployment.polling_unit_code ? ` (${deployment.polling_unit_code})` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {deployment.lga}, {deployment.state} {deployment.ward ? `· Ward: ${deployment.ward}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Reporting Time</p>
                    <p className="font-display text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      {new Date(deployment.reporting_time).toLocaleString()}
                    </p>

                    {deployment.supervisor_name && (
                      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        Supervisor: <span className="font-semibold text-foreground">{deployment.supervisor_name}</span> ({deployment.supervisor_phone ?? "N/A"})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Live Broadcaster */}
            <StreamBroadcaster />
          </section>
        )}

        {/* NIN gate notice */}
        {!hasNin && !loading && (
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground dark:text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Add your NIN to unlock i-Witness reporting</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Evidence is only accepted from a verified identity. Enter your 11-digit National
                Identity Number once below — it is never shown publicly, never sold, and never typed
                into an individual report.
              </p>
            </div>
          </div>
        )}

        {/* Shortcuts */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
            <Link to="/i-witness">
              <Camera className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-left">
                <span className="block text-sm font-semibold">File a report</span>
                <span className="block text-[11px] text-muted-foreground">
                  Real-time i-Witness capture
                </span>
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
            <Link to="/training">
              <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-left">
                <span className="block text-sm font-semibold">DIGEO academy</span>
                <span className="block text-[11px] text-muted-foreground">
                  Train and get accredited
                </span>
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
            <Link to={isStaff ? "/control-center" : "/live"}>
              <LayoutDashboard className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-left">
                <span className="block text-sm font-semibold">
                  {isStaff ? "Command Center" : "Watch live"}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {isStaff ? "Operator console" : "Public observer grid"}
                </span>
              </span>
            </Link>
          </Button>
        </div>

        {/* Profile form */}
        <form onSubmit={save} className="plate space-y-6 p-6">
          <div>
            <h2 className="font-display text-lg font-bold">Profile & identity</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These details are attached to reports you file and to your DIGEO accreditation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name" className="text-xs font-semibold">
                Full name
              </Label>
              <Input
                id="acc-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Amina Bello"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-phone" className="text-xs font-semibold">
                Phone
              </Label>
              <Input
                id="acc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 000 0000"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="acc-nin"
                className="flex items-center justify-between text-xs font-semibold"
              >
                <span>
                  National Identity Number (NIN) <span className="text-destructive">*</span> for
                  reporting
                </span>
                {hasNin && !ninDirty && (
                  <span className="flex items-center gap-1 font-normal text-primary">
                    <BadgeCheck className="h-3 w-3" />
                    Verified on file
                  </span>
                )}
              </Label>
              <Input
                id="acc-nin"
                inputMode="numeric"
                maxLength={11}
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11 digits"
                aria-invalid={!ninValid}
                aria-describedby="acc-nin-hint"
                className={!ninValid ? "border-destructive" : undefined}
              />
              <p id="acc-nin-hint" className="text-[11px] text-muted-foreground">
                {ninValid
                  ? "Stored privately. Only Command Center staff reviewing your evidence can see it."
                  : "A NIN is exactly 11 digits."}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="font-display text-sm font-bold">Where you observe</h3>

            <div className="space-y-1.5">
              <Label htmlFor="acc-address" className="text-xs font-semibold">
                Home or base address
              </Label>
              <LocationAutocomplete
                id="acc-address"
                value={address.address}
                onChange={(next) => {
                  setAddress(next);
                  if (next.state) setStateName(next.state);
                  if (next.lga) setLga(next.lga);
                }}
                placeholder="Town, LGA or street…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="acc-state" className="text-xs font-semibold">
                  State
                </Label>
                <select
                  id="acc-state"
                  value={stateName}
                  onChange={(e) => {
                    setStateName(e.target.value);
                    setLga("");
                  }}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                >
                  <option value="">Select a state…</option>
                  {STATE_NAMES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-lga" className="text-xs font-semibold">
                  LGA
                </Label>
                <select
                  id="acc-lga"
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  disabled={lgaOptions.length === 0}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                >
                  <option value="">
                    {lgaOptions.length ? "Select an LGA…" : "Pick a state first"}
                  </option>
                  {lgaOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-ward" className="text-xs font-semibold">
                  Ward
                </Label>
                <Input
                  id="acc-ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-pu" className="text-xs font-semibold">
                  Your polling unit
                </Label>
                <Input
                  id="acc-pu"
                  value={pollingUnit}
                  onChange={(e) => setPollingUnit(e.target.value)}
                  placeholder="e.g. PU 012, Giginyu Primary School"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-lang" className="text-xs font-semibold">
                  Preferred language
                </Label>
                <select
                  id="acc-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                >
                  <option value="en">English</option>
                  {NIGERIAN_LANGUAGES.filter((l) => l !== "English").map((l) => (
                    <option key={l} value={l.toLowerCase()}>
                      {l}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Interface translation is on the roadmap; this records your preference now.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-6">
            <Button type="submit" disabled={saving || !ninValid} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save profile
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Roles */}
        <section className="plate p-6">
          <h2 className="font-display text-lg font-bold">Your roles</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Roles are granted by a Super Admin and enforced in the database, not the interface.
          </p>

          <div className="mt-4 space-y-3">
            {(roles.length ? roles : (["viewer"] as const)).map((role) => (
              <div key={role} className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{ROLE_META[role].label}</span>
                  <code className="text-[10px] uppercase tracking-wider text-primary">{role}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_META[role].description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
