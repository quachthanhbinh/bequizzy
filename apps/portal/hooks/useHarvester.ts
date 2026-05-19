"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  commitHarvesterSession,
  createHarvesterSession,
  deleteHarvesterSession,
  getHarvesterSession,
  listHarvesterSessions,
  listHarvesterTemplates,
  resumeHarvesterSession,
  runReflection,
  grantHarvesterConsent,
  type CreateSessionInput,
  type HarvesterSession,
  type HarvesterSessionStatus,
} from "@/lib/api/harvester";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const SESSIONS_KEY = ["harvester-sessions"] as const;
const SESSION_KEY = (id: string) => ["harvester-session", id] as const;
const TEMPLATES_KEY = ["harvester-templates"] as const;
const REFLECT_KEY = ["harvester-reflect"] as const;

// ---------------------------------------------------------------------------
// Sessions list
// ---------------------------------------------------------------------------

export function useHarvesterSessions(status?: HarvesterSessionStatus) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, status],
    queryFn: () => listHarvesterSessions(status),
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Single session
// ---------------------------------------------------------------------------

export function useHarvesterSession(id: string | null) {
  return useQuery({
    queryKey: SESSION_KEY(id ?? ""),
    queryFn: () => getHarvesterSession(id!),
    enabled: !!id,
    staleTime: 0,
    retry: false,
    throwOnError: false,
  });
}

// ---------------------------------------------------------------------------
// Create session
// ---------------------------------------------------------------------------

export function useCreateHarvesterSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) => createHarvesterSession(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Resume session (draft → active)
// ---------------------------------------------------------------------------

export function useResumeHarvesterSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeHarvesterSession(id),
    onSuccess: (data: HarvesterSession) => {
      qc.setQueryData(SESSION_KEY(data.id), data);
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Commit session (draft → committed)
// ---------------------------------------------------------------------------

export function useCommitHarvesterSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commitHarvesterSession(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: SESSION_KEY(id) });
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
      // Also invalidate AI Brain docs list
      qc.invalidateQueries({ queryKey: ["brain-documents"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete session
// ---------------------------------------------------------------------------

export function useDeleteHarvesterSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHarvesterSession(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: SESSION_KEY(id) });
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function useHarvesterTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: listHarvesterTemplates,
    staleTime: 5 * 60_000, // templates rarely change
  });
}

// ---------------------------------------------------------------------------
// Reflection
// ---------------------------------------------------------------------------

export function useReflect(enabled = false) {
  return useQuery({
    queryKey: REFLECT_KEY,
    queryFn: runReflection,
    enabled,
    staleTime: 15 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export function useGrantHarvesterConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => grantHarvesterConsent(),
    onSuccess: () => {
      // Re-enable harvester after consent
      qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}
