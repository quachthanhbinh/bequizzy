/**
 * Leads API client — wraps lead-service endpoints via api-gateway.
 *
 * All functions accept optional auth overrides for SSR/testing.
 * Workspace ID is always required (enforced by api-gateway).
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeadStatus = "verified" | "unverified" | "invalid" | "risky";
export type ScoreLabel = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  notes: string | null;
  status: LeadStatus;
  enrichmentStatus: string;
  score: number;
  scoreLabel: ScoreLabel;
  source: string;
  sourceCampaignId: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  enriched: boolean;
}

export interface LeadsListResponse {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  title?: string;
  country?: string;
  source?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map snake_case API response to camelCase Lead type. */
function mapLead(raw: Record<string, unknown>): Lead {
  return {
    id: raw.id as string,
    firstName: (raw.first_name as string) ?? "",
    lastName: (raw.last_name as string) ?? "",
    email: raw.email as string,
    phone: (raw.phone as string | null) ?? null,
    company: (raw.company as string | null) ?? null,
    title: (raw.title as string | null) ?? null,
    linkedinUrl: (raw.linkedin_url as string | null) ?? null,
    industry: (raw.industry as string | null) ?? null,
    companySize: (raw.company_size as string | null) ?? null,
    website: (raw.website as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    timezone: (raw.timezone as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    status: (raw.status as LeadStatus) ?? "unverified",
    enrichmentStatus: (raw.enrichment_status as string) ?? "unverified",
    score: (raw.score as number) ?? 0,
    scoreLabel: scoreLabelFromScore((raw.score as number) ?? 0),
    source: (raw.source as string) ?? "manual",
    sourceCampaignId: (raw.source_campaign_id as string | null) ?? null,
    tags: (raw.tags as string[]) ?? [],
    customFields: (raw.custom_fields as Record<string, unknown>) ?? {},
    createdAt: new Date(raw.created_at as string).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    updatedAt: new Date(raw.updated_at as string).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    enriched: Boolean(raw.enriched),
  };
}

function scoreLabelFromScore(score: number): ScoreLabel {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchLeads(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus | "all";
  scoreLabel?: ScoreLabel | "all";
  workspaceId?: string;
  accessToken?: string;
}): Promise<LeadsListResponse> {
  const auth = getAuthContext();
  const workspaceId = params?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = params?.accessToken ?? auth.accessToken ?? undefined;

  const qp = new URLSearchParams();
  if (params?.page) qp.set("page", String(params.page));
  if (params?.pageSize) qp.set("page_size", String(params.pageSize));
  if (params?.search) qp.set("q", params.search);
  if (params?.status && params.status !== "all") qp.set("status", params.status);

  const path = `/v1/leads${qp.toString() ? `?${qp}` : ""}`;
  const raw = await apiFetch<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    page_size: number;
  }>(path, { workspaceId, accessToken });

  return {
    items: raw.items.map(mapLead),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
  };
}

export async function fetchLead(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Lead> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/leads/${id}`, {
    workspaceId,
    accessToken,
  });
  return mapLead(raw);
}

export async function createLead(
  input: CreateLeadInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Lead> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>("/v1/leads", {
    method: "POST",
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      company: input.company,
      title: input.title,
      country: input.country,
      source: input.source ?? "manual",
      tags: input.tags ?? [],
    }),
    workspaceId,
    accessToken,
  });
  return mapLead(raw);
}

export async function deleteLead(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<void> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  await apiFetch<void>(`/v1/leads/${id}`, {
    method: "DELETE",
    workspaceId,
    accessToken,
  });
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  city?: string;
  country?: string;
  timezone?: string;
  status?: LeadStatus;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Lead> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const body: Record<string, unknown> = {};
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.phone !== undefined) body.phone = input.phone;
  if (input.company !== undefined) body.company = input.company;
  if (input.title !== undefined) body.title = input.title;
  if (input.linkedinUrl !== undefined) body.linkedin_url = input.linkedinUrl;
  if (input.industry !== undefined) body.industry = input.industry;
  if (input.companySize !== undefined) body.company_size = input.companySize;
  if (input.website !== undefined) body.website = input.website;
  if (input.city !== undefined) body.city = input.city;
  if (input.country !== undefined) body.country = input.country;
  if (input.timezone !== undefined) body.timezone = input.timezone;
  if (input.status !== undefined) body.status = input.status;
  if (input.notes !== undefined) body.notes = input.notes;
  if (input.tags !== undefined) body.tags = input.tags;
  if (input.customFields !== undefined) body.custom_fields = input.customFields;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    workspaceId,
    accessToken,
  });
  return mapLead(raw);
}

/** Merge-update only the custom_fields JSONB on a lead. */
export async function updateLeadCustomFields(
  id: string,
  fields: Record<string, unknown>,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Lead> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/leads/${id}/custom-fields`, {
    method: "PATCH",
    body: JSON.stringify(fields),
    workspaceId,
    accessToken,
  });
  return mapLead(raw);
}
