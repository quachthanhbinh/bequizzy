"use client";

import { useState, FormEvent, useRef, KeyboardEvent, useEffect } from "react";
import PhoneInput, { type PhoneValue } from "@/components/PhoneInput";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/useWorkspace";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "profile" | "workspace" | "security" | "devices" | "email";

interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastSeen: string;
  current: boolean;
}

// ─── Mock devices ─────────────────────────────────────────────────────────────

const MOCK_DEVICES: Device[] = [
  { id: "d1", name: "Chrome on Windows 11", browser: "Chrome 123", os: "Windows 11", location: "Ho Chi Minh City, VN", ip: "171.224.x.x", lastSeen: "Active now", current: true },
  { id: "d2", name: "Safari on iPhone 15",  browser: "Safari 17",  os: "iOS 17",     location: "Ho Chi Minh City, VN", ip: "171.224.x.x", lastSeen: "2 hours ago", current: false },
  { id: "d3", name: "Firefox on macOS",     browser: "Firefox 124",os: "macOS Sonoma",location: "Singapore, SG",       ip: "203.x.x.x",   lastSeen: "Yesterday at 4:21 PM", current: false },
  { id: "d4", name: "Chrome on Android",    browser: "Chrome 123", os: "Android 14", location: "Bangkok, TH",          ip: "182.x.x.x",   lastSeen: "3 days ago", current: false },
];

const BACKUP_CODES = ["A4B2-X9KL","M7W3-ZP8N","Q5JC-TU2R","Y1EH-6DF9","K3GS-V7NM","R9XA-8BL4","D2WP-C5YT","F6HQ-J1KE"];

// ─── Shared components ─────────────────────────────────────────────────────────

function SectionHeading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

function SaveBar({ saving, label, savingLabel }: { saving: boolean; label: string; savingLabel: string }) {
  return (
    <div className="flex justify-end pt-4 border-t border-border mt-6">
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {savingLabel}
          </span>
        ) : label}
      </button>
    </div>
  );
}

// ─── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const s = t.settings;
  const p = s.profile;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName:  user?.lastName  ?? "",
    email:     user?.email     ?? "",
    phone:     (user?.phone ?? { dialCode: "+84", number: "" }) as PhoneValue,
  });

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
    }
  }, [user]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = p.val.firstNameRequired;
    if (!form.lastName.trim())  errs.lastName  = p.val.lastNameRequired;
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    await updateProfile({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Avatar */}
      <div className="mb-7 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold select-none">
            {(form.firstName[0] ?? "").toUpperCase()}{(form.lastName[0] ?? "").toUpperCase()}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            aria-label="Change avatar"
          >
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{form.firstName} {form.lastName}</p>
          <p className="text-xs text-muted-foreground">{form.email}</p>
          <button type="button" className="text-xs text-primary hover:underline mt-0.5">
            {p.uploadPhoto}
          </button>
        </div>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="field">
          <label htmlFor="firstName" className="field-label">{p.firstName}</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            onBlur={() => { if (!form.firstName.trim()) setErrors((er) => ({ ...er, firstName: p.val.firstNameRequired })); else setErrors((er) => { const n = { ...er }; delete n.firstName; return n; }); }}
            className={`field-input ${errors.firstName ? "border-destructive" : ""}`}
          />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div className="field">
          <label htmlFor="lastName" className="field-label">{p.lastName}</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            onBlur={() => { if (!form.lastName.trim()) setErrors((er) => ({ ...er, lastName: p.val.lastNameRequired })); else setErrors((er) => { const n = { ...er }; delete n.lastName; return n; }); }}
            className={`field-input ${errors.lastName ? "border-destructive" : ""}`}
          />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="field mb-4">
        <label htmlFor="settingsEmail" className="field-label">{p.email}</label>
        <div className="relative">
          <input
            id="settingsEmail"
            type="email"
            readOnly
            value={form.email}
            className="field-input pr-24 bg-secondary/40 cursor-default text-muted-foreground"
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline font-medium"
          >
            {p.changeEmail}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{p.emailNote}</p>
      </div>

      {/* Phone */}
      <div className="field mb-4">
        <label htmlFor="settingsPhone" className="field-label">{p.phone}</label>
        <PhoneInput
          id="settingsPhone"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
      </div>

      {saved && (
        <p className="text-sm text-primary flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {p.saved}
        </p>
      )}
      <SaveBar saving={saving} label={t.common.save} savingLabel={t.common.saving} />
    </form>
  );
}

// ─── Password field ────────────────────────────────────────────────────────────

function PasswordField({ id, label, value, onChange, autoComplete, error }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`field-input pr-10 ${error ? "border-destructive" : ""}`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── TOTP input ────────────────────────────────────────────────────────────────

function TotpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputs.current[index + 1]?.focus();
    if (next.every((d) => d) && next.length === 6) onComplete(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputs.current[5]?.focus();
      onComplete(pasted);
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-bold text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 transition-all"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Security tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const { user, updatePassword } = useAuth();
  const { t } = useLanguage();
  const s = t.settings.security;

  const hasPassword = user?.hasPassword ?? false;

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSetupOpen, setTwoFaSetupOpen] = useState(false);
  const [twoFaStatus, setTwoFaStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (hasPassword && !pwForm.current) errs.current = s.val.currentRequired;
    if (pwForm.next.length < 8) errs.next = s.val.newMin;
    if (pwForm.next !== pwForm.confirm) errs.confirm = s.val.confirmMatch;
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwStatus("saving");
    const result = await updatePassword(hasPassword ? pwForm.current : null, pwForm.next);
    if (result?.error === "incorrect_current") {
      setPwErrors({ current: s.val.currentIncorrect });
      setPwStatus("idle");
      return;
    }
    setPwStatus("saved");
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwStatus("idle"), 3000);
  }

  async function handleVerifyTotp(code: string) {
    setTwoFaStatus("verifying");
    await new Promise((r) => setTimeout(r, 1000));
    if (code === "123456") {
      setTwoFaEnabled(true);
      setTwoFaSetupOpen(false);
      setShowBackupCodes(true);
      setTwoFaStatus("idle");
    } else {
      setTwoFaStatus("error");
    }
  }

  async function handleDisable2FA() {
    await new Promise((r) => setTimeout(r, 600));
    setTwoFaEnabled(false);
    setShowBackupCodes(false);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(BACKUP_CODES.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Change / Set Password */}
      <div>
        {!hasPassword && (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 mb-4 text-sm text-amber-700 dark:text-amber-400">
            <svg width="16" height="16" className="shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {s.oauthBanner}
          </div>
        )}
        <SectionHeading
          title={hasPassword ? s.changePwTitle : s.setPwTitle}
          desc={hasPassword ? s.changePwDesc : s.setPwDesc}
        />
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm" noValidate>
          {hasPassword && (
            <PasswordField id="current-pw" label={s.currentPw} autoComplete="current-password" value={pwForm.current} onChange={(v) => setPwForm((f) => ({ ...f, current: v }))} error={pwErrors.current} />
          )}
          <PasswordField id="new-pw"     label={s.newPw}     autoComplete="new-password"     value={pwForm.next}    onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}    error={pwErrors.next}    />
          <PasswordField id="confirm-pw" label={s.confirmPw} autoComplete="new-password"     value={pwForm.confirm} onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))} error={pwErrors.confirm} />

          {pwStatus === "saved" && (
            <p className="text-sm text-primary flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {hasPassword ? s.pwUpdated : s.pwSet}
            </p>
          )}

          <button type="submit" disabled={pwStatus === "saving"} className="btn btn-primary">
            {pwStatus === "saving" ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {s.updating}
              </span>
            ) : hasPassword ? s.updatePw : s.setPw}
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="pt-6 border-t border-border">
        <SectionHeading title={s.twoFaTitle} desc={s.twoFaDesc} />

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ðŸ”</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.authApp}</p>
              <p className="text-xs text-muted-foreground">
                {twoFaEnabled ? s.enabledDesc : s.notSetUp}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${twoFaEnabled ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <span className={`text-xs font-medium ${twoFaEnabled ? "text-primary" : "text-muted-foreground"}`}>
              {twoFaEnabled ? s.enabled : s.disabled}
            </span>
          </div>
        </div>

        {twoFaEnabled && showBackupCodes && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 mb-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.saveCodesTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.saveCodesDesc}</p>
              </div>
              <button onClick={() => setShowBackupCodes(false)} className="text-muted-foreground hover:text-foreground ml-4 shrink-0">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {BACKUP_CODES.map((code) => (
                <code key={code} className="rounded-md bg-background border border-border px-2.5 py-1.5 text-xs font-mono text-foreground tracking-wider">
                  {code}
                </code>
              ))}
            </div>
            <button type="button" onClick={copyBackupCodes} className="btn btn-outline btn-sm gap-1.5">
              {copiedCodes ? (
                <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> {s.copied}</>
              ) : (
                <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg> {s.copyAll}</>
              )}
            </button>
          </div>
        )}

        {twoFaSetupOpen && !twoFaEnabled && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 mb-4">
            <p className="text-sm font-semibold text-foreground">{s.setupTitle}</p>
            <div>
              <p className="text-xs text-muted-foreground mb-3">1. {s.setupStep1}</p>
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0 rounded-lg border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center text-muted-foreground/40">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4M9 9h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{s.enterKeyManually}</p>
                  <code className="block rounded-md bg-secondary border border-border px-2.5 py-2 text-xs font-mono text-foreground tracking-widest break-all">JBSWY3DPEHPK3PXP</code>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-3">2. {s.setupStep2}</p>
              <TotpInput onComplete={handleVerifyTotp} />
              {twoFaStatus === "error" && (
                <p className="text-xs text-destructive text-center mt-2">{s.incorrectCode}</p>
              )}
              {twoFaStatus === "verifying" && (
                <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  {s.verifying}
                </p>
              )}
            </div>
            <button type="button" onClick={() => setTwoFaSetupOpen(false)} className="btn btn-ghost btn-sm text-muted-foreground">
              {t.common.cancel}
            </button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {!twoFaEnabled ? (
            <button type="button" onClick={() => setTwoFaSetupOpen(true)} className="btn btn-primary gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {s.enable}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setShowBackupCodes((v) => !v)} className="btn btn-outline gap-1.5">
                {s.viewCodes}
              </button>
              <button type="button" onClick={handleDisable2FA} className="btn btn-ghost text-destructive hover:bg-destructive/5">
                {s.disable}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Devices tab ───────────────────────────────────────────────────────────────

function DevicesTab() {
  const { t } = useLanguage();
  const s = t.settings.devices;

  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  async function revokeDevice(id: string) {
    setRevoking(id);
    await new Promise((r) => setTimeout(r, 700));
    setDevices((ds) => ds.filter((d) => d.id !== id));
    setRevoking(null);
  }

  async function revokeAllOther() {
    setRevokingAll(true);
    await new Promise((r) => setTimeout(r, 900));
    setDevices((ds) => ds.filter((d) => d.current));
    setRevokingAll(false);
  }

  const otherDevices = devices.filter((d) => !d.current);

  return (
    <div>
      <SectionHeading title={s.title} desc={s.desc} />
      <div className="space-y-2 mb-5">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`flex items-start gap-3 rounded-xl border p-4 ${device.current ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground">
              {device.os.toLowerCase().includes("ios") || device.os.toLowerCase().includes("android") ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{device.name}</p>
                {device.current && (
                  <span className="rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-2 py-0.5">
                    {s.thisDevice}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{device.browser} · {device.location} · {device.ip}</p>
              <p className={`text-xs mt-0.5 ${device.lastSeen === "Active now" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {device.lastSeen === "Active now" ? s.activeNow : device.lastSeen}
              </p>
            </div>
            {!device.current && (
              <button
                type="button"
                onClick={() => revokeDevice(device.id)}
                disabled={revoking === device.id}
                className="btn btn-sm btn-ghost text-destructive hover:bg-destructive/5 shrink-0"
              >
                {revoking === device.id ? (
                  <span className="h-3 w-3 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                ) : s.revoke}
              </button>
            )}
          </div>
        ))}
      </div>

      {otherDevices.length > 0 && (
        <button type="button" onClick={revokeAllOther} disabled={revokingAll} className="btn btn-outline text-destructive border-destructive/30 hover:bg-destructive/5">
          {revokingAll ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
              Revoking…
            </span>
          ) : `${s.revokeAll} (${otherDevices.length})`}
        </button>
      )}

      {otherDevices.length === 0 && (
        <p className="text-sm text-muted-foreground">{s.noOther}</p>
      )}
    </div>
  );
}

// ─── Email & Sending Tab ──────────────────────────────────────────────────────

function EmailTab() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fromName, setFromName] = useState("Linh T.");
  const [fromEmail, setFromEmail] = useState("linh@revlooper.com");
  const [replyTo, setReplyTo] = useState("linh@revlooper.com");
  const [dailyCap, setDailyCap] = useState("50");
  const [sendWindow, setSendWindow] = useState<"business" | "all">("business");
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 900);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="card p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Sender identity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">The name and address your leads will see in their inbox.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">From name</label>
            <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">From email</label>
            <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Reply-to address</label>
            <input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Domain authentication</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Authenticate your sending domain to improve deliverability.</p>
        </div>
        <div className="space-y-2.5">
          {[
            { record: "SPF",   status: "verified", detail: "v=spf1 include:_spf.revlooper.com ~all" },
            { record: "DKIM",  status: "verified", detail: "rl._domainkey.revlooper.com" },
            { record: "DMARC", status: "not_set",  detail: "Not configured — recommended for inbox placement" },
            { record: "MX",    status: "verified", detail: "mail.revlooper.com priority 10" },
          ].map((row) => (
            <div key={row.record} className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                row.status === "verified" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
              }`}>
                {row.status === "verified" ? "✓" : "!"}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{row.record}
                  <span className={`ml-2 text-xs font-normal ${row.status === "verified" ? "text-teal-600" : "text-amber-600"}`}>
                    {row.status === "verified" ? "Verified" : "Not set"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-mono">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Sending limits</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Control how many emails go out to protect your domain reputation.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Daily send cap (emails/day)</label>
            <input type="number" min="1" max="500" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} className="input" />
            <p className="text-xs text-muted-foreground mt-1">Recommended: 30–50 for new domains.</p>
          </div>
          <div>
            <label className="label">Send window</label>
            <div className="flex gap-2 mt-1.5">
              {(["business", "all"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setSendWindow(opt)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                    sendWindow === opt ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  {opt === "business" ? "Business hours" : "Any time"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Email warmup & tracking</h3>
        <div className="space-y-4">
          {[
            { label: "Automatic warmup", desc: "Gradually scale up sending volume over 4 weeks.", value: warmupEnabled, set: setWarmupEnabled },
            { label: "Track email opens", desc: "Add a tracking pixel to detect when leads open your email.", value: trackOpens, set: setTrackOpens },
            { label: "Track link clicks", desc: "Wrap links to track when a lead clicks a CTA.", value: trackClicks, set: setTrackClicks },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button type="button" role="switch" aria-checked={item.value} onClick={() => item.set((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${item.value ? "bg-primary" : "bg-border"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-4.5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-teal-600">Saved!</span>}
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
// ─── Workspace tab ────────────────────────────────────────────────────────────────────

function WorkspaceTab() {
  const { data: workspace, isLoading } = useWorkspace();
  const updateWorkspaceMutation = useUpdateWorkspace();

  const [form, setForm] = useState({ name: "", timezone: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (workspace) {
      setForm({ name: workspace.name, timezone: workspace.timezone ?? "" });
    }
  }, [workspace]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await updateWorkspaceMutation.mutateAsync({ name: form.name, timezone: form.timezone || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // error state is exposed via updateWorkspaceMutation.isError
    }
  }

  const saving = updateWorkspaceMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionHeading title="Workspace Settings" desc="Manage your workspace name, timezone, and general preferences." />

      {isLoading && <p className="text-sm text-muted-foreground">Loading workspace info…</p>}
      {updateWorkspaceMutation.isError && (
        <p className="text-sm text-destructive">
          Failed to save: {updateWorkspaceMutation.error instanceof Error ? updateWorkspaceMutation.error.message : "Unknown error"}
        </p>
      )}

      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Workspace name
          </label>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="My Workspace"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Slug
          </label>
          <div className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-secondary text-muted-foreground">
            {workspace?.slug ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed after creation.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Timezone
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
          >
            <option value="">— Select timezone —</option>
            {Object.entries(
              (Intl.supportedValuesOf("timeZone") as string[]).reduce<Record<string, string[]>>(
                (acc, tz) => {
                  const region = tz.includes("/") ? tz.split("/")[0] : "Other";
                  (acc[region] ??= []).push(tz);
                  return acc;
                },
                {}
              )
            )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([region, zones]) => (
                <optgroup key={region} label={region}>
                  {zones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Used for scheduling campaigns and analytics reports.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Plan
          </label>
          <div className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-secondary text-muted-foreground capitalize">
            {workspace?.plan ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            To change your plan, go to{" "}
            <a href="/billing" className="text-primary hover:underline">Billing</a>.
          </p>
        </div>
      </div>

      {saved && (
        <p className="text-sm text-teal-600 font-medium">Workspace settings saved.</p>
      )}
      {updateWorkspaceMutation.isError && (
        <p className="text-sm text-destructive">Failed to save. Please try again.</p>
      )}

      <SaveBar saving={saving} label="Save workspace" savingLabel="Saving…" />
    </form>
  );
}
// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useLanguage();
  const s = t.settings;
  const [tab, setTab] = useState<Tab>("profile");

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile",   label: s.tabs.profile  },
    { id: "workspace", label: "Workspace"     },
    { id: "security",  label: s.tabs.security },
    { id: "devices",   label: s.tabs.devices  },
    { id: "email",     label: "Email & Sending" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{s.subtitle}</p>
        </div>

        <div className="flex gap-1 border-b border-border mb-7">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "profile"   && <ProfileTab />}
        {tab === "workspace"  && <WorkspaceTab />}
        {tab === "security"  && <SecurityTab />}
        {tab === "devices"   && <DevicesTab />}
        {tab === "email"     && <EmailTab />}
      </div>
    </div>
  );
}
