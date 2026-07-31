import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface SideRaysProps {
  className?: string;
  intensity?: number;
}

/**
 * SideRays Component (ReactBits Side Rays background)
 * Projects single-side light beams from the top-right corner downward into the page layout.
 * Opacity set to 50% of original for a subtle, elegant ambient ray effect.
 */
export const SideRays = memo(function SideRays({ className, intensity = 0.5 }: SideRaysProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 pointer-events-none z-0 overflow-hidden select-none",
        className
      )}
    >
      {/* ----------------- TOP RIGHT RAYS (50% OPACITY) ----------------- */}
      <div className="absolute -top-12 -right-12 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] lg:w-[1100px] lg:h-[1100px] opacity-35 dark:opacity-45 mix-blend-screen transition-opacity duration-700">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-600/05 to-transparent blur-3xl" />

        {/* Conic Ray Beams */}
        <div
          className="absolute inset-0 origin-top-right animate-pulse-slow"
          style={{
            background: `conic-gradient(from 245deg at 100% 0%, 
              transparent 0deg, 
              rgba(0, 135, 81, ${0.1 * intensity}) 12deg, 
              transparent 22deg, 
              rgba(16, 185, 129, ${0.125 * intensity}) 35deg, 
              transparent 48deg, 
              rgba(212, 175, 55, ${0.08 * intensity}) 58deg, 
              transparent 72deg, 
              rgba(0, 135, 81, ${0.09 * intensity}) 84deg, 
              transparent 98deg)`,
            filter: "blur(20px)",
          }}
        />

        {/* Crisp Linear Beams */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25 dark:opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 1000"
        >
          <defs>
            <linearGradient id="beamGradRight1" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#008751" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#008751" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="beamGradRight2" x1="100%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.27" />
              <stop offset="70%" stopColor="#008751" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#008751" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="1000,0 550,1000 720,1000" fill="url(#beamGradRight1)" />
          <polygon points="1000,0 200,750 350,850" fill="url(#beamGradRight2)" />
          <polygon points="1000,0 0,450 100,580" fill="url(#beamGradRight1)" />
        </svg>
      </div>

      {/* Top Edge Highlight Mesh */}
      <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-l from-emerald-500/25 via-emerald-500/10 to-transparent" />
    </div>
  );
});
