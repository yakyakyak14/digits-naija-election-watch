import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Menu,
  Radio,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DigitsLockup } from "@/components/brand/DigitsLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/live", label: "Watch live" },
  { to: "/i-witness", label: "i-Witness" },
  { to: "/training", label: "DIGEO Exams" },
  { to: "/features", label: "Platform" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
] as const;

/** Cheap live counter for the nav — one count query, no realtime socket. */
function useLiveCount() {
  return useQuery({
    queryKey: ["nav-live-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("live_streams")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", true)
        .eq("status", "live");
      return count ?? 0;
    },
    staleTime: 60_000,
    refetchInterval: 90_000,
  });
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn, isStaff, displayName } = useViewer();
  const { data: liveCount = 0 } = useLiveCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-shadow",
        scrolled ? "glass shadow-plate" : "border-transparent bg-background",
      )}
    >
      {/* Flag rule — a thin national marker above the chrome. */}
      <div className="h-0.5 w-full bg-flag-gradient" aria-hidden />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="DIGITs Election Watch home" className="shrink-0">
          <DigitsLockup size={38} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/12 hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent/15 font-semibold" }}
            >
              {link.label}
              {link.to === "/live" && liveCount > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-[10px] font-bold text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live" />
                  {liveCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />

          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/i-witness">
              <Camera className="h-3.5 w-3.5 text-primary" />
              Report
            </Link>
          </Button>

          {isSignedIn ? (
            <Button asChild size="sm" className="gap-1.5">
              <Link to={isStaff ? "/control-center" : "/account"}>
                {isStaff ? (
                  <LayoutDashboard className="h-3.5 w-3.5" />
                ) : (
                  <UserRound className="h-3.5 w-3.5" />
                )}
                <span className="max-w-32 truncate">
                  {isStaff ? "Command Center" : displayName}
                </span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/auth">
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg text-foreground transition-colors hover:bg-accent/15 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t bg-background lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent/12"
                activeProps={{ className: "bg-accent/15 font-semibold" }}
              >
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.to === "/live" && liveCount > 0 && (
                    <Badge className="gap-1 bg-live text-[10px] text-white">
                      <Radio className="h-2.5 w-2.5" />
                      {liveCount} live
                    </Badge>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <ThemeToggle />
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/i-witness" onClick={() => setOpen(false)}>
                    <Camera className="h-3.5 w-3.5" />
                    Report
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link
                    to={isSignedIn ? (isStaff ? "/control-center" : "/account") : "/auth"}
                    onClick={() => setOpen(false)}
                  >
                    {isSignedIn ? (isStaff ? "Command Center" : "My account") : "Sign in"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
