import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  CircleStop,
  Clock,
  Download,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  SwitchCamera,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LocationAutocomplete,
  type ResolvedLocation,
} from "@/components/common/LocationAutocomplete";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useViewer } from "@/hooks/useViewer";
import { inferStateAndLga, lgasForState, STATE_NAMES } from "@/lib/nigeria";
import {
  MAX_CLIP_SECONDS,
  saveClipToDevice,
  submitIWitnessReport,
  TRIAGE_OPTIONS,
  type CapturedClip,
  type TriageCategory,
} from "@/lib/iwitness";
import { cn } from "@/lib/utils";

type Stage = "gate" | "capture" | "details";

function pickVideoMime() {
  const candidates = [
    "video/mp4;codecs=avc1,mp4a",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return "video/webm";
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "video/webm";
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Real-time i-Witness capture.
 *
 * Deliberate constraints, all of them enforced here rather than advertised:
 *  - Capture happens from the live camera only. There is no file input, so a clip
 *    from the gallery cannot enter the evidence chain.
 *  - Clips are hard-stopped at two minutes by the recorder itself.
 *  - Location permission is requested when the reporter opens the recorder, not
 *    on page load, and a fix is required before the form unlocks.
 *  - A verified NIN on the profile is required; it is never typed here.
 */
export function IWitnessRecorder({
  onClose,
  onFiled,
}: {
  onClose: () => void;
  onFiled?: () => void;
}) {
  const { isSignedIn, profile, displayName, hasNin, loading: viewerLoading } = useViewer();
  const geo = useGeolocation();

  const [stage, setStage] = useState<Stage>("gate");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [streamReady, setStreamReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clips, setClips] = useState<CapturedClip[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [location, setLocation] = useState<ResolvedLocation>({ address: "" });
  const [stateName, setStateName] = useState(profile?.state ?? "");
  const [lga, setLga] = useState(profile?.lga ?? "");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TriageCategory>("general");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipsRef = useRef<CapturedClip[]>([]);

  clipsRef.current = clips;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamReady(false);
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      stopCamera();
      setCameraError(null);
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        streamRef.current = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          await videoRef.current.play().catch(() => undefined);
        }
        setStreamReady(true);
      } catch (err) {
        setCameraError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera and microphone access were blocked. Allow them in your browser settings to file a report."
            : "No camera available on this device.",
        );
      }
    },
    [stopCamera],
  );

  // Release camera, timers and object URLs when the recorder closes.
  useEffect(() => {
    return () => {
      stopCamera();
      if (tickRef.current) clearInterval(tickRef.current);
      clipsRef.current.forEach((c) => URL.revokeObjectURL(c.objectUrl));
    };
  }, [stopCamera]);

  useEffect(() => {
    if (stage === "capture") void startCamera(facingMode);
  }, [stage, facingMode, startCamera]);

  // Seed the location fields from the profile, and from the GPS fix once granted.
  useEffect(() => {
    if (profile?.state && !stateName) setStateName(profile.state);
    if (profile?.lga && !lga) setLga(profile.lga);
  }, [profile?.state, profile?.lga, stateName, lga]);

  async function openRecorder() {
    const fix = await geo.request();
    if (!fix) return;
    setStage("capture");
  }

  function startRecording() {
    const media = streamRef.current;
    if (!media) {
      toast.error("Camera is not ready yet.");
      return;
    }

    chunksRef.current = [];
    const mimeType = pickVideoMime();

    try {
      const recorder = new MediaRecorder(media, { mimeType, videoBitsPerSecond: 2_500_000 });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const track = media.getVideoTracks()[0]?.getSettings();
        setClips((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            kind: "video",
            blob,
            mimeType,
            objectUrl: URL.createObjectURL(blob),
            durationSeconds: Math.min(MAX_CLIP_SECONDS, elapsed),
            width: track?.width,
            height: track?.height,
            capturedAt: new Date().toISOString(),
            latitude: geo.fix?.latitude,
            longitude: geo.fix?.longitude,
            accuracy: geo.fix?.accuracy,
          },
        ]);
        setElapsed(0);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);

      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_CLIP_SECONDS) {
            stopRecording();
            toast.info("Two-minute limit reached — clip saved. Record another if you need to.");
            return MAX_CLIP_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch {
      toast.error("This browser cannot record video. Try Chrome or Safari.");
    }
  }

  function stopRecording() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const media = streamRef.current;
    if (!video || !media) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) {
      toast.error("Could not capture the photo.");
      return;
    }

    setClips((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind: "image",
        blob,
        mimeType: "image/jpeg",
        objectUrl: URL.createObjectURL(blob),
        width,
        height,
        capturedAt: new Date().toISOString(),
        latitude: geo.fix?.latitude,
        longitude: geo.fix?.longitude,
        accuracy: geo.fix?.accuracy,
      },
    ]);
    toast.success("Photo captured.");
  }

  function removeClip(id: string) {
    setClips((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) URL.revokeObjectURL(target.objectUrl);
      return prev.filter((c) => c.id !== id);
    });
  }

  function applyLocation(next: ResolvedLocation) {
    setLocation(next);
    const inferred = next.state ? next : { ...next, ...inferStateAndLga(next.address) };
    if (inferred.state) setStateName(inferred.state);
    if (inferred.lga) setLga(inferred.lga);
  }

  const lgaOptions = useMemo(() => lgasForState(stateName), [stateName]);

  const readyToFile =
    clips.length > 0 &&
    Boolean(location.address.trim()) &&
    Boolean(stateName) &&
    Boolean(lga) &&
    geo.hasFix &&
    hasNin;

  async function fileReport() {
    if (!readyToFile || submitting) return;
    setSubmitting(true);
    try {
      await submitIWitnessReport({
        clips,
        reporterName: displayName,
        nin: profile!.nin!,
        address: location.address.trim(),
        state: stateName,
        lga,
        ward: ward.trim() || undefined,
        pollingUnit: pollingUnit.trim() || undefined,
        description: description.trim(),
        triageCategory: category,
        latitude: geo.fix?.latitude ?? location.latitude,
        longitude: geo.fix?.longitude ?? location.longitude,
        accuracy: geo.fix?.accuracy,
      });

      toast.success("Report delivered to the Command Center.", {
        description:
          "Operators review it now. It leaves your history after 24 hours — save a copy if you need one.",
      });
      clips.forEach((c) => URL.revokeObjectURL(c.objectUrl));
      setClips([]);
      onFiled?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not file the report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="File an i-Witness report"
      className="fixed inset-0 z-50 overflow-y-auto bg-navy-deep/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div className="mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-lifted">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 bg-navy-panel px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Camera className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">File an i-Witness report</h2>
              <p className="text-[11px] text-white/65">
                Live capture only · max {MAX_CLIP_SECONDS / 60} minutes per clip · no gallery
                uploads
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Gate */}
        {stage === "gate" && (
          <div className="space-y-4 p-5">
            {!viewerLoading && !isSignedIn && (
              <Gate
                icon={Lock}
                title="Sign in to file a report"
                body="Watching is open to everyone. Filing evidence needs an account so every report carries a verified identity."
                action={
                  <Button asChild>
                    <Link to="/auth">Sign in or create an account</Link>
                  </Button>
                }
              />
            )}

            {isSignedIn && !hasNin && (
              <Gate
                icon={ShieldCheck}
                title="Add your NIN first"
                body="Reports are tied to a verified identity. Add your 11-digit National Identity Number to your profile once — you will never type it again."
                action={
                  <Button asChild>
                    <Link to="/account">Open profile settings</Link>
                  </Button>
                }
              />
            )}

            {isSignedIn && hasNin && (
              <>
                <Gate
                  icon={MapPin}
                  title="Turn on location to continue"
                  body="An i-Witness report is a claim about a place. DIGITs stamps your coordinates onto the evidence, so location must be on and accessible before the camera opens."
                  action={
                    <Button
                      onClick={() => void openRecorder()}
                      disabled={geo.status === "prompting"}
                    >
                      {geo.status === "prompting" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for permission…
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" /> Allow location & open camera
                        </>
                      )}
                    </Button>
                  }
                />

                {geo.status === "denied" && (
                  <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Location permission was denied. Enable it for this site in your browser
                    settings, then try again.
                  </p>
                )}
                {(geo.status === "unavailable" || geo.status === "timeout") && (
                  <p className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Could not get a location fix. Move outdoors or closer to a window and try again.
                  </p>
                )}

                <ul className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
                  <li>
                    · Every clip is recorded live — you cannot attach a file from your device.
                  </li>
                  <li>· Clips stop automatically at two minutes. Record several if you need to.</li>
                  <li>
                    · Save a copy to your device at capture time; in-app history clears after 24
                    hours.
                  </li>
                  <li>· Never film how an identifiable person voted.</li>
                </ul>
              </>
            )}
          </div>
        )}

        {/* Capture */}
        {stage === "capture" && (
          <div className="space-y-4 p-5">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {recording && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-live/90 px-2.5 py-1 text-[11px] font-bold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  REC {formatClock(elapsed)} / {formatClock(MAX_CLIP_SECONDS)}
                </div>
              )}

              {geo.fix && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                  <MapPin className="h-3 w-3 text-emerald-400" />±{Math.round(geo.fix.accuracy)}m
                </div>
              )}

              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] text-white/85 backdrop-blur-sm">
                  <Clock className="h-3 w-3 text-brand-gold" />
                  Leaves your history in 24h · retained in the evidence vault
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((f) => (f === "environment" ? "user" : "environment"))
                  }
                  disabled={recording}
                  aria-label="Switch camera"
                  className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/85 disabled:opacity-40"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              </div>

              {recording && (
                <div
                  className="absolute inset-x-0 bottom-0 h-1 bg-live transition-[width] duration-1000 ease-linear"
                  style={{ width: `${(elapsed / MAX_CLIP_SECONDS) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={elapsed}
                  aria-valuemax={MAX_CLIP_SECONDS}
                  aria-label="Clip length"
                />
              )}
            </div>

            {cameraError && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {cameraError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {!recording ? (
                <Button
                  onClick={startRecording}
                  disabled={!streamReady}
                  className="gap-2 bg-live hover:bg-live/90 text-white"
                >
                  <Video className="h-4 w-4" />
                  Record clip
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="gap-2">
                  <CircleStop className="h-4 w-4" />
                  Stop ({formatClock(MAX_CLIP_SECONDS - elapsed)} left)
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => void capturePhoto()}
                disabled={!streamReady || recording}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Take photo
              </Button>

              <Button
                variant="ghost"
                onClick={() => void startCamera(facingMode)}
                disabled={recording}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Restart camera
              </Button>
            </div>

            {clips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold">
                  Captured evidence <span className="text-muted-foreground">({clips.length})</span>
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {clips.map((clip) => (
                    <li
                      key={clip.id}
                      className="group relative overflow-hidden rounded-lg border bg-black"
                    >
                      {clip.kind === "video" ? (
                        <video
                          src={clip.objectUrl}
                          controls
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <img
                          src={clip.objectUrl}
                          alt="Captured still"
                          className="aspect-video w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-x-1 top-1 flex items-center justify-between gap-1">
                        <Badge className="bg-black/70 text-[9px] text-white">
                          {clip.kind === "video" ? `${clip.durationSeconds ?? 0}s` : "Photo"}
                        </Badge>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => saveClipToDevice(clip, displayName)}
                            title="Save to device"
                            aria-label="Save to device"
                            className="grid h-6 w-6 place-items-center rounded bg-black/70 text-white hover:bg-black"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeClip(clip.id)}
                            title="Discard"
                            aria-label="Discard clip"
                            className="grid h-6 w-6 place-items-center rounded bg-black/70 text-white hover:bg-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between gap-2 border-t pt-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStage("details")} disabled={clips.length === 0}>
                Add details
              </Button>
            </div>
          </div>
        )}

        {/* Details */}
        {stage === "details" && (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Filing as <strong>{displayName}</strong> · NIN ending{" "}
                <strong>{profile?.nin?.slice(-4)}</strong> · {clips.length}{" "}
                {clips.length === 1 ? "clip" : "clips"} attached
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="iw-location" className="text-xs font-semibold">
                Where is this happening? <span className="text-destructive">*</span>
              </label>
              <LocationAutocomplete
                id="iw-location"
                value={location.address}
                onChange={applyLocation}
                placeholder="Polling unit, street, town or LGA…"
                aria-describedby="iw-location-hint"
              />
              <p id="iw-location-hint" className="text-[11px] text-muted-foreground">
                {geo.fix
                  ? `GPS locked at ${geo.fix.latitude.toFixed(5)}, ${geo.fix.longitude.toFixed(5)} (±${Math.round(geo.fix.accuracy)}m).`
                  : "Waiting for a GPS fix…"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="iw-state" className="text-xs font-semibold">
                  State <span className="text-destructive">*</span>
                </label>
                <select
                  id="iw-state"
                  value={stateName}
                  onChange={(e) => {
                    setStateName(e.target.value);
                    setLga("");
                  }}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                >
                  <option value="">Select a state…</option>
                  {STATE_NAMES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="iw-lga" className="text-xs font-semibold">
                  LGA <span className="text-destructive">*</span>
                </label>
                <select
                  id="iw-lga"
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  disabled={lgaOptions.length === 0}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                >
                  <option value="">
                    {lgaOptions.length ? "Select an LGA…" : "Pick a state first"}
                  </option>
                  {lgaOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="iw-ward" className="text-xs font-semibold">
                  Ward
                </label>
                <input
                  id="iw-ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Optional"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="iw-pu" className="text-xs font-semibold">
                  Polling unit
                </label>
                <input
                  id="iw-pu"
                  value={pollingUnit}
                  onChange={(e) => setPollingUnit(e.target.value)}
                  placeholder="e.g. PU 012, Giginyu Primary School"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold">What are we looking at?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRIAGE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-left transition-colors",
                      category === option.value
                        ? "border-primary bg-primary/8"
                        : "hover:border-primary/40 hover:bg-accent/10",
                    )}
                  >
                    <input
                      type="radio"
                      name="triage"
                      value={option.value}
                      checked={category === option.value}
                      onChange={() => setCategory(option.value)}
                      className="mt-0.5 accent-[var(--primary)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{option.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="iw-desc" className="text-xs font-semibold">
                What is happening? Describe it plainly.
              </label>
              <textarea
                id="iw-desc"
                rows={3}
                maxLength={800}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Facts only: what you saw, when, and who was involved. Do not edit the clip — describe conditions here instead."
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              />
              <p className="text-right text-[10px] text-muted-foreground">
                {description.length}/800
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              <Button variant="ghost" onClick={() => setStage("capture")}>
                Back to camera
              </Button>
              <Button
                onClick={() => void fileReport()}
                disabled={!readyToFile || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading evidence…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" /> Send to Command Center
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Gate({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Lock;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-muted/40 p-5 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-display text-sm font-bold">{title}</h3>
      <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">{body}</p>
      <div className="flex justify-center pt-1">{action}</div>
    </div>
  );
}
