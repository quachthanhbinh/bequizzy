"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampaigns, type Campaign, type CampaignStatus } from "@/hooks/useCampaigns";

const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft:    "bg-slate-100 text-slate-600",
  active:   "bg-teal-50 text-teal-700",
  paused:   "bg-amber-50 text-amber-700",
  archived: "bg-slate-100 text-slate-400",
};

export default function CampaignsPage() {
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useCampaigns({
    status: filter,
    search,
  });

  const visible = data?.items ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div data-tour="campaigns-header" className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : "Manage your outreach campaigns"}
            </p>
          </div>
          <Link data-tour="campaigns-new-btn" href="/campaigns/new" className="btn btn-primary gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Campaign
          </Link>
        </div>

        {/* Error banner */}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load campaigns. Check your connection and try again.
          </div>
        )}

        {/* Filters + Search */}
        <div data-tour="campaigns-filter" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all","active","paused","draft","archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 rounded-full bg-secondary" />
                  <div className="h-4 w-40 rounded bg-secondary" />
                  <div className="h-3 w-56 rounded bg-secondary" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map((j) => <div key={j} className="h-10 rounded bg-secondary" />)}
                </div>
                <div className="h-3 w-full rounded bg-secondary" />
              </div>
            ))}
          </div>
        )}

        {/* Campaign grid */}
        {!isLoading && visible.length === 0 && (
          <div className="card p-16 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              {search || filter !== "all" ? "No campaigns match your filters." : "No campaigns yet."}
            </p>
            {!search && filter === "all" && (
              <p className="text-xs text-muted-foreground mb-4">Create your first campaign to start reaching out to leads.</p>
            )}
            <Link href="/campaigns/new" className="btn btn-primary mt-4">Create your first campaign</Link>
          </div>
        )}

        {!isLoading && visible.length > 0 && (
          <div data-tour="campaigns-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c: Campaign) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="card p-5 hover:shadow-md transition-shadow group flex flex-col gap-4">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                      {c.aiGenerated && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                          AI
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{c.openRate > 0 ? `${c.openRate}%` : "—"}</p>
                    <p className="text-xs text-muted-foreground">Open rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{c.replyRate > 0 ? `${c.replyRate}%` : "—"}</p>
                    <p className="text-xs text-muted-foreground">Reply rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{c.meetings}</p>
                    <p className="text-xs text-muted-foreground">Meetings</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                  <span>{c.leads} leads</span>
                  <span>{c.createdAt}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

