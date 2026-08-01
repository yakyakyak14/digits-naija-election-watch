import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { DIGEOTrainingCenter } from "@/components/training/DIGEOTrainingCenter";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "DIGEO Observer Training & Exams — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Take the official 6-module DIGEO observer training curriculum and exam assessments. Free, open, and certified.",
      },
      { property: "og:title", content: "DIGEO Observer Training & Exams" },
      {
        property: "og:description",
        content: "Complete electoral law, BVAS, and evidence handling exam modules.",
      },
    ],
  }),
  component: PublicTrainingPage,
});

function PublicTrainingPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <DIGEOTrainingCenter />
      </div>
    </SiteLayout>
  );
}
