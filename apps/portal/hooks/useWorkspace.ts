"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchWorkspace,
  updateWorkspace,
  type WorkspaceInfo,
  type UpdateWorkspaceInput,
} from "@/lib/api/workspace";

export const WORKSPACE_KEY = "workspace";

export function useWorkspace() {
  const { user } = useAuth();
  const workspaceId = user?.activeWorkspaceId ?? null;
  return useQuery({
    queryKey: [WORKSPACE_KEY, workspaceId],
    queryFn: () => fetchWorkspace(workspaceId!),
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateWorkspaceInput) =>
      updateWorkspace(user!.activeWorkspaceId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WORKSPACE_KEY] }),
  });
}

export type { WorkspaceInfo };
