import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TrainingModule = Database["public"]["Tables"]["digeo_training_modules"]["Row"];
export type TraineeProgress = Database["public"]["Tables"]["digeo_trainee_progress"]["Row"];
export type Certificate = Database["public"]["Tables"]["digeo_certificates"]["Row"];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/**
 * Static outline used on public marketing pages so visitors can see the
 * curriculum without a database round trip. The authoritative content — full
 * module text and assessments — lives in `digeo_training_modules`.
 */
export const DIGEO_CURRICULUM_OUTLINE = [
  {
    number: 1,
    title: "The Electoral Act 2022 and your rights as an observer",
    summary:
      "What the law lets you do at a polling unit, and how to assert access without confrontation.",
    category: "Legal framework",
    minutes: 18,
  },
  {
    number: 2,
    title: "BVAS, accreditation and the zero-print check",
    summary:
      "The accreditation chain end to end, plus the checks that catch a manipulated machine.",
    category: "Technical observation",
    minutes: 22,
  },
  {
    number: 3,
    title: "Counting, Form EC8A and the IReV upload",
    summary:
      "How a polling unit result is produced, signed, posted and uploaded — and where results go missing.",
    category: "Result transparency",
    minutes: 25,
  },
  {
    number: 4,
    title: "Capturing evidence that stands up",
    summary: "Framing, timestamps, geolocation and the two-minute discipline of i-Witness clips.",
    category: "Evidence and reporting",
    minutes: 20,
  },
  {
    number: 5,
    title: "Neutrality, conduct and personal safety",
    summary:
      "Holding the line on impartiality, refusing inducement, and getting out of danger safely.",
    category: "Conduct and safety",
    minutes: 16,
  },
  {
    number: 6,
    title: "Streaming live from your polling unit",
    summary: "Consent, framing, connectivity, battery discipline and Command Center hand-off.",
    category: "Live broadcast",
    minutes: 20,
  },
] as const;

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.question === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.every((o) => typeof o === "string") &&
    typeof candidate.correctIndex === "number"
  );
}

/** `quiz_data` is untyped JSONB, so every question is validated before use. */
export function parseQuiz(module: TrainingModule): QuizQuestion[] {
  const raw: unknown = module.quiz_data;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isQuizQuestion);
}

export function parseKeyPoints(module: TrainingModule): string[] {
  const raw: unknown = module.key_points;
  return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === "string") : [];
}

export async function listModules(): Promise<TrainingModule[]> {
  const { data, error } = await supabase
    .from("digeo_training_modules")
    .select("*")
    .eq("is_published", true)
    .order("module_number");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listMyProgress(): Promise<TraineeProgress[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("digeo_trainee_progress")
    .select("*")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Records an assessment attempt. Marks the module complete only when the score
 * clears the module's pass mark; a failed attempt still increments the attempt
 * counter so coordinators can see the effort.
 */
export async function recordAttempt(input: {
  moduleId: string;
  score: number;
  passMark: number;
  answers: Record<string, number>;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to record your progress.");

  const passed = input.score >= input.passMark;

  const { data: existing } = await supabase
    .from("digeo_trainee_progress")
    .select("id, attempts, quiz_score, status")
    .eq("user_id", user.id)
    .eq("module_id", input.moduleId)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    module_id: input.moduleId,
    status: passed ? ("completed" as const) : ("in_progress" as const),
    quiz_score: Math.max(input.score, existing?.quiz_score ?? 0),
    attempts: (existing?.attempts ?? 0) + 1,
    answers: input.answers as never,
    completed_at: passed ? new Date().toISOString() : null,
  };

  const { error } = existing
    ? await supabase.from("digeo_trainee_progress").update(payload).eq("id", existing.id)
    : await supabase.from("digeo_trainee_progress").insert(payload);

  if (error) throw new Error(error.message);
  return { passed, score: input.score };
}

export async function getMyCertificate(): Promise<Certificate | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("digeo_certificates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Issues the accreditation certificate once every published module is complete.
 * Idempotent: an existing certificate is returned rather than replaced.
 */
export async function issueCertificate(input: {
  fullName: string;
  state: string;
  lga?: string | null;
  averageScore: number;
}): Promise<Certificate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to claim your certificate.");

  const existing = await getMyCertificate();
  if (existing) return existing;

  const year = new Date().getFullYear();
  const serial = Math.floor(Math.random() * 90_000) + 10_000;
  const certificateNumber = `DIGEO-${year}-${serial}`;

  // The QR payload is a verification hash, not the holder's identity.
  const hashSource = `${user.id}:${certificateNumber}:${year}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashSource));
  const qrHash = Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data, error } = await supabase
    .from("digeo_certificates")
    .insert({
      user_id: user.id,
      certificate_number: certificateNumber,
      full_name: input.fullName,
      state: input.state,
      lga: input.lga ?? null,
      average_score: Math.round(input.averageScore),
      qr_code_hash: qrHash,
      // Accreditation is reviewed each electoral cycle.
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 730).toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
