import { Award, CheckCircle2, Printer, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DigitsMark } from "@/components/brand/DigitsLogo";

interface DIGEOCertificateBadgeProps {
  fullName: string;
  state: string;
  lga?: string | null;
  certificateNumber: string;
  issuedAt?: string;
  averageScore?: number | null;
  qrHash?: string;
  onClose: () => void;
}

/**
 * Printable accreditation certificate. The verification block carries the
 * certificate number and a truncated hash rather than the holder's identity, so
 * a photograph of the badge cannot leak personal data.
 */
export function DIGEOCertificateBadge({
  fullName,
  state,
  lga,
  certificateNumber,
  issuedAt,
  averageScore,
  qrHash,
  onClose,
}: DIGEOCertificateBadgeProps) {
  const issued = issuedAt ? new Date(issuedAt) : new Date();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DIGEO accreditation certificate"
      className="fixed inset-0 z-50 overflow-y-auto bg-navy-deep/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div className="print-plate mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-brand-gold/40 bg-card shadow-lifted">
        <header className="no-print flex items-center justify-between gap-3 bg-navy-panel px-5 py-3 text-white">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold">
            <Award className="h-4.5 w-4.5 text-brand-gold" />
            DIGEO accreditation certificate
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative overflow-hidden bg-linear-to-b from-primary/4 via-background to-accent/6 p-8 sm:p-12">
          {/* Watermark */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
            aria-hidden
          >
            <DigitsMark size={420} />
          </div>

          <div className="relative space-y-8">
            <div className="space-y-3 text-center">
              <DigitsMark size={64} className="mx-auto" priority />
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Federal Republic of Nigeria · Citizen observation network
              </span>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
                Certificate of Accreditation
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                DIGITs Trained Election Observer
              </p>
            </div>

            <div className="space-y-4 border-y border-primary/15 py-8 text-center">
              <p className="text-xs italic text-muted-foreground">This certifies that</p>
              <h2 className="animate-sheen bg-clip-text font-display text-2xl font-extrabold text-primary underline decoration-brand-gold decoration-2 underline-offset-8 sm:text-4xl">
                {fullName}
              </h2>
              <p className="mx-auto max-w-xl text-xs leading-relaxed sm:text-sm">
                has completed the full DIGEO curriculum — electoral law and observer rights, BVAS
                accreditation verification, result and Form EC8A arithmetic, evidence handling,
                conduct and safety, and live broadcast — and is accredited to observe elections in{" "}
                <strong>
                  {lga ? `${lga} LGA, ` : ""}
                  {state}
                </strong>
                .
              </p>

              {typeof averageScore === "number" && averageScore > 0 && (
                <Badge className="gap-1 bg-primary/15 text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  Average assessment score {averageScore}%
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Accreditation number
                </p>
                <p className="font-display text-sm font-bold">{certificateNumber}</p>
                <p className="text-[10px] font-semibold text-primary">Status: verified & active</p>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Issued</p>
                <p className="text-sm font-semibold">
                  {issued.toLocaleDateString("en-NG", { dateStyle: "long" })}
                </p>
                {qrHash && (
                  <p className="text-[10px] text-muted-foreground">
                    Verification hash <code className="font-mono">{qrHash.slice(0, 12)}</code>
                  </p>
                )}
              </div>
            </div>

            <div className="h-1.5 w-full rounded bg-flag-gradient" aria-hidden />

            <p className="text-center text-[10px] text-muted-foreground">
              Verify this certificate at digits-election-watch.vercel.app using the accreditation
              number above.
            </p>
          </div>
        </div>

        <footer className="no-print flex items-center justify-between gap-3 border-t bg-muted/40 p-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print or save as PDF
          </Button>
        </footer>
      </div>
    </div>
  );
}
