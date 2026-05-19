"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchDealStages,
  fetchDeals,
  createDeal,
  createDealStage,
  moveDeal,
  addActivity,
  type Deal,
  type DealStage,
  type CreateDealInput,
  type CreateStageInput,
} from "@/lib/api/crm";

export const CRM_STAGES_KEY = "deal-stages";
export const CRM_DEALS_KEY = "deals";

export function useDealStages() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [CRM_STAGES_KEY],
    queryFn: fetchDealStages,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useDeals() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [CRM_DEALS_KEY],
    queryFn: fetchDeals,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDealInput) => createDeal(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_DEALS_KEY] }),
  });
}

export function useCreateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStageInput) => createDealStage(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_STAGES_KEY] }),
  });
}

export function useMoveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      moveDeal(dealId, stageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_DEALS_KEY] }),
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dealId,
      activity_type,
      note,
    }: {
      dealId: string;
      activity_type: string;
      note?: string;
    }) => addActivity(dealId, { activity_type, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_DEALS_KEY] }),
  });
}

export type { Deal, DealStage };
