import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, memo } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Chrome,
  Eye,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DigitsLockup } from "@/components/brand/DigitsLogo";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LightRays } from "@/components/backgrounds/LightRays";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Sign in to comment on live feeds, file i-Witness evidence, or reach the DIGITs Command Center. Watching the platform never requires an account.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AuthPage,
});

/** What an account unlocks — deliberately no privilege or role detail. */
const PUBLIC_ACCESS = [
  { open: true, label: "Watching is free" },
  { open: true, label: "Reading the record is free" },
  { open: true, label: "DIGEO training is free" },
  { open: false, label: "Commenting needs an account" },
  { open: false, label: "Reporting needs an account" },
] as const;

/* -------------------------------------------------------------------------- */
/* Forms — memoised and self-contained so keystrokes never re-render the page  */
/* -------------------------------------------------------------------------- */
const SignInForm = memo(function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back.");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4 pt-3">
      <div>
        <Label htmlFor="signin-email" className="text-xs font-semibold">
          Email address
        </Label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-10 bg-background/70 pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signin-password" className="text-xs font-semibold">
          Password
        </Label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 bg-background/70 pl-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="h-10 w-full font-semibold" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
});

const SignUpForm = memo(function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: { full_name: name.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Check your inbox for the verification link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 pt-3">
      <div>
        <Label htmlFor="signup-name" className="text-xs font-semibold">
          Full name
        </Label>
        <div className="relative mt-1.5">
          <UserCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-name"
            required
            autoComplete="name"
            placeholder="e.g. Amina Bello"
            className="h-10 bg-background/70 pl-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signup-email" className="text-xs font-semibold">
          Email address
        </Label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-10 bg-background/70 pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signup-password" className="text-xs font-semibold">
          Password
        </Label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-10 bg-background/70 pl-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="h-10 w-full font-semibold" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your account…
          </>
        ) : (
          "Create free account"
        )}
      </Button>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        New accounts start as Viewer. Add your NIN in profile settings to unlock i-Witness
        reporting, and apply for DIGEO accreditation whenever you're ready.
      </p>
    </form>
  );
});

/* -------------------------------------------------------------------------- */

function AuthPage() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already signed in? Send staff to the Command Center, everyone else to their account.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);

      const staffRoles = new Set([
        "super_admin",
        "admin",
        "control_center_operator",
        "observer_coordinator",
        "reviewer",
      ]);
      const isStaff = (roles ?? []).some((r) => staffRoles.has(r.role));
      navigate({ to: isStaff ? "/control-center" : "/account", replace: true });
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function signInGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/account`,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep">
      {/*
       * Single centred column. The page used to be a two-column split whose right
       * half enumerated the role model to anonymous visitors; that reference now
       * lives in the Command Center. Centring keeps the one thing this page is
       * for — signing in — at the optical centre.
       */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-14">
        {/* Rays shine down from the top centre, behind everything. */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-navy-panel" />
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            followMouse
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
            pulsating={false}
            fadeDistance={1}
            saturation={1}
            className="opacity-[0.55] mix-blend-screen"
          />
          {/* Grounds the rays so the card never floats on pure black. */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-navy-deep to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Link
            to="/"
            className="mx-auto mb-7 flex w-fit justify-center"
            aria-label="DIGITs Election Watch home"
          >
            <DigitsLockup size={52} tone="light" priority />
          </Link>

          <div className="glass-dark rounded-2xl border border-white/12 p-6 shadow-lifted sm:p-8">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sign in to take part
              </h1>
              <p className="mt-1.5 text-sm text-white/65">
                Comment on live feeds, file i-Witness evidence, train as a DIGEO, or open the
                Command Center.
              </p>
            </div>

            <Button
              onClick={() => void signInGoogle()}
              variant="outline"
              disabled={googleLoading}
              className="mt-6 h-11 w-full border-white/20 bg-white/5 font-medium text-white hover:bg-white/12 hover:text-white"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">
              <span className="h-px flex-1 bg-white/15" />
              or use email
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/8 p-1">
                <TabsTrigger value="signin" className="text-xs font-semibold">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs font-semibold">
                  Create account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <SignInForm onSuccess={() => navigate({ to: "/account" })} />
              </TabsContent>

              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/50">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green-bright" />
              Sessions secured by Supabase Auth. Your NIN is never shown publicly.
            </p>
          </div>

          {/* What an account is and isn't needed for — no privilege detail. */}
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {PUBLIC_ACCESS.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/55">
                {item.open ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-green-bright" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-brand-gold" />
                )}
                {item.label}
              </li>
            ))}
          </ul>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/55">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>
              You don't need this to watch.{" "}
              <Link to="/live" className="font-semibold text-brand-green-bright hover:underline">
                Open the live grid
              </Link>{" "}
              without an account.
            </span>
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
