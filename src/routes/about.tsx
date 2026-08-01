import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Camera,
  Handshake,
  LifeBuoy,
  Mail,
  MapPin,
  Newspaper,
  Rocket,
  ScaleIcon,
  Send,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DigitsMark } from "@/components/brand/DigitsLogo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Contact — DIGITs Election Watch" },
      {
        name: "description",
        content:
          "Learn about DIGITs Election Watch, our non-partisan commitments, and contact our support, press, or partnership desks.",
      },
      { property: "og:title", content: "About & Contact — DIGITs Election Watch" },
      {
        property: "og:description",
        content: "Mission, principles, contact channels, and partnership information.",
      },
    ],
  }),
  component: AboutAndContactPage,
});

const PILLARS = [
  {
    icon: Target,
    title: "Our Mission",
    body: "Put a credible, timestamped record of election day in citizens' hands — while it is still election day.",
  },
  {
    icon: Rocket,
    title: "What We Do",
    body: "Train observers, stream live feeds, collect real-time evidence, and publish only what survives verification.",
  },
  {
    icon: Handshake,
    title: "Our Partners",
    body: "CSOs, newsrooms, and funders receive the same verified record simultaneously — open and transparent.",
  },
];

const PRINCIPLES = [
  {
    title: "Non-partisan or nothing",
    body: "Observers declare non-partisanship on enrolment. DIGITs never endorses or predicts outcomes.",
  },
  {
    title: "Evidence over assertion",
    body: "Every published claim is timestamped, geo-stamped, hash-sealed, and attributed to a named reporter.",
  },
  {
    title: "Open by default",
    body: "Watching, reading and training require no account. Sign-in is only for commenting or submitting evidence.",
  },
  {
    title: "Identity protected",
    body: "A reporter's NIN verifies identity but is never displayed publicly, sold, or shared with any party.",
  },
  {
    title: "Nothing disappears",
    body: "Flagged evidence is retained with reasons recorded. All actions are written to an immutable audit log.",
  },
  {
    title: "Safety first",
    body: "Observers are trained to withdraw from danger and report from safety. No clip is worth an injury.",
  },
];

const CHANNELS = [
  {
    icon: ShieldAlert,
    title: "Urgent, on election day",
    body: "Do not email. File an i-Witness report directly inside the app — it reaches the Command Center queue immediately.",
    action: { to: "/i-witness", label: "File a report now" },
    urgent: true,
  },
  {
    icon: LifeBuoy,
    title: "Observer support",
    body: "Deployment questions, accreditation status, training issues, or broadcast setup assistance.",
    email: "observers@digits.ng",
  },
  {
    icon: Newspaper,
    title: "Press & newsrooms",
    body: "Access to verified records, attribution guidance, and coverage coordination. We do not brief on predictions.",
    email: "press@digits.ng",
  },
  {
    icon: Building2,
    title: "Partnerships & funding",
    body: "CSOs, election monitoring missions, and partners extending deployment coverage in specific states or LGAs.",
    email: "partners@digits.ng",
  },
];

export function AboutAndContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setName("");
      setEmail("");
      setMessage("");
      toast.success(
        "Thank you! Your message has been received. Our team will get back to you shortly.",
      );
    }, 800);
  }

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <DigitsMark size={76} priority className="mx-auto mb-5 drop-shadow-md" />
          <Badge className="mb-3 bg-primary/12 text-primary font-bold">About &amp; Contact</Badge>
          <h1 className="font-display text-display font-extrabold leading-tight">
            Built so Nigerians never have to take anyone's word for it
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            DIGITs is an independent, non-partisan platform for real-time citizen election watching,
            certified observer training, and transparent verification.
          </p>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="plate-interactive p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">{pillar.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Six Commitments */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mx-auto max-w-xl text-center">
            <ScaleIcon className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 font-display text-display-sm font-bold">Six Core Guarantees</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Principles enforced across the platform and database.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <article key={principle.title} className="plate p-4">
                <h3 className="flex items-start gap-2 font-display text-sm font-bold">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {principle.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Channels Section */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mx-auto max-w-xl text-center mb-8">
          <Badge className="mb-2 bg-primary/12 text-primary">Get In Touch</Badge>
          <h2 className="font-display text-display-sm font-bold">Reach the Right Desk</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Select the appropriate channel for your inquiry or message us directly below.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => (
            <article
              key={channel.title}
              className={
                channel.urgent
                  ? "plate flex flex-col border-destructive/35 bg-destructive/5 p-5"
                  : "plate-interactive flex flex-col p-5"
              }
            >
              <span
                className={
                  channel.urgent
                    ? "grid h-10 w-10 place-items-center rounded-xl bg-destructive/12 text-destructive"
                    : "grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary"
                }
              >
                <channel.icon className="h-5 w-5" />
              </span>

              <h3 className="mt-3 font-display text-base font-bold">{channel.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                {channel.body}
              </p>

              {channel.action ? (
                <Button
                  asChild
                  size="sm"
                  className="mt-4 gap-1.5"
                  variant={channel.urgent ? "destructive" : "default"}
                >
                  <Link to={channel.action.to}>
                    <Camera className="h-3.5 w-3.5" />
                    {channel.action.label}
                  </Link>
                </Button>
              ) : (
                <a
                  href={`mailto:${channel.email}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {channel.email}
                </a>
              )}
            </article>
          ))}
        </div>

        {/* Location & General Email */}
        <div className="plate mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="font-display text-base font-bold">Headquarters Location</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Abuja, Federal Capital Territory, Nigeria
            </p>
          </div>
          <div>
            <h3 className="font-display text-base font-bold">General Inquiries</h3>
            <a
              href="mailto:hello@digits.ng"
              className="mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              hello@digits.ng
            </a>
          </div>
        </div>
      </section>

      {/* Direct Contact Form */}
      <section className="border-t bg-secondary/30 py-14">
        <div className="mx-auto max-w-2xl px-4">
          <form onSubmit={handleSubmit} className="plate space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold">Send a Message</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Have a question or proposal? Send a direct message to our support &amp; partnership
                team.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs font-semibold">
                  Your Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chukwuma Obi"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-email" className="text-xs font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-subject" className="text-xs font-semibold">
                Inquiry Topic
              </Label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-primary/60"
              >
                <option value="general">General Inquiry</option>
                <option value="observer">DIGEO Observer Support</option>
                <option value="press">Press &amp; Media Coverage</option>
                <option value="partnership">Partnerships &amp; CSO Funding</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-message" className="text-xs font-semibold">
                Your Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message details here..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={sending} className="w-full gap-2 font-bold">
              <Send className="h-4 w-4" />
              {sending ? "Sending message..." : "Send Message"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
