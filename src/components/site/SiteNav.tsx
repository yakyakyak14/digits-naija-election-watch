import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/live", label: "Live Feeds 🔴" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/about", label: "About" },
  { to: "/get-involved", label: "Become DIGEO" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <img src="/favicon.svg" alt="DIGITs Shield Logo" className="h-8 w-8" />
          <span className="text-foreground tracking-tight">DIGITs Nigeria</span>
          <span className="ml-1 hidden text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full sm:inline">
            Election Watch
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-medium"
              activeProps={{ className: "text-emerald-600 dark:text-emerald-400 font-semibold" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-300">
            <Link to="/live">
              <Video className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              <span>Public Stream</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Link to="/auth">Control Center / Sign in</Link>
          </Button>
        </div>

        <button className="md:hidden p-1 text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center justify-between"
              >
                <span>{l.label}</span>
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 pt-2 border-t">
              <Button asChild variant="outline" size="sm" className="w-full justify-center gap-2">
                <Link to="/live" onClick={() => setOpen(false)}>
                  <Video className="h-4 w-4 text-red-500" />
                  <span>View 1-6 Live Streams</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="w-full justify-center bg-emerald-600 text-white">
                <Link to="/auth" onClick={() => setOpen(false)}>Control Center / Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
