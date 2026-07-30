import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_META, ROLES, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

/**
 * The role catalogue, one slide per role.
 *
 * This used to sit on the public /auth page. It was moved behind auth because
 * enumerating every privilege tier and its exact database role slug to anonymous
 * visitors is free reconnaissance for anyone probing the platform — and it is
 * operational reference material, not marketing.
 */

/** Which grants each role can hand out — the ceiling enforced in RLS. */
const GRANT_POWER: Partial<Record<AppRole, string>> = {
  super_admin: "Any role, including Admin and Super Admin",
  admin: "Every role except Admin and Super Admin",
};

/** Where each role actually works day to day. */
const SURFACES: Record<AppRole, string[]> = {
  super_admin: ["Every Command Center screen", "Users & roles", "Audit trail"],
  admin: ["Every Command Center screen", "Users & roles", "Audit trail"],
  control_center_operator: ["Live operations", "i-Witness queue", "Incidents", "Public preview"],
  observer_coordinator: ["Observers", "Incidents", "DIGEO academy", "Field forms"],
  digeo: ["Live operations (broadcast)", "Field forms", "DIGEO academy"],
  reviewer: ["i-Witness queue", "Incidents"],
  viewer: ["Overview", "Public preview", "DIGEO academy"],
};

const TONE: Record<AppRole, string> = {
  super_admin: "border-destructive/40 bg-destructive/5",
  admin: "border-accent/50 bg-accent/8",
  control_center_operator: "border-primary/40 bg-primary/5",
  observer_coordinator: "border-primary/30 bg-primary/4",
  digeo: "border-primary/30 bg-primary/4",
  reviewer: "border-border bg-muted/30",
  viewer: "border-border bg-muted/20",
};

export function RoleReferenceSlides() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, slidesToScroll: 1 });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback((api: NonNullable<typeof emblaApi>) => {
    setSelected(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <section className="plate overflow-hidden" aria-label="Platform role reference">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            Role reference
          </h2>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            All {ROLES.length} roles and what each one can do. Every account starts as Viewer;
            anything beyond that is granted by an administrator and enforced in row-level security,
            not in the interface.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {selected + 1} / {ROLES.length}
          </Badge>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous role"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next role"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="overflow-hidden p-5" ref={emblaRef}>
        <ul className="flex gap-4">
          {ROLES.map((role, index) => {
            const meta = ROLE_META[role];
            return (
              <li
                key={role}
                className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 xl:basis-1/3"
              >
                <article className={cn("flex h-full flex-col rounded-xl border p-5", TONE[role])}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold">{meta.label}</h3>
                    <code className="shrink-0 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {role}
                    </code>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>

                  <dl className="mt-4 space-y-3 border-t pt-3 text-xs">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Can do
                      </dt>
                      <dd className="mt-1.5">
                        <ul className="space-y-1.5">
                          {meta.capabilities.map((capability) => (
                            <li key={capability} className="flex items-start gap-1.5">
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                              <span className="text-muted-foreground">{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Command Center access
                      </dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1">
                        {SURFACES[role].map((surface) => (
                          <Badge
                            key={surface}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {surface}
                          </Badge>
                        ))}
                      </dd>
                    </div>

                    <div>
                      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        <Database className="h-2.5 w-2.5" />
                        Can grant roles
                      </dt>
                      <dd className="mt-1 text-muted-foreground">
                        {GRANT_POWER[role] ?? "No — cannot grant or revoke any role"}
                      </dd>
                    </div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t p-3">
        {ROLES.map((role, index) => (
          <button
            key={role}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to ${ROLE_META[role].label}`}
            aria-current={index === selected}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === selected
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
            )}
          />
        ))}
      </div>
    </section>
  );
}
