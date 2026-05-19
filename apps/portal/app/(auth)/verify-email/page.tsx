"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const s = t.verifyEmail;

  const token = searchParams.get("token") ?? "";
  const hasError = searchParams.get("error");
  const isVerified = token.length > 8 && !hasError;

  if (isVerified) {
    return (
      <div className="space-y-6 text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{s.verifiedTitle}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.verifiedDesc}</p>
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-left space-y-1 text-sm">
          <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">{s.whatsNext}</p>
          <div className="space-y-1.5 text-muted-foreground">
            {[s.step1, s.step2, s.step3].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <Link href="/onboarding" className="btn btn-primary w-full justify-center">
          {s.ctaSetup}
        </Link>

        <p className="text-xs text-muted-foreground">
          Or{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            {s.ctaDashboard}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{s.failedTitle}</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.failedDesc}</p>
      </div>

      <div className="rounded-lg bg-secondary/60 border border-border p-4 text-sm text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Possible reasons:</p>
        <p>Â· {s.reason1}</p>
        <p>Â· {s.reason2}</p>
        <p>Â· {s.reason3}</p>
      </div>

      <div className="space-y-2">
        <Link href="/sign-up" className="btn btn-primary w-full justify-center">
          {s.requestNew}
        </Link>
        <Link href="/sign-in" className="btn btn-ghost w-full justify-center text-muted-foreground">
          {s.backToSignIn}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted-foreground py-10">Loadingâ€¦</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

