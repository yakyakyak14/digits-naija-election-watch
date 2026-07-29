import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { cn } from "@/lib/utils";

/**
 * Standard public shell. `flex-col` plus `mt-auto` on the footer keeps the footer
 * pinned to the base of the viewport even on pages shorter than one screen.
 */
export function SiteLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className={cn("flex-1", className)}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
