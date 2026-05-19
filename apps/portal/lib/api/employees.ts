/**
 * AI Employee Platform API client (Spec 40).
 * Wraps ai-employee-service endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  monthly_rental_price_usd: string;
  credits_per_run_estimate: number;
  default_daily_spend_cap_usd: string;
  default_monthly_spend_cap_usd: string;
  default_dry_run_days: number;
  default_per_run_cost_ceiling_usd: string;
  allowed_model_ids: string[];
  min_plan: string;
  is_published: boolean;
  version: number;
  created_at: string;
}

export interface ToolManifest {
  id: string;
  name: string;
  description: string;
  side_effect_class: string;
  requires_approval_above_usd: string | null;
  max_per_run: number;
}

export interface CatalogDetail extends CatalogEntry {
  tools: ToolManifest[];
}

export interface CatalogListResponse {
  data: CatalogEntry[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    coming_soon: boolean;
  };
}

export interface Rental {
  id: string;
  workspace_id: string;
  catalog_id: string;
  rented_by_user_id: string;
  model_id: string;
  status: string;
  pause_reason: string | null;
  daily_spend_cap_usd: string;
  monthly_spend_cap_usd: string;
  per_run_credit_ceiling: number;
  dry_run_until: string | null;
  paddle_line_item_id: string | null;
  cancelling_at: string | null;
  cancellation_grace_ends_at: string | null;
  config: Record<string, unknown>;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  workspace_id: string;
  rental_id: string;
  run_id: string;
  tool_id: string;
  proposed_action: Record<string, unknown>;
  reasoning: string;
  expected_outcome: string;
  rollback_plan: string | null;
  risk_score: number;
  estimated_cost_usd: string;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string;
  idempotency_key: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authOpts() {
  const { accessToken, workspaceId } = getAuthContext();
  return {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function fetchCatalog(params?: {
  limit?: number;
  offset?: number;
}): Promise<CatalogListResponse> {
  const qp = new URLSearchParams();
  if (params?.limit) qp.set("limit", String(params.limit));
  if (params?.offset) qp.set("offset", String(params.offset));
  const path = `/v1/employees/catalog${qp.toString() ? `?${qp}` : ""}`;
  return apiFetch<CatalogListResponse>(path, authOpts());
}

export async function fetchCatalogEntry(slug: string): Promise<CatalogDetail> {
  return apiFetch<CatalogDetail>(`/v1/employees/catalog/${slug}`, authOpts());
}

// ---------------------------------------------------------------------------
// Rentals
// ---------------------------------------------------------------------------

export async function fetchRentals(status?: string): Promise<Rental[]> {
  const qp = new URLSearchParams();
  if (status) qp.set("status", status);
  const path = `/v1/employees/rentals${qp.toString() ? `?${qp}` : ""}`;
  return apiFetch<Rental[]>(path, authOpts());
}

export async function fetchRental(id: string): Promise<Rental> {
  return apiFetch<Rental>(`/v1/employees/rentals/${id}`, authOpts());
}

export async function cancelRental(id: string): Promise<Rental> {
  return apiFetch<Rental>(`/v1/employees/rentals/${id}/cancel`, {
    method: "POST",
    ...authOpts(),
  });
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export async function fetchApprovals(status?: string): Promise<ApprovalRequest[]> {
  const qp = new URLSearchParams();
  if (status) qp.set("status", status);
  const path = `/v1/employees/approvals${qp.toString() ? `?${qp}` : ""}`;
  return apiFetch<ApprovalRequest[]>(path, authOpts());
}

export async function approveAction(id: string): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>(`/v1/employees/approvals/${id}/approve`, {
    method: "POST",
    ...authOpts(),
  });
}

export async function rejectAction(id: string): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>(`/v1/employees/approvals/${id}/reject`, {
    method: "POST",
    ...authOpts(),
  });
}
