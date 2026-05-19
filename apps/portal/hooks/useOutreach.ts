"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchMailboxes,
  fetchSuppressed,
  addSuppression,
  removeSuppression,
  type Mailbox,
  type SuppressedEmail,
  type SuppressionReason,
} from "@/lib/api/outreach";

export const MAILBOXES_KEY = "mailboxes";
export const SUPPRESSION_KEY = "suppression";

export function useMailboxes() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [MAILBOXES_KEY],
    queryFn: fetchMailboxes,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useSuppression() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [SUPPRESSION_KEY],
    queryFn: fetchSuppressed,
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useAddSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, reason }: { email: string; reason?: SuppressionReason }) =>
      addSuppression(email, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SUPPRESSION_KEY] }),
  });
}

export function useRemoveSuppression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => removeSuppression(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SUPPRESSION_KEY] }),
  });
}

export type { Mailbox, SuppressedEmail };
