import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <img src="/favicon.svg" alt="DIGITs Logo" className="h-7 w-7" />
            <span>DIGITs Nigeria</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Citizen-powered transparency and real-time election monitoring for Nigeria.
          </p>
          <div className="mt-4 h-1 w-24 bg-flag-gradient rounded" />
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-foreground">Platform</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><Link to="/live" className="hover:text-foreground transition-colors">Live 1-6 Observer Feeds</Link></li>
            <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
            <li><Link to="/get-involved" className="hover:text-foreground transition-colors">Become a DIGEO</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-foreground">Organization</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground transition-colors">About DIGITs</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Support</Link></li>
            <li><Link to="/auth" className="hover:text-foreground transition-colors">Control Center Login</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-foreground">Electoral Integrity</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Empowering voters with real-time video observation, verified i-Witness reports, and independent polling unit tallies across all 36 States & FCT.
          </p>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground space-y-2">
        <div>
          © {new Date().getFullYear()} DIGITs Nigeria Election Watch. All rights reserved.
        </div>
        <div className="text-sm font-medium text-foreground">
          Built by <strong className="font-bold text-emerald-600 dark:text-emerald-400 animate-float drop-shadow-sm">SirHope</strong> of <strong className="font-bold text-amber-500 dark:text-amber-400 animate-float-delay drop-shadow-sm">WYN-Tech</strong>.
        </div>
      </div>
    </footer>
  );
}
