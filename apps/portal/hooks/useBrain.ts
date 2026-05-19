"use client";

/**
 * TanStack Query hooks for AI Brain API.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  deleteDocument,
  fetchBrainDocuments,
  fetchWizardState,
  getDocument,
  reindexDocument,
  saveWizardAnswers,
  submitWizard,
  updateDocument,
  uploadDocument,
  type DocumentUpdateInput,
  type DocumentUploadInput,
  type KnowledgeDoc,
  type WizardSubmitInput,
} from "@/lib/api/brain";

export const BRAIN_QUERY_KEY = "brain-documents";

export function useBrainDocuments() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [BRAIN_QUERY_KEY],
    queryFn: fetchBrainDocuments,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useSubmitWizard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WizardSubmitInput) => submitWizard(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BRAIN_QUERY_KEY] });
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentUploadInput) => uploadDocument(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BRAIN_QUERY_KEY] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BRAIN_QUERY_KEY] });
    },
  });
}

export function useDocument(id: string | null) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: ["brain-document", id],
    queryFn: () => getDocument(id!),
    enabled: !authLoading && !!user && !!id,
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateInput }) =>
      updateDocument(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: [BRAIN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["brain-document", id] });
    },
  });
}

export function useReindexDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reindexDocument(id),
    onSuccess: (_result, id) => {
      qc.invalidateQueries({ queryKey: [BRAIN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["brain-document", id] });
    },
  });
}

export function useWizardState() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: ["brain-wizard-state"],
    queryFn: fetchWizardState,
    enabled: !authLoading && !!user,
  });
}

export function useSaveWizardAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: Record<string, string>) => saveWizardAnswers(answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brain-wizard-state"] });
    },
  });
}
