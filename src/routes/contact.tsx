import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — DIGITS" },
      { name: "description", content: "Contact the DIGITS team for partnerships, media, and support." },
      { property: "og:title", content: "Contact DIGITS" },
      { property: "og:description", content: "Get in touch with the DIGITS transparency team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Contact</h1>
        <p className="mt-4 text-lg text-muted-foreground">We'd love to hear from you.</p>
      </section>
      <section className="mx-auto grid max-w-4xl gap-6 px-4 pb-24 md:grid-cols-2">
        <Card className="p-8">
          <Mail className="h-6 w-6 text-primary" />
          <div className="mt-3 font-semibold">Email</div>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="mailto:hello@digits.ng">hello@digits.ng</a>
        </Card>
        <Card className="p-8">
          <MapPin className="h-6 w-6 text-primary" />
          <div className="mt-3 font-semibold">Location</div>
          <div className="text-sm text-muted-foreground">Abuja, Nigeria</div>
        </Card>
      </section>
    </SiteLayout>
  );
}
