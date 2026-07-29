import { Award, ShieldCheck, Download, CheckCircle2, X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DIGEOCertificateBadgeProps {
  fullName: string;
  state: string;
  certificateNumber: string;
  onClose: () => void;
}

export function DIGEOCertificateBadge({
  fullName,
  state,
  certificateNumber,
  onClose,
}: DIGEOCertificateBadgeProps) {
  const handlePrint = () => {
    window.print();
    toast.success("Preparing official DIGEO Observer Certificate for printing...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-card text-card-foreground shadow-2xl my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b px-6 py-3 bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span className="font-display text-sm font-bold">DIGEO Official Certification Badge</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-emerald-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Certificate Body */}
        <div className="p-8 sm:p-12 space-y-8 bg-gradient-to-b from-emerald-950/5 via-background to-amber-500/5 relative">
          {/* Certificate Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img src="/favicon.svg" alt="Watermark" className="h-96 w-96" />
          </div>

          {/* Top Crest */}
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Federal Republic of Nigeria · Election Observation Network
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              CERTIFICATE OF ACCREDITATION
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest">
              DIGITs Trained Election Observer (DIGEO)
            </p>
          </div>

          {/* Recipient Details */}
          <div className="text-center space-y-4 relative z-10 border-y py-8 border-emerald-500/20">
            <p className="text-xs text-muted-foreground italic">This certifies that</p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 underline decoration-amber-500 decoration-2 underline-offset-8">
              {fullName}
            </h2>
            <p className="text-xs sm:text-sm text-foreground max-w-xl mx-auto leading-relaxed">
              has successfully completed all mandatory training modules on electoral legal frameworks, BVAS protocol monitoring, and real-time incident reporting for <strong className="text-foreground">{state} State</strong>.
            </p>
          </div>

          {/* Footer Seals & Verification */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accreditation ID</p>
              <p className="font-mono text-xs font-bold text-foreground">{certificateNumber}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Status: VERIFIED & ACTIVE</p>
            </div>

            <div className="flex items-center gap-3 bg-muted/60 p-3 rounded-xl border">
              <div className="h-12 w-12 bg-white rounded border grid place-items-center">
                <QrCode className="h-10 w-10 text-emerald-950" />
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="font-bold text-foreground">Digital QR Verification</p>
                <p className="text-muted-foreground">Scan badge to verify authenticity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t bg-muted/40 p-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Download className="h-4 w-4" />
            Print / Save Certificate PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
