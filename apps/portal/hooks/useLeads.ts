"use client";

/**
 * TanStack Query hooks for leads API.
 * Falls back gracefully to empty state when API is unavailable.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchLeads,
  fetchLead,
  createLead,
  deleteLead,
  updateLead,
  updateLeadCustomFields,
  type Lead,
  type LeadStatus,
  type ScoreLabel,
  type CreateLeadInput,
  type UpdateLeadInput,
} from "@/lib/api/leads";

export const LEADS_QUERY_KEY = "leads";

export function useLeads(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus | "all";
  scoreLabel?: ScoreLabel | "all";
}) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, params],
    queryFn: () => fetchLeads(params),
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, id],
    queryFn: () => fetchLead(id!),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLeadInput }) =>
      updateLead(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY, id] });
    },
  });
}

export function useUpdateLeadCustomFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, unknown> }) =>
      updateLeadCustomFields(id, fields),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [LEADS_QUERY_KEY, id] });
    },
  });
}

export type { Lead, LeadStatus, ScoreLabel, UpdateLeadInput };
