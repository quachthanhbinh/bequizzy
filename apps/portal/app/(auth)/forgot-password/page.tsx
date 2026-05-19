"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const s = t.forgotPw;

  const [step, setStep] = useState<Step>("form");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  function emailError() {
    if (!touched) return "";
    if (!email.trim()) return s.val.emailRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return s.val.emailInvalid;
    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (emailError() || !email.trim()) return;
    setStatus("loading");
    const supabase = createClient();
    // Supabase never reveals whether the email exists (prevents enumeration)
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setStatus("idle");
    setStep("sent");
  }

  if (step === "sent") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{s.sentTitle}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {s.sentDescPre}{" "}
            <span className="font-medium text-foreground">{email}</span>
            {" "}{s.sentDescSuffix}
          </p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setStep("form"); setEmail(""); setTouched(false); }}
            className="btn btn-outline w-full justify-center"
          >
            {s.tryDifferent}
          </button>
          <Link href="/sign-in" className="btn btn-ghost w-full justify-center text-muted-foreground">
            {s.backSignIn}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {s.sentHint}{" "}
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            {s.sentSignUp}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {s.backToSignIn}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="field">
          <label htmlFor="email" className="field-label">{s.email}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={s.emailPlaceholder}
            className={`field-input ${emailError() ? "border-destructive" : ""}`}
          />
          {emailError() && <p className="text-xs text-destructive mt-0.5">{emailError()}</p>}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-primary w-full justify-center"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {s.submitting}
            </span>
          ) : (
            s.submit
          )}
        </button>
      </form>
    </div>
  );
}
