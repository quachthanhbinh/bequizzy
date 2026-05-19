"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useDeleteCampaign } from "@/hooks/useCampaigns";
import { CampaignCustomFieldsTab } from "@/components/campaigns/CampaignCustomFieldsTab";
import type { CampaignStatus } from "@/lib/api/campaigns";

const STATUS_STYLE: Record<CampaignStatus, string> = {
  active:   "bg-teal-50 text-teal-700",
  draft:    "bg-slate-100 text-slate-500",
  paused:   "bg-amber-50 text-amber-700",
  archived: "bg-slate-100 text-slate-400",
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = typeof params?.id === "string" ? params.id : null;
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const deleteCampaign = useDeleteCampaign();
  const [tab, setTab] = useState<"overview" | "leads" | "sequences" | "custom-fields" | "settings">("overview");

  async function handleArchiveCampaign() {
    if (!campaignId) return;
    const confirmed = window.confirm("Archive this campaign? This will stop sending and hide it from active lists.");
    if (!confirmed) return;

    await deleteCampaign.mutateAsync(campaignId);
    router.push("/campaigns");
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-muted-foreground">Loading campaign…</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link href="/campaigns" className="text-sm text-primary hover:underline">
            ← Back to Campaigns
          </Link>
          <p className="text-sm text-muted-foreground">Campaign not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 h-14 border-b border-border bg-background/95 backdrop-blur">
        <Link href="/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground truncate">{campaign.name}</h1>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[campaign.status]}`}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
        {campaign.aiGenerated && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI-generated
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-ghost text-xs">Pause</button>
          <button type="button" className="btn btn-primary text-xs">+ Add Leads</button>
        </div>
      </div>

      <div className="px-5 py-5 max-w-6xl mx-auto space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["overview", "leads", "sequences", "custom-fields", "settings"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "custom-fields" ? "Custom Fields" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total leads" value={campaign.leads} />
              <StatCard label="Emails sent" value={campaign.sent} />
              <StatCard label="Meetings booked" value={campaign.meetings} accent />
              <StatCard label="Reply rate" value={`${campaign.replyRate}%`} accent />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Open rate" value={`${campaign.openRate}%`} />
              <StatCard label="Click rate" value="—" />
              <StatCard label="Bounce rate" value="—" />
              <StatCard label="Unsubscribes" value="—" />
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Campaign details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Description</dt>
                  <dd className="text-foreground">{campaign.description || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Created</dt>
                  <dd className="text-foreground">{campaign.createdAt}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Leads tab */}
        {tab === "leads" && (
          <div className="card p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Lead enrollment coming soon</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Per-campaign lead enrollment view will be available when the sequence worker ships.
            </p>
          </div>
        )}

        {/* Sequences tab */}
        {tab === "sequences" && (
          <div className="space-y-3">
            <div className="card p-10 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">No sequences attached</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Attach a sequence to start sending automated outreach steps.
              </p>
            </div>
            <button type="button" className="btn btn-secondary text-sm w-full">
              + Attach sequence
            </button>
          </div>
        )}

        {/* Custom Fields tab */}
        {tab === "custom-fields" && campaignId && (
          <CampaignCustomFieldsTab campaignId={campaignId} />
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="space-y-4 max-w-lg">
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Campaign settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Campaign name</label>
                  <input type="text" defaultValue={campaign.name} className="input" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea rows={2} defaultValue={campaign.description} className="input resize-none" />
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <button type="button" className="btn btn-primary text-sm">Save changes</button>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Archive campaign</p>
                  <p className="text-xs text-muted-foreground">Stop sending and archive this campaign.</p>
                </div>
                <button
                  type="button"
                  onClick={handleArchiveCampaign}
                  disabled={deleteCampaign.isPending || campaign.status === "archived"}
                  className="btn btn-ghost text-xs text-destructive border border-destructive/30 hover:bg-destructive/5"
                >
                  {deleteCampaign.isPending ? "Archiving..." : "Archive"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
