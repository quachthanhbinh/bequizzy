/**
 * Billing API client — plan info, credits, and transaction history via billing-service.
 */
import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanId = "free" | "starter" | "growth" | "scale";

export interface BillingPlan {
  plan: PlanId;
  credits_balance: number;
  credits_monthly_allocation: number;
  topup_credits: number;
  credits_reset_at: string | null;
  paddle_subscription_id: string | null;
}

export interface CreditTransaction {
  id: string;
  transaction_type: "allocation" | "deduction" | "refund" | "topup" | "adjustment";
  amount: number;
  feature_key: string | null;
  description: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchBillingPlan(): Promise<BillingPlan> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<BillingPlan>("/v1/billing/plan", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function fetchCreditHistory(): Promise<CreditTransaction[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<CreditTransaction[]>("/v1/billing/credits/history", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
