"use client";

/**
 * ActionCard — renders a confirmation card for AI-requested CRM operations.
 *
 * When the AI Advisor suggests a create/update/delete action, this card shows
 * a summary of what will happen and requires explicit user confirmation before
 * executing the mutation. Destructive actions (delete) use a red border.
 *
 * Lookup flow: for update/delete actions where the AI only knows a name/email
 * (not the internal UUID), the card fetches the resource automatically by
 * searching the API. If not found it shows an error.
 */

import { useState, useEffect } from "react";
import {
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useUpdateCampaignStatus,
} from "@/hooks/useCampaigns";
import { useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { fetchLeads } from "@/lib/api/leads";
import { fetchCampaigns } from "@/lib/api/campaigns";
import type { AdvisorAction } from "@/lib/api/advisor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldRow(label: string, value: string | undefined) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground min-w-[80px] shrink-0">{label}:</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

const ICON: Record<string, string> = {
  create_campaign: "📣",
  update_campaign: "✏️",
  delete_campaign: "🗑️",
  create_lead: "👤",
  update_lead: "✏️",
  update_lead_status: "🔄",
  delete_lead: "🗑️",
  navigate: "🔗",
};

const TITLE: Record<string, string> = {
  create_campaign: "Create campaign",
  update_campaign: "Update campaign",
  delete_campaign: "Delete campaign",
  create_lead: "Add lead",
  update_lead: "Update lead",
  update_lead_status: "Change lead status",
  delete_lead: "Delete lead",
  navigate: "Navigate",
};

const isDestructive = (type: string) =>
  type === "delete_campaign" || type === "delete_lead";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActionCardProps {
  action: AdvisorAction;
  /** Called when action is executed. Pass a human-readable result string. */
  onExecuted: (result: string) => void;
  /** Called when the user dismisses the card without acting. */
  onCancelled: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionCard({ action, onExecuted, onCancelled }: ActionCardProps) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "error">("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  
  // Form state for create_campaign action
  const [campaignFormState, setCampaignFormState] = useState({
    name: action.type === "create_campaign" ? action.payload.name || "" : "",
    description: action.type === "create_campaign" ? action.payload.description || "" : "",
  });

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaignMut = useDeleteCampaign();
  const updateCampaignStatus = useUpdateCampaignStatus();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  // ---------------------------------------------------------------------------
  // Resolve ID for update/delete actions that only provide a name/email
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      action.type === "navigate" ||
      action.type === "create_campaign" ||
      action.type === "create_lead"
    ) {
      return;
    }

    // Runtime safety: payload may be absent if the LLM returned a malformed action
    // (e.g. inlined fields directly instead of nesting under "payload").
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(action as any).payload) {
      setLookupError("Action data is incomplete. Please try manually.");
      setLookupState("error");
      return;
    }

    const payload = action.payload as Record<string, unknown>;

    // Already has ID — no lookup needed
    if (typeof payload.id === "string" && payload.id) {
      setResolvedId(payload.id);
      return;
    }

    // Need to look up
    setLookupState("loading");

    const doLookup = async () => {
      try {
        if (action.type === "update_campaign" || action.type === "delete_campaign") {
          const name = payload.name as string | undefined;
          if (!name) {
            setLookupError("No campaign name to search for.");
            setLookupState("error");
            return;
          }
          const res = await fetchCampaigns({ search: name, pageSize: 5 });
          const match =
            res.items.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? res.items[0];
          if (!match) {
            setLookupError(`Campaign "${name}" not found.`);
            setLookupState("error");
            return;
          }
          setResolvedId(match.id);
          setLookupState("idle");
        } else {
          // Lead actions
          const email = payload.email as string | undefined;
          const name = payload.name as string | undefined;
          const search = email ?? name;
          if (!search) {
            setLookupError("No lead email or name to search for.");
            setLookupState("error");
            return;
          }
          const res = await fetchLeads({ search, pageSize: 5 });
          const match =
            res.items.find((l) => l.email?.toLowerCase() === email?.toLowerCase()) ??
            res.items[0];
          if (!match) {
            setLookupError(`Lead "${search}" not found.`);
            setLookupState("error");
            return;
          }
          setResolvedId(match.id);
          setLookupState("idle");
        }
      } catch {
        setLookupError("Lookup failed — try again or do it manually.");
        setLookupState("error");
      }
    };

    doLookup();
  }, []); // run once on mount

  // ---------------------------------------------------------------------------
  // Determine if the action is ready to execute
  // ---------------------------------------------------------------------------
  const needsId =
    action.type !== "navigate" &&
    action.type !== "create_campaign" &&
    action.type !== "create_lead";
  const isCampaignFormValid = action.type === "create_campaign" && campaignFormState.name.trim().length > 0;
  const ready = (action.type === "create_campaign" ? isCampaignFormValid : (!needsId || !!resolvedId));

  // ---------------------------------------------------------------------------
  // Execute
  // ---------------------------------------------------------------------------
  const handleConfirm = async () => {
    if (!ready || executing) return;
    setExecuting(true);
    try {
      switch (action.type) {
        case "create_campaign": {
          // Use form state values instead of action.payload
          await createCampaign.mutateAsync({
            name: campaignFormState.name.trim(),
            description: campaignFormState.description.trim() || undefined,
          });
          onExecuted(`Campaign "${campaignFormState.name}" created successfully.`);
          break;
        }
        case "update_campaign": {
          const id = resolvedId!;
          if (action.payload.status) {
            await updateCampaignStatus.mutateAsync({ id, status: action.payload.status });
          }
          if (action.payload.name !== undefined || action.payload.description !== undefined) {
            await updateCampaign.mutateAsync({
              id,
              input: {
                name: action.payload.name,
                description: action.payload.description,
              },
            });
          }
          onExecuted(`Campaign updated successfully.`);
          break;
        }
        case "delete_campaign": {
          await deleteCampaignMut.mutateAsync(resolvedId!);
          onExecuted(`Campaign "${action.payload.name}" deleted.`);
          break;
        }
        case "create_lead": {
          const p = action.payload;
          await createLead.mutateAsync({
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            company: p.company,
            title: p.title,
          });
          onExecuted(`Lead ${p.firstName} ${p.lastName} added successfully.`);
          break;
        }
        case "update_lead": {
          await updateLead.mutateAsync({ id: resolvedId!, input: action.payload });
          onExecuted(`Lead updated successfully.`);
          break;
        }
        case "update_lead_status": {
          await updateLead.mutateAsync({
            id: resolvedId!,
            input: { status: action.payload.status },
          });
          onExecuted(`Lead status changed to "${action.payload.status}".`);
          break;
        }
        case "delete_lead": {
          await deleteLead.mutateAsync(resolvedId!);
          const label = action.payload.email ?? action.payload.name ?? "Lead";
          onExecuted(`"${label}" deleted.`);
          break;
        }
        case "navigate": {
          window.location.href = action.href;
          onExecuted(`Navigated to ${action.href}.`);
          break;
        }
      }
    } catch {
      onExecuted(`Action failed — please try manually.`);
    } finally {
      setExecuting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const destructive = isDestructive(action.type);
  const borderClass = destructive
    ? "border-destructive/30 bg-destructive/5"
    : "border-primary/25 bg-primary/5";

  function renderPayloadRows() {
    if (action.type === "navigate") return null;

    // Runtime safety: payload may be absent if LLM returned a malformed action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(action as any).payload) return null;

    switch (action.type) {
      case "create_campaign":
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign name</label>
              <input
                type="text"
                value={campaignFormState.name}
                onChange={(e) => setCampaignFormState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. SaaS Founders Q2"
                className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description (optional)</label>
              <textarea
                value={campaignFormState.description}
                onChange={(e) => setCampaignFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Who are you targeting and what's the goal?"
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        );
      case "update_campaign":
        return (
          <>
            {fieldRow("Campaign", action.payload.name)}
            {fieldRow("New name", action.payload.name)}
            {fieldRow("Description", action.payload.description)}
            {fieldRow("Status", action.payload.status)}
          </>
        );
      case "delete_campaign":
        return (
          <>
            {fieldRow("Campaign", action.payload.name)}
            <p className="text-[11px] text-destructive font-medium mt-1">
              ⚠️ This cannot be undone.
            </p>
          </>
        );
      case "create_lead":
        return (
          <>
            {fieldRow("Name", `${action.payload.firstName} ${action.payload.lastName}`)}
            {fieldRow("Email", action.payload.email)}
            {fieldRow("Company", action.payload.company)}
            {fieldRow("Title", action.payload.title)}
          </>
        );
      case "update_lead":
        return (
          <>
            {fieldRow("Lead", action.payload.email)}
            {fieldRow("First name", action.payload.firstName)}
            {fieldRow("Last name", action.payload.lastName)}
            {fieldRow("Company", action.payload.company)}
            {fieldRow("Title", action.payload.title)}
            {fieldRow("Country", action.payload.country)}
          </>
        );
      case "update_lead_status":
        return (
          <>
            {fieldRow("Lead", action.payload.email ?? action.payload.name)}
            {fieldRow("New status", action.payload.status)}
          </>
        );
      case "delete_lead":
        return (
          <>
            {fieldRow("Lead", action.payload.email ?? action.payload.name)}
            <p className="text-[11px] text-destructive font-medium mt-1">
              ⚠️ This cannot be undone.
            </p>
          </>
        );
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`mt-2 rounded-xl border p-3 text-sm max-w-[360px] ${borderClass}`}
      role="region"
      aria-label="Pending action"
    >
      {/* Title row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{ICON[action.type] ?? "⚡"}</span>
        <span className="font-semibold text-foreground text-[13px]">
          {TITLE[action.type] ?? action.label}
        </span>
      </div>

      {/* Payload preview */}
      <div className="space-y-0.5 mb-3">{renderPayloadRows()}</div>

      {/* Lookup states */}
      {lookupState === "loading" && (
        <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Resolving resource…
        </p>
      )}
      {lookupState === "error" && (
        <p className="text-[11px] text-destructive mb-2">{lookupError}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!ready || executing || lookupState === "loading" || lookupState === "error"}
          className={`btn btn-sm flex-1 disabled:opacity-40 ${
            destructive ? "btn-destructive" : "btn-primary"
          }`}
        >
          {executing ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Running…
            </span>
          ) : action.type === "navigate" ? (
            "Go"
          ) : action.type === "create_campaign" ? (
            "Create Campaign"
          ) : (
            "Confirm"
          )}
        </button>
        <button
          type="button"
          onClick={onCancelled}
          disabled={executing}
          className="btn btn-sm btn-ghost text-muted-foreground disabled:opacity-40"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
