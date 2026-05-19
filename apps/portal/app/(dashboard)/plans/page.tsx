"use client";

import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type Plan = "free" | "pro" | "business" | "agency";
type GateId = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9" | "G10" | "G11" | "G12";

interface Gate {
  id: GateId;
  feature: string;
  description: string;
  freePlan: Plan;
  targetPlan: Plan;
  preview: boolean;
  hitRate: number;    // mock: gate hits/month
  convRate: number;   // mock: gate-to-upgrade %
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

const CURRENT_PLAN: Plan = "free";

const PLAN_ORDER: Plan[] = ["free", "pro", "business", "agency"];

const GATES: Gate[] = [
  { id: "G1",  feature: "Lead limit",                description: "Import your 101st lead",              freePlan: "free",     targetPlan: "pro",      preview: true,  hitRate: 148, convRate: 9.5  },
  { id: "G2",  feature: "AI credits",                description: "AI draft depletes 50 credits",        freePlan: "free",     targetPlan: "pro",      preview: true,  hitRate: 312, convRate: 11.2 },
  { id: "G3",  feature: "LinkedIn step",             description: "Add LinkedIn connect step",            freePlan: "free",     targetPlan: "pro",      preview: true,  hitRate: 94,  convRate: 7.8  },
  { id: "G4",  feature: "Remove branding",           description: "Custom booking page without logo",    freePlan: "free",     targetPlan: "pro",      preview: false, hitRate: 67,  convRate: 4.2  },
  { id: "G5",  feature: "2nd active campaign",       description: "First campaign got a reply",          freePlan: "free",     targetPlan: "pro",      preview: true,  hitRate: 53,  convRate: 14.1 },
  { id: "G6",  feature: "Zalo / WhatsApp",           description: "Leads prefer Zalo messaging",         freePlan: "pro",      targetPlan: "business", preview: false, hitRate: 29,  convRate: 3.1  },
  { id: "G7",  feature: "AI Reply Assistant",        description: "10+ inbox replies queued",            freePlan: "pro",      targetPlan: "business", preview: false, hitRate: 88,  convRate: 8.4  },
  { id: "G8",  feature: "CRM deal values",           description: "Pipeline grew; needs deal amounts",   freePlan: "pro",      targetPlan: "business", preview: false, hitRate: 41,  convRate: 5.7  },
  { id: "G9",  feature: "3rd+ seat",                 description: "Team hired an assistant",             freePlan: "pro",      targetPlan: "business", preview: false, hitRate: 22,  convRate: 6.3  },
  { id: "G10", feature: "2nd workspace",             description: "Managing a second client",            freePlan: "business", targetPlan: "agency",   preview: false, hitRate: 14,  convRate: 7.9  },
  { id: "G11", feature: "API access",                description: "Automate lead imports",               freePlan: "business", targetPlan: "agency",   preview: false, hitRate: 31,  convRate: 12.4 },
  { id: "G12", feature: "White-label booking",       description: "Present to a client",                 freePlan: "business", targetPlan: "agency",   preview: false, hitRate: 9,   convRate: 5.1  },
];

const PLAN_DETAILS: Record<Plan, { label: string; price: string; color: string; features: string[] }> = {
  free: {
    label: "Free",
    price: "$0",
    color: "bg-slate-100 text-slate-700",
    features: ["100 leads", "50 AI credits/mo", "1 active campaign", "Email only", "RevLooper branding"],
  },
  pro: {
    label: "Pro",
    price: "$49/mo",
    color: "bg-blue-100 text-blue-700",
    features: ["5,000 leads", "1,000 AI credits/mo", "Unlimited campaigns", "LinkedIn + SMS", "Custom branding", "2 seats"],
  },
  business: {
    label: "Business",
    price: "$149/mo",
    color: "bg-violet-100 text-violet-700",
    features: ["50,000 leads", "5,000 AI credits/mo", "AI Reply Assistant", "Zalo + WhatsApp", "CRM deal values", "10 seats"],
  },
  agency: {
    label: "Agency",
    price: "$399/mo",
    color: "bg-amber-100 text-amber-700",
    features: ["Unlimited leads", "Unlimited AI credits", "Multiple workspaces", "White-label", "API access", "Unlimited seats"],
  },
};

// ─── GateWall preview component ─────────────────────────────────────────────────

function GateWallPreview({ gate, onClose }: { gate: Gate; onClose: () => void }) {
  const target = PLAN_DETAILS[gate.targetPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm border border-border">
        {/* Icon */}
        <div className="flex justify-center pt-7 pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          </div>
        </div>

        <div className="px-6 pb-6 text-center space-y-3">
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${target.color}`}>{target.label} feature</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{gate.feature}</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve just hit the <span className="font-semibold text-foreground">{gate.description.toLowerCase()}</span> limit on your Free plan.
            Upgrade to {target.label} to keep going.
          </p>

          {/* Preview (for gates that show "what you're missing") */}
          {gate.preview && (
            <div className="bg-secondary/50 rounded-xl p-4 border border-border text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What you&apos;re unlocking</p>
              <ul className="space-y-1.5">
                {PLAN_DETAILS[gate.targetPlan].features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                    <svg className="h-3.5 w-3.5 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button className="btn btn-primary w-full">
              Upgrade to {target.label} — {target.price}
            </button>
            <button onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan comparison card ────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const details = PLAN_DETAILS[plan];
  const isUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(CURRENT_PLAN);

  return (
    <div className={`card p-5 space-y-4 ${isCurrent ? "border-primary border-2 ring-2 ring-primary/10" : ""}`}>
      {isCurrent && (
        <div className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full w-fit">Current plan</div>
      )}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{details.label}</h3>
          <span className="text-lg font-bold text-foreground">{details.price}</span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {details.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-foreground">
            <svg className="h-3.5 w-3.5 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            {f}
          </li>
        ))}
      </ul>
      {isUpgrade && (
        <button className="btn btn-primary w-full text-sm">Upgrade to {details.label}</button>
      )}
      {isCurrent && (
        <button className="btn btn-outline w-full text-sm" disabled>Current plan</button>
      )}
      {!isUpgrade && !isCurrent && (
        <button className="btn btn-outline w-full text-sm text-muted-foreground" disabled>Downgrade</button>
      )}
    </div>
  );
}

// ─── Gate table row ──────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<Plan, string> = {
  free:     "bg-slate-100 text-slate-600",
  pro:      "bg-blue-50 text-blue-700",
  business: "bg-violet-50 text-violet-700",
  agency:   "bg-amber-50 text-amber-700",
};

function GateRow({ gate, onPreview }: { gate: Gate; onPreview: () => void }) {
  const isBlocked = PLAN_ORDER.indexOf(CURRENT_PLAN) < PLAN_ORDER.indexOf(gate.targetPlan);
  const convColor = gate.convRate >= 8 ? "text-teal-700" : gate.convRate >= 5 ? "text-foreground" : "text-amber-600";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isBlocked
            ? <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            : <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          }
          <span className="text-sm font-medium text-foreground">{gate.feature}</span>
          {gate.id}
        </div>
        <p className="text-xs text-muted-foreground ml-6">{gate.description}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[gate.freePlan]}`}>
          {PLAN_DETAILS[gate.freePlan].label}
        </span>
        <span className="mx-1.5 text-muted-foreground">→</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[gate.targetPlan]}`}>
          {PLAN_DETAILS[gate.targetPlan].label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{gate.hitRate}/mo</td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${convColor}`}>{gate.convRate}%</span>
      </td>
      <td className="px-4 py-3">
        {gate.preview
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">Preview</span>
          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">CTA only</span>
        }
      </td>
      <td className="px-4 py-3">
        <button onClick={onPreview} className="text-xs text-primary hover:underline">Preview wall</button>
      </td>
    </tr>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

type Tab = "plans" | "gates";

export default function PlansPage() {
  const [tab, setTab] = useState<Tab>("plans");
  const [previewGate, setPreviewGate] = useState<Gate | null>(null);

  const totalHits = GATES.reduce((s, g) => s + g.hitRate, 0);
  const avgConv = (GATES.reduce((s, g) => s + g.convRate, 0) / GATES.length).toFixed(1);
  const highConvGates = GATES.filter((g) => g.convRate >= 8).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plans & Feature Gates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare plans, track gate-to-upgrade conversion, and preview how each gate wall looks to users
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="text-2xl font-bold text-foreground mt-1">Free</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Gate hits / month</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalHits}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Avg gate conversion</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{avgConv}%</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">High-conv gates (≥8%)</p>
            <p className="text-2xl font-bold text-foreground mt-1">{highConvGates} / {GATES.length}</p>
          </div>
        </div>

        {/* Design principle callout */}
        <div className="card p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">✦</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Design principle: never show a hard error</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every gate shows a <span className="font-medium text-foreground">GateWall</span> component — a value prompt with upgrade CTA — not a 403 or toast error.
                G1–G5 include a &quot;what you&apos;re missing&quot; preview panel. Click any row below to see the wall in action.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["plans", "gates"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "gates" ? "Gate inventory" : "Plan comparison"}
            </button>
          ))}
        </div>

        {/* Plans tab */}
        {tab === "plans" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((plan) => (
              <PlanCard key={plan} plan={plan} isCurrent={plan === CURRENT_PLAN} />
            ))}
          </div>
        )}

        {/* Gates tab */}
        {tab === "gates" && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Feature / trigger</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Upgrade path</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Hits</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Conv.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Preview</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {GATES.map((gate) => (
                  <GateRow key={gate.id} gate={gate} onPreview={() => setPreviewGate(gate)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Low conversion warning */}
        {tab === "gates" && (
          <div className="card p-4 border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800 mb-1">Gates below 5% conversion</p>
            <div className="flex flex-wrap gap-2">
              {GATES.filter((g) => g.convRate < 5).map((g) => (
                <button key={g.id} onClick={() => setPreviewGate(g)} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
                  {g.id}: {g.feature} ({g.convRate}%)
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-2">Review these gate walls — copy or preview may need improvement to increase upgrade pressure.</p>
          </div>
        )}
      </div>

      {previewGate && <GateWallPreview gate={previewGate} onClose={() => setPreviewGate(null)} />}
    </div>
  );
}
