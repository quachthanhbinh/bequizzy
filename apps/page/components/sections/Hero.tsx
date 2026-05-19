import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      {/* Subtle background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.953 0.051 180.80 / 0.35), transparent)",
        }}
      />

      <div className="page-container text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
          AI-native outreach platform · Built for SEA founders
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
          Your AI Sales Rep,{" "}
          <span className="text-primary">working 24/7</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Describe your target in plain English. RevLooper builds a full
          campaign — from lead import to meeting booked — in under 10 minutes.
          No copywriting skills needed.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="https://app.revlooper.com/sign-up"
            className="btn btn-primary btn-lg w-full sm:w-auto"
          >
            Start for free — no credit card
          </Link>
          <Link
            href="#how-it-works"
            className="btn btn-outline btn-lg w-full sm:w-auto"
          >
            See how it works
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free plan · 100 leads · 1 active campaign · No credit card required
        </p>

        {/* Social proof bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {[
            { value: "10 min", label: "avg. campaign setup" },
            { value: "40%", label: "30-day retention" },
            { value: "8%+", label: "free-to-pro conversion" },
            { value: "5×", label: "channels supported" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <span className="text-xs">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Mock UI preview */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-3 flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </span>
            <span className="mx-auto text-xs text-muted-foreground font-mono">
              app.revlooper.com — AI Campaign Builder
            </span>
          </div>
          <div className="p-6 text-left">
            <div className="flex gap-4">
              {/* Chat panel mock */}
              <div className="flex-1 space-y-3">
                <div className="rounded-xl bg-muted p-3 text-sm text-foreground max-w-xs">
                  <p className="font-medium text-xs text-muted-foreground mb-1">You</p>
                  I want to recruit Java developers for a fintech startup in Singapore.
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                  <p className="font-medium text-xs text-primary mb-1">RevLooper AI</p>
                  <p className="mb-2">Building your campaign — <strong>Tech Talent SG · Java / Fintech</strong></p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                      <span>Intro email — personalized with LinkedIn headline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/30 text-xs font-bold">2</span>
                      <span>Wait 3 days → follow-up with role highlights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/30 text-xs font-bold">3</span>
                      <span>Final nudge + booking link</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Stats mock */}
              <div className="hidden md:flex flex-col gap-3 w-40">
                {[
                  { label: "Leads ready", value: "247" },
                  { label: "Emails sent", value: "89" },
                  { label: "Reply rate", value: "18%" },
                  { label: "Meetings", value: "6" },
                ].map((s) => (
                  <div key={s.label} className="card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
