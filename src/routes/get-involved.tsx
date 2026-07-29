import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/get-involved")({
  head: () => ({
    meta: [
      { title: "Get Involved — DIGITS" },
      { name: "description", content: "Become a trained DIGEO election observer, a citizen monitor, or support DIGITS." },
      { property: "og:title", content: "Get Involved with DIGITS" },
      { property: "og:description", content: "Join thousands of Nigerians building electoral transparency." },
    ],
  }),
  component: GetInvolvedPage,
});

const paths = [
  { icon: ShieldCheck, title: "Become a DIGEO", body: "Get trained and certified as a DIGITS Election Observer. Broadcast live from polling units on election day.", cta: "Start Training", to: "/auth" },
  { icon: Eye, title: "Citizen Monitor", body: "Sign up as a viewer. Watch live streams and verified reports — hold power accountable from anywhere.", cta: "Sign up", to: "/auth" },
  { icon: HeartHandshake, title: "Partner / Support", body: "Are you a CSO, media outlet or funder? Partner with DIGITS to scale transparent elections.", cta: "Contact us", to: "/contact" },
];

function GetInvolvedPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Get Involved</h1>
        <p className="mt-4 text-lg text-muted-foreground">Three ways to help build a more transparent Nigeria.</p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 md:grid-cols-3">
        {paths.map((p) => (
          <Card key={p.title} className="flex flex-col p-8">
            <p.icon className="h-8 w-8 text-primary" />
            <div className="mt-4 font-display text-xl font-semibold">{p.title}</div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.body}</p>
            <Button asChild className="mt-6"><Link to={p.to}>{p.cta}</Link></Button>
          </Card>
        ))}
      </section>
    </SiteLayout>
  );
}
