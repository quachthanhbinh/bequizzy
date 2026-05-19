"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const s = t.updatePw;

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function fieldError(field: "password" | "confirm") {
    if (!touched[field]) return "";
    if (field === "password") {
      if (!form.password) return s.val.required;
      if (form.password.length < 8) return s.val.min;
    }
    if (field === "confirm") {
      if (!form.confirm) return s.val.confirmRequired;
      if (form.confirm !== form.password) return s.val.confirmMatch;
    }
    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (fieldError("password") || fieldError("confirm") || !form.password || !form.confirm) return;
    setStatus("loading");
    setServerError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: form.password });

    if (error) {
      setStatus("error");
      const msg = error.message.toLowerCase();
      setServerError(
        msg.includes("expired") || msg.includes("session") || msg.includes("token")
          ? s.linkExpired
          : error.message,
      );
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{s.successTitle}</h1>
          <p className="text-sm text-muted-foreground mt-2">{s.successDesc}</p>
        </div>
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
        {/* New password */}
        <div className="field">
          <label htmlFor="password" className="field-label">{s.newPassword}</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
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
          {fieldError("password") && (
            <p className="text-xs text-destructive mt-0.5">{fieldError("password")}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="field">
          <label htmlFor="confirm" className="field-label">{s.confirmPassword}</label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
            placeholder={s.confirmPlaceholder}
            className={`field-input ${fieldError("confirm") ? "border-destructive" : ""}`}
          />
          {fieldError("confirm") && (
            <p className="text-xs text-destructive mt-0.5">{fieldError("confirm")}</p>
          )}
        </div>

        {serverError && (
          <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            {serverError}
          </div>
        )}

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
          ) : s.submit}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary hover:underline">{s.backToSignIn}</Link>
      </p>
    </div>
  );
}
