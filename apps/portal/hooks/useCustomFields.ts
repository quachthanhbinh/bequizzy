"use client";

/**
 * TanStack Query hooks for lead custom field definitions.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchCustomFieldDefinitions,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  type CustomFieldDefinition,
  type CustomFieldType,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
} from "@/lib/api/customFields";

export type { CustomFieldDefinition, CustomFieldType };

export const CUSTOM_FIELDS_QUERY_KEY = "customFieldDefinitions";

export function useCustomFieldDefinitions(params?: { campaignId?: string }) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [CUSTOM_FIELDS_QUERY_KEY, params?.campaignId ?? null],
    queryFn: () => fetchCustomFieldDefinitions({ campaignId: params?.campaignId }),
    enabled: !authLoading && !!user,
    staleTime: 30_000,
  });
}

export function useCreateCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomFieldInput) => createCustomFieldDefinition(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOM_FIELDS_QUERY_KEY] });
    },
  });
}

export function useUpdateCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomFieldInput }) =>
      updateCustomFieldDefinition(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOM_FIELDS_QUERY_KEY] });
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomFieldDefinition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOM_FIELDS_QUERY_KEY] });
    },
  });
}

export type { CustomFieldDefinition, CreateCustomFieldInput, UpdateCustomFieldInput };
