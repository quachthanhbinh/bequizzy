"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateCampaign, useDraftCampaign, type CampaignDraft } from "@/hooks/useCampaigns";

type Mode = "ai" | "manual";

export default function NewCampaignPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("ai");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftCampaign = useDraftCampaign();
  const createCampaign = useCreateCampaign();

  async function handleAIGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim().length < 10) return;
    setError(null);
    draftCampaign.mutate(prompt, {
      onSuccess: (data) => {
        setDraft(data);
        setStep("preview");
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to generate campaign. Please try again.");
      },
    });
  }

  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    createCampaign.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (campaign) => {
          router.push(`/campaigns/${campaign.id}`);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to create campaign.");
        },
      },
    );
  }

  async function handleApplyDraft() {
    if (!draft) return;
    setError(null);
    createCampaign.mutate(
      {
        name: draft.name,
        description: draft.description,
        aiGenerated: true,
      },
      {
        onSuccess: (campaign) => {
          router.push(`/campaigns/${campaign.id}`);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to save campaign.");
        },
      },
    );
  }

  const isGenerating = draftCampaign.isPending;
  const isSaving = createCampaign.isPending;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">New Campaign</h1>
            <p className="text-sm text-muted-foreground">AI-powered or manual setup</p>
          </div>
        </div>

        {step === "input" && (
          <>
            {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("ai")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${mode === "ai" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                AI-Generated
                <span data-testid="ai-credit-cost" className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">5 credits</span>
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${mode === "manual" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Manual
                <span className="ml-auto text-xs text-muted-foreground">Free</span>
              </button>
            </div>

            {mode === "ai" ? (
              <form onSubmit={handleAIGenerate} className="card p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">What&apos;s your outreach goal?</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Reach bootstrapped SaaS founders in Vietnam and Thailand to introduce RevLooper as their AI sales rep. Target companies with 5–50 employees that do B2B sales."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{prompt.length}/500 characters · min 10</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-xs text-primary flex items-start gap-2">
                  <svg width="14" height="14" className="shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  <span>AI will use your <strong>AI Brain</strong> context (ICP, value prop, objections) to generate a tailored campaign. Cost: <strong>5 credits</strong>.</span>
                </div>
                <button
                  type="submit"
                  disabled={isGenerating || prompt.trim().length < 10}
                  className="btn btn-primary w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Generating campaign…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      Generate Campaign
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleManualCreate} className="card p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Campaign name <span className="text-destructive">*</span></label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. SaaS Founders SEA Q2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Who are you targeting and what's the goal?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={isSaving || !name.trim()} className="btn btn-primary w-full">
                  {isSaving ? "Creating…" : "Create Campaign"}
                </button>
              </form>
            )}
          </>
        )}

        {step === "preview" && draft && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">AI Campaign Draft</h2>
              <button onClick={() => { setStep("input"); draftCampaign.reset(); }} className="btn btn-outline btn-sm gap-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Regenerate
              </button>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Campaign Name</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Description</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => d && { ...d, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Target Audience</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  value={draft.audience}
                  onChange={(e) => setDraft((d) => d && { ...d, audience: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Sequence Outline</label>
                <div className="space-y-2">
                  {draft.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">{i + 1}</span>
                      <div>
                        <p className="font-medium text-foreground">{s.label}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("input")} className="btn btn-outline flex-1">Edit prompt</button>
              <button onClick={handleApplyDraft} disabled={isSaving} className="btn btn-primary flex-1 gap-1.5">
                {isSaving ? "Saving…" : "Save Campaign"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
