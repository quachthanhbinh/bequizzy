const TESTIMONIALS = [
  {
    quote:
      "Before RevLooper, I spent 3+ hours a day manually messaging candidates. Now I upload a CSV, the AI writes personalized intros, and follow-ups run automatically. I booked 4 client meetings in my first week.",
    name: "Linh T.",
    role: "Independent Recruitment Consultant",
    location: "Ho Chi Minh City, Vietnam",
    avatar: "LT",
    metric: "4 meetings in week 1",
  },
  {
    quote:
      "My insurance outreach was entirely manual — spreadsheets, memory, WhatsApp copy-paste. RevLooper's AI sequences with Zalo and email changed everything. My hot lead count went from 5 to 30 in a month.",
    name: "Minh N.",
    role: "Life Insurance Agent",
    location: "Ho Chi Minh City, Vietnam",
    avatar: "MN",
    metric: "6× more hot leads",
  },
  {
    quote:
      "As a 3-person agency, I couldn't justify $1,000/month for an AI SDR. RevLooper gives us everything we need — multi-channel sequences, a CRM, unified inbox — at a price that makes sense. We landed 2 new retainers in the first month.",
    name: "Tom R.",
    role: "Founder, Digital Marketing Agency",
    location: "Singapore",
    avatar: "TR",
    metric: "2 retainers in month 1",
  },
  {
    quote:
      "The AI Brain feature is a game-changer. I uploaded my product deck and pricing PDF. Now every generated email references my actual package names and pricing — not generic filler. Prospects ask how I wrote such tailored messages.",
    name: "Sarah K.",
    role: "SaaS Founder",
    location: "Bangkok, Thailand",
    avatar: "SK",
    metric: "3× higher reply rate",
  },
  {
    quote:
      "RevLooper's Daily Ops Brief saves me 30 minutes every morning. Instead of checking 4 dashboards, I open RevLooper and see exactly what to act on: who replied overnight, which hot leads need follow-up, what's in my review queue.",
    name: "Adi P.",
    role: "B2B Sales Consultant",
    location: "Jakarta, Indonesia",
    avatar: "AP",
    metric: "30 min/day saved",
  },
  {
    quote:
      "Managing 8 client workspaces used to be chaos. With RevLooper Agency, I have one billing, workspace templates for onboarding new clients, and an overview dashboard that shows me every account's health at a glance.",
    name: "Mark L.",
    role: "Founder, Outbound Agency",
    location: "Kuala Lumpur, Malaysia",
    avatar: "ML",
    metric: "8 clients managed in one view",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="section bg-background">
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by solo operators across SEA
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            From recruiters in Vietnam to agencies in Singapore — RevLooper
            helps teams of 1–10 punch above their weight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <StarRating />

              <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.role} · {t.location}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
                  {t.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
