import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/control-center/observers")({
  component: () => (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">DIGEO Observers</h1>
        <p className="text-sm text-muted-foreground">Directory of trained DIGITS Election Observers.</p>
      </div>
      <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
        DIGEO directory appears here once observers complete training. (Phase 2)
      </Card>
    </div>
  ),
});
