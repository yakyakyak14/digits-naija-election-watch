import { Link } from "@tanstack/react-router";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { DigitsMark } from "@/components/brand/DigitsLogo";
import { TOTAL_LGAS } from "@/lib/nigeria";
import { cn } from "@/lib/utils";

const COLUMNS = [
  {
    heading: "Watch",
    links: [
      { to: "/live", label: "Live observer grid" },
      { to: "/i-witness", label: "i-Witness reports" },
      { to: "/features", label: "Platform capabilities" },
    ],
  },
  {
    heading: "Take part",
    links: [
      { to: "/get-involved", label: "Become a DIGEO" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/auth", label: "Sign in" },
    ],
  },
  {
    heading: "Organisation",
    links: [
      { to: "/about", label: "About DIGITs" },
      { to: "/contact", label: "Contact & partnerships" },
      { to: "/control-center", label: "Command Center" },
    ],
  },
] as const;

/**
 * Global footer. Rendered at the base of every page — public marketing, the live
 * grid, and the Command Center alike — so the build credit and the accountability
 * links are never missing.
 */
export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto border-t bg-navy-panel text-white", className)}>
      <div className="bg-weave">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="DIGITs Election Watch home"
            >
              <DigitsMark size={46} />
              <span className="font-display text-lg font-extrabold leading-tight">
                DIGITs
                <span className="ml-1.5 text-brand-gold">Election Watch</span>
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Citizen observation of Nigerian elections, streamed as it happens and verified before
              it is published. Built for the {TOTAL_LGAS.toLocaleString()} local government areas
              across 36 states and the Federal Capital Territory.
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-white/60">
              <a
                href="mailto:hello@digits.ng"
                className="flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                hello@digits.ng
              </a>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Abuja, Nigeria
              </span>
            </div>

            <div className="h-1 w-28 rounded bg-flag-gradient" aria-hidden />
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
                {column.heading}
              </h2>
              <ul className="space-y-2 text-sm text-white/70">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-white/55">
              © {year} DIGITs Nigeria Election Watch. Independent, non-partisan, citizen-funded.
            </p>

            <p className="flex items-center gap-1.5 text-xs text-white/55">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green-bright" />
              Evidence retained in a private vault. Never sold, never shared with any party.
            </p>

            {/* Build credit — required on every page. */}
            <p className="text-sm text-white/85">
              Built by{" "}
              <strong className="animate-float font-extrabold text-brand-green-bright drop-shadow-sm">
                SirHope
              </strong>{" "}
              of{" "}
              <strong className="animate-float-delay font-extrabold text-brand-gold drop-shadow-sm">
                WYN-Tech
              </strong>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
