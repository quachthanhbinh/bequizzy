const STEPS = [
  {
    step: "01",
    title: "Tell RevLooper about your business",
    description:
      "Answer 5 quick questions about what you sell, who you target, and your brand voice. RevLooper's AI Brain stores this context and uses it in every generated output.",
    tag: "5 minutes",
  },
  {
    step: "02",
    title: "Import or connect your leads",
    description:
      "Upload a CSV, connect Facebook Lead Ads, Google Ads forms, or Zalo — or build a hosted RevLooper lead page. Leads are auto-enriched and verified.",
    tag: "2 minutes",
  },
  {
    step: "03",
    title: "Let AI build your campaign",
    description:
      "Type your outreach goal. RevLooper writes subject lines, email bodies, and a full multi-step sequence using your AI Brain context. Edit any step inline.",
    tag: "3 minutes",
  },
  {
    step: "04",
    title: "Launch on Autopilot",
    description:
      "Set the campaign to Autopilot and walk away. Sequences execute on schedule, follow-ups trigger on no-reply, and stop conditions fire on any reply or booking.",
    tag: "1 click",
  },
  {
    step: "05",
    title: "Reply, book, and close",
    description:
      "All replies land in your Unified Inbox with AI-suggested responses. Hot leads are flagged. Booking links are embedded. Deals move to your Kanban pipeline.",
    tag: "Ongoing",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section bg-background">
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            From zero to first meeting in one afternoon
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            RevLooper is designed so that a solo founder with no sales ops
            experience can run professional outreach from day one.
          </p>
        </div>

        <div className="relative">
          {/* Connector line — desktop only */}
          <div
            aria-hidden
            className="hidden lg:block absolute left-[2.25rem] top-10 bottom-10 w-px bg-border"
          />

          <div className="space-y-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="relative flex gap-6 lg:gap-8"
              >
                {/* Step number */}
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary font-bold text-sm z-10">
                  {s.step}
                </div>

                {/* Content */}
                <div className="flex-1 card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-1.5">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary whitespace-nowrap">
                    {s.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
