import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Target, Rocket, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DIGITS" },
      { name: "description", content: "DIGITS's mission is to empower citizens and strengthen Nigerian democracy through transparent, technology-driven election monitoring." },
      { property: "og:title", content: "About DIGITS" },
      { property: "og:description", content: "Vision, mission and impact of the DIGITS platform." },
    ],
  }),
  component: AboutPage,
});

const pillars = [
  { icon: Target, title: "Our Vision", body: "To create a transparent, technology-enabled ecosystem where every citizen can monitor elections in real-time and contribute to strengthening democratic processes across Nigeria." },
  { icon: Rocket, title: "Our Mission", body: "To provide citizens with accessible tools to report incidents, verify information, and participate actively in election monitoring while building trust in electoral processes." },
  { icon: HeartHandshake, title: "Our Impact", body: "By enabling real-time monitoring and incident reporting, DIGITS helps detect irregularities early, improves electoral credibility, and strengthens public confidence in democratic institutions." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold md:text-5xl">About DIGITS</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Empowering citizens and strengthening Nigerian democracy through transparent,
          technology-driven election monitoring.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
        {pillars.map((p) => (
          <Card key={p.title} className="p-8">
            <p.icon className="h-8 w-8 text-primary" />
            <div className="mt-4 font-display text-xl font-semibold">{p.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </Card>
        ))}
      </section>
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold md:text-3xl">The Problem We Solve</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Nigerian elections face challenges including limited transparency, difficulty in real-time
            monitoring, and public trust concerns. DIGITS addresses these by creating a secure,
            citizen-powered platform where trained election observers (DIGEO) can broadcast live from
            polling units, incidents can be tracked in real-time, and the public can access
            transparent, verified election data.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
