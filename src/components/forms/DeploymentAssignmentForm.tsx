import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, MapPinned, Send, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
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
import { supabase } from "@/integrations/supabase/client";
import { listUsersWithRoles } from "@/lib/roles.functions";
import { ELECTION_TYPES, lgasForState, STATE_NAMES } from "@/lib/nigeria";

/**
 * Coordinator-side form: assigns an accredited observer to a specific polling
 * unit for a specific election. Only staff can insert deployments (RLS), so this
 * form only ever renders inside the Command Center.
 */
export function DeploymentAssignmentForm({ onAssigned }: { onAssigned?: () => void }) {
  const { user, isStaff } = useViewer();
  const qc = useQueryClient();

  const observers = useQuery({
    queryKey: ["assignable-observers"],
    queryFn: listUsersWithRoles,
    enabled: isStaff,
    staleTime: 60_000,
  });

  const [observerId, setObserverId] = useState("");
  const [electionName, setElectionName] = useState<string>(ELECTION_TYPES[0]);
  const [electionDate, setElectionDate] = useState("");
  const [stateName, setStateName] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [puName, setPuName] = useState("");
  const [puCode, setPuCode] = useState("");
  const [puLocation, setPuLocation] = useState<ResolvedLocation>({ address: "" });
  const [reportingTime, setReportingTime] = useState("07:00");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const lgaOptions = useMemo(() => lgasForState(stateName), [stateName]);

  // Certified observers first — they are who deployments are meant for.
  const candidates = useMemo(() => {
    const all = observers.data ?? [];
    const digeos = all.filter((u) => u.roles.includes("digeo"));
    const others = all.filter((u) => !u.roles.includes("digeo"));
    return { digeos, others };
  }, [observers.data]);

  const ready = observerId && electionDate && stateName && lga && puName.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || saving || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("digeo_deployments").insert({
        observer_id: observerId,
        election_name: electionName,
        election_date: electionDate,
        state: stateName,
        lga,
        ward: ward.trim() || null,
        polling_unit_name: puName.trim(),
        polling_unit_code: puCode.trim() || null,
        latitude: puLocation.latitude ?? null,
        longitude: puLocation.longitude ?? null,
        reporting_time: reportingTime,
        supervisor_name: supervisorName.trim() || null,
        supervisor_phone: supervisorPhone.trim() || null,
        notes: notes.trim() || null,
        assigned_by: user.id,
        status: "assigned",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Let the observer know without waiting for them to check the app.
      await supabase.from("notifications").insert({
        user_id: observerId,
        title: `Deployment assigned: ${puName.trim()}`,
        body: `${electionName} on ${electionDate}. Report at ${reportingTime} to ${puName.trim()}, ${lga}, ${stateName}.`,
        kind: "info",
        link: "/control-center/observers",
      });

      toast.success("Deployment assigned and the observer notified.");
      setPuName("");
      setPuCode("");
      setNotes("");
      setObserverId("");
      onAssigned?.();
      qc.invalidateQueries({ queryKey: ["cc-deployments"] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate space-y-8 p-6">
      <header>
        <h2 className="font-display text-lg font-bold">Assign a deployment</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          One observer, one polling unit, one election. The observer is notified immediately and can
          accept or decline.
        </p>
      </header>

      <FormSection title="Who" icon={UserRoundCheck}>
        <Field
          label="Observer"
          required
          hint="Certified DIGEOs are listed first. Assigning an uncertified account is possible but not advised."
          htmlFor="dep-observer"
        >
          <SelectControl
            id="dep-observer"
            value={observerId}
            onChange={(e) => setObserverId(e.target.value)}
            invalid={!observerId}
          >
            <option value="">Select an observer…</option>
            {candidates.digeos.length > 0 && (
              <optgroup label="Certified DIGEO observers">
                {candidates.digeos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} — {u.lga ?? "no LGA"} ({u.email})
                  </option>
                ))}
              </optgroup>
            )}
            {candidates.others.length > 0 && (
              <optgroup label="Other accounts">
                {candidates.others.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.email})
                  </option>
                ))}
              </optgroup>
            )}
          </SelectControl>
        </Field>
      </FormSection>

      <FormSection title="Which election" icon={CalendarClock}>
        <FieldGrid>
          <Field label="Election" required htmlFor="dep-election">
            <SelectControl
              id="dep-election"
              value={electionName}
              onChange={(e) => setElectionName(e.target.value)}
            >
              {ELECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectControl>
          </Field>

          <Field label="Election date" required htmlFor="dep-date">
            <TextControl
              id="dep-date"
              type="date"
              value={electionDate}
              onChange={(e) => setElectionDate(e.target.value)}
              invalid={!electionDate}
            />
          </Field>

          <Field
            label="Reporting time"
            required
            hint="Observers should arrive before setup."
            htmlFor="dep-time"
          >
            <TextControl
              id="dep-time"
              type="time"
              value={reportingTime}
              onChange={(e) => setReportingTime(e.target.value)}
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection title="Where" icon={MapPinned}>
        <Field
          label="Polling unit location"
          hint="Sets the coordinates used for check-in verification."
          htmlFor="dep-location"
        >
          <LocationAutocomplete
            id="dep-location"
            value={puLocation.address}
            onChange={(next) => {
              setPuLocation(next);
              if (next.state) setStateName(next.state);
              if (next.lga) setLga(next.lga);
              if (!puName.trim() && next.address) setPuName(next.address.split(",")[0]);
            }}
            placeholder="Search the polling unit or its street…"
          />
        </Field>

        <FieldGrid>
          <Field label="Polling unit name" required htmlFor="dep-pu">
            <TextControl
              id="dep-pu"
              value={puName}
              onChange={(e) => setPuName(e.target.value)}
              invalid={!puName.trim()}
              placeholder="e.g. Garki Model Primary School"
            />
          </Field>

          <Field label="Polling unit code" htmlFor="dep-pu-code">
            <TextControl
              id="dep-pu-code"
              value={puCode}
              onChange={(e) => setPuCode(e.target.value)}
              placeholder="e.g. 20-05-08-012"
            />
          </Field>

          <Field label="State" required htmlFor="dep-state">
            <SelectControl
              id="dep-state"
              value={stateName}
              onChange={(e) => {
                setStateName(e.target.value);
                setLga("");
              }}
              invalid={!stateName}
            >
              <option value="">Select a state…</option>
              {STATE_NAMES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectControl>
          </Field>

          <Field label="LGA" required htmlFor="dep-lga">
            <SelectControl
              id="dep-lga"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              disabled={lgaOptions.length === 0}
              invalid={!lga}
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

          <Field label="Ward" htmlFor="dep-ward">
            <TextControl
              id="dep-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Escalation contact"
        description="Who the observer calls before they call anyone else."
      >
        <FieldGrid>
          <Field label="Supervisor name" htmlFor="dep-sup-name">
            <TextControl
              id="dep-sup-name"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
            />
          </Field>
          <Field label="Supervisor phone" htmlFor="dep-sup-phone">
            <TextControl
              id="dep-sup-phone"
              type="tel"
              value={supervisorPhone}
              onChange={(e) => setSupervisorPhone(e.target.value)}
            />
          </Field>
        </FieldGrid>

        <Field
          label="Briefing notes"
          hint="Anything specific about this unit the observer should expect."
          htmlFor="dep-notes"
        >
          <TextAreaControl
            id="dep-notes"
            rows={3}
            maxLength={800}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end border-t pt-6">
        <Button type="submit" disabled={!ready || saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Assigning…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Assign deployment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
