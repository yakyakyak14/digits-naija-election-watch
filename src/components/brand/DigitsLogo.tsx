import { cn } from "@/lib/utils";

const SRC = {
  32: "/brand/digits-logo-32.png",
  48: "/brand/digits-logo-48.png",
  64: "/brand/digits-logo-64.png",
  128: "/brand/digits-logo-128.png",
  256: "/brand/digits-logo-256.png",
  512: "/brand/digits-logo-512.png",
} as const;

type MarkSize = keyof typeof SRC;

/**
 * The DIGITs crest. Renders the smallest raster that still covers the requested
 * box at 2x DPR so nav bars don't pay for a 512px asset.
 */
export function DigitsMark({
  size = 40,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const target = size * 2;
  const step = ([32, 48, 64, 128, 256, 512] as MarkSize[]).find((s) => s >= target) ?? 512;

  return (
    <img
      src={SRC[step]}
      srcSet={`${SRC[step]} 1x, ${SRC[Math.min(512, step * 2) as MarkSize] ?? SRC[512]} 2x`}
      width={size}
      height={size}
      alt="DIGITs Election Watch crest"
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}

/**
 * Full lockup: crest + wordmark. Unified font colors across all tones.
 */
export function DigitsLockup({
  size = 40,
  tone = "auto",
  showTagline = true,
  className,
  priority = false,
}: {
  size?: number;
  tone?: "auto" | "light" | "dark";
  showTagline?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const nameTone =
    tone === "light" ? "text-white" : tone === "dark" ? "text-navy-deep" : "text-foreground";
  const subTone =
    tone === "light"
      ? "text-white/80"
      : tone === "dark"
        ? "text-navy-soft"
        : "text-muted-foreground";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <DigitsMark size={size} priority={priority} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={cn("font-display text-[1.02rem] font-extrabold tracking-tight", nameTone)}>
          DIGITs Election Watch
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em]",
              subTone,
            )}
          >
            Nigeria · Citizen Observation
          </span>
        )}
      </span>
    </span>
  );
}
