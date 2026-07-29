import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared layout primitives for the DIGEO forms. They exist so the enrolment,
 * deployment, checklist and incident forms read as one system — same label
 * weight, same hint placement, same error affordance — without each form
 * reinventing it.
 */

export function FormSection({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <fieldset className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div>
          <h3 className="font-display text-sm font-bold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return (
    <div
      className={cn("grid gap-4", cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2")}
    >
      {children}
    </div>
  );
}

const CONTROL_CLASS =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60";

export function TextControl({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_CLASS, invalid && "border-destructive", className)}
    />
  );
}

export function SelectControl({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_CLASS, invalid && "border-destructive", className)}
    >
      {children}
    </select>
  );
}

export function TextAreaControl({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25",
        invalid && "border-destructive",
        className,
      )}
    />
  );
}

/** Yes / No / Not observed — the only honest answer set for a field checklist. */
export function TriToggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean | null;
  onChange: (next: boolean | null) => void;
  hint?: string;
}) {
  const name = useId();
  const options: { label: string; v: boolean | null }[] = [
    { label: "Yes", v: true },
    { label: "No", v: false },
    { label: "Not observed", v: null },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>

      <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={value === option.v}
            onClick={() => onChange(option.v)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
              value === option.v
                ? option.v === true
                  ? "bg-primary text-primary-foreground"
                  : option.v === false
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted-foreground/25 text-foreground"
                : "text-muted-foreground hover:bg-background",
            )}
          >
            {option.label}
          </button>
        ))}
        <input type="hidden" name={name} value={String(value)} />
      </div>
    </div>
  );
}

export function CheckboxRow({
  label,
  description,
  checked,
  onChange,
  required,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        checked ? "border-primary/50 bg-primary/6" : "hover:border-primary/30 hover:bg-accent/10",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="min-w-0">
        <span className="block text-xs font-semibold">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
