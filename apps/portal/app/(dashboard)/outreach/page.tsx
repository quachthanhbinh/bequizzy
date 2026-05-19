"use client";

import { useState } from "react";
import { useMailboxes, useSuppression, useAddSuppression, useRemoveSuppression } from "@/hooks/useOutreach";
import type { Mailbox } from "@/lib/api/outreach";

const PROVIDER_LABEL: Record<string, string> = {
  gmail:     "Google Workspace",
  outlook:   "Microsoft 365",
  sendgrid:  "SendGrid",
  postmark:  "Postmark",
  ses:       "AWS SES",
};

const PROVIDER_ICON: Record<string, string> = {
  gmail:    "G",
  outlook:  "O",
  sendgrid: "SG",
  postmark: "PM",
  ses:      "SES",
};

const REASON_STYLE: Record<string, string> = {
  bounce:      "bg-red-50 text-red-700",
  complaint:   "bg-orange-50 text-orange-700",
  unsubscribe: "bg-slate-100 text-slate-600",
  manual:      "bg-slate-100 text-slate-600",
};

// ─── DKIM/DMARC/SPF checklist ──────────────────────────────────────────────────

const DNS_CHECKS = [
  { label: "SPF record",   detail: "v=spf1 include:_spf.google.com ~all", ok: true  },
  { label: "DKIM (2048b)", detail: "google._domainkey.revlooper.com",      ok: true  },
  { label: "DMARC policy", detail: "p=quarantine; rua=mailto:dmarc@...",   ok: true  },
  { label: "BIMI logo",    detail: "brand indicator not yet configured",   ok: false },
  { label: "MX records",   detail: "Primary MX: aspmx.l.google.com",      ok: true  },
];

// ─── Connect Mailbox Modal ──────────────────────────────────────────────────────

function ConnectModal({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<"gmail" | "outlook">("gmail");
  const [email, setEmail] = useState("");
  const [connecting, setConnecting] = useState(false);

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setConnecting(true);
    setTimeout(() => { setConnecting(false); onClose(); }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Connect Mailbox</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleConnect} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Provider</label>
        <div className="grid grid-cols-2 gap-2">
              {(["gmail", "outlook"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${provider === p ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  <span className="text-base font-bold">{PROVIDER_ICON[p]}</span>
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email address <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@yourdomain.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            You&apos;ll be redirected to {provider === "gmail" ? "Google" : "Microsoft"} OAuth to grant send permissions. RevLooper only requests Send and Labels scopes.
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-foreground">Enable warmup schedule (recommended for new mailboxes)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={connecting || !email.trim()} className="btn btn-primary flex-1">
              {connecting ? "Connecting…" : `Authorize with ${provider === "gmail" ? "Google" : "Microsoft"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mailbox Card ───────────────────────────────────────────────────────────────

function MailboxCard({ mb }: { mb: Mailbox }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">
            {PROVIDER_ICON[mb.provider] ?? mb.provider.toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{mb.email}</p>
            <p className="text-xs text-muted-foreground">{PROVIDER_LABEL[mb.provider] ?? mb.provider}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${mb.is_active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
          {mb.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-foreground">{mb.daily_send_limit}</p>
          <p className="text-xs text-muted-foreground">Daily limit</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{new Date(mb.created_at).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">Connected</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <span className="text-muted-foreground">{mb.display_name ?? ""}</span>
        <button className="text-muted-foreground hover:text-foreground hover:underline">Settings</button>
      </div>
    </div>
  );
}

// ─── Suppression list tab ───────────────────────────────────────────────────────

function SuppressionTab() {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const { data: suppressed, isLoading } = useSuppression();
  const addSuppression = useAddSuppression();
  const removeSuppression = useRemoveSuppression();

  const all = suppressed ?? [];
  const visible = all.filter((s) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    if (!newEmail.trim()) return;
    addSuppression.mutate(
      { email: newEmail.trim() },
      { onSuccess: () => { setAdding(false); setNewEmail(""); } }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search suppressed emails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setAdding(true)} className="btn btn-outline gap-1.5 text-sm shrink-0">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add manually
        </button>
      </div>

      {adding && (
        <div className="card p-4 flex items-center gap-3">
          <input
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="email@example.com"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoFocus
          />
          <button onClick={handleAdd} disabled={addSuppression.isPending} className="btn btn-primary btn-sm text-sm">Add</button>
          <button onClick={() => { setAdding(false); setNewEmail(""); }} className="btn btn-outline btn-sm text-sm">Cancel</button>
        </div>
      )}

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reason</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Suppressed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${REASON_STYLE[s.reason] ?? "bg-slate-100 text-slate-600"}`}>{s.reason}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={removeSuppression.isPending}
                    onClick={() => removeSuppression.mutate(s.email)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && visible.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No suppressed emails{search ? " match your search" : ""}.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {all.length} total suppressed addresses. Suppressed emails are never contacted — even if manually added to a campaign.
      </p>
    </div>
  );
}

// ─── DNS checklist tab ──────────────────────────────────────────────────────────

function DnsTab() {
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">DNS Authentication Checklist</h3>
        <p className="text-xs text-muted-foreground">Checked against revlooper.com. Fixes here won&apos;t block sending but will improve deliverability scores.</p>
        <div className="space-y-2">
          {DNS_CHECKS.map(({ label, detail, ok }) => (
            <div key={label} className="flex items-start gap-3">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${ok ? "bg-teal-100 text-teal-600" : "bg-red-100 text-red-600"}`}>
                {ok
                  ? <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  : <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{detail}</p>
              </div>
              {!ok && <button className="text-xs text-primary hover:underline shrink-0">How to fix</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 space-y-3 border-primary/20 bg-primary/5">
        <h3 className="text-sm font-semibold text-foreground">Warmup Progress</h3>
        <p className="text-xs text-muted-foreground">The warmup schedule gradually increases daily send volume to build inbox reputation before hitting full capacity.</p>
        <div className="space-y-3">
          {[
            { phase: "Days 1–7",   limit: 10,  active: false, done: true  },
            { phase: "Days 8–14",  limit: 25,  active: true,  done: false },
            { phase: "Days 15–21", limit: 50,  active: false, done: false },
            { phase: "Days 22–30", limit: 100, active: false, done: false },
            { phase: "Full",       limit: 200, active: false, done: false },
          ].map(({ phase, limit, active, done }) => (
            <div key={phase} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-teal-100 text-teal-600" : active ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                {done ? "✓" : active ? "→" : "·"}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{phase}</span>
                <span className="text-xs text-muted-foreground">{limit} emails/day</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">outreach@revlooper.io is currently on day 12 of warmup.</p>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

type OutreachTab = "mailboxes" | "suppression" | "dns";

export default function OutreachPage() {
  const [tab, setTab] = useState<OutreachTab>("mailboxes");
  const [showModal, setShowModal] = useState(false);
  const { data: mailboxes, isLoading } = useMailboxes();

  const allMailboxes = mailboxes ?? [];
  const activeMailboxes = allMailboxes.filter((m) => m.is_active).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Email Outreach</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage mailboxes, monitor deliverability health, and control suppression lists</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Connect Mailbox
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Active mailboxes", value: `${activeMailboxes}/${allMailboxes.length}` },
            { label: "Total mailboxes",  value: allMailboxes.length },
            { label: "Status", value: isLoading ? "Loading…" : allMailboxes.length === 0 ? "No mailboxes" : "Connected" },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["mailboxes", "suppression", "dns"] as OutreachTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "dns" ? "DNS & Warmup" : t === "suppression" ? "Suppression list" : "Mailboxes"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "mailboxes" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && <p className="text-sm text-muted-foreground col-span-3">Loading mailboxes…</p>}
            {!isLoading && allMailboxes.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <p className="text-sm text-muted-foreground mb-3">No mailboxes connected yet.</p>
                <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">Connect your first mailbox</button>
              </div>
            )}
            {allMailboxes.map((mb) => <MailboxCard key={mb.id} mb={mb} />)}
          </div>
        )}
        {tab === "suppression" && <SuppressionTab />}
        {tab === "dns" && <DnsTab />}
      </div>

      {showModal && <ConnectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
