/**
 * Workspace API client — workspace settings via workspace-service.
 */
import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  timezone?: string;
  logo_url?: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
  const { accessToken } = getAuthContext();
  return apiFetch<WorkspaceInfo>(`/v1/workspaces/${workspaceId}`, {
    accessToken: accessToken ?? undefined,
    workspaceId,
  });
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<WorkspaceInfo> {
  const { accessToken } = getAuthContext();
  return apiFetch<WorkspaceInfo>(`/v1/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId,
  });
}
