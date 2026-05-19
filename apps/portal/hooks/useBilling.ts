"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchBillingPlan,
  fetchCreditHistory,
  type BillingPlan,
  type CreditTransaction,
} from "@/lib/api/billing";

export const BILLING_PLAN_KEY = "billing-plan";
export const CREDIT_HISTORY_KEY = "credit-history";

export function useBillingPlan() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [BILLING_PLAN_KEY],
    queryFn: fetchBillingPlan,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useCreditHistory() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [CREDIT_HISTORY_KEY],
    queryFn: fetchCreditHistory,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export type { BillingPlan, CreditTransaction };
