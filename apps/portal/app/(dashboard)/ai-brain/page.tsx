"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardModal } from "@/components/brain/WizardModal";
import { UploadDocModal } from "@/components/brain/UploadDocModal";
import { DocumentDetailDrawer } from "@/components/brain/DocumentDetailDrawer";
import { useBrainDocuments, useDeleteDocument, useWizardState } from "@/hooks/useBrain";
import {
  useHarvesterSessions,
  useHarvesterTemplates,
  useCreateHarvesterSession,
  useDeleteHarvesterSession,
  useReflect,
} from "@/hooks/useHarvester";
import type { HarvesterTemplate } from "@/lib/api/harvester";

const DOC_TYPE_LABELS: Record<string, string> = {
  business_profile: "Business Profile",
  product: "Product Doc",
  pricing: "Pricing",
  persona: "Persona",
  brand_voice: "Brand Voice",
  case_study: "Case Study",
  objection: "Objections",
  faq: "FAQ",
  custom: "Custom",
};

export default function AIBrainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"documents" | "drafts">("documents");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"setup" | "review">("setup");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [drawerDocId, setDrawerDocId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const { data: docs, isLoading } = useBrainDocuments();
  const { data: wizardState } = useWizardState();
  const deleteDoc = useDeleteDocument();
  const { data: drafts, isLoading: draftsLoading } = useHarvesterSessions(undefined);
  const { data: templates } = useHarvesterTemplates();
  const createSession = useCreateHarvesterSession();
  const deleteSession = useDeleteHarvesterSession();
  const { data: reflectData } = useReflect(!!docs && docs.length > 0);

  const hasDocs = docs && docs.length > 0;
  const draftSessions = drafts?.filter((s) => s.status === "active" || s.status === "draft") ?? [];
  const topSuggestion = reflectData?.suggestions?.[0] ?? null;

  async function startHarvestingFromTemplate(template: HarvesterTemplate) {
    const session = await createSession.mutateAsync({
      topic: template.name,
      mode: "chat",
      template_id: template.id,
    });
    setTemplatePickerOpen(false);
    router.push(`/ai-brain/harvester/${session.id}`);
  }

  function openReviewWizard() {
    setWizardMode("review");
    setWizardOpen(true);
  }

  function openSetupWizard() {
    setWizardMode("setup");
    setWizardOpen(true);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Brain</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your workspace knowledge base — powers AI-personalized outreach
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setUploadOpen(true)}
            >
              Upload Document
            </button>
            {hasDocs && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={openReviewWizard}
              >
                Review Answers
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setTemplatePickerOpen(true)}
            >
              Start Harvesting
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openSetupWizard}
            >
              {hasDocs ? "Retrain AI Brain" : "Set Up AI Brain"}
            </button>
          </div>
        </div>

        {/* Reflection suggestion banner */}
        {topSuggestion && (
          <div className="card p-4 flex items-center justify-between gap-4 border-l-4 border-primary">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">AI Brain gap detected</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{topSuggestion.reason}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary text-xs px-3 py-1.5 shrink-0"
              onClick={() => setTemplatePickerOpen(true)}
            >
              Start: {topSuggestion.topic}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "documents"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Documents {hasDocs ? `(${docs.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "drafts"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drafts {draftSessions.length > 0 ? `(${draftSessions.length})` : ""}
          </button>
        </div>

        {/* ── Documents tab ── */}
        {activeTab === "documents" && (
          <>
        {/* Loading */}
        {isLoading && (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted-foreground">Loading knowledge base...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasDocs && (
          <div data-testid="ai-brain-empty-state" className="card p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl" role="img" aria-label="brain">🧠</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Your AI Brain is empty
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Answer a few quick questions about your business and the AI will generate
              a personalized knowledge base to power your outreach.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setWizardOpen(true)}
            >
              Run Setup Wizard
            </button>
          </div>
        )}

        {/* Document list */}
        {!isLoading && hasDocs && (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="card p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{doc.version}
                    </span>
                    {doc.chunk_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {doc.chunk_count} {doc.chunk_count === 1 ? "chunk" : "chunks"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1 truncate">
                    {doc.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerDocId(doc.id)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label={`View ${doc.title}`}
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => deleteDoc.mutate(doc.id)}
                  disabled={deleteDoc.isPending}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 shrink-0"
                  aria-label={`Delete ${doc.title}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* ── Drafts tab ── */}
        {activeTab === "drafts" && (
          <>
            {draftsLoading && (
              <div className="card p-10 text-center">
                <p className="text-sm text-muted-foreground">Loading drafts...</p>
              </div>
            )}
            {!draftsLoading && draftSessions.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-sm text-muted-foreground mb-4">No active harvester sessions.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setTemplatePickerOpen(true)}
                >
                  Start Harvesting
                </button>
              </div>
            )}
            {!draftsLoading && draftSessions.length > 0 && (
              <div className="space-y-3">
                {draftSessions.map((session) => (
                  <div key={session.id} className="card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            session.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{session.turn_count} turns</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">{session.topic}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/ai-brain/harvester/${session.id}`)}
                      className="btn btn-secondary text-xs px-3 py-1 shrink-0"
                    >
                      {session.status === "draft" ? "Review draft" : "Continue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSession.mutate(session.id)}
                      disabled={deleteSession.isPending}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Wizard modal */}
      <WizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        mode={wizardMode}
        initialAnswers={wizardMode === "review" ? (wizardState?.answers ?? {}) : undefined}
      />

      {/* Upload document modal */}
      <UploadDocModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Document detail drawer */}
      <DocumentDetailDrawer
        docId={drawerDocId}
        onClose={() => setDrawerDocId(null)}
      />

      {/* Template picker modal */}
      {templatePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setTemplatePickerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Select harvester topic"
        >
          <div
            className="bg-background rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">What do you want to teach the AI?</h2>
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(templates ?? []).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => startHarvestingFromTemplate(tpl)}
                  disabled={createSession.isPending}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                >
                  <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  )}
                </button>
              ))}
              {(!templates || templates.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Loading templates...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
