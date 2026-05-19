import Link from "next/link";

export default function CTA() {
  return (
    <section className="section bg-primary text-primary-foreground">
      <div className="page-container text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Ready to let AI run your outreach?
        </h2>
        <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
          Set up your first campaign in under 10 minutes. No credit card
          required. Free plan available forever.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="https://app.revlooper.com/sign-up"
            className="btn btn-lg bg-white text-primary hover:bg-white/90 border-white w-full sm:w-auto"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="#contact"
            className="btn btn-lg bg-transparent text-white border-white/50 hover:bg-white/10 w-full sm:w-auto"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}
