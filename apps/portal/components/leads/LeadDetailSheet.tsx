"use client";

/**
 * LeadDetailSheet — right-side slide-in panel showing full lead detail.
 *
 * - Click any field value to edit inline; blur or Enter saves.
 * - Custom fields tab shows workspace-global + campaign-scoped fields.
 * - Activity tab shows the timeline.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLead, useUpdateLead, useUpdateLeadCustomFields, type Lead } from "@/hooks/useLeads";
import {
  useCustomFieldDefinitions,
  type CustomFieldDefinition,
} from "@/hooks/useCustomFields";
import { apiFetch, getAuthContext } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(lead: Lead) {
  const f = lead.firstName?.[0] ?? "";
  const l = lead.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || lead.email[0].toUpperCase();
}

const STATUS_STYLE: Record<string, string> = {
  verified:   "bg-teal-50 text-teal-700",
  unverified: "bg-slate-100 text-slate-600",
  invalid:    "bg-red-50 text-red-600",
  risky:      "bg-amber-50 text-amber-700",
};

const SCORE_STYLE: Record<string, string> = {
  hot:  "bg-red-50 text-red-600",
  warm: "bg-amber-50 text-amber-700",
  cold: "bg-slate-100 text-slate-500",
};

// ---------------------------------------------------------------------------
// Inline editable field
// ---------------------------------------------------------------------------

interface InlineFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (val: string) => void;
  saving?: boolean;
}

function InlineField({ label, value, multiline, onSave, saving }: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  function handleCommit() {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); handleCommit(); }
    if (e.key === "Escape") { e.stopPropagation(); setDraft(value); setEditing(false); }
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm border border-primary/50 rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm border border-primary/50 rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-secondary/60 transition-colors min-h-[28px] ${
            saving ? "opacity-50" : ""
          } ${value ? "text-foreground" : "text-muted-foreground italic"}`}
        >
          {value || "Click to edit"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom field inline cell
// ---------------------------------------------------------------------------

interface CustomFieldCellProps {
  def: CustomFieldDefinition;
  value: unknown;
  onSave: (key: string, val: unknown) => void;
  saving?: boolean;
}

function CustomFieldCell({ def, value, onSave, saving }: CustomFieldCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value ?? "")); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function handleCommit() {
    let coerced: unknown = draft;
    if (def.fieldType === "number") coerced = draft === "" ? null : Number(draft);
    if (def.fieldType === "boolean") coerced = draft === "true";
    onSave(def.key, coerced);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleCommit(); }
    if (e.key === "Escape") { e.stopPropagation(); setDraft(String(value ?? "")); setEditing(false); }
  }

  const displayValue = def.fieldType === "boolean"
    ? (value ? "Yes" : "No")
    : (value as string | null | undefined)
      ? String(value)
      : "";

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">
        {def.name}
        {def.required && <span className="text-destructive ml-0.5">*</span>}
      </p>
      {editing ? (
        def.fieldType === "boolean" ? (
          <div className="flex gap-3 py-1">
            {["true", "false"].map((v) => (
              <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`cf-bool-${def.id}`}
                  value={v}
                  checked={draft === v}
                  onChange={() => setDraft(v)}
                  className="accent-primary"
                />
                {v === "true" ? "Yes" : "No"}
              </label>
            ))}
            <button type="button" onClick={handleCommit} className="ml-auto text-xs text-primary hover:underline">Save</button>
          </div>
        ) : def.fieldType === "select" ? (
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            className="w-full text-sm border border-primary/50 rounded px-2 py-1 bg-background focus:outline-none"
          >
            <option value="">— select —</option>
            {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={def.fieldType === "number" ? "number" : def.fieldType === "date" ? "date" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm border border-primary/50 rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-secondary/60 transition-colors min-h-[28px] ${
            saving ? "opacity-50" : ""
          } ${displayValue ? "text-foreground" : "text-muted-foreground italic"}`}
        >
          {displayValue || "Click to edit"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sheet
// ---------------------------------------------------------------------------

type Tab = "details" | "custom-fields" | "activity";

interface Props {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDetailSheet({ leadId, onClose }: Props) {
  const { data: lead, isLoading } = useLead(leadId);
  const updateLead = useUpdateLead();
  const updateCustomFields = useUpdateLeadCustomFields();
  const { data: fieldDefs = [] } = useCustomFieldDefinitions({
    campaignId: lead?.sourceCampaignId ?? undefined,
  });

  const [tab, setTab] = useState<Tab>("details");

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (leadId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [leadId]);

  const saveField = useCallback(
    (input: Parameters<typeof updateLead.mutateAsync>[0]["input"]) => {
      if (!leadId) return;
      updateLead.mutate({ id: leadId, input });
    },
    [leadId, updateLead],
  );

  const saveCustomField = useCallback(
    (key: string, val: unknown) => {
      if (!leadId) return;
      updateCustomFields.mutate({ id: leadId, fields: { [key]: val } });
    },
    [leadId, updateCustomFields],
  );

  const saving = updateLead.isPending || updateCustomFields.isPending;

  if (!leadId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lead detail"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          {isLoading || !lead ? (
            <div className="flex-1 space-y-1.5 animate-pulse">
              <div className="h-4 w-36 rounded bg-secondary" />
              <div className="h-3 w-52 rounded bg-secondary" />
            </div>
          ) : (
            <>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {initials(lead)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SCORE_STYLE[lead.scoreLabel]}`}>
                  {lead.scoreLabel}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border px-5 shrink-0">
          {(["details", "custom-fields", "activity"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "custom-fields" ? "Custom Fields" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading || !lead ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-20 rounded bg-secondary" />
                  <div className="h-8 w-full rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── Details tab ── */}
              {tab === "details" && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InlineField
                      label="First name"
                      value={lead.firstName}
                      onSave={(v) => saveField({ firstName: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Last name"
                      value={lead.lastName}
                      onSave={(v) => saveField({ lastName: v })}
                      saving={saving}
                    />
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <p className="text-sm px-2 py-1 text-foreground">{lead.email}</p>
                    </div>
                    <InlineField
                      label="Phone"
                      value={lead.phone ?? ""}
                      onSave={(v) => saveField({ phone: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Company"
                      value={lead.company ?? ""}
                      onSave={(v) => saveField({ company: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Title"
                      value={lead.title ?? ""}
                      onSave={(v) => saveField({ title: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Industry"
                      value={lead.industry ?? ""}
                      onSave={(v) => saveField({ industry: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Company size"
                      value={lead.companySize ?? ""}
                      onSave={(v) => saveField({ companySize: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Website"
                      value={lead.website ?? ""}
                      onSave={(v) => saveField({ website: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="LinkedIn"
                      value={lead.linkedinUrl ?? ""}
                      onSave={(v) => saveField({ linkedinUrl: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="City"
                      value={lead.city ?? ""}
                      onSave={(v) => saveField({ city: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Country"
                      value={lead.country ?? ""}
                      onSave={(v) => saveField({ country: v })}
                      saving={saving}
                    />
                    <InlineField
                      label="Timezone"
                      value={lead.timezone ?? ""}
                      onSave={(v) => saveField({ timezone: v })}
                      saving={saving}
                    />
                  </div>
                  <div>
                    <InlineField
                      label="Notes"
                      value={lead.notes ?? ""}
                      multiline
                      onSave={(v) => saveField({ notes: v })}
                      saving={saving}
                    />
                  </div>

                  {/* Tags */}
                  {lead.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
                    <p>Created: {lead.createdAt}</p>
                    <p>Updated: {lead.updatedAt}</p>
                    {lead.sourceCampaignId && (
                      <p>Source campaign: {lead.sourceCampaignId}</p>
                    )}
                    <p>Enrichment: <span className="capitalize">{lead.enrichmentStatus}</span></p>
                  </div>
                </div>
              )}

              {/* ── Custom Fields tab ── */}
              {tab === "custom-fields" && (
                <div className="p-5">
                  {fieldDefs.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm font-medium text-foreground mb-1">No custom fields defined</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Add custom fields on the campaign settings page to capture extra data for this lead.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fieldDefs
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((def) => (
                          <CustomFieldCell
                            key={def.id}
                            def={def}
                            value={lead.customFields[def.key]}
                            onSave={saveCustomField}
                            saving={saving}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Activity tab ── */}
              {tab === "activity" && (
                <ActivityTab leadId={lead.id} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ActivityTab({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { workspaceId, accessToken } = getAuthContext();
    apiFetch<ActivityItem[]>(`/v1/leads/${leadId}/activities?limit=50`, {
      workspaceId: workspaceId ?? undefined,
      accessToken: accessToken ?? undefined,
    })
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return (
      <div className="p-5 space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-secondary shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 rounded bg-secondary" />
              <div className="h-3 w-48 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-16 text-center px-5">
        <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
        <p className="text-xs text-muted-foreground">Actions like emails sent and replies will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <ol className="relative border-l border-border space-y-4 ml-2">
        {activities.map((a) => (
          <li key={a.id} className="ml-4">
            <div className="absolute -left-1.5 mt-0.5 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
            <p className="text-sm font-medium text-foreground capitalize mt-0.5">
              {a.activity_type.replace(/_/g, " ")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface ActivityItem {
  id: string;
  activity_type: string;
  created_at: string;
}

