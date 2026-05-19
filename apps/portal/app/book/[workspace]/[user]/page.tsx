"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookingLinkInfo {
  title: string;
  description: string;
  duration_minutes: number;
  host_name: string;
  host_avatar?: string;
  timezone: string;
}

interface TimeSlot {
  time: string;      // "09:00"
  display: string;   // "9:00 AM"
  available: boolean;
}

type BookingStep = "select-slot" | "fill-form" | "confirmed";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 9; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m > 0) break;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const display = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      // Simulate some slots as unavailable
      const unavailableHours = [10, 11, 14];
      const available = !(unavailableHours.includes(h) && m === 0);
      slots.push({ time, display, available });
    }
  }
  return slots;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Calendar Component ───────────────────────────────────────────────────────

function Calendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  }

  function isSelected(day: number) {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  }

  // Weekend days are "unavailable" (simplified)
  function isWeekend(day: number) {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return dow === 0 || dow === 6;
  }

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const disabled = isPast(day) || isWeekend(day);
          const selected = isSelected(day);
          return (
            <button
              key={`day-${day}`}
              disabled={disabled}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              className={[
                "mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                "min-h-[40px] min-w-[40px]",
                selected
                  ? "bg-primary text-primary-foreground"
                  : disabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-foreground hover:bg-teal-50 hover:text-teal-700 cursor-pointer",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  timezone: string;
}

function BookingForm({
  selectedDate,
  selectedSlot,
  durationMinutes,
  onBack,
  onSubmit,
}: {
  selectedDate: Date;
  selectedSlot: TimeSlot;
  durationMinutes: number;
  onBack: () => void;
  onSubmit: (data: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    notes: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const dateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selected time summary */}
      <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-teal-800">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {dateStr}
        </div>
        <div className="flex items-center gap-2 text-sm text-teal-700">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {selectedSlot.display} · {durationMinutes} min
        </div>
        <div className="text-xs text-teal-600">{form.timezone}</div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="booking-name">
          Full name <span className="text-destructive">*</span>
        </label>
        <input
          id="booking-name"
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Your full name"
          className={[
            "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground",
            "placeholder:text-muted-foreground outline-none transition-colors",
            "min-h-[44px]",
            errors.name ? "border-destructive" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
          ].join(" ")}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="booking-email">
          Email address <span className="text-destructive">*</span>
        </label>
        <input
          id="booking-email"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@company.com"
          className={[
            "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground",
            "placeholder:text-muted-foreground outline-none transition-colors",
            "min-h-[44px]",
            errors.email ? "border-destructive" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
          ].join(" ")}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="booking-phone">
          Phone number <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="booking-phone"
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+1 555 000 0000"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[44px]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="booking-notes">
          Anything you&apos;d like to share? <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="What would you like to discuss? Any context helps us prepare."
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="booking-tz">
          Your timezone
        </label>
        <select
          id="booking-tz"
          value={form.timezone}
          onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[44px]"
        >
          {[
            "UTC",
            "Asia/Bangkok",
            "Asia/Ho_Chi_Minh",
            "Asia/Singapore",
            "Asia/Jakarta",
            "Asia/Manila",
            "Asia/Kuala_Lumpur",
            "Asia/Kolkata",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Europe/Berlin",
            "Australia/Sydney",
          ].map(tz => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
        >
          {submitting && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {submitting ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    </form>
  );
}

// ─── Confirmed Screen ─────────────────────────────────────────────────────────

function ConfirmedScreen({
  selectedDate,
  selectedSlot,
  form,
  title,
}: {
  selectedDate: Date;
  selectedSlot: TimeSlot;
  form: FormData;
  title: string;
}) {
  const dateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="text-center py-6 space-y-6">
      {/* Checkmark */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-teal-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">You&apos;re confirmed!</h2>
        <p className="text-sm text-muted-foreground">
          A calendar invite has been sent to{" "}
          <span className="font-medium text-foreground">{form.email}</span>
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-left space-y-3">
        <div className="flex items-start gap-3">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-muted-foreground mt-0.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">{selectedSlot.display}</p>
        </div>
        <div className="flex items-center gap-3">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-muted-foreground shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Need to reschedule? Reply to the confirmation email or contact us directly.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicBookingPage() {
  useParams();

  // Simulated booking link data — in production, fetched from booking-service
  const [linkInfo] = useState<BookingLinkInfo>({
    title: "Discovery Call",
    description: "Let's explore how RevLooper can help grow your pipeline. 30 minutes, no pressure.",
    duration_minutes: 30,
    host_name: "Sales Team",
    timezone: "Asia/Bangkok",
  });

  const [step, setStep] = useState<BookingStep>("select-slot");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmedForm, setConfirmedForm] = useState<FormData | null>(null);

  const slots = selectedDate ? generateSlots() : [];

  // Scroll to slots panel when a date is selected on mobile
  useEffect(() => {
    if (selectedDate && window.innerWidth < 768) {
      document.getElementById("slots-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("fill-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormSubmit(data: FormData) {
    setConfirmedForm(data);
    setStep("confirmed");
  }

  function handleBack() {
    setSelectedSlot(null);
    setStep("select-slot");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">RevLooper</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-muted-foreground truncate">{linkInfo.title}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="md:grid md:grid-cols-[280px_1px_1fr]">
            {/* Left panel — host info */}
            <div className="p-6 md:p-8">
              {/* Host avatar */}
              <div className="mb-5">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">{linkInfo.host_name}</p>
                <h1 className="text-xl font-bold text-foreground leading-tight">{linkInfo.title}</h1>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0 text-teal-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {linkInfo.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0 text-teal-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Video call link sent on confirmation
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0 text-teal-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  {linkInfo.timezone.replace(/_/g, " ")}
                </div>
              </div>

              {linkInfo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-5">
                  {linkInfo.description}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block bg-border" />

            {/* Right panel — slot picker / form / confirmed */}
            <div className="p-6 md:p-8">
              {step === "select-slot" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-foreground mb-1">Select a date</h2>
                    <p className="text-sm text-muted-foreground">Choose a day that works for you</p>
                  </div>

                  <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">
                    {/* Calendar */}
                    <div>
                      <Calendar
                        selectedDate={selectedDate}
                        onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                      />
                    </div>

                    {/* Time slots */}
                    <div id="slots-panel">
                      {selectedDate ? (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">
                            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </h3>
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {slots.map(slot => (
                              <button
                                key={slot.time}
                                disabled={!slot.available}
                                onClick={() => handleSlotSelect(slot)}
                                className={[
                                  "w-full text-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                                  slot.available
                                    ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300"
                                    : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
                                ].join(" ")}
                              >
                                {slot.display}
                                {!slot.available && (
                                  <span className="text-xs text-slate-300 ml-2">Unavailable</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="hidden md:flex items-center justify-center h-full text-sm text-muted-foreground text-center py-12">
                          <div>
                            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mx-auto text-slate-300 mb-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Select a date to see<br />available times</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === "fill-form" && selectedDate && selectedSlot && (
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-5">Your details</h2>
                  <BookingForm
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    durationMinutes={linkInfo.duration_minutes}
                    onBack={handleBack}
                    onSubmit={handleFormSubmit}
                  />
                </div>
              )}

              {step === "confirmed" && selectedDate && selectedSlot && confirmedForm && (
                <ConfirmedScreen
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  form={confirmedForm}
                  title={linkInfo.title}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <a href="https://revlooper.com" className="hover:text-teal-600 transition-colors font-medium">
            RevLooper
          </a>
        </p>
      </main>
    </div>
  );
}
