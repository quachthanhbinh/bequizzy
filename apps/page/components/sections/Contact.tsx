"use client";

import { useState, FormEvent } from "react";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      // Replace with your form endpoint when BE is ready
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="section bg-background">
      <div className="page-container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get in touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Questions about pricing, agency plans, or custom integrations?
              We&apos;ll respond within one business day.
            </p>
          </div>

          {status === "sent" ? (
            <div className="card p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Message sent!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                We&apos;ll get back to you within one business day.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="btn btn-outline btn-sm mx-auto"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="name" className="field-label">Name <span className="text-destructive">*</span></label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="field-input"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email" className="field-label">Email <span className="text-destructive">*</span></label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="subject" className="field-label">Subject <span className="text-destructive">*</span></label>
                <select
                  id="subject"
                  required
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="field-input"
                >
                  <option value="">Select a topic…</option>
                  <option>Agency / multi-workspace plan</option>
                  <option>Pricing question</option>
                  <option>Custom integration</option>
                  <option>Technical support</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="message" className="field-label">Message <span className="text-destructive">*</span></label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us how we can help…"
                  className="field-input"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong. Please try again or email us at{" "}
                  <a href="mailto:hello@revlooper.com" className="underline">
                    hello@revlooper.com
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="btn btn-primary w-full justify-center"
              >
                {status === "sending" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send message"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
