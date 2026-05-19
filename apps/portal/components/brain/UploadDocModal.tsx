"use client";

import { useRef, useState } from "react";
import { useUploadDocument } from "@/hooks/useBrain";
import type { DocumentUploadInput } from "@/lib/api/brain";

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "business_profile", label: "Business Profile" },
  { value: "product", label: "Product Doc" },
  { value: "pricing", label: "Pricing" },
  { value: "persona", label: "Persona" },
  { value: "brand_voice", label: "Brand Voice" },
  { value: "case_study", label: "Case Study" },
  { value: "objection", label: "Objections" },
  { value: "faq", label: "FAQ" },
  { value: "custom", label: "Custom" },
];

interface UploadDocModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadDocModal({ open, onClose }: UploadDocModalProps) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("custom");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDoc = useUploadDocument();

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-fill title from filename (strip extension)
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setContent((event.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Document content is required.");
      return;
    }

    const input: DocumentUploadInput = {
      title: title.trim(),
      doc_type: docType,
      content: content.trim(),
    };

    try {
      await uploadDoc.mutateAsync(input);
      handleClose();
    } catch {
      setError("Upload failed. Please try again.");
    }
  }

  function handleClose() {
    setTitle("");
    setDocType("custom");
    setContent("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-doc-modal-title"
    >
      <div className="card w-full max-w-lg mx-4 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="upload-doc-modal-title" className="text-lg font-semibold text-foreground">
            Upload Document
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="upload-title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="upload-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field-input"
              placeholder="e.g. Competitor Analysis Q1 2026"
              required
            />
          </div>

          {/* Doc Type */}
          <div className="space-y-1.5">
            <label htmlFor="upload-doc-type" className="text-sm font-medium text-foreground">
              Document Type <span className="text-destructive">*</span>
            </label>
            <select
              id="upload-doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="field-input"
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* File upload (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="upload-file" className="text-sm font-medium text-foreground">
              Load from file
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">(txt, md, csv — optional)</span>
            </label>
            <input
              id="upload-file"
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json,.html"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label htmlFor="upload-content" className="text-sm font-medium text-foreground">
              Content <span className="text-destructive">*</span>
            </label>
            <textarea
              id="upload-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="field-input resize-y text-xs font-mono"
              placeholder="Paste or type document content here…"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={uploadDoc.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadDoc.isPending}
            >
              {uploadDoc.isPending ? "Uploading…" : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
