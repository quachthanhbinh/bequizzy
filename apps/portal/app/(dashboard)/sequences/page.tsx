"use client";

import Link from "next/link";
import { useSequences } from "@/hooks/useSequences";

export default function SequencesPage() {
  const { data: sequences = [], isLoading } = useSequences();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sequences</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build and manage automated outreach sequences
            </p>
          </div>
          <Link href="/campaigns/new" className="btn btn-primary gap-1.5 shrink-0">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Sequence
          </Link>
        </div>

        {isLoading && (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted-foreground">Loading sequences…</p>
          </div>
        )}

        {!isLoading && sequences.length === 0 && (
          <div className="card p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">No sequences yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create a campaign first, then attach a sequence to start sending automated outreach steps.
            </p>
            <Link href="/campaigns" className="btn btn-secondary">
              Go to Campaigns
            </Link>
          </div>
        )}

        {!isLoading && sequences.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sequences.map((seq) => (
                  <tr key={seq.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/sequences/${seq.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {seq.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        seq.status === "active" ? "bg-teal-50 text-teal-700" :
                        seq.status === "paused" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {seq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/sequences/${seq.id}`} className="btn btn-outline btn-sm">
                        Open Builder
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

