import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Restricted } from "@/components/control-center/PageHeader";
import { useViewer } from "@/hooks/useViewer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

export const Route = createFileRoute("/_authenticated/control-center/audit")({
  component: AuditPage,
});

/** Colour by consequence: publications and role grants matter most. */
function actionTone(action: string) {
  if (action.startsWith("role.")) return "bg-destructive/15 text-destructive";
  if (action.includes("publish") || action.includes("approve")) return "bg-primary/15 text-primary";
  if (action.includes("flag") || action.includes("reject") || action.includes("escalated"))
    return "bg-accent/20 text-accent-foreground dark:text-accent";
  return "bg-muted text-muted-foreground";
}

function AuditPage() {
  const { isStaff } = useViewer();

  const log = useQuery({
    queryKey: ["cc-audit"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isStaff,
  });

  if (!isStaff) return <Restricted need="a Command Center role" />;

  const rows = log.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Audit trail"
        description="Every consequential action — role grants, feed approvals, evidence publications, incident decisions — with the operator who made it. Append-only: entries cannot be edited or removed from the interface."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => void log.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", log.isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {log.isLoading && <p className="text-sm text-muted-foreground">Loading the trail…</p>}

      {!log.isLoading && rows.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title="Nothing recorded yet"
          body="Approvals, publications and role changes are written here as they happen."
        />
      )}

      {rows.length > 0 && (
        <div className="plate overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">When</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Entity</th>
                  <th className="p-3 font-semibold">Actor</th>
                  <th className="p-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/25">
                    <td className="whitespace-nowrap p-3 text-[11px] text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="p-3">
                      <Badge className={cn("text-[10px]", actionTone(row.action))}>
                        {row.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-[11px]">
                      <span className="font-semibold">{row.entity}</span>
                      {row.entity_id && (
                        <span className="block truncate font-mono text-[10px] text-muted-foreground">
                          {row.entity_id.slice(0, 18)}…
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-muted-foreground">
                      {row.actor_label ?? "—"}
                    </td>
                    <td className="max-w-xs p-3 text-[10px] text-muted-foreground">
                      <code className="break-all">
                        {Object.entries((row.detail ?? {}) as Record<string, unknown>)
                          .map(([k, v]) => `${k}=${String(v)}`)
                          .join(" · ") || "—"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
