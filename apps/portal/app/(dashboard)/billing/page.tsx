"use client";

import { useState } from "react";
import { useBillingPlan, useCreditHistory } from "@/hooks/useBilling";
import type { PlanId } from "@/lib/api/billing";

const PLANS: { id: PlanId; name: string; price: number; currency: string; period: string; credits: number; features: string[]; popular?: boolean }[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    period: "forever",
    credits: 100,
    features: [
      "100 AI credits/month",
      "Up to 250 leads",
      "1 active campaign",
      "Basic sequences (3 steps)",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    currency: "USD",
    period: "/month",
    credits: 2000,
    features: [
      "2,000 AI credits/month",
      "Up to 2,500 leads",
      "5 active campaigns",
      "Unlimited sequence steps",
      "Meeting booking",
      "Email support",
    ],
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    currency: "USD",
    period: "/month",
    credits: 8000,
    features: [
      "8,000 AI credits/month",
      "Up to 10,000 leads",
      "Unlimited campaigns",
      "AI Brain (full RAG)",
      "CRM + Inbox",
      "Multichannel (LinkedIn, SMS)",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 199,
    currency: "USD",
    period: "/month",
    credits: 30000,
    features: [
      "30,000 AI credits/month",
      "Unlimited leads",
      "Unlimited campaigns",
      "Agency workspace management",
      "Custom AI persona",
      "SLA + dedicated support",
    ],
  },
];

const CREDIT_COSTS: { operation: string; cost: number; category: string }[] = [
  { operation: "Email draft (AI)", cost: 5, category: "Email" },
  { operation: "Personalised variant (A/B)", cost: 3, category: "Email" },
  { operation: "Lead enrichment", cost: 10, category: "Leads" },
  { operation: "AI lead scoring", cost: 2, category: "Leads" },
  { operation: "AI Brain knowledge chunk", cost: 1, category: "AI Brain" },
  { operation: "AI reply classification", cost: 1, category: "Inbox" },
  { operation: "AI-suggested reply draft", cost: 4, category: "Inbox" },
];

const INVOICE_STYLE: Record<string, string> = {
  paid:    "bg-teal-50 text-teal-700",
  pending: "bg-amber-50 text-amber-700",
  failed:  "bg-red-50 text-red-600",
  allocation: "bg-blue-50 text-blue-700",
  deduction:  "bg-red-50 text-red-600",
  refund:     "bg-teal-50 text-teal-700",
  topup:      "bg-purple-50 text-purple-700",
  adjustment: "bg-slate-100 text-slate-600",
};

export default function BillingPage() {
  const [tab, setTab] = useState<"overview" | "plans" | "credits" | "invoices">("overview");
  const { data: billingPlan, isLoading: planLoading } = useBillingPlan();
  const { data: creditHistory, isLoading: historyLoading } = useCreditHistory();

  const planId = billingPlan?.plan ?? "free";
  const creditsUsed = billingPlan
    ? billingPlan.credits_monthly_allocation - billingPlan.credits_balance + billingPlan.topup_credits
    : 0;
  const creditsTotal = billingPlan?.credits_monthly_allocation ?? 0;
  const pct = creditsTotal > 0 ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)) : 0;
  const currentPlan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 py-5 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Billing & Credits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your plan, credit usage, and invoices.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["overview", "plans", "credits", "invoices"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-4">
            {planLoading && <p className="text-sm text-muted-foreground">Loading billing info…</p>}
            {/* Current plan */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-foreground">{currentPlan.name} plan</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${currentPlan.price}/month
                    {billingPlan?.credits_reset_at
                      ? ` · Renews ${new Date(billingPlan.credits_reset_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <button type="button" onClick={() => setTab("plans")} className="btn btn-secondary text-sm shrink-0">
                  Change plan
                </button>
              </div>

              {/* Credit usage bar */}
              <div data-testid="credit-meter" className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">AI credits used this cycle</span>
                  <span className="font-medium text-foreground">{creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {pct}% used
                  {billingPlan?.credits_reset_at
                    ? ` · Resets ${new Date(billingPlan.credits_reset_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment method</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-secondary rounded flex items-center justify-center">
                  <svg width="24" height="16" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="4" fill="#1434CB"/><path d="M16.4 8.4L14 15.6h-2.2L9.6 10c-.1-.5-.3-.7-.7-.9-.7-.4-1.8-.7-2.9-.8L6 8.4h3.5c.5 0 .9.3 1 .8l.9 4.7 2.2-5.5h2.8zm5.4 4.8c0-2.1-2.9-2.3-2.9-3.2 0-.3.3-.6.9-.7.4 0 1.4 0 2.6.6l.5-2.2C22.2 7.3 21.2 7 20 7c-2.6 0-4.4 1.4-4.4 3.4 0 1.5 1.3 2.3 2.3 2.8 1 .5 1.4.9 1.4 1.3 0 .7-.8 1-1.6 1-1.3 0-2.1-.4-2.7-.6l-.5 2.2c.6.3 1.7.5 2.8.5 2.8.1 4.5-1.3 4.5-3.4zm7 2.4h2.4L29.5 8.4h-2.2c-.5 0-.9.3-1.1.7l-3.8 6.5h2.7l.5-1.4h3.2l.2 1.4zm-2.8-3.3l1.3-3.6.7 3.6h-2z" fill="white"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 09/27</p>
                </div>
                <button type="button" className="ml-auto text-xs text-primary hover:underline">Update</button>
              </div>
            </div>
          </div>
        )}

        {/* Plans tab */}
        {tab === "plans" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === planId;
                return (
                  <div key={plan.id} className={`card p-5 relative ${isCurrent ? "ring-2 ring-primary" : ""} ${plan.popular ? "ring-2 ring-primary/50" : ""}`}>
                    {plan.popular && !isCurrent && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        Most popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        Current plan
                      </span>
                    )}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.credits.toLocaleString()} AI credits/month</p>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <svg className="text-primary mt-0.5 shrink-0" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={isCurrent}
                      className={`w-full btn text-sm ${isCurrent ? "btn-ghost opacity-50" : "btn-primary"}`}
                    >
                      {isCurrent ? "Current plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              All plans include a 14-day free trial. No credit card required for Free plan.
              Payments processed securely via Paddle.
            </p>
          </div>
        )}

        {/* Credits tab */}
        {tab === "credits" && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">How credits work</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Credits are consumed when the AI performs operations on your behalf. They reset at the start of each billing cycle.
                You can top up at any time.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-xs font-semibold text-muted-foreground">Operation</th>
                    <th className="pb-2 text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="pb-2 text-xs font-semibold text-muted-foreground text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CREDIT_COSTS.map((row) => (
                    <tr key={row.operation}>
                      <td className="py-2.5 text-foreground text-sm">{row.operation}</td>
                      <td className="py-2.5 text-muted-foreground text-xs">{row.category}</td>
                      <td className="py-2.5 text-right font-medium text-foreground">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Buy extra credits</h3>
              <div className="grid grid-cols-3 gap-3">
                {[{ credits: 1000, price: 9 }, { credits: 5000, price: 39 }, { credits: 15000, price: 99 }].map((pkg) => (
                  <button key={pkg.credits} type="button" className="card p-3 text-center hover:ring-2 hover:ring-primary transition-all space-y-1">
                    <p className="text-base font-bold text-foreground">{pkg.credits.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">credits</p>
                    <p className="text-sm font-semibold text-primary">${pkg.price}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Extra credits never expire and roll over to the next cycle.</p>
            </div>
          </div>
        )}

        {/* Invoices tab */}
        {tab === "invoices" && (
          <div className="card overflow-hidden">
            {historyLoading && <p className="px-4 py-3 text-sm text-muted-foreground">Loading history…</p>}
            {!historyLoading && (!creditHistory || creditHistory.length === 0) && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No credit transactions yet.</p>
            )}
            {(creditHistory ?? []).length > 0 && (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Credits</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(creditHistory ?? []).map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-foreground">{tx.description ?? tx.feature_key ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <span className={tx.transaction_type === "deduction" ? "text-red-600" : "text-teal-600"}>
                          {tx.transaction_type === "deduction" ? "−" : "+"}{Math.abs(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STYLE[tx.transaction_type] ?? "bg-slate-100 text-slate-600"}`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
