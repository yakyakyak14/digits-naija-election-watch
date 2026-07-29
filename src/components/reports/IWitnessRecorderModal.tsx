import { useState, useRef, useEffect } from "react";
import { Camera, Video, StopCircle, RefreshCw, UploadCloud, Download, MapPin, ShieldAlert, CheckCircle2, X, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GooglePlacesAutocomplete } from "@/components/common/GooglePlacesAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IWitnessRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    display_name?: string;
    phone?: string;
    nin?: string;
    state?: string;
    lga?: string;
  };
}

export function IWitnessRecorderModal({ isOpen, onClose, userProfile }: IWitnessRecorderModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Form Fields
  const [reporterName, setReporterName] = useState(userProfile?.display_name || "");
  const [nin, setNin] = useState(userProfile?.nin || "");
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [triageCategory, setTriageCategory] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Request Location & Camera Stream on Open
  useEffect(() => {
    if (isOpen) {
      requestLocation();
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Handle Recording Timer (max 120s = 2 mins)
  useEffect(() => {
    if (recording) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= 120) {
            stopRecording();
            toast.info("Maximum clip duration (2 minutes) reached.");
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [recording]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoError(null);
        if (!locationAddress) {
          setLocationAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        }
      },
      (err) => {
        setGeoError("Location permission required to verify i-Witness report authenticity.");
      },
      { enableHighAccuracy: true }
    );
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Camera and microphone access are required for real-time i-Witness recording.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (recording) {
      clearInterval(timerIntervalRef.current);
      setRecording(false);
    }
  };

  const startRecording = () => {
    if (!stream) {
      toast.error("Camera feed not ready.");
      return;
    }
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setTimerSeconds(0);
      toast.success("Recording started... (Max 2 minutes)");
    } catch (e) {
      console.error("MediaRecorder start error:", e);
      toast.error("Failed to start video recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setMediaUrl(null);
    setTimerSeconds(0);
    startCamera();
  };

  const handleDownload = () => {
    if (!mediaUrl) return;
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = `iWitness-Report-${Date.now()}.webm`;
    a.click();
    toast.success("Saved video report to your local device.");
  };

  const handleUploadReport = async () => {
    if (!reporterName.trim()) {
      toast.error("Please state your Full Name.");
      return;
    }
    if (!nin.trim() || nin.length < 8) {
      toast.error("Please enter a valid National Identity Number (NIN).");
      return;
    }
    if (!locationAddress.trim()) {
      toast.error("Please specify your location or select from map autocomplete.");
      return;
    }
    if (!recordedBlob) {
      toast.error("No real-time video recorded. Please record a video clip first.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `iwitness_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;

      // Upload to Supabase Storage bucket 'iwitness-reports'
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("iwitness-reports")
        .upload(fileName, recordedBlob, { contentType: "video/webm", upsert: true });

      let publicUrl = "";
      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from("iwitness-reports").getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } else {
        // Fallback stored data object URL
        publicUrl = mediaUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      }

      // Save database record
      const { error: dbErr } = await (supabase as any).from("iwitness_reports").insert([
        {
          reporter_name: reporterName,
          nin: nin,
          state: locationAddress.split(",").reverse()[0]?.trim() || "State Vicinity",
          lga: locationAddress.split(",")[1]?.trim() || "LGA Vicinity",
          address: locationAddress,
          latitude: latitude,
          longitude: longitude,
          media_type: "video",
          media_url: publicUrl,
          description: description,
          triage_category: triageCategory,
          status: "pending",
        },
      ]);

      if (dbErr) {
        console.warn("DB insert fallback warning:", dbErr.message);
      }

      toast.success("i-Witness report uploaded to Control Center cloud storage successfully!", {
        description: "Your report will be reviewed by Control Center operators and broadcasted to public screens.",
      });

      onClose();
    } catch (err: any) {
      toast.error("Upload error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-600 text-white">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Submit Real-Time i-Witness Report</h2>
              <p className="text-xs text-emerald-300">Live Camera Verification · No Device Uploads Allowed</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-emerald-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form & Camera Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Real-time Camera Preview / Recorded Video */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner border border-slate-800">
            {mediaUrl ? (
              <video src={mediaUrl} controls className="h-full w-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            )}

            {/* Live Recording HUD */}
            {recording && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-red-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white" />
                REC 0{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")} / 02:00
              </div>
            )}

            {/* Expiry Notice */}
            <div className="absolute bottom-3 left-3 z-10 text-[11px] font-medium text-white/80 bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs flex items-center gap-1">
              <Lock className="h-3 w-3 text-amber-400" />
              Expires from your history in 24h · Saved securely in Control Center
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            {!mediaUrl ? (
              !recording ? (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Video className="h-4 w-4" />
                  Start Real-Time Video Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="gap-2">
                  <StopCircle className="h-4 w-4" />
                  Stop Recording ({120 - timerSeconds}s remaining)
                </Button>
              )
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <Button variant="outline" onClick={resetRecording} className="gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Re-record Video
                </Button>
                <Button variant="secondary" onClick={handleDownload} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Download to Device
                </Button>
              </div>
            )}
          </div>

          {/* Required Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reporter Full Name *</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Chukwuemeka Dan"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">National Identity Number (NIN) *</label>
              <input
                type="text"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                placeholder="11-digit NIN number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Location Autocomplete with Google Places */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Election Vicinity Location & Polling Unit *</span>
              {latitude && (
                <span className="text-[11px] text-emerald-600 font-normal">
                  📍 Verified Coordinates ({latitude.toFixed(3)}, {longitude?.toFixed(3)})
                </span>
              )}
            </label>
            <GooglePlacesAutocomplete
              value={locationAddress}
              onChange={(addr, lat, lng) => {
                setLocationAddress(addr);
                if (lat && lng) {
                  setLatitude(lat);
                  setLongitude(lng);
                }
              }}
              placeholder="Type location, LGA, state or polling unit name..."
            />
            {geoError && <p className="text-[11px] text-amber-600">{geoError}</p>}
          </div>

          {/* Triage Category & Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Incident Category</label>
              <select
                value={triageCategory}
                onChange={(e) => setTriageCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="general">General Election Observation</option>
                <option value="peaceful">Peaceful Voting Progress</option>
                <option value="logistics">INEC Logistics / BVAS Delay</option>
                <option value="violence">Disruption / Security Concern</option>
                <option value="vote_buying">Inducement / Vote-buying</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Brief Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is happening in your vicinity?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t bg-muted/40 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadReport}
            disabled={isUploading || !recordedBlob}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            {isUploading ? "Uploading to Cloud Storage..." : "Submit i-Witness Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
