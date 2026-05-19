"use client";

/**
 * TanStack Query hooks for campaigns API.
 * Falls back gracefully to empty state when API is unavailable.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaignStatus,
  updateCampaign,
  deleteCampaign,
  draftCampaignWithAI,
  type Campaign,
  type CampaignStatus,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type CampaignDraft,
} from "@/lib/api/campaigns";

export const CAMPAIGNS_QUERY_KEY = "campaigns";

export function useCampaigns(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CampaignStatus | "all";
}) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, params],
    queryFn: () => fetchCampaigns(params),
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, id],
    queryFn: () => fetchCampaign(id!),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaign(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      updateCampaignStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

export function useDraftCampaign() {
  return useMutation({
    mutationFn: (prompt: string) => draftCampaignWithAI(prompt),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCampaignInput }) =>
      updateCampaign(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

export type { Campaign, CampaignStatus, CampaignDraft, UpdateCampaignInput };
