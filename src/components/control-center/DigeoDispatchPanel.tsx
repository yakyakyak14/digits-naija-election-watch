import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Eye, Loader2, Mail, Send, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/control-center/PageHeader";
import { DIGEOCertificateBadge } from "@/components/training/DIGEOCertificateBadge";
import { useViewer } from "@/hooks/useViewer";
import {
  listCertificates,
  previewWelcomeEmail,
  sendWelcomeEmail,
  type Certificate,
} from "@/lib/digeo";
import { listUsersWithRoles, type PlatformUser } from "@/lib/roles.functions";

/**
 * Accreditation dispatch: who is accredited, their certificate, and the welcome
 * email. This is where an Admin views a certificate and triggers the send —
 * the browser never talks to the mail provider directly, it calls the
 * `send-digeo-welcome` Edge Function which holds the key.
 */
export function DigeoDispatchPanel() {
  const { isAdmin, roles } = useViewer();
  const canDispatch = isAdmin || roles.includes("observer_coordinator");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState<Certificate | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string; to: string } | null>(
    null,
  );

  const users = useQuery({
    queryKey: ["cc-users"],
    queryFn: listUsersWithRoles,
    enabled: canDispatch,
  });
  const certificates = useQuery({
    queryKey: ["cc-certificates"],
    queryFn: listCertificates,
    enabled: canDispatch,
  });

  if (!canDispatch) return null;

  const observers = (users.data ?? []).filter((u) => u.roles.includes("digeo"));

  async function onPreview(user: PlatformUser) {
    setBusyId(user.id);
    try {
      const result = await previewWelcomeEmail(user.id);
      setPreview(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not render the preview.");
    } finally {
      setBusyId(null);
    }
  }

  async function onSend(user: PlatformUser) {
    setBusyId(user.id);
    try {
      await sendWelcomeEmail(user.id);
      toast.success(`Welcome email and certificate sent to ${user.email}.`);
    } catch (err) {
      // The provider-missing case is the common one and needs to be unmistakable.
      toast.error(err instanceof Error ? err.message : "Send failed.", { duration: 12000 });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="plate overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <Award className="h-4.5 w-4.5 text-primary" />
            Accreditation &amp; welcome dispatch
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            View any observer's certificate, preview their welcome email, and send it with their
            election-day kit and platform links. Sends are recorded in the audit trail.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {observers.length} accredited
        </Badge>
      </header>

      {users.isLoading || certificates.isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading observers…</p>
      ) : observers.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No accredited observers yet"
          body="Approve a DIGEO application to accredit an observer, then dispatch their welcome pack from here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-semibold">Observer</th>
                <th className="p-3 font-semibold">Certificate</th>
                <th className="p-3 font-semibold">Locality</th>
                <th className="p-3 text-right font-semibold">Welcome pack</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {observers.map((user) => {
                const certificate = certificates.data?.get(user.id);
                const busy = busyId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-muted/25">
                    <td className="p-3">
                      <span className="text-xs font-semibold">{user.display_name}</span>
                      <span className="block text-[11px] text-muted-foreground">{user.email}</span>
                    </td>

                    <td className="p-3">
                      {certificate ? (
                        <button
                          type="button"
                          onClick={() => setShowCertificate(certificate)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          {certificate.certificate_number}
                        </button>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <TriangleAlert className="h-2.5 w-2.5" />
                          Not issued
                        </Badge>
                      )}
                    </td>

                    <td className="p-3 text-xs text-muted-foreground">
                      {[user.lga, user.state].filter(Boolean).join(", ") || "—"}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || !certificate}
                          onClick={() => void onPreview(user)}
                          className="gap-1.5"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy || !certificate}
                          onClick={() => void onSend(user)}
                          className="gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Certificate viewer — the same component the holder prints. */}
      {showCertificate && (
        <DIGEOCertificateBadge
          fullName={showCertificate.full_name}
          state={showCertificate.state}
          lga={showCertificate.lga}
          certificateNumber={showCertificate.certificate_number}
          issuedAt={showCertificate.issued_at}
          averageScore={showCertificate.average_score}
          qrHash={showCertificate.qr_code_hash}
          onClose={() => setShowCertificate(null)}
        />
      )}

      {/* Email preview — rendered by the same code path that sends. */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Welcome email preview"
          className="fixed inset-0 z-50 overflow-y-auto bg-navy-deep/85 p-3 backdrop-blur-md sm:p-6"
        >
          <div className="mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-lifted">
            <header className="flex items-start justify-between gap-3 border-b bg-muted/40 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold">{preview.subject}</p>
                <p className="truncate text-[11px] text-muted-foreground">To: {preview.to}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Sandboxed: the preview is email HTML, not part of this app. */}
            <iframe
              title="Welcome email preview"
              sandbox=""
              srcDoc={preview.html}
              className="h-[70vh] w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </section>
  );
}
