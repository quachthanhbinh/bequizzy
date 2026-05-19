"use client";

import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import type { ScoreLabel } from "@/lib/api/leads";

const TIER_STYLE: Record<ScoreLabel, string> = {
  hot:  "bg-red-50 text-red-700 border-red-200",
  warm: "bg-amber-50 text-amber-700 border-amber-200",
  cold: "bg-blue-50 text-blue-600 border-blue-200",
};

const TIER_BAR: Record<ScoreLabel, string> = {
  hot:  "bg-red-400",
  warm: "bg-amber-400",
  cold: "bg-blue-400",
};

export default function ScoringPage() {
  const [filter, setFilter] = useState<"all" | ScoreLabel>("all");
  const { data, isLoading } = useLeads({ pageSize: 100 });

  const allLeads = data?.items ?? [];
  const visible = filter === "all" ? allLeads : allLeads.filter((l) => l.scoreLabel === filter);
  const counts = {
    hot:  allLeads.filter((l) => l.scoreLabel === "hot").length,
    warm: allLeads.filter((l) => l.scoreLabel === "warm").length,
    cold: allLeads.filter((l) => l.scoreLabel === "cold").length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead Scoring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-powered scores based on engagement, fit and intent signals
            </p>
          </div>
          <button type="button" className="btn btn-secondary text-sm">
            Recalculate scores
          </button>
        </div>

        {isLoading ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted-foreground">Loading leadsâ€¦</p>
          </div>
        ) : allLeads.length === 0 ? (
          <div data-testid="scoring-empty-state" className="card p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">No scored leads yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Lead scores appear here once leads are enrolled in sequences and start engaging with your outreach.
            </p>
          </div>
        ) : (
          <>
            {/* Tier summary */}
            <div className="grid grid-cols-3 gap-3">
              {(["hot", "warm", "cold"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFilter(filter === tier ? "all" : tier)}
                  className={`card p-4 text-left transition-all ${filter === tier ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TIER_STYLE[tier]}`}
                    >
                      {tier}
                    </span>
                    <span className="text-2xl font-bold text-foreground">{counts[tier]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tier === "hot" ? "Score â‰¥ 75" : tier === "warm" ? "Score 40â€“74" : "Score < 40"}
                  </p>
                </button>
              ))}
            </div>

            {/* Lead table */}
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((lead) => (
                    <tr key={lead.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.company ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TIER_STYLE[lead.scoreLabel]}`}
                        >
                          {lead.scoreLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${TIER_BAR[lead.scoreLabel]}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground">{lead.score}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No {filter} leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
