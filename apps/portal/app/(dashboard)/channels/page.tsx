"use client";

import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type LinkedInStatus = "connected" | "disconnected" | "rate_limited";
type SmsProvider = "twilio" | "esms";
type ChannelType = "linkedin" | "sms_twilio" | "sms_esms" | "zalo" | "whatsapp";

interface LinkedInAccount {
  id: string;
  name: string;
  headline: string;
  avatar: string;
  status: LinkedInStatus;
  connectsToday: number;
  connectsLimit: number;
  messagesToday: number;
  messagesLimit: number;
  pendingRequests: number;
  acceptRate: number;
}

interface SmsAccount {
  id: string;
  provider: SmsProvider;
  sender: string;
  status: "active" | "inactive";
  creditBalance: number | null;
  twilioBalance: number | null;
  sentToday: number;
  dailyLimit: number;
  deliveryRate: number;
}

interface ConsentStat {
  country: string;
  flag: string;
  total: number;
  consented: number;
  blocked: number;
}

// ─── No backend for LinkedIn/SMS yet — empty until connected ───────────────────

const MOCK_LINKEDIN: LinkedInAccount[] = [];
const MOCK_SMS: SmsAccount[] = [];

const CONSENT_STATS: ConsentStat[] = [
  { country: "Vietnam",   flag: "🇻🇳", total: 842,  consented: 619,  blocked: 223 },
  { country: "Thailand",  flag: "🇹🇭", total: 314,  consented: 271,  blocked: 43  },
  { country: "Singapore", flag: "🇸🇬", total: 520,  consented: 504,  blocked: 16  },
];

// ─── LinkedIn account card ──────────────────────────────────────────────────────

const LI_STATUS_STYLE: Record<LinkedInStatus, string> = {
  connected:    "bg-blue-50 text-blue-700",
  disconnected: "bg-slate-100 text-slate-600",
  rate_limited: "bg-amber-50 text-amber-700",
};

function LinkedInCard({ account }: { account: LinkedInAccount }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
            {account.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{account.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{account.headline}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LI_STATUS_STYLE[account.status]}`}>
          {account.status === "rate_limited" ? "Rate limited" : account.status}
        </span>
      </div>

      {account.status === "rate_limited" && (
        <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
          Daily connect limit reached. Resets at midnight. LinkedIn enforces 25 connections/day — don&apos;t attempt to bypass this.
        </div>
      )}

      {/* Quota bars */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Connect requests today</span>
            <span className={`font-medium ${account.connectsToday >= account.connectsLimit ? "text-amber-600" : "text-foreground"}`}>
              {account.connectsToday} / {account.connectsLimit}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${account.connectsToday >= account.connectsLimit ? "bg-amber-400" : "bg-blue-500"}`}
              style={{ width: `${(account.connectsToday / account.connectsLimit) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Messages today</span>
            <span className="font-medium text-foreground">{account.messagesToday} / {account.messagesLimit}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(account.messagesToday / account.messagesLimit) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-base font-bold text-foreground">{account.pendingRequests}</p>
          <p className="text-xs text-muted-foreground">Pending requests</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-base font-bold text-foreground">{account.acceptRate}%</p>
          <p className="text-xs text-muted-foreground">Accept rate</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <span className="text-muted-foreground">Via browser extension</span>
        <div className="flex gap-2">
          <button className="text-primary hover:underline">View queue</button>
          <button className="text-muted-foreground hover:text-destructive transition-colors">Disconnect</button>
        </div>
      </div>
    </div>
  );
}

// ─── SMS account card ───────────────────────────────────────────────────────────

function SmsCard({ account }: { account: SmsAccount }) {
  const isTwilio = account.provider === "twilio";
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${isTwilio ? "bg-red-600" : "bg-green-700"}`}>
            {isTwilio ? "TW" : "ES"}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{isTwilio ? "Twilio" : "ESMS.vn"}</p>
            <p className="text-xs text-muted-foreground font-mono">{account.sender}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${account.status === "active" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
          {account.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-foreground">
            {isTwilio ? `$${account.twilioBalance?.toFixed(2)}` : `${account.creditBalance?.toLocaleString()} cr`}
          </p>
          <p className="text-xs text-muted-foreground">{isTwilio ? "Twilio balance" : "ESMS credits"}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-foreground">{account.deliveryRate}%</p>
          <p className="text-xs text-muted-foreground">Delivery rate</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">SMS sent today</span>
          <span className="font-medium text-foreground">{account.sentToday} / {account.dailyLimit}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isTwilio ? "bg-red-500" : "bg-green-600"}`} style={{ width: `${(account.sentToday / account.dailyLimit) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <span className="text-muted-foreground">{isTwilio ? "International (non-VN)" : "Vietnam (+84)"}</span>
        <button className="text-primary hover:underline">Settings</button>
      </div>
    </div>
  );
}

// ─── Consent tab ────────────────────────────────────────────────────────────────

function ConsentTab() {
  return (
    <div className="space-y-4">
      <div className="card p-4 border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">PDPA consent required for Vietnamese SMS</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Under Vietnam&apos;s PDPA (Decree 13/2023/NĐ-CP), explicit consent must be recorded before sending SMS to +84 numbers.
              223 leads are currently blocked due to missing consent.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/50">
          <h3 className="text-sm font-semibold text-foreground">SMS Consent by Country</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Country</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Total leads</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Consented</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Blocked</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {CONSENT_STATS.map((c) => {
              const pct = Math.round((c.consented / c.total) * 100);
              return (
                <tr key={c.country} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="mr-2">{c.flag}</span>
                    <span className="text-sm text-foreground">{c.country}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-teal-700 font-medium">{c.consented.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">{c.blocked > 0 ? c.blocked.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 90 ? "bg-teal-500" : pct >= 70 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Collect consent automatically</h3>
        <p className="text-xs text-muted-foreground">
          Add a consent checkbox to your inbound forms — RevLooper records it in the consent log automatically.
          Alternatively, send a one-time consent request SMS to unconsented leads.
        </p>
        <div className="flex gap-3">
          <button className="btn btn-primary btn-sm text-sm">Send consent request SMS</button>
          <button className="btn btn-outline btn-sm text-sm">View unconsented leads</button>
        </div>
      </div>
    </div>
  );
}

// ─── Connect modal ───────────────────────────────────────────────────────────────

function ConnectChannelModal({ onClose }: { onClose: () => void }) {
  const [channel, setChannel] = useState<ChannelType>("linkedin");

  const CHANNELS: { id: ChannelType; label: string; icon: string; note: string }[] = [
    { id: "linkedin",   label: "LinkedIn",    icon: "in", note: "Requires RevLooper browser extension (Chrome/Edge)" },
    { id: "sms_twilio", label: "Twilio SMS",  icon: "TW", note: "International SMS — API key + phone number required" },
    { id: "sms_esms",   label: "ESMS.vn",    icon: "ES", note: "Vietnam SMS — brandname sender, ESMS API key required" },
    { id: "zalo",       label: "Zalo OA",    icon: "Z",  note: "Pro plan required — Zalo Official Account webhook" },
    { id: "whatsapp",   label: "WhatsApp",   icon: "W",  note: "Business plan required — Meta WABA approval needed" },
  ];

  const selected = CHANNELS.find((c) => c.id === channel)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Connect Channel</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-xs font-medium transition-all ${channel === c.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                <span className="text-sm font-bold">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
            {selected.note}
          </div>

          {(channel === "zalo" || channel === "whatsapp") && (
            <div className="card p-4 border-amber-200 bg-amber-50 text-center">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                {channel === "zalo" ? "Zalo" : "WhatsApp"} requires {channel === "zalo" ? "Pro" : "Business"} plan
              </p>
              <p className="text-xs text-amber-700 mb-3">Upgrade to unlock this channel.</p>
              <button className="btn btn-primary btn-sm text-sm">Upgrade plan</button>
            </div>
          )}

          {channel !== "zalo" && channel !== "whatsapp" && (
            <div className="flex gap-3">
              <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={onClose} className="btn btn-primary flex-1">
                {channel === "linkedin" ? "Install Extension" : "Connect"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

type Tab = "linkedin" | "sms" | "consent";

export default function ChannelsPage() {
  const [tab, setTab] = useState<Tab>("linkedin");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Multichannel Outreach</h1>
            <p className="text-sm text-muted-foreground mt-0.5">LinkedIn, SMS (Twilio + ESMS.vn), and future channels — all with suppression and consent gates</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Connect Channel
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "LinkedIn accounts", value: MOCK_LINKEDIN.length },
            { label: "LI connects today",  value: `${MOCK_LINKEDIN.reduce((s, a) => s + a.connectsToday, 0)} / ${MOCK_LINKEDIN.reduce((s, a) => s + a.connectsLimit, 0)}` },
            { label: "SMS sent today",     value: MOCK_SMS.reduce((s, a) => s + a.sentToday, 0).toLocaleString() },
            { label: "Consent gaps",       value: 223, warn: true },
          ].map(({ label, value, warn }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${warn ? "text-amber-600" : "text-foreground"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["linkedin", "sms", "consent"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "linkedin" ? "LinkedIn" : t === "sms" ? "SMS" : "Consent (PDPA)"}
              {t === "consent" && <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">!</span>}
            </button>
          ))}
        </div>

        {/* LinkedIn tab */}
        {tab === "linkedin" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {MOCK_LINKEDIN.map((a) => <LinkedInCard key={a.id} account={a} />)}
            </div>
            <div className="card p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">i</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">LinkedIn rate limits (enforced by RevLooper)</p>
                  <ul className="space-y-0.5 text-blue-700">
                    <li>• Max 25 connect requests/day per account (LinkedIn&apos;s hard limit)</li>
                    <li>• Max 100 messages/day per account</li>
                    <li>• Suppression list is checked before every send</li>
                    <li>• Connection note templates use AI personalization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS tab */}
        {tab === "sms" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {MOCK_SMS.map((a) => <SmsCard key={a.id} account={a} />)}
            </div>
            <div className="card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Routing rules</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇻🇳</span>
                  <span>Vietnam numbers <span className="font-mono">+84</span> → routed to <span className="font-semibold text-foreground">ESMS.vn</span> (requires PDPA consent check)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🌍</span>
                  <span>All other countries → routed to <span className="font-semibold text-foreground">Twilio</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🚫</span>
                  <span>Suppression list checked synchronously before every SMS dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consent tab */}
        {tab === "consent" && <ConsentTab />}
      </div>

      {showModal && <ConnectChannelModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
