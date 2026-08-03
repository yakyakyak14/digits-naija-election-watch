import { Link } from "@tanstack/react-router";
import { DigitsLockup } from "@/components/brand/DigitsLogo";
import { cn } from "@/lib/utils";

/** One row of essentials. Everything else lives in the nav or on its own page. */
const LINKS = [
  { to: "/live", label: "Watch live" },
  { to: "/i-witness", label: "i-Witness" },
  { to: "/get-involved", label: "Become a DIGEO" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

/**
 * Global footer, rendered at the base of every page including the Command Center.
 * Uses unified DigitsLockup with light tone for dark background.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t bg-navy-deep text-white", className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="DIGITs Election Watch home"
        >
          <DigitsLockup size={28} tone="light" showTagline={false} />
        </Link>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-0.5 sm:items-end">
          {/* Build credit — required on every page. Both names share one colour. */}
          <p className="text-xs text-white/80">
            Built by{" "}
            <strong className="animate-float font-extrabold text-brand-green-bright">
              SirHope
            </strong>{" "}
            of{" "}
            <strong className="animate-float-delay font-extrabold text-brand-green-bright">
              WYN-Tech
            </strong>
            .
          </p>
          <p className="text-[10px] text-white/40">
            © {new Date().getFullYear()} DIGITs · Independent &amp; non-partisan
          </p>
        </div>
      </div>
    </footer>
  );
}
