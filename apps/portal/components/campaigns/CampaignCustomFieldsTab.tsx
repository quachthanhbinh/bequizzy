"use client";

/**
 * CampaignCustomFieldsTab — manage lead custom field definitions scoped to a campaign.
 * Rendered as a tab inside the Campaign detail page.
 */

import { useState } from "react";
import {
  useCustomFieldDefinitions,
  useCreateCustomFieldDefinition,
  useUpdateCustomFieldDefinition,
  useDeleteCustomFieldDefinition,
  type CustomFieldDefinition,
  type CustomFieldType,
} from "@/hooks/useCustomFields";

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text",    label: "Text" },
  { value: "number",  label: "Number" },
  { value: "date",    label: "Date" },
  { value: "boolean", label: "Boolean (Yes/No)" },
  { value: "url",     label: "URL" },
  { value: "select",  label: "Select (dropdown)" },
];

// ---------------------------------------------------------------------------
// Row: display + inline edit
// ---------------------------------------------------------------------------

interface RowProps {
  def: CustomFieldDefinition;
  onSave: (id: string, patch: { name?: string; fieldType?: CustomFieldType; required?: boolean; options?: string[] }) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function FieldRow({ def, onSave, onDelete, deleting }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(def.name);
  const [fieldType, setFieldType] = useState<CustomFieldType>(def.fieldType);
  const [required, setRequired] = useState(def.required);
  const [optionsRaw, setOptionsRaw] = useState(def.options.join(", "));

  function handleSave() {
    const options = fieldType === "select"
      ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    onSave(def.id, { name, fieldType, required, options });
    setEditing(false);
  }

  function handleCancel() {
    setName(def.name);
    setFieldType(def.fieldType);
    setRequired(def.required);
    setOptionsRaw(def.options.join(", "));
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="bg-secondary/20">
        <td className="px-3 py-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-primary/50 rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Field name"
          />
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{def.key}</td>
        <td className="px-3 py-2">
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
            className="text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none"
          >
            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          {fieldType === "select" && (
            <input
              type="text"
              value={optionsRaw}
              onChange={(e) => setOptionsRaw(e.target.value)}
              className="w-full text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none"
              placeholder="Option 1, Option 2, …"
            />
          )}
        </td>
        <td className="px-3 py-2 text-center">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="text-xs text-primary hover:underline font-medium">Save</button>
            <button type="button" onClick={handleCancel} className="text-xs text-muted-foreground hover:underline">Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-secondary/30 transition-colors">
      <td className="px-3 py-2.5 text-sm font-medium text-foreground">{def.name}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{def.key}</td>
      <td className="px-3 py-2.5 text-xs text-foreground capitalize">
        {FIELD_TYPES.find((t) => t.value === def.fieldType)?.label ?? def.fieldType}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {def.fieldType === "select" && def.options.length > 0
          ? def.options.join(", ")
          : "—"}
      </td>
      <td className="px-3 py-2.5 text-center">
        {def.required
          ? <span className="text-xs font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">Yes</span>
          : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (window.confirm(`Delete field "${def.name}"? This will remove saved values from all leads.`)) {
                onDelete(def.id);
              }
            }}
            className="text-xs text-destructive hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Add field form
// ---------------------------------------------------------------------------

interface AddFormProps {
  campaignId: string;
  onDone: () => void;
}

function AddFieldForm({ campaignId, onDone }: AddFormProps) {
  const createDef = useCreateCustomFieldDefinition();
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [required, setRequired] = useState(false);
  const [optionsRaw, setOptionsRaw] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const options = fieldType === "select"
      ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    await createDef.mutateAsync({ name: name.trim(), fieldType, required, options, campaignId });
    onDone();
  }

  return (
    <tr className="bg-primary/5 border-t-2 border-primary/20">
      <td className="px-3 py-2" colSpan={6}>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-muted-foreground mb-0.5 block">Field name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Deal size (USD)"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
              className="text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none"
            >
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {fieldType === "select" && (
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-0.5 block">Options (comma-separated)</label>
              <input
                type="text"
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                className="w-full text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none"
                placeholder="Option 1, Option 2"
              />
            </div>
          )}
          <label className="flex items-center gap-1.5 text-sm cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Required
          </label>
          <div className="flex gap-2 pb-1">
            <button
              type="submit"
              disabled={createDef.isPending}
              className="btn btn-primary btn-sm text-xs"
            >
              {createDef.isPending ? "Adding…" : "Add field"}
            </button>
            <button type="button" onClick={onDone} className="btn btn-ghost btn-sm text-xs">Cancel</button>
          </div>
          {createDef.isError && (
            <p className="w-full text-xs text-destructive mt-1">
              Failed to add field. Check the name and try again.
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

interface Props {
  campaignId: string;
}

export function CampaignCustomFieldsTab({ campaignId }: Props) {
  const { data: defs = [], isLoading } = useCustomFieldDefinitions({ campaignId });
  const updateDef = useUpdateCustomFieldDefinition();
  const deleteDef = useDeleteCustomFieldDefinition();
  const [showAddForm, setShowAddForm] = useState(false);

  // Only show defs scoped to this campaign (not workspace-global ones)
  const campaignDefs = defs.filter((d) => d.campaignId === campaignId);
  const globalDefs = defs.filter((d) => d.campaignId === null);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Campaign-scoped fields */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Campaign-specific fields</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              These fields appear only on leads enrolled in this campaign.
            </p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary btn-sm text-xs gap-1.5"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add field
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Options</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Required</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaignDefs.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No campaign-specific fields yet. Click <strong>Add field</strong> to create one.
                  </td>
                </tr>
              )}
              {campaignDefs
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((def) => (
                  <FieldRow
                    key={def.id}
                    def={def}
                    onSave={(id, patch) => updateDef.mutate({ id, input: patch })}
                    onDelete={(id) => deleteDef.mutate(id)}
                    deleting={deleteDef.isPending}
                  />
                ))}
              {showAddForm && (
                <AddFieldForm campaignId={campaignId} onDone={() => setShowAddForm(false)} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workspace-global fields (read-only here) */}
      {globalDefs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Workspace-wide fields</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              These apply to all leads in the workspace. Manage them in workspace settings.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {globalDefs
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((def) => (
                    <tr key={def.id} className="text-muted-foreground">
                      <td className="px-3 py-2.5 text-sm">{def.name}</td>
                      <td className="px-3 py-2.5 text-xs font-mono">{def.key}</td>
                      <td className="px-3 py-2.5 text-xs capitalize">
                        {FIELD_TYPES.find((t) => t.value === def.fieldType)?.label ?? def.fieldType}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        {def.required ? "Yes" : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
