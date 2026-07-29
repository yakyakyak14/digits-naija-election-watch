import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, memo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Chrome, Loader2, Lock, Mail, UserCheck } from "lucide-react";
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

/* -------------------------------------------------------------------------- */
/* Interactive Canvas Background with Particle Grid & Emerald/Gold Orbs */
/* -------------------------------------------------------------------------- */
const InteractiveAuthBackground = memo(function InteractiveAuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }> = [];

    const colors = ["rgba(0, 135, 81, 0.4)", "rgba(212, 175, 55, 0.3)", "rgba(16, 185, 129, 0.3)"];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 135, 81, ${0.15 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Mouse proximity reaction
        const mdx = p1.x - mouseX;
        const mdy = p1.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 140) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 * (1 - mdist / 140)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Isolated Sign In Form Component */
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Signed in successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="signin-email" className="text-xs font-semibold text-foreground">
          Email Address
        </Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            className="pl-9 h-10 bg-background/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signin-password" className="text-xs font-semibold text-foreground">
          Password
        </Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-9 h-10 bg-background/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
          </>
        ) : (
          "Sign In to Control Center"
        )}
      </Button>
    </form>
  );
});

/* -------------------------------------------------------------------------- */
/* Isolated Sign Up Form Component */
/* -------------------------------------------------------------------------- */
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
          emailRedirectTo: `${window.location.origin}/control-center`,
          data: { full_name: name.trim() },
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Verification link sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="signup-name" className="text-xs font-semibold text-foreground">
          Full Name
        </Label>
        <div className="relative mt-1">
          <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signup-name"
            required
            autoComplete="name"
            placeholder="E.g. Amina Bello"
            className="pl-9 h-10 bg-background/60"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
          Email Address
        </Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            className="pl-9 h-10 bg-background/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
          Password (min 6 chars)
        </Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="signup-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-9 h-10 bg-background/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
});

/* -------------------------------------------------------------------------- */
/* Main Auth Page */
/* -------------------------------------------------------------------------- */
function AuthPage() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        navigate({ to: "/control-center" });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function signInGoogle() {
    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/control-center`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Google auth redirect error");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen grid md:grid-cols-2 bg-background overflow-hidden">
      {/* Dynamic Interactive Background */}
      <InteractiveAuthBackground />

      {/* Left Column: Form Card */}
      <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2.5 font-display text-xl font-bold group">
          <img src="/favicon.svg" alt="DIGITs Shield Logo" className="h-9 w-9 transition-transform group-hover:scale-105" />
          <span className="text-foreground tracking-tight">DIGITs <span className="text-emerald-600 dark:text-emerald-400">Nigeria</span></span>
        </Link>

        <div className="mx-auto w-full max-w-md backdrop-blur-xl bg-card/85 dark:bg-card/75 border border-emerald-500/20 shadow-2xl rounded-2xl p-6 sm:p-8">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Control Center Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in to manage DIGEO observers, view live streams, and review reports.
            </p>
          </div>

          <Button
            onClick={signInGoogle}
            variant="outline"
            disabled={googleLoading}
            className="mt-6 w-full h-11 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-all font-medium"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <Chrome className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            Continue with Google OAuth
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>OR EMAIL ACCESS</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/80 p-1">
              <TabsTrigger value="signin" className="text-xs font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <SignInForm onSuccess={() => navigate({ to: "/control-center" })} />
            </TabsContent>

            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Protected by DIGITS Security Protocol & Supabase Auth</span>
          </div>
        </div>
      </div>

      {/* Right Column: Roles & Capabilities Panel */}
      <div className="relative z-10 hidden overflow-y-auto border-l border-emerald-500/10 bg-secondary/30 backdrop-blur-md px-8 py-12 md:flex flex-col justify-center">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Role-Based Security
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Platform Roles & Capabilities</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              New accounts start with <strong>Viewer</strong> access. Control Center Super Admins can assign DIGEO Observer, Media Operator, and Admin roles.
            </p>
          </div>

          <div className="space-y-3.5">
            {ROLES.map((r) => (
              <Card key={r} className="p-4 border-emerald-500/15 bg-card/60 backdrop-blur-xs hover:border-emerald-500/30 transition-all">
                <div className="font-semibold text-sm text-foreground flex items-center justify-between">
                  <span>{ROLE_META[r].label}</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-normal uppercase tracking-wider">{r}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{ROLE_META[r].description}</div>
                <ul className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                  {ROLE_META[r].capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
