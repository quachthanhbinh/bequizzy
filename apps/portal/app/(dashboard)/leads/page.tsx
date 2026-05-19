"use client";

import { useState } from "react";
import { useLeads, type Lead, type LeadStatus, type ScoreLabel } from "@/hooks/useLeads";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";

const STATUS_STYLE: Record<LeadStatus, string> = {
  verified:   "bg-teal-50 text-teal-700",
  unverified: "bg-slate-100 text-slate-600",
  invalid:    "bg-red-50 text-red-600",
  risky:      "bg-amber-50 text-amber-700",
};

const SCORE_STYLE: Record<ScoreLabel, string> = {
  hot:  "bg-red-50 text-red-600",
  warm: "bg-amber-50 text-amber-700",
  cold: "bg-slate-100 text-slate-500",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreLabel | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const { data, isLoading, isError } = useLeads({
    search,
    status: statusFilter,
  });

  const allLeads = data?.items ?? [];
  const visible = allLeads.filter((l: Lead) => {
    if (scoreFilter !== "all" && l.scoreLabel !== scoreFilter) return false;
    return true;
  });
  const totalCount = data?.total ?? visible.length;
  const hotCount = visible.filter((l: Lead) => l.scoreLabel === "hot").length;

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map((l: Lead) => l.id)));
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div data-tour="leads-header" className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${totalCount} leads · ${hotCount} hot`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button data-tour="leads-import-btn" className="btn btn-outline btn-sm gap-1.5">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Import CSV
            </button>
            <button className="btn btn-primary btn-sm gap-1.5">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* Error banner */}
        {isError && (
          <div data-testid="leads-error-banner" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load leads. Check your connection and try again.
          </div>
        )}

        {/* Filters */}
        <div data-tour="leads-search" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Status:</span>
            {(["all","verified","unverified","risky","invalid"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Score:</span>
            {(["all","hot","warm","cold"] as const).map((s) => (
              <button key={s} onClick={() => setScoreFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${scoreFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium text-primary">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <button className="btn btn-outline btn-sm">Add to Campaign</button>
              <button className="btn btn-outline btn-sm">Tag</button>
              <button className="btn btn-outline btn-sm">Export</button>
              <button className="btn btn-outline btn-sm text-destructive hover:bg-destructive/5">Delete</button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div data-testid="leads-skeleton" className="card overflow-hidden">
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="h-4 w-4 rounded bg-secondary" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-36 rounded bg-secondary" />
                    <div className="h-3 w-48 rounded bg-secondary" />
                  </div>
                  <div className="h-3.5 w-24 rounded bg-secondary" />
                  <div className="h-5 w-14 rounded-full bg-secondary" />
                  <div className="h-5 w-16 rounded-full bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="card overflow-hidden">
            <div data-tour="leads-table" className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="w-10 px-4 py-3 text-left">
                      <input type="checkbox" checked={selected.size === visible.length && visible.length > 0} onChange={toggleAll}
                        className="h-4 w-4 rounded border-border accent-primary" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Added</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('input[type="checkbox"]')) return;
                        setOpenLeadId(l.id);
                      }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)}
                          className="h-4 w-4 rounded border-border accent-primary" />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{l.firstName} {l.lastName}</p>
                        <p className="text-xs text-muted-foreground">{l.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-foreground">{l.company}</p>
                        <p className="text-xs text-muted-foreground">{l.title} · {l.country}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span data-testid="lead-score-badge" className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SCORE_STYLE[l.scoreLabel]}`}>
                            {l.scoreLabel}
                          </span>
                          <span className="text-xs text-muted-foreground">{l.score}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[l.status]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground capitalize">{l.source.replace(/_/g, " ")}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.createdAt}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setOpenLeadId(l.id); }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Open lead detail"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 && !isLoading && (
                <div className="py-16 text-center">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {search || statusFilter !== "all" || scoreFilter !== "all" ? "No leads match your filters." : "No leads yet."}
                  </p>
                  {!search && statusFilter === "all" && scoreFilter === "all" && (
                    <p className="text-xs text-muted-foreground">Import a CSV or add leads manually to get started.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    <LeadDetailSheet leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </>
  );
}

