"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLead } from "@/hooks/useLeads";

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { data: lead, isLoading } = useLead(id);

  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (lead?.tags) setTags(lead.tags);
  }, [lead]);

  function addTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" && newTag.trim()) {
      setTags((t) => [...t, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-muted-foreground">Loading lead…</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Link href="/leads" className="text-sm text-primary hover:underline">← Back to Leads</Link>
          <p className="text-sm text-muted-foreground">Lead not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/leads" className="hover:text-foreground transition-colors">Leads</Link>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span className="text-foreground">{lead.firstName} {lead.lastName}</span>
        </div>

        {/* Lead hero */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{lead.firstName} {lead.lastName}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.scoreLabel === "hot" ? "bg-red-50 text-red-600" : lead.scoreLabel === "warm" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {lead.scoreLabel === "hot" ? "🔥" : lead.scoreLabel === "warm" ? "🌤" : "❄️"} {lead.scoreLabel.charAt(0).toUpperCase() + lead.scoreLabel.slice(1)} · {lead.score}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 capitalize">{lead.status}</span>
                {lead.enriched && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Enriched</span>}
              </div>
              <p className="text-sm text-muted-foreground">{lead.title ?? "—"} at <strong className="text-foreground">{lead.company ?? "—"}</strong></p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  {lead.email}
                </a>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn btn-outline btn-sm gap-1.5">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                Enrich
              </button>
              <button className="btn btn-primary btn-sm gap-1.5">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Enroll
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-border">
          {(["overview","activity"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab === "activity" ? "Activity" : tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Left col */}
            <div className="lg:col-span-2 space-y-5">
              {/* Details */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["First Name", lead.firstName],
                    ["Last Name", lead.lastName],
                    ["Email", lead.email],
                    ["Company", lead.company ?? "—"],
                    ["Title", lead.title ?? "—"],
                    ["Country", lead.country ?? "—"],
                    ["Source", lead.source.replace(/_/g, " ")],
                    ["Added", lead.createdAt],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                      <p className="text-foreground font-medium">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border flex justify-end">
                  <button className="btn btn-outline btn-sm">Edit Details</button>
                </div>
              </div>

              {/* Notes */}
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex justify-end">
                  <button className="btn btn-outline btn-sm">Save Note</button>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-5">
              {/* Tags */}
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-full text-xs font-medium text-foreground">
                      {tag}
                      <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-muted-foreground hover:text-destructive transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <input
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add tag, press Enter…"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                />
              </div>

              {/* Score breakdown */}
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Score Breakdown</h3>
                  <span className={`text-2xl font-bold ${lead.scoreLabel === "hot" ? "text-red-500" : lead.scoreLabel === "warm" ? "text-amber-500" : "text-slate-500"}`}>{lead.score}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { signal: "Email clicked", pts: "+15" },
                    { signal: "Email opened ×3", pts: "+24" },
                    { signal: "Email replied", pts: "+25" },
                    { signal: "No reply 2d", pts: "−4" },
                    { signal: "Enrolled", pts: "+22" },
                  ].map((s) => (
                    <div key={s.signal} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.signal}</span>
                      <span className={`font-semibold ${s.pts.startsWith("+") ? "text-teal-600" : "text-red-500"}`}>{s.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Source</h3>
                <p className="text-xs text-muted-foreground capitalize">{lead.source.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground mt-1">Added {lead.createdAt}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="card p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">No activity yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Activity will appear here as emails are sent, opened, and replied to.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
