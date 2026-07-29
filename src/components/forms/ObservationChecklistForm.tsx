import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Accessibility,
  Calculator,
  ClipboardCheck,
  Loader2,
  MapPinned,
  Send,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGrid,
  FormSection,
  SelectControl,
  TextAreaControl,
  TextControl,
  TriToggle,
} from "./FormPrimitives";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { ELECTION_TYPES, lgasForState, STATE_NAMES } from "@/lib/nigeria";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Checklist = Database["public"]["Tables"]["observation_checklists"]["Row"];
type Phase = Checklist["phase"];

const PHASES: { value: Phase; label: string; hint: string }[] = [
  { value: "setup", label: "Setup & opening", hint: "Before the first voter" },
  { value: "accreditation", label: "Accreditation", hint: "BVAS and the queue" },
  { value: "voting", label: "Voting", hint: "Conduct in the booth" },
  { value: "counting", label: "Counting & EC8A", hint: "Sorting, tally, result sheet" },
  { value: "collation", label: "Collation", hint: "Ward or LGA collation centre" },
];

const RATINGS: { value: NonNullable<Checklist["overall_rating"]>; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "critical", label: "Critical" },
];

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

/**
 * Polling-unit observation checklist, one submission per phase.
 *
 * The result block runs the three arithmetic checks an observer is trained to
 * apply — accreditation ≤ registration, votes ≤ accreditation, valid + rejected
 * = total — and blocks submission when they fail. The same two bounds are also
 * CHECK constraints on the table, so a bad row cannot arrive by any other route.
 */
export function ObservationChecklistForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, profile } = useViewer();

  const deployments = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digeo_deployments")
        .select(
          "id, election_name, state, lga, ward, polling_unit_name, polling_unit_code, election_date",
        )
        .order("election_date", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: Boolean(user?.id),
  });

  const [phase, setPhase] = useState<Phase>("setup");
  const [deploymentId, setDeploymentId] = useState("");
  const [electionName, setElectionName] = useState<string>(ELECTION_TYPES[0]);
  const [stateName, setStateName] = useState(profile?.state ?? "");
  const [lga, setLga] = useState(profile?.lga ?? "");
  const [ward, setWard] = useState(profile?.ward ?? "");
  const [puName, setPuName] = useState(profile?.polling_unit ?? "");
  const [puCode, setPuCode] = useState("");

  const [openedOnTime, setOpenedOnTime] = useState<boolean | null>(null);
  const [actualOpenTime, setActualOpenTime] = useState("");
  const [bvasPresent, setBvasPresent] = useState<boolean | null>(null);
  const [zeroPrint, setZeroPrint] = useState<boolean | null>(null);
  const [materialsComplete, setMaterialsComplete] = useState<boolean | null>(null);
  const [securityPresent, setSecurityPresent] = useState<boolean | null>(null);
  const [officials, setOfficials] = useState("");
  const [agents, setAgents] = useState("");

  const [pwdAccess, setPwdAccess] = useState<boolean | null>(null);
  const [secretBallot, setSecretBallot] = useState<boolean | null>(null);
  const [queueOrderly, setQueueOrderly] = useState<boolean | null>(null);

  const [registered, setRegistered] = useState("");
  const [accredited, setAccredited] = useState("");
  const [valid, setValid] = useState("");
  const [rejected, setRejected] = useState("");
  const [totalCast, setTotalCast] = useState("");
  const [ec8aSigned, setEc8aSigned] = useState<boolean | null>(null);
  const [irevUploaded, setIrevUploaded] = useState<boolean | null>(null);
  const [postedPublicly, setPostedPublicly] = useState<boolean | null>(null);

  const [irregularities, setIrregularities] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rating, setRating] = useState<NonNullable<Checklist["overall_rating"]> | "">("");
  const [submitting, setSubmitting] = useState(false);

  const showResults = phase === "counting" || phase === "collation";
  const showSetup = phase === "setup" || phase === "accreditation";
  const lgaOptions = useMemo(() => lgasForState(stateName), [stateName]);

  const arithmetic = useMemo(() => {
    const r = numberOrNull(registered);
    const a = numberOrNull(accredited);
    const v = numberOrNull(valid);
    const x = numberOrNull(rejected);
    const t = numberOrNull(totalCast);
    const problems: string[] = [];

    if (r !== null && a !== null && a > r) {
      problems.push(`Accredited (${a}) exceeds registered voters (${r}).`);
    }
    if (a !== null && t !== null && t > a) {
      problems.push(`Votes cast (${t}) exceeds accredited voters (${a}).`);
    }
    if (v !== null && x !== null && t !== null && v + x !== t) {
      problems.push(
        `Valid (${v}) + rejected (${x}) = ${v + x}, but total cast is recorded as ${t}.`,
      );
    }
    return problems;
  }, [registered, accredited, valid, rejected, totalCast]);

  const missingCore = !stateName || !lga || !puName.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    if (missingCore) {
      toast.error("State, LGA and polling unit are required.");
      return;
    }
    if (arithmetic.length > 0) {
      toast.error("Fix the result arithmetic before submitting.", { description: arithmetic[0] });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("observation_checklists").insert({
        observer_id: user.id,
        deployment_id: deploymentId || null,
        phase,
        election_name: electionName,
        state: stateName,
        lga,
        ward: ward.trim() || null,
        polling_unit_name: puName.trim(),
        polling_unit_code: puCode.trim() || null,
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        opened_on_time: openedOnTime,
        actual_open_time: actualOpenTime || null,
        bvas_present: bvasPresent,
        bvas_zero_print_verified: zeroPrint,
        materials_complete: materialsComplete,
        inec_officials_count: numberOrNull(officials),
        security_present: securityPresent,
        party_agents_count: numberOrNull(agents),
        accessible_to_pwd: pwdAccess,
        secret_ballot_respected: secretBallot,
        voter_queue_orderly: queueOrderly,
        registered_voters: numberOrNull(registered),
        accredited_voters: numberOrNull(accredited),
        valid_votes: numberOrNull(valid),
        rejected_votes: numberOrNull(rejected),
        total_votes_cast: numberOrNull(totalCast),
        ec8a_signed_by_agents: ec8aSigned,
        results_uploaded_to_irev: irevUploaded,
        results_posted_publicly: postedPublicly,
        irregularities: irregularities.trim() || null,
        observer_remarks: remarks.trim() || null,
        overall_rating: rating || null,
        status: "submitted",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`${PHASES.find((p) => p.value === phase)?.label} checklist submitted.`);
      setIrregularities("");
      setRemarks("");
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate space-y-8 p-6">
      <header>
        <h2 className="font-display text-lg font-bold">Polling unit observation checklist</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          File one checklist per phase as the day progresses. "Not observed" is a valid answer —
          guessing is not.
        </p>
      </header>

      {/* Phase */}
      <div>
        <p className="mb-2 text-xs font-semibold">Which phase are you reporting on?</p>
        <div className="flex flex-wrap gap-2">
          {PHASES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPhase(option.value)}
              aria-pressed={phase === option.value}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                phase === option.value
                  ? "border-primary bg-primary/8"
                  : "hover:border-primary/40 hover:bg-accent/10",
              )}
            >
              <span className="block text-xs font-semibold">{option.label}</span>
              <span className="block text-[10px] text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <FormSection title="Where and what" icon={MapPinned}>
        {(deployments.data?.length ?? 0) > 0 && (
          <Field
            label="Link to a deployment"
            hint="Selecting one fills in the location from your assignment."
            htmlFor="cl-deployment"
          >
            <SelectControl
              id="cl-deployment"
              value={deploymentId}
              onChange={(e) => {
                const id = e.target.value;
                setDeploymentId(id);
                const match = deployments.data?.find((d) => d.id === id);
                if (match) {
                  setElectionName(match.election_name);
                  setStateName(match.state);
                  setLga(match.lga);
                  setWard(match.ward ?? "");
                  setPuName(match.polling_unit_name);
                  setPuCode(match.polling_unit_code ?? "");
                }
              }}
            >
              <option value="">Not linked to a deployment</option>
              {deployments.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.election_name} — {d.polling_unit_name} ({d.lga})
                </option>
              ))}
            </SelectControl>
          </Field>
        )}

        <FieldGrid>
          <Field label="Election" required htmlFor="cl-election">
            <SelectControl
              id="cl-election"
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

          <Field label="Polling unit name" required htmlFor="cl-pu">
            <TextControl
              id="cl-pu"
              value={puName}
              onChange={(e) => setPuName(e.target.value)}
              invalid={!puName.trim()}
              placeholder="e.g. Giginyu Primary School"
            />
          </Field>

          <Field label="State" required htmlFor="cl-state">
            <SelectControl
              id="cl-state"
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

          <Field label="LGA" required htmlFor="cl-lga">
            <SelectControl
              id="cl-lga"
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

          <Field label="Ward" htmlFor="cl-ward">
            <TextControl
              id="cl-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <Field
            label="Polling unit code"
            hint="From the INEC register, if visible."
            htmlFor="cl-pu-code"
          >
            <TextControl
              id="cl-pu-code"
              value={puCode}
              onChange={(e) => setPuCode(e.target.value)}
              placeholder="e.g. 20-05-08-012"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      {showSetup && (
        <FormSection title="Setup, materials and BVAS" icon={ClipboardCheck}>
          <div className="space-y-2">
            <TriToggle
              label="Polling unit opened on time"
              value={openedOnTime}
              onChange={setOpenedOnTime}
            />
            <TriToggle
              label="BVAS device present and working"
              value={bvasPresent}
              onChange={setBvasPresent}
            />
            <TriToggle
              label="Zero-print certificate verified before accreditation"
              hint="The machine must show zero accredited voters before the first voter."
              value={zeroPrint}
              onChange={setZeroPrint}
            />
            <TriToggle
              label="All voting materials present and complete"
              value={materialsComplete}
              onChange={setMaterialsComplete}
            />
            <TriToggle
              label="Security personnel present"
              value={securityPresent}
              onChange={setSecurityPresent}
            />
          </div>

          <FieldGrid cols={3}>
            <Field label="Actual opening time" htmlFor="cl-open-time">
              <TextControl
                id="cl-open-time"
                type="time"
                value={actualOpenTime}
                onChange={(e) => setActualOpenTime(e.target.value)}
              />
            </Field>
            <Field label="INEC officials present" htmlFor="cl-officials">
              <TextControl
                id="cl-officials"
                inputMode="numeric"
                value={officials}
                onChange={(e) => setOfficials(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
              />
            </Field>
            <Field label="Party agents present" htmlFor="cl-agents">
              <TextControl
                id="cl-agents"
                inputMode="numeric"
                value={agents}
                onChange={(e) => setAgents(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
              />
            </Field>
          </FieldGrid>
        </FormSection>
      )}

      <FormSection title="Access and conduct" icon={Accessibility}>
        <div className="space-y-2">
          <TriToggle
            label="Accessible to voters with disabilities"
            hint="Ramp or level access, priority handling, assistive provisions."
            value={pwdAccess}
            onChange={setPwdAccess}
          />
          <TriToggle
            label="Ballot secrecy respected"
            hint="Nobody could see how an identifiable voter voted."
            value={secretBallot}
            onChange={setSecretBallot}
          />
          <TriToggle
            label="Voter queue orderly and unobstructed"
            value={queueOrderly}
            onChange={setQueueOrderly}
          />
        </div>
      </FormSection>

      {showResults && (
        <FormSection
          title="Result figures"
          icon={Calculator}
          description="Record the figures as written on the sheet — not your impression of them."
        >
          <FieldGrid cols={3}>
            {[
              {
                label: "Registered voters",
                value: registered,
                set: setRegistered,
                id: "cl-registered",
              },
              {
                label: "Accredited voters",
                value: accredited,
                set: setAccredited,
                id: "cl-accredited",
              },
              { label: "Total votes cast", value: totalCast, set: setTotalCast, id: "cl-total" },
              { label: "Valid votes", value: valid, set: setValid, id: "cl-valid" },
              { label: "Rejected ballots", value: rejected, set: setRejected, id: "cl-rejected" },
            ].map((entry) => (
              <Field key={entry.id} label={entry.label} htmlFor={entry.id}>
                <TextControl
                  id={entry.id}
                  inputMode="numeric"
                  value={entry.value}
                  onChange={(e) => entry.set(e.target.value.replace(/\D/g, ""))}
                  placeholder="—"
                />
              </Field>
            ))}
          </FieldGrid>

          {arithmetic.length > 0 && (
            <div className="rounded-lg border border-destructive/35 bg-destructive/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                <Calculator className="h-3.5 w-3.5" />
                Arithmetic check failed
              </p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-destructive">
                {arithmetic.map((problem) => (
                  <li key={problem}>· {problem}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                If the sheet really says this, that itself is the finding — record the figures in
                the irregularities box below and leave these fields blank.
              </p>
            </div>
          )}

          {arithmetic.length === 0 && totalCast && valid && rejected && (
            <Badge className="gap-1 bg-primary/15 text-primary">
              <Calculator className="h-3 w-3" />
              Arithmetic consistent
            </Badge>
          )}

          <div className="space-y-2">
            <TriToggle
              label="Form EC8A signed by all party agents present"
              value={ec8aSigned}
              onChange={setEc8aSigned}
            />
            <TriToggle
              label="Result uploaded to IReV from the polling unit"
              value={irevUploaded}
              onChange={setIrevUploaded}
            />
            <TriToggle
              label="Result posted publicly at the polling unit"
              value={postedPublicly}
              onChange={setPostedPublicly}
            />
          </div>
        </FormSection>
      )}

      <FormSection title="What you saw" icon={Vote}>
        <Field
          label="Irregularities"
          hint="Facts and times. Leave blank if there were none."
          htmlFor="cl-irregularities"
        >
          <TextAreaControl
            id="cl-irregularities"
            rows={3}
            maxLength={1200}
            value={irregularities}
            onChange={(e) => setIrregularities(e.target.value)}
            placeholder="e.g. 09:40 — accreditation paused 25 minutes when the BVAS battery failed; no backup available."
          />
        </Field>

        <Field label="Observer remarks" htmlFor="cl-remarks">
          <TextAreaControl
            id="cl-remarks"
            rows={2}
            maxLength={800}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Anything a coordinator should know that the fields above don't capture."
          />
        </Field>

        <Field label="Overall rating for this phase" htmlFor="cl-rating">
          <SelectControl
            id="cl-rating"
            value={rating}
            onChange={(e) => setRating(e.target.value as NonNullable<Checklist["overall_rating"]>)}
          >
            <option value="">No rating</option>
            {RATINGS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectControl>
        </Field>
      </FormSection>

      <div className="flex items-center justify-end border-t pt-6">
        <Button
          type="submit"
          disabled={submitting || missingCore || arithmetic.length > 0}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit checklist
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
