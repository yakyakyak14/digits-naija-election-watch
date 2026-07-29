import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DIGITS" },
      { name: "description", content: "A transparent, step-by-step process for citizen-powered election monitoring in Nigeria." },
      { property: "og:title", content: "How DIGITS works" },
      { property: "og:description", content: "From training to live observation to verified reports — every step explained." },
    ],
  }),
  component: HowPage,
});

const steps = [
  { n: 1, title: "Register & Train", body: "Sign up, complete the DIGEO training modules covering election law, ethical observation, and platform tools. Pass the certification quiz." },
  { n: 2, title: "Get Assigned", body: "Our Observer Coordinators assign trained DIGEOs to specific polling units based on location and capacity." },
  { n: 3, title: "Observe & Broadcast", body: "On election day, DIGEOs broadcast live to the Control Center from their assigned polling unit and submit real-time incident reports." },
  { n: 4, title: "Curated Public Transparency", body: "The Control Center reviews reports and curates up to 6 live streams for public viewing. Verified data is published to the transparency dashboard." },
];

function HowPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold md:text-5xl">How DIGITS Works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A transparent, step-by-step process for citizen-powered election monitoring.
        </p>
      </section>
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <ol className="space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-6 rounded-xl border bg-card p-6">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
                {s.n}
              </div>
              <div>
                <div className="font-display text-xl font-semibold">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  );
}
