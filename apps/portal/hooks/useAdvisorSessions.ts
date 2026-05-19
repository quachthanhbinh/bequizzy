"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdvisorSession,
  deleteAdvisorSession,
  getAdvisorSession,
  listAdvisorSessions,
  updateAdvisorSession,
  type AdvisorSession,
} from "@/lib/api/advisor";

const SESSIONS_KEY = ["advisor-sessions"] as const;
const SESSION_KEY = (id: string) => ["advisor-session", id] as const;

export function useAdvisorSessions(status: "active" | "archived" = "active") {
  return useQuery({
    queryKey: [...SESSIONS_KEY, status],
    queryFn: () => listAdvisorSessions(status),
    staleTime: 30_000,
  });
}

export function useAdvisorSession(id: string | null) {
  return useQuery({
    queryKey: SESSION_KEY(id ?? ""),
    queryFn: () => getAdvisorSession(id!),
    enabled: !!id,
    staleTime: 0,
    retry: false,
    throwOnError: false,
  });
}

export function useCreateAdvisorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdvisorSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

export function useUpdateAdvisorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; status?: "active" | "archived" }) =>
      updateAdvisorSession(id, body),
    onSuccess: (updated: AdvisorSession) => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
      qc.setQueryData(SESSION_KEY(updated.id), updated);
    },
  });
}

export function useDeleteAdvisorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdvisorSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}
