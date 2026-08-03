import React, { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Camera, CheckCircle2, GraduationCap, ShieldCheck, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrollWorldSection {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  accent: string;
  bgGradient: string;
  image: string;
  icon: React.ElementType;
  cta?: {
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}

const DEFAULT_SECTIONS: ScrollWorldSection[] = [
  {
    id: "polling-units",
    label: "Polling Units",
    eyebrow: "Step 01 • Ground Zero",
    title: "Dawn at the Polling Unit",
    body: "Observers and citizens assemble across Nigeria's 176,846 polling units. Materials arrive, BVAS units are checked, and the watch begins.",
    tags: ["176,846 Units", "BVAS Verification", "Open Sunlight"],
    accent: "var(--primary)",
    bgGradient: "from-primary/20 via-background/60 to-background",
    image:
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=80",
    icon: GraduationCap,
  },
  {
    id: "digeo-training",
    label: "Observer Training",
    eyebrow: "Step 02 • Accreditation",
    title: "Certified Field Observers",
    body: "DIGEO observers complete 6 rigorous modules covering electoral law, EC8A arithmetic, incident escalation, and non-partisan conduct.",
    tags: ["6 Modules", "70% Pass Mark", "Accredited ID"],
    accent: "var(--primary)",
    bgGradient: "from-primary/30 via-background/60 to-background",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80",
    icon: ShieldCheck,
    cta: {
      primary: { label: "Train as Observer", href: "/training" },
    },
  },
  {
    id: "iwitness-capture",
    label: "i-Witness Capture",
    eyebrow: "Step 03 • On-The-Spot",
    title: "GPS & NIN Verified Reports",
    body: "Citizens record live incidents directly with forced GPS location and NIN identity checks. Video and photos are locked at capture time.",
    tags: ["GPS Locked", "NIN Identity", "Gallery Blocked"],
    accent: "var(--accent)",
    bgGradient: "from-accent/25 via-background/60 to-background",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    icon: Camera,
    cta: {
      primary: { label: "File Report", href: "/i-witness" },
    },
  },
  {
    id: "command-center",
    label: "Triage & Audit",
    eyebrow: "Step 04 • Verification",
    title: "Command Center Audit",
    body: "Every report is triaged by automated severity scoring, verified by coordinators against polling unit checklists, and logged immutably.",
    tags: ["4-Stage Triage", "Audit Logged", "Zero Deletions"],
    accent: "var(--primary)",
    bgGradient: "from-primary/20 via-background/60 to-background",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
    icon: CheckCircle2,
    cta: {
      secondary: { label: "View Audit Log", href: "/audit-log" },
    },
  },
  {
    id: "public-grid",
    label: "Live Broadcast",
    eyebrow: "Step 05 • Public Record",
    title: "Nigeria, Watched By Nigerians",
    body: "Verified feeds stream directly to the public live grid. 1-to-6 split screen live observer feeds, accessible to every citizen without login.",
    tags: ["6-Way Split", "Free Access", "Live Feeds"],
    accent: "var(--primary)",
    bgGradient: "from-primary/35 via-background/60 to-background",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80",
    icon: Video,
    cta: {
      primary: { label: "Watch Live Grid", href: "/live" },
      secondary: { label: "Learn Workflow", href: "/how-it-works" },
    },
  },
];

interface ScrollWorldProps {
  sections?: ScrollWorldSection[];
  className?: string;
}

/**
 * ScrollWorld Component — Unified font colors and design system tokens.
 * Implements camera-depth scroll-scrubbed journey with background zoom,
 * particle atmosphere, section route dots, and smooth typography.
 */
export function ScrollWorld({ sections = DEFAULT_SECTIONS, className }: ScrollWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);
      setScrollProgress(rawProgress);

      const sectionCount = sections.length;
      const index = Math.min(Math.floor(rawProgress * sectionCount), sectionCount - 1);
      setActiveIndex(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections.length]);

  const scrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sectionHeight = (rect.height - window.innerHeight) / (sections.length - 1);
    const targetY = window.scrollY + rect.top + index * sectionHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-background text-foreground font-sans selection:bg-primary/20",
        className,
      )}
      style={{ height: `${sections.length * 100}vh` }}
    >
      {/* Fixed Sticky Viewport Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none z-10 flex flex-col justify-between">
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/80 z-50">
          <div
            className="h-full bg-flag-gradient transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Ambient Sky Particle Atmosphere */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-3xl" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Background Images with Depth Zoom & Opacity Crossfade */}
        <div className="absolute inset-0 z-0">
          {sections.map((section, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={section.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                  isActive ? "opacity-100 scale-105" : "opacity-0 scale-100",
                )}
                style={{
                  transitionProperty: "opacity, transform",
                  transitionDuration: "1200ms",
                }}
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="h-full w-full object-cover object-center filter brightness-[0.35] contrast-110 blur-[1px]"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-b", section.bgGradient)} />
                <div className="absolute inset-0 bg-background/60 mix-blend-multiply" />
              </div>
            );
          })}
        </div>

        {/* Right Route Navigation Dots */}
        <div className="pointer-events-auto absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 items-end">
          {sections.map((sec, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(idx)}
                aria-label={`Jump to ${sec.label}`}
                className="group relative flex items-center gap-3 p-1.5 focus:outline-none"
              >
                {/* Hover / Active Label */}
                <span
                  className={cn(
                    "hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md border transition-all duration-300",
                    isActive
                      ? "bg-primary/20 text-primary border-primary/40 opacity-100 translate-x-0"
                      : "bg-card/80 text-muted-foreground border-border opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                  )}
                >
                  {sec.label}
                </span>

                {/* Dot Indicator */}
                <span
                  className={cn(
                    "h-3 w-3 rounded-full transition-all duration-300 border",
                    isActive
                      ? "bg-primary border-primary scale-125 shadow-glow-green"
                      : "bg-muted border-border group-hover:bg-muted-foreground group-hover:scale-110",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Active Content Copy Card Layer */}
        <div className="pointer-events-auto relative z-30 flex-1 flex items-center px-6 sm:px-12 lg:px-20 max-w-4xl mx-auto w-full">
          {sections.map((sec, idx) => {
            const isActive = idx === activeIndex;
            const Icon = sec.icon;

            if (!isActive) return null;

            return (
              <div
                key={sec.id}
                className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700"
              >
                {/* Eyebrow & Number */}
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 border border-primary/30 text-primary shadow-glow">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-primary">
                    {sec.eyebrow}
                  </span>
                </div>

                {/* Section Title */}
                <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-md leading-tight">
                  {sec.title}
                </h2>

                {/* Body Description */}
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {sec.body}
                </p>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {sec.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/15 border border-primary/30 text-primary backdrop-blur-sm shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action CTAs */}
                {sec.cta && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    {sec.cta.primary && (
                      <Link
                        to={sec.cta.primary.href}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:-translate-y-0.5"
                      >
                        {sec.cta.primary.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {sec.cta.secondary && (
                      <Link
                        to={sec.cta.secondary.href}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card text-card-foreground border border-border font-semibold text-sm hover:bg-accent/15 transition-all backdrop-blur-md hover:-translate-y-0.5"
                      >
                        {sec.cta.secondary.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Scroll Hint */}
        <div className="pointer-events-none relative z-30 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 border border-border text-[11px] font-mono tracking-widest text-muted-foreground uppercase backdrop-blur-md">
            <span>Scroll to Fly Through Workflow</span>
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );
}
