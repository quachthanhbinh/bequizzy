/**
 * CRM API client — deal stages, deals, activities via crm-service.
 */
import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DealStatus = "open" | "won" | "lost";

export interface DealStage {
  id: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost?: boolean;
}

export interface Deal {
  id: string;
  stage_id: string;
  title: string;
  amount: number | null;
  lead_id: string | null;
  status: DealStatus;
  created_at: string;
}

export interface Activity {
  id: string;
  deal_id: string;
  activity_type: string;
  note: string | null;
  created_at: string;
}

export interface CreateDealInput {
  stage_id: string;
  title: string;
  amount?: number;
  lead_id?: string;
}

export interface CreateStageInput {
  name: string;
  position?: number;
  is_default?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
}

// ---------------------------------------------------------------------------
// Deal Stages
// ---------------------------------------------------------------------------

export async function fetchDealStages(): Promise<DealStage[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<DealStage[]>("/v1/deal-stages", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function createDealStage(input: CreateStageInput): Promise<DealStage> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<DealStage>("/v1/deal-stages", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function fetchDeals(): Promise<Deal[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<Deal[]>("/v1/deals", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<Deal>("/v1/deals", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function moveDeal(dealId: string, stageId: string): Promise<Deal> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<Deal>(`/v1/deals/${dealId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ stage_id: stageId }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function addActivity(
  dealId: string,
  input: { activity_type: string; note?: string },
): Promise<Activity> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<Activity>(`/v1/deals/${dealId}/activities`, {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
