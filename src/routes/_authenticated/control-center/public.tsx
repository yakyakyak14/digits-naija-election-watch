import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/control-center/public")({
  component: () => (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Public Viewer Preview</h1>
        <p className="text-sm text-muted-foreground">See what citizens see. Layout is controlled from Live Streams.</p>
      </div>
      <Card className="aspect-video border-dashed p-8 flex flex-col items-center justify-center text-muted-foreground">
        <Eye className="h-8 w-8" />
        <div className="mt-3 text-sm">Public multi-tile viewer renders here in Phase 3.</div>
      </Card>
    </div>
  ),
});
