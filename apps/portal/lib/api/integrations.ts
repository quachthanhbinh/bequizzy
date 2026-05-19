/**
 * Integrations API client — wraps integration-service endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveIntegration {
  id: string;
  provider: string;
  status: string; // "active" | "inactive" | etc. from backend
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchIntegrations(
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<LiveIntegration[]> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<{ data: LiveIntegration[] }>("/v1/integrations", {
    workspaceId,
    accessToken,
  });
  return raw.data ?? [];
}

export async function connectIntegration(
  provider: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<LiveIntegration> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<{ data: LiveIntegration }>("/v1/integrations", {
    method: "POST",
    body: JSON.stringify({ provider }),
    workspaceId,
    accessToken,
  });
  return raw.data;
}

export async function disconnectIntegration(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<void> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  await apiFetch<unknown>(`/v1/integrations/${id}`, {
    method: "DELETE",
    workspaceId,
    accessToken,
  });
}

export interface OAuthAuthorizeResult {
  provider: string;
  provider_name: string;
  url: string | null;
  dev_mode: boolean;
}

export async function getOAuthUrl(
  provider: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<OAuthAuthorizeResult> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<{ data: OAuthAuthorizeResult }>(
    `/v1/integrations/oauth/${provider}/authorize`,
    { workspaceId, accessToken },
  );
  return raw.data;
}

export async function connectIntegrationWithCredentials(
  provider: string,
  credentials: Record<string, string>,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<LiveIntegration> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<{ data: LiveIntegration }>("/v1/integrations", {
    method: "POST",
    body: JSON.stringify({ provider, credentials }),
    workspaceId,
    accessToken,
  });
  return raw.data;
}

export async function exchangeOAuthCode(
  provider: string,
  code: string,
  state: string,
): Promise<LiveIntegration> {
  const auth = getAuthContext();
  const accessToken = auth.accessToken ?? undefined;

  const raw = await apiFetch<{ data: LiveIntegration }>(
    `/v1/integrations/oauth/${provider}/callback`,
    {
      method: "POST",
      body: JSON.stringify({ code, state }),
      workspaceId: state,
      accessToken,
    },
  );
  return raw.data;
}
