import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPinned, Send, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  Field,
  FieldGrid,
  FormSection,
  SelectControl,
  TextAreaControl,
  TextControl,
} from "./FormPrimitives";
import {
  LocationAutocomplete,
  type ResolvedLocation,
} from "@/components/common/LocationAutocomplete";
import { useViewer } from "@/hooks/useViewer";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { lgasForState, STATE_NAMES } from "@/lib/nigeria";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Incident = Database["public"]["Tables"]["incident_reports"]["Row"];
type IncidentType = Incident["incident_type"];
type Severity = Incident["severity"];

const INCIDENT_TYPES: { value: IncidentType; label: string; suggested: Severity }[] = [
  { value: "late_opening", label: "Late opening", suggested: "medium" },
  { value: "material_shortage", label: "Material shortage", suggested: "medium" },
  { value: "bvas_failure", label: "BVAS failure", suggested: "high" },
  { value: "vote_buying", label: "Vote buying / inducement", suggested: "high" },
  { value: "ballot_snatching", label: "Ballot snatching", suggested: "critical" },
  { value: "violence", label: "Violence", suggested: "critical" },
  { value: "intimidation", label: "Intimidation", suggested: "high" },
  { value: "underage_voting", label: "Underage voting", suggested: "high" },
  { value: "multiple_voting", label: "Multiple voting", suggested: "high" },
  { value: "result_alteration", label: "Result alteration", suggested: "critical" },
  { value: "agent_misconduct", label: "Party agent misconduct", suggested: "medium" },
  { value: "security_misconduct", label: "Security misconduct", suggested: "high" },
  {
    value: "pwd_access_denied",
    label: "Access denied to voter with disability",
    suggested: "high",
  },
  { value: "other", label: "Something else", suggested: "medium" },
];

const SEVERITIES: { value: Severity; label: string; hint: string; tone: string }[] = [
  {
    value: "low",
    label: "Low",
    hint: "Noted, no action needed now",
    tone: "border-muted-foreground/40",
  },
  { value: "medium", label: "Medium", hint: "Coordinator should know", tone: "border-accent/60" },
  { value: "high", label: "High", hint: "Needs a response today", tone: "border-orange-500/60" },
  {
    value: "critical",
    label: "Critical",
    hint: "Escalate immediately",
    tone: "border-destructive/70",
  },
];

/**
 * DIGEO field incident report. Distinct from an i-Witness clip: this is the
 * structured escalation an accredited observer files so the Command Center can
 * act, optionally linked to the evidence that supports it.
 */
export function IncidentReportForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, profile } = useViewer();
  const geo = useGeolocation();

  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [stateName, setStateName] = useState(profile?.state ?? "");
  const [lga, setLga] = useState(profile?.lga ?? "");
  const [ward, setWard] = useState(profile?.ward ?? "");
  const [puName, setPuName] = useState(profile?.polling_unit ?? "");
  const [location, setLocation] = useState<ResolvedLocation>({ address: "" });
  const [headline, setHeadline] = useState("");
  const [narrative, setNarrative] = useState("");
  const [peopleAffected, setPeopleAffected] = useState("");
  const [securityNotified, setSecurityNotified] = useState(false);
  const [inecNotified, setInecNotified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const lgaOptions = useMemo(() => lgasForState(stateName), [stateName]);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!incidentType) next.incidentType = "Pick the closest category.";
    if (headline.trim().length < 6) next.headline = "At least 6 characters.";
    if (headline.trim().length > 160) next.headline = "Keep it under 160 characters.";
    if (narrative.trim().length < 20)
      next.narrative = "At least 20 characters — facts, times, who was involved.";
    if (!stateName) next.state = "Required.";
    if (!lga) next.lga = "Required.";
    if (!puName.trim()) next.puName = "Required.";
    return next;
  }, [incidentType, headline, narrative, stateName, lga, puName]);

  const isValid = Object.keys(errors).length === 0;
  const err = (key: string) => (touched ? errors[key] : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) {
      toast.error("Some answers still need attention.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const fix = geo.fix ?? (await geo.request());

      const { error } = await supabase.from("incident_reports").insert({
        observer_id: user.id,
        incident_type: incidentType as IncidentType,
        severity,
        occurred_at: new Date(occurredAt).toISOString(),
        state: stateName,
        lga,
        ward: ward.trim() || null,
        polling_unit_name: puName.trim(),
        latitude: fix?.latitude ?? location.latitude ?? null,
        longitude: fix?.longitude ?? location.longitude ?? null,
        headline: headline.trim(),
        narrative: narrative.trim(),
        people_affected: peopleAffected.trim() === "" ? null : Number(peopleAffected),
        security_notified: securityNotified,
        inec_notified: inecNotified,
        status: "open",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Incident filed.", {
        description:
          severity === "critical"
            ? "Flagged critical — the Command Center is alerted immediately."
            : "It is in the Command Center queue for triage.",
      });

      setHeadline("");
      setNarrative("");
      setPeopleAffected("");
      setSecurityNotified(false);
      setInecNotified(false);
      setTouched(false);
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate space-y-8 p-6">
      <header>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Siren className="h-5 w-5 text-destructive" />
          Field incident report
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          For anything the Command Center needs to act on. If you have video, file the i-Witness
          clip too — this form is what makes an operator pick it up.
        </p>
      </header>

      <FormSection title="What happened" icon={AlertTriangle}>
        <Field label="Incident type" required error={err("incidentType")}>
          <div className="flex flex-wrap gap-1.5">
            {INCIDENT_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setIncidentType(option.value);
                  setSeverity(option.suggested);
                }}
                aria-pressed={incidentType === option.value}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  incidentType === option.value
                    ? "border-primary bg-primary/12 font-semibold text-primary"
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Severity"
          required
          hint="Pre-set from the incident type — override it if the situation on the ground differs."
        >
          <div className="grid gap-2 sm:grid-cols-4">
            {SEVERITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSeverity(option.value)}
                aria-pressed={severity === option.value}
                className={cn(
                  "rounded-lg border-2 p-2.5 text-left transition-colors",
                  severity === option.value
                    ? `${option.tone} bg-muted/40`
                    : "border-border hover:bg-accent/10",
                )}
              >
                <span className="block text-xs font-bold">{option.label}</span>
                <span className="block text-[10px] text-muted-foreground">{option.hint}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="One-line summary"
          required
          error={err("headline")}
          hint={`${headline.length}/160 — what an operator sees first in the queue.`}
          htmlFor="inc-headline"
        >
          <TextControl
            id="inc-headline"
            maxLength={160}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            invalid={Boolean(err("headline"))}
            placeholder="e.g. Accreditation halted 40 minutes after BVAS battery failure, no backup on site"
          />
        </Field>

        <Field
          label="What happened, in detail"
          required
          error={err("narrative")}
          hint="Times, names and ranks where you have them. Facts only — no conclusions about intent."
          htmlFor="inc-narrative"
        >
          <TextAreaControl
            id="inc-narrative"
            rows={5}
            maxLength={2000}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            invalid={Boolean(err("narrative"))}
          />
        </Field>

        <FieldGrid>
          <Field label="When did it happen?" required htmlFor="inc-when">
            <TextControl
              id="inc-when"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
            />
          </Field>

          <Field
            label="People affected"
            hint="Approximate is fine. Leave blank if not applicable."
            htmlFor="inc-people"
          >
            <TextControl
              id="inc-people"
              inputMode="numeric"
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(e.target.value.replace(/\D/g, ""))}
              placeholder="—"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection title="Where" icon={MapPinned}>
        <Field
          label="Location"
          hint="Your GPS fix is attached automatically when you submit."
          htmlFor="inc-location"
        >
          <LocationAutocomplete
            id="inc-location"
            value={location.address}
            onChange={(next) => {
              setLocation(next);
              if (next.state) setStateName(next.state);
              if (next.lga) setLga(next.lga);
            }}
            placeholder="Polling unit, street or town…"
          />
        </Field>

        <FieldGrid>
          <Field label="Polling unit" required error={err("puName")} htmlFor="inc-pu">
            <TextControl
              id="inc-pu"
              value={puName}
              onChange={(e) => setPuName(e.target.value)}
              invalid={Boolean(err("puName"))}
            />
          </Field>

          <Field label="Ward" htmlFor="inc-ward">
            <TextControl
              id="inc-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <Field label="State" required error={err("state")} htmlFor="inc-state">
            <SelectControl
              id="inc-state"
              value={stateName}
              onChange={(e) => {
                setStateName(e.target.value);
                setLga("");
              }}
              invalid={Boolean(err("state"))}
            >
              <option value="">Select a state…</option>
              {STATE_NAMES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectControl>
          </Field>

          <Field label="LGA" required error={err("lga")} htmlFor="inc-lga">
            <SelectControl
              id="inc-lga"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              disabled={lgaOptions.length === 0}
              invalid={Boolean(err("lga"))}
            >
              <option value="">
                {lgaOptions.length ? "Select an LGA…" : "Pick a state first"}
              </option>
              {lgaOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </SelectControl>
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Who else knows"
        description="Recorded so the Command Center does not duplicate an escalation."
      >
        <div className="space-y-2">
          <CheckboxRow
            label="Security personnel on site were notified"
            checked={securityNotified}
            onChange={setSecurityNotified}
          />
          <CheckboxRow
            label="The Presiding Officer or INEC official was notified"
            checked={inecNotified}
            onChange={setInecNotified}
          />
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <p className="text-[11px] text-muted-foreground">
          If you are in danger, leave first and file from safety. No report is worth an injury.
        </p>
        <Button
          type="submit"
          disabled={submitting}
          variant={severity === "critical" ? "destructive" : "default"}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Filing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> File incident
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
