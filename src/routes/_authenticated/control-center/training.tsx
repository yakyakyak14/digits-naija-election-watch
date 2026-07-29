import { createFileRoute } from "@tanstack/react-router";
import { DIGEOTrainingCenter } from "@/components/training/DIGEOTrainingCenter";

export const Route = createFileRoute("/_authenticated/control-center/training")({
  component: TrainingRoutePage,
});

function TrainingRoutePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <DIGEOTrainingCenter />
    </div>
  );
}
