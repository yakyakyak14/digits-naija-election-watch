import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveVideoGrid, ObserverStream } from "@/components/video/LiveVideoGrid";
import { Radio, ShieldCheck, CheckCircle2, XCircle, Settings2, Share2, MonitorUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/control-center/live")({
  component: LiveControlCenterPage,
});

function LiveControlCenterPage() {
  const [streamList, setStreamList] = useState<ObserverStream[]>([
    {
      id: "stream-1",
      observerName: "Amina Bello (DIGEO #042)",
      state: "Kano",
      lga: "Nasarawa",
      pollingUnit: "PU 012 - Giginyu Primary School",
      title: "Voter Accreditation & Queue Monitoring",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      isApproved: true,
      tileSlot: 1,
      viewers: 1420,
      status: "live",
    },
    {
      id: "stream-2",
      observerName: "Chidi Okonkwo (DIGEO #108)",
      state: "Enugu",
      lga: "Enugu North",
      pollingUnit: "PU 004 - Independence Layout",
      title: "INEC BVAS Result Sheet Upload Observation",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      isApproved: true,
      tileSlot: 2,
      viewers: 980,
      status: "live",
    },
    {
      id: "stream-3",
      observerName: "Babatunde Adeleke (DIGEO #215)",
      state: "Lagos",
      lga: "Ikeja",
      pollingUnit: "PU 018 - Allen Avenue Secretariat",
      title: "Ballot Counting & Agent Signature Verification",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      isApproved: true,
      tileSlot: 3,
      viewers: 2310,
      status: "live",
    },
    {
      id: "stream-4",
      observerName: "Fatima Yusuf (DIGEO #077)",
      state: "Kaduna",
      lga: "Kaduna North",
      pollingUnit: "PU 009 - Unguwan Rimi Market",
      title: "Peaceful Sorting of Presidential Ballots",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      isApproved: true,
      tileSlot: 4,
      viewers: 860,
      status: "live",
    },
    {
      id: "stream-5",
      observerName: "Emeka Nwosu (DIGEO #319)",
      state: "Rivers",
      lga: "Port Harcourt",
      pollingUnit: "PU 022 - GRA Phase 2 Center",
      title: "Collation Center Security & Transparency Check",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoykit.mp4",
      isApproved: true,
      tileSlot: 5,
      viewers: 1750,
      status: "live",
    },
    {
      id: "stream-6",
      observerName: "Grace Danjuma (DIGEO #154)",
      state: "FCT Abuja",
      lga: "Abuja Municipal (AMAC)",
      pollingUnit: "PU 001 - Garki Model Primary School",
      title: "Public Result Declaration Announcement",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      isApproved: true,
      tileSlot: 6,
      viewers: 3100,
      status: "live",
    },
  ]);

  const handleToggleApprove = (streamId: string) => {
    setStreamList((prev) =>
      prev.map((s) => {
        if (s.id === streamId) {
          const nextState = !s.isApproved;
          toast.success(
            nextState
              ? `Approved stream from ${s.observerName} for public broadcast`
              : `Removed ${s.observerName} stream from public broadcast`
          );
          return { ...s, isApproved: nextState };
        }
        return s;
      })
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Control Center Broadcast Operator</h1>
            <Badge className="bg-emerald-600 text-white font-semibold">LiveKit Connected</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Select, approve, and route real-time DIGEO observer video feeds to the public 1–6 split screen grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.open("/live", "_blank")}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MonitorUp className="h-4 w-4" />
            Open Public Viewer Page
          </Button>
        </div>
      </div>

      {/* Live Video Control Grid */}
      <LiveVideoGrid
        streams={streamList}
        initialTileCount={6}
        isAdminControl={true}
        onToggleApprove={handleToggleApprove}
      />

      {/* Stream Routing Management Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-emerald-600" />
            Observer Stream Approval Matrix
          </h2>
          <span className="text-xs text-muted-foreground">
            {streamList.filter((s) => s.isApproved).length} of {streamList.length} streams approved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="p-3">Observer Details</th>
                <th className="p-3">Location & PU</th>
                <th className="p-3">Stream Title</th>
                <th className="p-3">Viewers</th>
                <th className="p-3">Broadcast Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {streamList.map((stream) => (
                <tr key={stream.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{stream.observerName}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{stream.state}</span> ({stream.lga}) — {stream.pollingUnit}
                  </td>
                  <td className="p-3 text-xs font-medium">{stream.title}</td>
                  <td className="p-3 text-xs font-semibold">{stream.viewers.toLocaleString()}</td>
                  <td className="p-3">
                    {stream.isApproved ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Approved for Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 gap-1">
                        <XCircle className="h-3 w-3 text-amber-600" />
                        Pending Approval
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant={stream.isApproved ? "outline" : "default"}
                      onClick={() => handleToggleApprove(stream.id)}
                      className={!stream.isApproved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                    >
                      {stream.isApproved ? "Unapprove" : "Approve Broadcast"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
