import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, memo } from "react";
import { toast } from "sonner";
import { Chrome, Eye, Loader2, Lock, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DigitsLockup } from "@/components/brand/DigitsLogo";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ROLE_META, ROLES } from "@/lib/roles";

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

/* -------------------------------------------------------------------------- */
/* Ambient backdrop                                                            */
/* -------------------------------------------------------------------------- */
/**
 * Pure CSS. This was a canvas particle field with an O(n^2) connection pass —
 * ~900 stroke() calls per frame on a full-viewport canvas, plus a
 * getBoundingClientRect() on every pointer move. It held a core at 100% for as
 * long as the page was open, and on modest hardware the extra work of a React
 * keystroke was enough to tip the renderer into "Page Unresponsive" while
 * typing into the email field.
 *
 * Gradients and blurred orbs are rasterised once and composited by the GPU, so
 * this costs nothing on the main thread and cannot interfere with input.
 */
function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/12 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-green/8 blur-3xl" />
      <div className="bg-dot-grid absolute inset-0 opacity-60" />
    </div>
  );
}

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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative grid flex-1 overflow-hidden lg:grid-cols-2">
        <AuthBackdrop />

        {/* Form column */}
        <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-14">
          <Link to="/" className="mb-8 inline-flex w-fit" aria-label="DIGITs Election Watch home">
            <DigitsLockup size={44} priority />
          </Link>

          <div className="glass mx-auto w-full max-w-md rounded-2xl border border-primary/15 p-6 shadow-lifted sm:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Sign in to take part
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Comment on live feeds, file i-Witness evidence, train as a DIGEO, or open the Command
              Center.
            </p>

            <Button
              onClick={() => void signInGoogle()}
              variant="outline"
              disabled={googleLoading}
              className="mt-6 h-11 w-full font-medium"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
              ) : (
                <Chrome className="mr-2 h-4 w-4 text-primary" />
              )}
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/80 p-1">
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

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Sessions secured by Supabase Auth. Your NIN is never shown publicly.
            </p>
          </div>

          <p className="mx-auto mt-6 flex max-w-md items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>
              You don't need this to watch.{" "}
              <Link to="/live" className="font-semibold text-primary hover:underline">
                Open the live grid
              </Link>{" "}
              without an account.
            </span>
          </p>
        </div>

        {/* Roles column */}
        <aside className="relative z-10 hidden flex-col justify-center overflow-y-auto border-l bg-secondary/40 px-8 py-12 lg:flex">
          <div className="scroll-slim mx-auto max-w-md space-y-5">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                Role-based access
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
                Seven roles, enforced in the database
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Every account starts as <strong>Viewer</strong>. Roles are granted by a Super Admin,
                and the rules live in row-level security — not just in the interface.
              </p>
            </div>

            <ul className="space-y-3">
              {ROLES.map((role) => (
                <li key={role} className="plate p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{ROLE_META[role].label}</span>
                    <code className="text-[10px] uppercase tracking-wider text-primary">
                      {role}
                    </code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ROLE_META[role].description}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {ROLE_META[role].capabilities.map((capability) => (
                      <li key={capability} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
