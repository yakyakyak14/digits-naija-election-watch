import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Certificate = Database["public"]["Tables"]["digeo_certificates"]["Row"];

export interface WelcomePreview {
  subject: string;
  html: string;
  to: string;
  certificate: string;
}

interface FunctionFailure {
  error: string;
  detail?: string;
  configured?: boolean;
}

/**
 * Calls the `send-digeo-welcome` Edge Function.
 *
 * The function holds the mail provider key, so the browser can never send mail
 * directly. A 503 with `configured: false` means no provider is set up yet — that
 * is surfaced to the operator verbatim rather than swallowed, because "nothing
 * was sent" is the one outcome they must not be wrong about.
 */
async function callWelcome(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<WelcomePreview & FunctionFailure>(
    "send-digeo-welcome",
    { body },
  );

  // supabase-js surfaces non-2xx as an error; read the body for the real reason.
  if (error) {
    let detail = error.message;
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === "function") {
      const parsed = (await response.json().catch(() => null)) as FunctionFailure | null;
      if (parsed?.error) detail = parsed.detail ? `${parsed.error} ${parsed.detail}` : parsed.error;
    }
    throw new Error(detail);
  }

  if (data && "error" in data && data.error) {
    throw new Error(data.detail ? `${data.error} ${data.detail}` : data.error);
  }

  return data;
}

/** Renders the welcome email without sending it. */
export async function previewWelcomeEmail(userId: string): Promise<WelcomePreview> {
  const data = await callWelcome({ action: "preview", userId });
  if (!data?.html) throw new Error("The preview came back empty.");
  return data;
}

/** Sends the welcome email and certificate to an accredited observer. */
export async function sendWelcomeEmail(userId: string) {
  return callWelcome({ action: "send", userId });
}

/** Certificates keyed by holder, for the observer roster. */
export async function listCertificates(): Promise<Map<string, Certificate>> {
  const { data, error } = await supabase.from("digeo_certificates").select("*");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((c) => [c.user_id, c]));
}

export type ModuleScore = {
  moduleNumber: number;
  title: string;
  status: string;
  score: number | null;
  attempts: number;
  completedAt: string | null;
};

/**
 * Per-module assessment results for every trainee, so a coordinator can see how
 * an accreditation was earned rather than just that it was.
 */
export async function listAssessmentResults(): Promise<Map<string, ModuleScore[]>> {
  const [{ data: modules, error: moduleError }, { data: progress, error: progressError }] =
    await Promise.all([
      supabase
        .from("digeo_training_modules")
        .select("id, module_number, title")
        .eq("is_published", true)
        .order("module_number"),
      supabase
        .from("digeo_trainee_progress")
        .select("user_id, module_id, status, quiz_score, attempts, completed_at"),
    ]);

  if (moduleError) throw new Error(moduleError.message);
  if (progressError) throw new Error(progressError.message);

  const moduleById = new Map((modules ?? []).map((m) => [m.id, m]));
  const byUser = new Map<string, ModuleScore[]>();

  for (const row of progress ?? []) {
    const module = moduleById.get(row.module_id);
    if (!module) continue;

    const list = byUser.get(row.user_id) ?? [];
    list.push({
      moduleNumber: module.module_number,
      title: module.title,
      status: row.status,
      score: row.quiz_score,
      attempts: row.attempts ?? 0,
      completedAt: row.completed_at,
    });
    byUser.set(row.user_id, list);
  }

  for (const list of byUser.values()) list.sort((a, b) => a.moduleNumber - b.moduleNumber);
  return byUser;
}
