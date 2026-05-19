"use client";

/**
 * DocumentDetailDrawer — right-side slide-over panel for viewing, editing, and
 * re-indexing a single knowledge document.
 */

import { useEffect, useState } from "react";
import { useDocument, useReindexDocument, useUpdateDocument } from "@/hooks/useBrain";

const DOC_TYPES = [
  { value: "product", label: "Product" },
  { value: "pricing", label: "Pricing" },
  { value: "persona", label: "Persona" },
  { value: "brand_voice", label: "Brand Voice" },
  { value: "case_study", label: "Case Study" },
  { value: "objection", label: "Objection Handling" },
  { value: "custom", label: "Custom" },
];

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-green-100 text-green-700",
  indexing: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

interface Props {
  docId: string | null;
  onClose: () => void;
}

export function DocumentDetailDrawer({ docId, onClose }: Props) {
  const { data: doc, isLoading } = useDocument(docId);
  const updateDoc = useUpdateDocument();
  const reindexDoc = useReindexDocument();

  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setDocType(doc.doc_type);
      setContent(doc.content);
      setDirty(false);
    }
  }, [doc]);

  if (!docId) return null;

  function handleDownload() {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!docId) return;
    const patch: { title?: string; doc_type?: string; content?: string } = {};
    if (title !== doc?.title) patch.title = title;
    if (docType !== doc?.doc_type) patch.doc_type = docType;
    if (content !== doc?.content) patch.content = content;
    if (Object.keys(patch).length === 0) return;
    await updateDoc.mutateAsync({ id: docId, data: patch });
    setDirty(false);
  }

  async function handleReindex() {
    if (!docId) return;
    await reindexDoc.mutateAsync(docId);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Document Details"
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl flex flex-col bg-background border-l shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-foreground">Document Details</h2>
          <div className="flex items-center gap-3">
            {doc && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                  STATUS_STYLES[doc.embedding_status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {doc.embedding_status}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
          )}

          {!isLoading && doc && (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="doc-title" className="text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="field-input w-full"
                />
              </div>

              {/* Doc type */}
              <div className="space-y-1.5">
                <label htmlFor="doc-type" className="text-sm font-medium text-foreground">
                  Type
                </label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setDocType(e.target.value);
                    setDirty(true);
                  }}
                  className="field-input w-full"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="doc-content" className="text-sm font-medium text-foreground">
                    Content
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {content.length.toLocaleString()} / 100,000 chars
                  </span>
                </div>
                <textarea
                  id="doc-content"
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setContent(e.target.value);
                    setDirty(true);
                  }}
                  rows={16}
                  maxLength={100000}
                  className="field-input w-full font-mono text-sm resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && doc && (
          <div className="px-6 py-4 border-t flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-secondary text-sm"
              >
                Download
              </button>
              {doc.embedding_status === "error" && (
                <button
                  type="button"
                  onClick={handleReindex}
                  disabled={reindexDoc.isPending}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  {reindexDoc.isPending ? "Retrying…" : "Retry Indexing"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || updateDoc.isPending}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {updateDoc.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
