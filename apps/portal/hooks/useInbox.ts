"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchThreads,
  fetchThread,
  fetchMessages,
  markThreadRead,
  updateThreadStatus,
  sendMessage,
  generateDraft,
  sendDraft,
  type InboxThread,
  type InboxMessage,
  type ThreadStatus,
} from "@/lib/api/inbox";

export const THREADS_KEY = "inbox-threads";
export const MESSAGES_KEY = "inbox-messages";

export function useThreads(params?: { status?: ThreadStatus }) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [THREADS_KEY, params],
    queryFn: () => fetchThreads(params),
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: [THREADS_KEY, threadId],
    queryFn: () => fetchThread(threadId!),
    enabled: !!threadId,
  });
}

export function useMessages(threadId: string | null) {
  return useQuery({
    queryKey: [MESSAGES_KEY, threadId],
    queryFn: () => fetchMessages(threadId!),
    enabled: !!threadId,
    placeholderData: (prev) => prev,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, isRead }: { threadId: string; isRead: boolean }) =>
      markThreadRead(threadId, isRead),
    onSuccess: () => qc.invalidateQueries({ queryKey: [THREADS_KEY] }),
  });
}

export function useUpdateThreadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, status }: { threadId: string; status: ThreadStatus }) =>
      updateThreadStatus(threadId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [THREADS_KEY] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      sendMessage(threadId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [MESSAGES_KEY, vars.threadId] });
      qc.invalidateQueries({ queryKey: [THREADS_KEY] });
    },
  });
}

export function useGenerateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => generateDraft(threadId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [THREADS_KEY] }),
  });
}

export function useSendDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => sendDraft(draftId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [THREADS_KEY] }),
  });
}

export type { InboxThread, InboxMessage, ThreadStatus };
