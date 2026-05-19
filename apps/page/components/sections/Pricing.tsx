import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For solo founders testing the waters.",
    cta: "Start for free",
    href: "https://app.revlooper.com/sign-up",
    highlighted: false,
    features: [
      "100 leads",
      "1 active campaign",
      "20 emails / day",
      "AI Brain — 3 documents",
      "3 AI text assets / month",
      "Meeting booking",
      "RevLooper subdomain booking page",
    ],
    missing: [
      "Email warm-up",
      "Multi-channel outreach",
      "AI lead scoring",
      "Daily Ops Brief",
      "Autopilot mode",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For solo operators running serious outreach.",
    cta: "Start Pro trial",
    href: "https://app.revlooper.com/sign-up?plan=pro",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "5,000 leads",
      "Unlimited campaigns",
      "200 emails / day",
      "AI Brain — 20 documents",
      "100 AI text assets / month",
      "20 image/PDF generations / month",
      "Email warm-up (Mailreach)",
      "Lead enrichment (Apollo)",
      "Autopilot + Review modes",
      "AI lead scoring (badge)",
      "Daily Ops Brief (cards 1–5)",
      "A/B testing",
    ],
    missing: [],
  },
  {
    name: "Business",
    price: "$149",
    period: "/ month",
    description: "For small teams ready to scale.",
    cta: "Start Business trial",
    href: "https://app.revlooper.com/sign-up?plan=business",
    highlighted: false,
    features: [
      "25,000 leads",
      "3 team seats",
      "500 emails / day",
      "AI Brain — 100 documents",
      "500 AI text assets / month",
      "100 image/PDF generations / month",
      "Everything in Pro",
      "Multi-channel (LinkedIn, Zalo, WhatsApp)",
      "AI lead scoring — full breakdown",
      "Daily Ops Brief (all 7 cards)",
      "CRM Kanban + pipeline analytics",
      "5 workflow automations",
      "SMTP custom connection",
    ],
    missing: [],
  },
  {
    name: "Agency",
    price: "$399",
    period: "/ month",
    description: "For agencies managing multiple client workspaces.",
    cta: "Contact sales",
    href: "#contact",
    highlighted: false,
    features: [
      "Unlimited leads",
      "Unlimited team seats",
      "2,000 emails / day",
      "AI Brain — unlimited",
      "Unlimited AI assets",
      "Everything in Business",
      "Multi-client workspace management",
      "Workspace templates",
      "White-label (add-on)",
      "Centralized billing",
      "AdsPower / GenLogin integration",
      "Dedicated onboarding",
    ],
    missing: [],
  },
];

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-primary mt-0.5">
    <path d="M13.5 4L6.5 11L3 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-muted-foreground/40 mt-0.5">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Pricing() {
  return (
    <section id="pricing" className="section bg-secondary/40">
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
            Extra AI credits available at $5 / 500 credits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col p-6 relative ${
                plan.highlighted
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
                  : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </span>
              )}

              <div className="mb-5">
                <h3 className="text-base font-semibold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground pb-1">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <Link
                href={plan.href}
                className={`btn w-full justify-center mb-6 ${
                  plan.highlighted ? "btn-primary" : "btn-outline"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/60 line-through">
                    <XIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include a 14-day free trial of Pro features. No credit card required.
        </p>
      </div>
    </section>
  );
}
