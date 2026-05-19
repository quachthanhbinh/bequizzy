"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FormStatus = "active" | "paused" | "draft" | "archived";
type FormType = "landing_page" | "popup" | "inline" | "chatbot";

interface InboundForm {
  id: string;
  name: string;
  type: FormType;
  status: FormStatus;
  campaign: string | null;
  url: string;
  views: number;
  submissions: number;
  convRate: number;
  leads: number;
  createdAt: string;
}

// ─── No forms API service yet — empty until backend ships ──────────────────────

const MOCK_FORMS: InboundForm[] = [];

// ─── Style maps ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<FormStatus, string> = {
  active:   "bg-teal-50 text-teal-700",
  paused:   "bg-amber-50 text-amber-700",
  draft:    "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-400",
};

const TYPE_STYLE: Record<FormType, string> = {
  landing_page: "bg-blue-50 text-blue-700",
  popup:        "bg-violet-50 text-violet-700",
  inline:       "bg-amber-50 text-amber-700",
  chatbot:      "bg-primary/10 text-primary",
};

const TYPE_LABEL: Record<FormType, string> = {
  landing_page: "Landing Page",
  popup:        "Popup",
  inline:       "Inline Form",
  chatbot:      "Chatbot Widget",
};

const TYPE_ICON: Record<FormType, JSX.Element> = {
  landing_page: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  popup:        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>,
  inline:       <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>,
  chatbot:      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
};

// ─── New form modal (mock) ──────────────────────────────────────────────────────

function NewFormModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FormType>("landing_page");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setTimeout(() => { setCreating(false); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">New Inbound Form</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Form name <span className="text-destructive">*</span></label>
            <input
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Free Demo Request"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Form type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TYPE_LABEL) as [FormType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TYPE_STYLE[t]}`}>{TYPE_ICON[t]}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
            {type === "landing_page" && "A dedicated page hosted at rvlp.co/your-slug. Share the link in ads, emails, or social media."}
            {type === "popup" && "An overlay that appears on your website after a delay or scroll trigger. Paste the embed code on your site."}
            {type === "inline" && "A form that embeds directly into a page or blog post. Great for content-driven lead capture."}
            {type === "chatbot" && "A conversational chatbot widget that qualifies leads with guided questions. Embed on your site or share a direct link."}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={creating || !name.trim()} className="btn btn-primary flex-1">
              {creating ? "Creating…" : "Create Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Summary stats ──────────────────────────────────────────────────────────────

function SummaryStats({ forms }: { forms: InboundForm[] }) {
  const active = forms.filter((f) => f.status === "active");
  const totalViews = forms.reduce((s, f) => s + f.views, 0);
  const totalSubmissions = forms.reduce((s, f) => s + f.submissions, 0);
  const avgConv = active.length > 0 ? (active.reduce((s, f) => s + f.convRate, 0) / active.length).toFixed(1) : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Active forms", value: active.length },
        { label: "Total views", value: totalViews.toLocaleString() },
        { label: "Submissions", value: totalSubmissions.toLocaleString() },
        { label: "Avg. conv. rate", value: `${avgConv}%` },
      ].map(({ label, value }) => (
        <div key={label} className="card p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Form card ─────────────────────────────────────────────────────────────────

function FormCard({ form }: { form: InboundForm }) {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(`https://${form.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_STYLE[form.type]}`}>
            {TYPE_ICON[form.type]}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{form.name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[form.status]}`}>{form.status}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLE[form.type]}`}>{TYPE_LABEL[form.type]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Edit form">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Preview">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-base font-bold text-foreground">{form.views > 0 ? form.views.toLocaleString() : "—"}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>
        <div>
          <p className={`text-base font-bold ${form.convRate >= 5 ? "text-teal-600" : form.convRate > 0 ? "text-foreground" : "text-muted-foreground"}`}>
            {form.convRate > 0 ? `${form.convRate}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Conv. rate</p>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{form.leads > 0 ? form.leads : "—"}</p>
          <p className="text-xs text-muted-foreground">Leads captured</p>
        </div>
      </div>

      {/* URL row + Campaign */}
      <div className="space-y-2 text-xs">
        {form.campaign && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
            <span>{form.campaign}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="flex-1 bg-secondary px-2.5 py-1.5 rounded-lg text-muted-foreground font-mono truncate">{form.url}</span>
          <button
            onClick={copyUrl}
            className="shrink-0 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
        <span>Created {form.createdAt}</span>
        <div className="flex items-center gap-2">
          {form.status === "active" && (
            <button className="text-amber-600 hover:underline">Pause</button>
          )}
          {form.status === "paused" && (
            <button className="text-teal-600 hover:underline">Resume</button>
          )}
          {form.status === "draft" && (
            <button className="text-teal-600 hover:underline">Publish</button>
          )}
          {form.status !== "archived" && (
            <button className="text-muted-foreground hover:text-foreground hover:underline">Archive</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FormType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "all">("all");

  const visible = MOCK_FORMS.filter((f) => {
    if (typeFilter !== "all" && f.type !== typeFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Inbound Forms</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Landing pages, popups, and widgets that capture leads directly into your pipeline</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Form
          </button>
        </div>

        {/* Summary stats */}
        <SummaryStats forms={MOCK_FORMS} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search forms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground self-center pr-1">Type:</span>
            {(["all", "landing_page", "popup", "inline", "chatbot"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                {t === "all" ? "All types" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <span className="text-xs text-muted-foreground self-center pr-1">Status:</span>
            {(["all", "active", "paused", "draft", "archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="card p-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              </div>
            </div>
            <p className="text-foreground font-medium mb-1">No forms match your filters</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting the filters or create your first inbound form.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">Create your first form</button>
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        )}

        {/* Getting started tip */}
        {MOCK_FORMS.filter((f) => f.status === "active").length < 3 && (
          <div className="card p-5 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tip: Combine inbound + outbound for 3× more replies</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Link a landing page to a campaign. Leads that fill your form are automatically enrolled in the matching sequence — no manual work.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && <NewFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
