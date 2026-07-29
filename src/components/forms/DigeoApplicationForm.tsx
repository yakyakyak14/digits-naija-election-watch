import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  FileSignature,
  Loader2,
  MapPinned,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LocationAutocomplete,
  type ResolvedLocation,
} from "@/components/common/LocationAutocomplete";
import {
  CheckboxRow,
  Field,
  FieldGrid,
  FormSection,
  SelectControl,
  TextAreaControl,
  TextControl,
} from "./FormPrimitives";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { lgasForState, NIGERIAN_LANGUAGES, STATE_NAMES } from "@/lib/nigeria";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["digeo_applications"]["Row"];

const EDUCATION = [
  "Secondary school",
  "Technical / vocational",
  "National Diploma (ND)",
  "Higher National Diploma (HND)",
  "Bachelor's degree",
  "Postgraduate",
  "Other",
];

const AVAILABILITY: { value: Application["availability"]; label: string; hint: string }[] = [
  { value: "full_day", label: "Full election day", hint: "Setup through result declaration" },
  { value: "morning", label: "Morning only", hint: "Setup and accreditation" },
  { value: "afternoon", label: "Afternoon only", hint: "Voting through counting" },
  { value: "collation_only", label: "Collation centre", hint: "Result collation and declaration" },
];

const STATUS_COPY: Record<string, { label: string; tone: string; body: string }> = {
  submitted: {
    label: "Submitted",
    tone: "bg-muted text-muted-foreground",
    body: "An observer coordinator has your application in the queue. You can keep training while it is reviewed.",
  },
  under_review: {
    label: "Under review",
    tone: "bg-accent/20 text-accent-foreground dark:text-accent",
    body: "A coordinator is checking your details. You may be contacted on the phone number you gave.",
  },
  approved: {
    label: "Approved",
    tone: "bg-primary/15 text-primary",
    body: "You are accredited as a DIGEO. Deployments for upcoming elections will appear in your Command Center.",
  },
  rejected: {
    label: "Not approved",
    tone: "bg-destructive/15 text-destructive",
    body: "This application was not approved. The reason is below; you may apply again once it is addressed.",
  },
};

/**
 * DIGEO enrolment application. This is the form that turns a Viewer into a
 * candidate observer: identity, locality, eligibility, availability, and the
 * three declarations accreditation depends on.
 *
 * The database rejects a non-draft submission unless all three declarations are
 * accepted, so the UI and the data cannot drift apart.
 */
export function DigeoApplicationForm() {
  const { user, profile, displayName } = useViewer();
  const qc = useQueryClient();

  const existing = useQuery({
    queryKey: ["my-digeo-application", user?.id],
    queryFn: async (): Promise<Application | null> => {
      const { data, error } = await supabase
        .from("digeo_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(user?.id),
  });

  const [fullName, setFullName] = useState("");
  const [nin, setNin] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Application["gender"] | "">("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stateName, setStateName] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [preferredPu, setPreferredPu] = useState("");
  const [residence, setResidence] = useState<ResolvedLocation>({ address: "" });
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [hasSmartphone, setHasSmartphone] = useState(true);
  const [hasPrior, setHasPrior] = useState(false);
  const [priorDetail, setPriorDetail] = useState("");
  const [partyAffiliated, setPartyAffiliated] = useState(false);
  const [partyDetail, setPartyDetail] = useState("");
  const [availability, setAvailability] = useState<Application["availability"] | "">("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [acceptCode, setAcceptCode] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [declareNonPartisan, setDeclareNonPartisan] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Prefill from the profile so nobody retypes what DIGITs already knows.
  useEffect(() => {
    if (!profile && !user) return;
    setFullName((v) => v || profile?.display_name || displayName);
    setNin((v) => v || profile?.nin || "");
    setPhone((v) => v || profile?.phone || "");
    setEmail((v) => v || user?.email || "");
    setStateName((v) => v || profile?.state || "");
    setLga((v) => v || profile?.lga || "");
    setWard((v) => v || profile?.ward || "");
    setPreferredPu((v) => v || profile?.polling_unit || "");
    setResidence((v) => (v.address ? v : { address: profile?.address ?? "" }));
    setSignature((v) => v || profile?.display_name || displayName);
  }, [profile, user, displayName]);

  const lgaOptions = useMemo(() => lgasForState(stateName), [stateName]);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Required.";
    if (!/^[0-9]{11}$/.test(nin)) next.nin = "A NIN is exactly 11 digits.";
    if (!dob) next.dob = "Required.";
    else {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) next.dob = "Observers must be 18 or older.";
      if (age > 100) next.dob = "Check this date.";
    }
    if (!gender) next.gender = "Required.";
    if (!/^[0-9+\s()-]{7,20}$/.test(phone)) next.phone = "Enter a reachable phone number.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email.";
    if (!stateName) next.state = "Required.";
    if (!lga) next.lga = "Required.";
    if (!residence.address.trim()) next.residence = "Required.";
    if (!education) next.education = "Required.";
    if (languages.length === 0) next.languages = "Pick at least one.";
    if (!availability) next.availability = "Required.";
    if (!emergencyName.trim()) next.emergencyName = "Required.";
    if (!/^[0-9+\s()-]{7,20}$/.test(emergencyPhone))
      next.emergencyPhone = "Enter a reachable phone number.";
    if (partyAffiliated && !partyDetail.trim()) next.partyDetail = "Describe the affiliation.";
    if (hasPrior && !priorDetail.trim()) next.priorDetail = "Tell us where and when.";
    if (!acceptCode) next.acceptCode = "You must accept the code of conduct.";
    if (!acceptData) next.acceptData = "You must accept the data policy.";
    if (!declareNonPartisan) next.declareNonPartisan = "This declaration is required.";
    if (signature.trim().length < 3) next.signature = "Type your full name to sign.";
    return next;
  }, [
    fullName,
    nin,
    dob,
    gender,
    phone,
    email,
    stateName,
    lga,
    residence.address,
    education,
    languages,
    availability,
    emergencyName,
    emergencyPhone,
    partyAffiliated,
    partyDetail,
    hasPrior,
    priorDetail,
    acceptCode,
    acceptData,
    declareNonPartisan,
    signature,
  ]);

  const isValid = Object.keys(errors).length === 0;

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
      const { error } = await supabase.from("digeo_applications").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        nin,
        date_of_birth: dob,
        gender: gender as Application["gender"],
        phone: phone.trim(),
        email: email.trim(),
        state: stateName,
        lga,
        ward: ward.trim() || null,
        preferred_polling_unit: preferredPu.trim() || null,
        residential_address: residence.address.trim(),
        latitude: residence.latitude ?? null,
        longitude: residence.longitude ?? null,
        highest_education: education,
        occupation: occupation.trim() || null,
        languages,
        has_smartphone: hasSmartphone,
        has_prior_observation: hasPrior,
        prior_observation_detail: hasPrior ? priorDetail.trim() : null,
        is_party_affiliated: partyAffiliated,
        party_affiliation_detail: partyAffiliated ? partyDetail.trim() : null,
        availability: availability as Application["availability"],
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        motivation: motivation.trim() || null,
        accepted_code_of_conduct: acceptCode,
        accepted_data_policy: acceptData,
        declared_non_partisan: declareNonPartisan,
        signature_name: signature.trim(),
        status: "submitted",
      });

      if (error) {
        toast.error(
          error.message.includes("digeo_applications_active_per_user")
            ? "You already have an application in progress."
            : error.message,
        );
        return;
      }

      // Mirror the identity fields onto the profile so reporting unlocks too.
      await supabase
        .from("profiles")
        .update({ nin, display_name: fullName.trim(), phone: phone.trim(), state: stateName, lga })
        .eq("id", user.id);

      toast.success("Application submitted.", {
        description: "A coordinator will review it. You can start the training modules right away.",
      });
      await existing.refetch();
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } finally {
      setSubmitting(false);
    }
  }

  function toggleLanguage(language: string) {
    setLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language],
    );
  }

  // Already applied — show the status instead of a second form.
  if (existing.data && existing.data.status !== "draft") {
    const copy = STATUS_COPY[existing.data.status] ?? STATUS_COPY.submitted;
    return (
      <div className="plate space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <BadgeCheck className="h-5 w-5 text-primary" />
            Your DIGEO application
          </h2>
          <Badge className={copy.tone}>{copy.label}</Badge>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>

        {existing.data.review_note && (
          <p className="rounded-lg border bg-muted/40 p-3 text-xs">
            <span className="font-semibold">Coordinator note: </span>
            {existing.data.review_note}
          </p>
        )}

        <dl className="grid gap-3 border-t pt-4 text-xs sm:grid-cols-2">
          {[
            ["Applicant", existing.data.full_name],
            ["Locality", `${existing.data.lga}, ${existing.data.state}`],
            ["Availability", existing.data.availability.replace(/_/g, " ")],
            [
              "Submitted",
              new Date(existing.data.created_at).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              }),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-semibold capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  const err = (key: string) => (touched ? errors[key] : undefined);

  return (
    <form onSubmit={submit} className="plate space-y-8 p-6">
      <header>
        <h2 className="font-display text-lg font-bold">DIGEO accreditation application</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Everything a coordinator needs to assign you a polling unit and reach you on election day.
          Roughly five minutes, and details already on your profile are filled in for you.
        </p>
      </header>

      <FormSection
        title="Who you are"
        icon={UserRound}
        description="Must match your national identity record."
      >
        <FieldGrid>
          <Field label="Full name" required error={err("fullName")} htmlFor="app-name">
            <TextControl
              id="app-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              invalid={Boolean(err("fullName"))}
              autoComplete="name"
            />
          </Field>

          <Field
            label="National Identity Number"
            required
            error={err("nin")}
            hint="11 digits. Stored privately."
            htmlFor="app-nin"
          >
            <TextControl
              id="app-nin"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              invalid={Boolean(err("nin"))}
            />
          </Field>

          <Field
            label="Date of birth"
            required
            error={err("dob")}
            hint="Observers must be 18 or older."
            htmlFor="app-dob"
          >
            <TextControl
              id="app-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              invalid={Boolean(err("dob"))}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>

          <Field label="Gender" required error={err("gender")} htmlFor="app-gender">
            <SelectControl
              id="app-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Application["gender"])}
              invalid={Boolean(err("gender"))}
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </SelectControl>
          </Field>

          <Field label="Phone" required error={err("phone")} htmlFor="app-phone">
            <TextControl
              id="app-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              invalid={Boolean(err("phone"))}
              autoComplete="tel"
            />
          </Field>

          <Field label="Email" required error={err("email")} htmlFor="app-email">
            <TextControl
              id="app-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(err("email"))}
              autoComplete="email"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Where you can observe"
        icon={MapPinned}
        description="Deployments are assigned close to where you live."
      >
        <Field label="Residential address" required error={err("residence")} htmlFor="app-address">
          <LocationAutocomplete
            id="app-address"
            value={residence.address}
            onChange={(next) => {
              setResidence(next);
              if (next.state) setStateName(next.state);
              if (next.lga) setLga(next.lga);
            }}
            placeholder="Street, town, LGA…"
          />
        </Field>

        <FieldGrid>
          <Field label="State" required error={err("state")} htmlFor="app-state">
            <SelectControl
              id="app-state"
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

          <Field label="LGA" required error={err("lga")} htmlFor="app-lga">
            <SelectControl
              id="app-lga"
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

          <Field label="Ward" htmlFor="app-ward">
            <TextControl
              id="app-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <Field
            label="Preferred polling unit"
            hint="We try to honour this, but coverage comes first."
            htmlFor="app-pu"
          >
            <TextControl
              id="app-pu"
              value={preferredPu}
              onChange={(e) => setPreferredPu(e.target.value)}
              placeholder="e.g. PU 012, Giginyu Primary School"
            />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection title="Eligibility and capacity" icon={ShieldCheck}>
        <FieldGrid>
          <Field
            label="Highest education"
            required
            error={err("education")}
            htmlFor="app-education"
          >
            <SelectControl
              id="app-education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              invalid={Boolean(err("education"))}
            >
              <option value="">Select…</option>
              {EDUCATION.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectControl>
          </Field>

          <Field label="Occupation" htmlFor="app-occupation">
            <TextControl
              id="app-occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </FieldGrid>

        <Field
          label="Languages you can observe in"
          required
          error={err("languages")}
          hint="Helps us place you where you can actually communicate."
        >
          <div className="flex flex-wrap gap-1.5">
            {NIGERIAN_LANGUAGES.map((language) => {
              const active = languages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full border border-primary bg-primary/12 px-3 py-1 text-[11px] font-semibold text-primary"
                      : "rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  }
                >
                  {language}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="space-y-2">
          <CheckboxRow
            label="I have a smartphone that can record video"
            description="Streaming and evidence capture both need one."
            checked={hasSmartphone}
            onChange={setHasSmartphone}
          />

          <CheckboxRow
            label="I have observed an election before"
            checked={hasPrior}
            onChange={setHasPrior}
          />
          {hasPrior && (
            <Field label="Where and when?" required error={err("priorDetail")} htmlFor="app-prior">
              <TextControl
                id="app-prior"
                value={priorDetail}
                onChange={(e) => setPriorDetail(e.target.value)}
                placeholder="e.g. 2023 Governorship, Ikeja LGA, with YIAGA Africa"
                invalid={Boolean(err("priorDetail"))}
              />
            </Field>
          )}

          <CheckboxRow
            label="I hold membership, office or a campaign role in a political party"
            description="Declare it. An undeclared affiliation discovered later ends the accreditation."
            checked={partyAffiliated}
            onChange={setPartyAffiliated}
          />
          {partyAffiliated && (
            <Field
              label="Describe the affiliation"
              required
              error={err("partyDetail")}
              htmlFor="app-party"
            >
              <TextControl
                id="app-party"
                value={partyDetail}
                onChange={(e) => setPartyDetail(e.target.value)}
                invalid={Boolean(err("partyDetail"))}
              />
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection title="Availability and safety" icon={CalendarClock}>
        <Field label="When can you observe?" required error={err("availability")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {AVAILABILITY.map((option) => (
              <label
                key={option.value}
                className={
                  availability === option.value
                    ? "flex cursor-pointer items-start gap-2 rounded-lg border border-primary bg-primary/8 p-2.5"
                    : "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors hover:border-primary/40 hover:bg-accent/10"
                }
              >
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={availability === option.value}
                  onChange={() => setAvailability(option.value)}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-xs font-semibold">{option.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <FieldGrid>
          <Field
            label="Emergency contact name"
            required
            error={err("emergencyName")}
            htmlFor="app-ec-name"
          >
            <TextControl
              id="app-ec-name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              invalid={Boolean(err("emergencyName"))}
            />
          </Field>

          <Field
            label="Emergency contact phone"
            required
            error={err("emergencyPhone")}
            htmlFor="app-ec-phone"
          >
            <TextControl
              id="app-ec-phone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              invalid={Boolean(err("emergencyPhone"))}
            />
          </Field>
        </FieldGrid>

        <Field
          label="Why do you want to observe?"
          hint="Optional. A few sentences is plenty."
          htmlFor="app-motivation"
        >
          <TextAreaControl
            id="app-motivation"
            rows={3}
            maxLength={600}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Declarations"
        icon={FileSignature}
        description="All three are required. The database will not accept the application without them."
      >
        <div className="space-y-2">
          <CheckboxRow
            required
            label="I accept the DIGEO code of conduct"
            description="No party colours or slogans, no comment on outcomes, no inducements, no interference with officials or voters, no handling of election materials."
            checked={acceptCode}
            onChange={setAcceptCode}
          />
          <CheckboxRow
            required
            label="I accept the data and evidence policy"
            description="My NIN is held privately and used to attribute my reports. Evidence I capture is retained in the DIGITs vault and may be published once verified."
            checked={acceptData}
            onChange={setAcceptData}
          />
          <CheckboxRow
            required
            label="I declare that I will observe without partisanship"
            description="I will not campaign, predict, endorse or celebrate any candidate or party while accredited."
            checked={declareNonPartisan}
            onChange={setDeclareNonPartisan}
          />
        </div>

        {touched && (errors.acceptCode || errors.acceptData || errors.declareNonPartisan) && (
          <p className="text-[11px] font-medium text-destructive">
            All three declarations are required.
          </p>
        )}

        <Field
          label="Sign by typing your full name"
          required
          error={err("signature")}
          hint="This is your electronic signature on the declarations above."
          htmlFor="app-signature"
        >
          <TextControl
            id="app-signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            invalid={Boolean(err("signature"))}
            className="font-display"
          />
        </Field>
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <p className="text-[11px] text-muted-foreground">
          You can begin the training modules immediately — accreditation and training run in
          parallel.
        </p>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit application
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
