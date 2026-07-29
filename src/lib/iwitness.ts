import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type IWitnessReport = Database["public"]["Tables"]["iwitness_reports"]["Row"];
export type TriageCategory = NonNullable<IWitnessReport["triage_category"]>;

export const MAX_CLIP_SECONDS = 120;
export const EVIDENCE_BUCKET = "iwitness-media";

export const TRIAGE_OPTIONS: { value: TriageCategory; label: string; hint: string }[] = [
  {
    value: "peaceful",
    label: "Peaceful voting",
    hint: "Orderly accreditation, voting or counting",
  },
  {
    value: "logistics",
    label: "Logistics or BVAS",
    hint: "Late materials, machine failure, long delays",
  },
  {
    value: "vote_buying",
    label: "Inducement",
    hint: "Cash, gifts or pressure around the polling unit",
  },
  {
    value: "violence",
    label: "Violence or intimidation",
    hint: "Disruption, threats, unsafe conditions",
  },
  {
    value: "ballot_snatching",
    label: "Ballot interference",
    hint: "Boxes, papers or results tampered with",
  },
  { value: "general", label: "General observation", hint: "Anything else worth putting on record" },
];

export interface CapturedClip {
  id: string;
  kind: "video" | "image";
  blob: Blob;
  mimeType: string;
  objectUrl: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

/**
 * SHA-256 of the captured bytes, stored alongside the object so any later
 * alteration of the evidence is detectable.
 */
export async function hashBlob(blob: Blob): Promise<string | undefined> {
  try {
    if (!crypto?.subtle) return undefined;
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

/**
 * MediaRecorder reports types like `video/mp4;codecs=avc1,mp4a`, but the storage
 * bucket's allowed_mime_types list holds bare types — the parameterised string
 * is rejected. Strip the codec parameters before upload.
 */
function baseMimeType(mimeType: string) {
  return mimeType.split(";")[0].trim() || "application/octet-stream";
}

export interface SubmitReportInput {
  clips: CapturedClip[];
  reporterName: string;
  nin: string;
  address: string;
  state: string;
  lga: string;
  ward?: string;
  pollingUnit?: string;
  description: string;
  triageCategory: TriageCategory;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

/**
 * Uploads every captured clip to the private evidence bucket, then writes the
 * report and its media rows.
 *
 * Storage layout is `<uid>/<reportId>/<n>.<ext>`, which is what the storage RLS
 * policy keys on: a reporter can only ever write inside their own folder, and
 * only Command Center staff can read someone else's.
 */
export async function submitIWitnessReport(input: SubmitReportInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to file an i-Witness report.");
  if (input.clips.length === 0) throw new Error("Record at least one clip or photo first.");

  const primary = input.clips[0];
  const reportId = crypto.randomUUID();
  const basePath = `${user.id}/${reportId}`;

  const uploaded: Array<{
    clip: CapturedClip;
    path: string;
    hash?: string;
  }> = [];

  for (const [index, clip] of input.clips.entries()) {
    const path = `${basePath}/${index}-${clip.kind}.${extensionFor(clip.mimeType)}`;
    const { error: uploadError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(path, clip.blob, { contentType: baseMimeType(clip.mimeType), upsert: false });

    if (uploadError) {
      throw new Error(`Upload failed on clip ${index + 1}: ${uploadError.message}`);
    }
    uploaded.push({ clip, path, hash: await hashBlob(clip.blob) });
  }

  const { data: report, error: reportError } = await supabase
    .from("iwitness_reports")
    .insert({
      id: reportId,
      user_id: user.id,
      reporter_name: input.reporterName,
      nin: input.nin,
      state: input.state,
      lga: input.lga,
      ward: input.ward ?? null,
      polling_unit: input.pollingUnit ?? null,
      address: input.address,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      accuracy_meters: input.accuracy ?? null,
      media_type: primary.kind,
      storage_path: uploaded[0].path,
      duration_seconds: primary.durationSeconds ?? null,
      description: input.description || null,
      triage_category: input.triageCategory,
      severity_score: severityFor(input.triageCategory),
      sha256_hash: uploaded[0].hash ?? null,
      captured_at: primary.capturedAt,
      is_realtime_capture: true,
      status: "pending",
      device_info: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        clips: input.clips.length,
        platform: typeof navigator !== "undefined" ? navigator.platform : null,
      } as never,
    })
    .select("id, created_at, expires_from_user_at")
    .single();

  if (reportError) throw new Error(reportError.message);

  const mediaRows = uploaded.map(({ clip, path, hash }, index) => ({
    report_id: reportId,
    user_id: user.id,
    media_type: clip.kind,
    storage_path: path,
    mime_type: baseMimeType(clip.mimeType),
    byte_size: clip.blob.size,
    duration_seconds: clip.durationSeconds ?? null,
    width: clip.width ?? null,
    height: clip.height ?? null,
    sha256_hash: hash ?? null,
    sort_order: index,
  }));

  const { error: mediaError } = await supabase.from("iwitness_media").insert(mediaRows);
  if (mediaError) {
    // The report row is already in the Command Center queue; surface the partial
    // failure rather than pretending everything landed.
    throw new Error(`Report filed, but media index failed: ${mediaError.message}`);
  }

  return report;
}

function severityFor(category: TriageCategory): number {
  switch (category) {
    case "violence":
      return 5;
    case "ballot_snatching":
      return 5;
    case "vote_buying":
      return 4;
    case "logistics":
      return 3;
    case "general":
      return 2;
    default:
      return 1;
  }
}

/** Short-lived signed URL for private evidence — the only way media is served. */
export async function signedEvidenceUrl(storagePath: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

/** The reporter's own 24-hour history. The view drops rows past the window. */
export async function listMyRecentReports() {
  const { data, error } = await supabase
    .from("my_iwitness_history")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Saves a captured clip to the reporter's own device. */
export function saveClipToDevice(clip: CapturedClip, reporterName: string) {
  const stamp = new Date(clip.capturedAt).toISOString().replace(/[:.]/g, "-");
  const safeName = reporterName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "reporter";
  const link = document.createElement("a");
  link.href = clip.objectUrl;
  link.download = `digits-iwitness-${safeName}-${stamp}.${extensionFor(clip.mimeType)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
