"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import PhoneInput, { type PhoneValue } from "@/components/PhoneInput";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

type Step = "form" | "check-email";
type Field = "firstName" | "lastName" | "email" | "password";

export default function SignUpPage() {
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const { t } = useLanguage();
  const s = t.signUp;

  const [step, setStep] = useState<Step>("form");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: { dialCode: "+84", number: "" } as PhoneValue,
  });
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });
  const [serverError, setServerError] = useState("");

  function touch(field: Field) {
    setTouched((v) => ({ ...v, [field]: true }));
  }

  function fieldError(field: Field): string {
    if (!touched[field]) return "";
    if (field === "firstName") {
      if (!form.firstName.trim()) return s.val.firstNameRequired;
      if (form.firstName.trim().length < 2) return s.val.firstNameMin;
    }
    if (field === "lastName") {
      if (!form.lastName.trim()) return s.val.lastNameRequired;
      if (form.lastName.trim().length < 2) return s.val.lastNameMin;
    }
    if (field === "email") {
      if (!form.email.trim()) return s.val.emailRequired;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return s.val.emailInvalid;
    }
    if (field === "password") {
      if (!form.password) return s.val.passwordRequired;
      if (form.password.length < 8) return s.val.passwordMin;
      if (!/\d/.test(form.password)) return s.val.passwordNumber;
    }
    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const allTouched: Record<Field, boolean> = { firstName: true, lastName: true, email: true, password: true };
    setTouched(allTouched);
    const hasErr = (["firstName", "lastName", "email", "password"] as Field[]).some((f) => fieldError(f));
    if (hasErr) return;

    setStatus("loading");
    setServerError("");
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
    });
    setStatus("idle");
    if (error === "email_taken") {
      setTouched((v) => ({ ...v, email: true }));
      setServerError(s.val.emailTaken);
      return;
    }
    setStep("check-email");
  }

  if (step === "check-email") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{s.checkTitle}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {s.checkDesc}{" "}
            <span className="font-medium text-foreground">{form.email}</span>.
          </p>
        </div>
        <div className="rounded-lg bg-secondary/60 border border-border p-4 text-left space-y-1.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide">What to do next</p>
          <p>1. {s.checkStep1}</p>
          <p>2. {s.checkStep2}</p>
          <p>3. {s.checkStep3}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{s.noEmail}</p>
          <button type="button" className="btn btn-outline btn-sm w-full justify-center">
            {s.resend}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary font-medium hover:underline">
            {s.backToSignIn}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label htmlFor="firstName" className="field-label">
              {s.firstName} <span className="text-destructive">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              onBlur={() => touch("firstName")}
              placeholder={s.firstNamePlaceholder}
              className={`field-input ${fieldError("firstName") ? "border-destructive" : ""}`}
            />
            {fieldError("firstName") && <p className="text-xs text-destructive mt-0.5">{fieldError("firstName")}</p>}
          </div>
          <div className="field">
            <label htmlFor="lastName" className="field-label">
              {s.lastName} <span className="text-destructive">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              onBlur={() => touch("lastName")}
              placeholder={s.lastNamePlaceholder}
              className={`field-input ${fieldError("lastName") ? "border-destructive" : ""}`}
            />
            {fieldError("lastName") && <p className="text-xs text-destructive mt-0.5">{fieldError("lastName")}</p>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="email" className="field-label">
            {s.email} <span className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setServerError(""); }}
            onBlur={() => touch("email")}
            placeholder={s.emailPlaceholder}
            className={`field-input ${fieldError("email") || serverError ? "border-destructive" : ""}`}
          />
          {(fieldError("email") || serverError) && (
            <p className="text-xs text-destructive mt-0.5">{serverError || fieldError("email")}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="password" className="field-label">
            {s.password} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onBlur={() => touch("password")}
              placeholder={s.passwordPlaceholder}
              className={`field-input pr-10 ${fieldError("password") ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {fieldError("password") && <p className="text-xs text-destructive mt-0.5">{fieldError("password")}</p>}
        </div>

        <div className="field">
          <label htmlFor="phone" className="field-label">{s.phone}</label>
          <PhoneInput
            id="phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {s.termsPrefix}{" "}
          <a href="https://revlooper.com/terms" className="text-primary hover:underline">{s.termsLink}</a>
          {" "}{s.and}{" "}
          <a href="https://revlooper.com/privacy" className="text-primary hover:underline">{s.privacyLink}</a>.
        </p>

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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">{t.common.orContinueWith}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={signInWithGoogle} className="btn btn-outline gap-2 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button type="button" onClick={signInWithFacebook} className="btn btn-outline gap-2 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
          </svg>
          Facebook
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {s.alreadyAccount}{" "}
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          {s.signIn}
        </Link>
      </p>
    </div>
  );
}
