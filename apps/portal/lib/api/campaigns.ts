/**
 * Campaigns API client — wraps campaign-service endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignStatus = "draft" | "active" | "paused" | "archived";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  aiGenerated: boolean;
  leads: number;
  sent: number;
  openRate: number;
  replyRate: number;
  meetings: number;
  createdAt: string;
}

export interface CampaignsListResponse {
  items: Campaign[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  aiGenerated?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapCampaign(raw: Record<string, unknown>): Campaign {
  const stats = (raw.stats as Record<string, number>) ?? {};
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: (raw.description as string) ?? "",
    status: (raw.status as CampaignStatus) ?? "draft",
    aiGenerated: Boolean(raw.ai_generated),
    leads: (raw.lead_count as number) ?? stats.lead_count ?? 0,
    sent: (raw.sent_count as number) ?? stats.sent ?? 0,
    openRate: Math.round(((raw.open_rate as number) ?? stats.open_rate ?? 0) * 100),
    replyRate: Math.round(((raw.reply_rate as number) ?? stats.reply_rate ?? 0) * 100),
    meetings: (raw.meeting_count as number) ?? stats.meetings ?? 0,
    createdAt: raw.created_at
      ? new Date(raw.created_at as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchCampaigns(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CampaignStatus | "all";
  workspaceId?: string;
  accessToken?: string;
}): Promise<CampaignsListResponse> {
  const auth = getAuthContext();
  const workspaceId = params?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = params?.accessToken ?? auth.accessToken ?? undefined;

  const qp = new URLSearchParams();
  if (params?.page) qp.set("page", String(params.page));
  if (params?.pageSize) qp.set("page_size", String(params.pageSize));
  if (params?.search) qp.set("q", params.search);
  if (params?.status && params.status !== "all") qp.set("status", params.status);

  const path = `/v1/campaigns${qp.toString() ? `?${qp}` : ""}`;
  const raw = await apiFetch<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
  }>(path, { workspaceId, accessToken });

  return {
    items: raw.items.map(mapCampaign),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
  };
}

export async function fetchCampaign(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Campaign> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/campaigns/${id}`, {
    workspaceId,
    accessToken,
  });
  return mapCampaign(raw);
}

export async function createCampaign(
  input: CreateCampaignInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Campaign> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>("/v1/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? "",
      ai_generated: input.aiGenerated ?? false,
      status: "draft",
      execution_mode: "autopilot",
    }),
    workspaceId,
    accessToken,
  });
  return mapCampaign(raw);
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Campaign> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/campaigns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    workspaceId,
    accessToken,
  });
  return mapCampaign(raw);
}

// ---------------------------------------------------------------------------
// AI campaign draft
// ---------------------------------------------------------------------------

export interface CampaignDraftStep {
  label: string;
  step_type: string;
  description: string;
}

export interface CampaignDraft {
  name: string;
  description: string;
  audience: string;
  steps: CampaignDraftStep[];
}

export async function draftCampaignWithAI(
  prompt: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<CampaignDraft> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  return apiFetch<CampaignDraft>("/v1/brain/campaigns/draft", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    workspaceId,
    accessToken,
  });
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: CampaignStatus;
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Campaign> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    workspaceId,
    accessToken,
  });
  return mapCampaign(raw);
}

export async function deleteCampaign(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<void> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  await apiFetch<void>(`/v1/campaigns/${id}`, {
    method: "DELETE",
    workspaceId,
    accessToken,
  });
}

