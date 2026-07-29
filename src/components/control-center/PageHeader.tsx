import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="plate flex flex-wrap items-start justify-between gap-4 p-6">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Consistent role-gate for Command Center pages that a role cannot open. */
export function Restricted({ need }: { need: string }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
      <p className="mt-3 font-display text-base font-semibold">Not available to your role</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        This screen needs {need}. Ask a Super Admin if you should have access.
      </p>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="plate flex flex-col items-center gap-2 p-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "accent" | "live" | "muted";
}) {
  const toneClass =
    tone === "live"
      ? "bg-live/12 text-live"
      : tone === "accent"
        ? "bg-accent/18 text-accent-foreground dark:text-accent"
        : tone === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/12 text-primary";

  return (
    <div className="plate p-5">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
