/**
 * Typed mock workspace, billing, and plan data for E2E tests.
 *
 * fetchBillingPlan  returns BillingPlan directly (no envelope).
 * fetchCreditHistory returns CreditTransaction[] directly (plain array).
 */

export interface MockBillingPlan {
  plan: "free" | "starter" | "growth" | "scale";
  credits_balance: number;
  credits_monthly_allocation: number;
  topup_credits: number;
  credits_reset_at: string | null;
  paddle_subscription_id: string | null;
}

export interface MockCreditHistoryEntry {
  id: string;
  workspace_id: string;
  type: "allocation" | "deduction" | "topup" | "refund";
  amount: number;
  operation: string | null;
  created_at: string;
}

/** Free plan — no credits, triggers plan-gating prompts */
export const MOCK_BILLING_FREE: MockBillingPlan = {
  plan: "free",
  credits_balance: 0,
  credits_monthly_allocation: 0,
  topup_credits: 0,
  credits_reset_at: null,
  paddle_subscription_id: null,
};

/** Starter plan — 500 credits, some used */
export const MOCK_BILLING_STARTER: MockBillingPlan = {
  plan: "starter",
  credits_balance: 350,
  credits_monthly_allocation: 500,
  topup_credits: 0,
  credits_reset_at: "2025-06-01T00:00:00Z",
  paddle_subscription_id: null,
};

/** Growth plan — 8000 credits */
export const MOCK_BILLING_GROWTH: MockBillingPlan = {
  plan: "growth",
  credits_balance: 6200,
  credits_monthly_allocation: 8000,
  topup_credits: 0,
  credits_reset_at: "2025-06-01T00:00:00Z",
  paddle_subscription_id: null,
};

// fetchBillingPlan returns BillingPlan directly — no envelope.
export const BILLING_PLAN_RESPONSE: MockBillingPlan = MOCK_BILLING_STARTER;
export const BILLING_FREE_RESPONSE: MockBillingPlan = MOCK_BILLING_FREE;

// fetchCreditHistory returns CreditTransaction[] directly — no envelope.
// CreditTransaction fields: id, transaction_type, amount, feature_key, description, created_at
export const CREDIT_HISTORY_RESPONSE = [
  {
    id: "hist-1",
    transaction_type: "allocation" as const,
    amount: 500,
    feature_key: null,
    description: "Monthly allocation",
    created_at: "2025-05-01T00:00:00Z",
  },
  {
    id: "hist-2",
    transaction_type: "deduction" as const,
    amount: -5,
    feature_key: "email_draft",
    description: "Email draft (AI)",
    created_at: "2025-05-02T00:00:00Z",
  },
];

export const CREDIT_HISTORY_EMPTY: typeof CREDIT_HISTORY_RESPONSE = [];
