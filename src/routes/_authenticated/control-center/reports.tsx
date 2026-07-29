import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, MapPin, Eye, CheckCircle2, AlertOctagon, Filter, Share2, Video, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/control-center/reports")({
  component: ReportsManagementPage,
});

interface IWitnessItem {
  id: string;
  reporterName: string;
  nin: string;
  state: string;
  lga: string;
  address: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  description: string;
  triageCategory: "violence" | "logistics" | "vote_buying" | "peaceful" | "general";
  severityScore: number;
  isBroadcasted: boolean;
  createdAt: string;
  expiresInHours: number;
}

function ReportsManagementPage() {
  const [reports, setReports] = useState<IWitnessItem[]>([
    {
      id: "report-101",
      reporterName: "Ibrahim Suleiman",
      nin: "28374619283",
      state: "Kano",
      lga: "Kano Municipal",
      address: "PU 008, Shahuci Primary School",
      mediaType: "video",
      mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      description: "BVAS machine malfunction resolved after technical team arrival. Accreditation proceeding smoothly.",
      triageCategory: "logistics",
      severityScore: 2,
      isBroadcasted: true,
      createdAt: "10 minutes ago",
      expiresInHours: 23,
    },
    {
      id: "report-102",
      reporterName: "Nkechi Amadi",
      nin: "74628193041",
      state: "Anambra",
      lga: "Awka South",
      address: "PU 014, Amawbia Junction",
      mediaType: "video",
      mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      description: "Large voter turnout observing peaceful queue formation and security check.",
      triageCategory: "peaceful",
      severityScore: 1,
      isBroadcasted: true,
      createdAt: "25 minutes ago",
      expiresInHours: 23,
    },
    {
      id: "report-103",
      reporterName: "Oluwaseun Ajayi",
      nin: "91827364501",
      state: "Oyo",
      lga: "Ibadan North",
      address: "PU 021, Bodija Market Square",
      mediaType: "video",
      mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      description: "Late arrival of voting materials by 45 minutes. Polling officers currently setting up tables.",
      triageCategory: "logistics",
      severityScore: 3,
      isBroadcasted: false,
      createdAt: "1 hour ago",
      expiresInHours: 22,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const toggleBroadcast = (id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.isBroadcasted;
          toast.success(
            next
              ? `Report from ${r.reporterName} pushed to Public Screen!`
              : `Report from ${r.reporterName} removed from Public Screen.`
          );
          return { ...r, isBroadcasted: next };
        }
        return r;
      })
    );
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "violence":
        return <Badge variant="destructive">Violence / Security</Badge>;
      case "logistics":
        return <Badge className="bg-amber-500 text-white">Logistics / BVAS</Badge>;
      case "vote_buying":
        return <Badge className="bg-purple-600 text-white">Vote Inducement</Badge>;
      case "peaceful":
        return <Badge className="bg-emerald-600 text-white">Peaceful Observation</Badge>;
      default:
        return <Badge variant="secondary">General Incident</Badge>;
    }
  };

  const filteredReports = selectedCategory === "all"
    ? reports
    : reports.filter((r) => r.triageCategory === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div>
          <h1 className="font-display text-2xl font-bold">i-Witness Evidence Vault & Control Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review real-time video reports uploaded from election vicinities with NIN and GPS coordinates.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted p-1 rounded-lg text-xs">
          {["all", "peaceful", "logistics", "violence", "vote_buying"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="overflow-hidden border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <video src={report.mediaUrl} controls className="h-full w-full object-cover" />
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                {getCategoryBadge(report.triageCategory)}
              </div>
              <div className="absolute bottom-2 right-2 z-10 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" />
                User Visibility: {report.expiresInHours}h left
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{report.reporterName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">NIN: {report.nin}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Score: {report.severityScore}/5
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {report.description}
              </p>

              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{report.address}</span>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="border-t bg-muted/30 p-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{report.createdAt}</span>

              <Button
                size="sm"
                variant={report.isBroadcasted ? "default" : "outline"}
                onClick={() => toggleBroadcast(report.id)}
                className={`text-xs gap-1.5 ${
                  report.isBroadcasted
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-emerald-600/40 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                {report.isBroadcasted ? "Broadcasted to Screen" : "Broadcast to Screen"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
