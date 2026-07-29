import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Camera, LifeBuoy, Mail, MapPin, Newspaper, ShieldAlert } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Reach the DIGITs team: partnerships for CSOs and newsrooms, observer support, platform issues, and the escalation route for urgent election-day incidents.",
      },
      { property: "og:title", content: "Contact DIGITs Election Watch" },
      {
        property: "og:description",
        content: "Partnerships, observer support and urgent escalation.",
      },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: ShieldAlert,
    title: "Urgent, on election day",
    body: "Do not email. File an i-Witness report or an incident report from inside the app — it reaches the Command Center queue immediately with your location attached.",
    action: { to: "/i-witness", label: "File a report now" },
    urgent: true,
  },
  {
    icon: LifeBuoy,
    title: "Observer support",
    body: "Deployment questions, accreditation status, training problems, or anything blocking you from going live.",
    email: "observers@digits.ng",
  },
  {
    icon: Newspaper,
    title: "Press and newsrooms",
    body: "Access to the verified record, attribution guidance, and coordination on coverage. We do not brief on outcomes or predictions.",
    email: "press@digits.ng",
  },
  {
    icon: Building2,
    title: "Partnerships and funding",
    body: "CSOs, election monitoring missions and funders looking to extend deployment coverage in specific states or LGAs.",
    email: "partners@digits.ng",
  },
];

function ContactPage() {
  return (
    <SiteLayout>
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/12 text-primary">Contact</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            Reach the right desk
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Four routes in, deliberately separated. Anything time-critical on election day belongs
            in the app, not an inbox.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {CHANNELS.map((channel) => (
            <article
              key={channel.title}
              className={
                channel.urgent
                  ? "plate flex flex-col border-destructive/35 bg-destructive/5 p-6"
                  : "plate-interactive flex flex-col p-6"
              }
            >
              <span
                className={
                  channel.urgent
                    ? "grid h-11 w-11 place-items-center rounded-xl bg-destructive/12 text-destructive"
                    : "grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary"
                }
              >
                <channel.icon className="h-5 w-5" />
              </span>

              <h2 className="mt-4 font-display text-lg font-bold">{channel.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {channel.body}
              </p>

              {channel.action ? (
                <Button
                  asChild
                  className="mt-5 gap-2"
                  variant={channel.urgent ? "destructive" : "default"}
                >
                  <Link to={channel.action.to}>
                    <Camera className="h-4 w-4" />
                    {channel.action.label}
                  </Link>
                </Button>
              ) : (
                <a
                  href={`mailto:${channel.email}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {channel.email}
                </a>
              )}
            </article>
          ))}
        </div>

        <div className="plate mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-display text-base font-bold">Where we are</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Abuja, Federal Capital Territory, Nigeria
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-bold">Anything else</h2>
            <a
              href="mailto:hello@digits.ng"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              hello@digits.ng
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
