const PARTNERS = [
  {
    category: "Email",
    items: [
      { name: "Gmail", logo: "G" },
      { name: "Outlook", logo: "O" },
      { name: "Mailreach", logo: "MR" },
    ],
  },
  {
    category: "Enrichment",
    items: [
      { name: "Apollo.io", logo: "A" },
      { name: "Hunter.io", logo: "H" },
    ],
  },
  {
    category: "Calendars",
    items: [
      { name: "Google Calendar", logo: "GC" },
      { name: "Outlook Calendar", logo: "OC" },
    ],
  },
  {
    category: "Channels",
    items: [
      { name: "Facebook Ads", logo: "FB" },
      { name: "Zalo OA", logo: "ZA" },
      { name: "WhatsApp", logo: "WA" },
      { name: "TikTok", logo: "TT" },
    ],
  },
  {
    category: "AI Models",
    items: [
      { name: "GPT-4o", logo: "AI" },
      { name: "Claude", logo: "CL" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "Supabase", logo: "SB" },
      { name: "Cloudflare R2", logo: "CF" },
    ],
  },
];

export default function Partners() {
  return (
    <section id="partners" className="section-sm bg-secondary/30">
      <div className="page-container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Integrations & partners
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            RevLooper connects with the tools you already use — from email
            providers to lead enrichment APIs and SEA-first channels.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group.category}
              </p>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {item.logo}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
