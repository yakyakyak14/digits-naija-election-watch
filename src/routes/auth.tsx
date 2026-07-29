import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Chrome, Loader2 } from "lucide-react";
import { ROLE_META, ROLES } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DIGITS Control Center" },
      { name: "description", content: "Sign in to the DIGITS Control Center. Email or Google login." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        navigate({ to: "/control-center" });
      }
    });
    return () => { active = false; };
  }, []); // Run once on mount to check existing session

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/control-center" });
    } catch (err: any) {
      toast.error(err.message || "An unexpected sign-in error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/control-center`,
          data: { full_name: name.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Account created! Check your email to confirm.");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signInGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/control-center` },
      });
      if (error) toast.error(error.message);
    } catch (err: any) {
      toast.error(err.message || "Google auth failed.");
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-lg font-bold">
          <img src="/favicon.svg" alt="DIGITs Shield Logo" className="h-8 w-8" />
          <span className="text-foreground font-semibold">DIGITs Nigeria</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold">Control Center Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin, DIGEO, and citizen accounts.</p>

          <Button onClick={signInGoogle} variant="outline" className="mt-6 w-full">
            <Chrome className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3">
                <div>
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    required
                    placeholder="E.g. Amina Bello"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to the DIGITS transparency principles.
          </p>
        </div>
      </div>

      {/* Right: roles panel */}
      <div className="hidden overflow-y-auto border-l bg-secondary/40 px-8 py-12 md:block">
        <div className="mx-auto max-w-md">
          <h2 className="font-display text-xl font-bold">Platform Roles & Limitations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            DIGITS uses role-based access. You start as <strong>Viewer</strong>. Admins can grant more roles.
          </p>
          <div className="mt-6 space-y-4">
            {ROLES.map((r) => (
              <Card key={r} className="p-4">
                <div className="font-semibold">{ROLE_META[r].label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{ROLE_META[r].description}</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {ROLE_META[r].capabilities.map((c) => <li key={c}>• {c}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
