/**
 * AI Advisor API client — wraps ai-service /v1/advisor/chat via api-gateway.
 */

import { apiFetch, getAuthContext, type ApiResponse } from "./client";
import type { CampaignStatus } from "./campaigns";
import type { LeadStatus } from "./leads";

// Re-export for convenience
export type { CampaignStatus, LeadStatus };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdvisorAction =
  | { type: "create_campaign"; label: string; payload: { name: string; description?: string } }
  | {
      type: "update_campaign";
      label: string;
      payload: { id?: string; name?: string; description?: string; status?: CampaignStatus };
    }
  | { type: "delete_campaign"; label: string; payload: { id?: string; name: string } }
  | {
      type: "create_lead";
      label: string;
      payload: {
        firstName: string;
        lastName: string;
        email: string;
        company?: string;
        title?: string;
      };
    }
  | {
      type: "update_lead";
      label: string;
      payload: {
        id?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        company?: string;
        title?: string;
        country?: string;
      };
    }
  | {
      type: "update_lead_status";
      label: string;
      payload: { id?: string; email?: string; name?: string; status: LeadStatus };
    }
  | { type: "delete_lead"; label: string; payload: { id?: string; email?: string; name?: string } }
  | { type: "navigate"; label: string; href: string };

export interface AdvisorChatInput {
  message: string;
  session_id: string | null;
}

export interface AdvisorChatResponse {
  session_id: string;
  response: string;
  sources: string[];
  action: AdvisorAction | null;
  session_archived?: boolean;
  archived_session_id?: string | null;
  archived_session_title?: string | null;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export interface AdvisorSession {
  id: string;
  title: string | null;
  status: "active" | "archived";
  message_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface AdvisorSessionDetail extends AdvisorSession {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    sources?: string[];
    action?: AdvisorAction | null;
    ts: string;
  }>;
}

export interface ListSessionsResponse {
  sessions: AdvisorSession[];
  next_cursor: string | null;
  total: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function sendAdvisorMessage(
  input: AdvisorChatInput,
): Promise<AdvisorChatResponse> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<AdvisorChatResponse>("/v1/advisor/chat", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function listAdvisorSessions(
  status: "active" | "archived" = "active",
  cursor?: string,
): Promise<ListSessionsResponse> {
  const { accessToken, workspaceId } = getAuthContext();
  const params = new URLSearchParams({ status, limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch<ApiResponse<ListSessionsResponse>>(`/v1/advisor/sessions?${params}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
  return res.data;
}

export async function createAdvisorSession(): Promise<AdvisorSession & {
  session_archived: boolean;
  archived_session_id: string | null;
  archived_session_title: string | null;
}> {
  const { accessToken, workspaceId } = getAuthContext();
  const res = await apiFetch<ApiResponse<AdvisorSession & {
    session_archived: boolean;
    archived_session_id: string | null;
    archived_session_title: string | null;
  }>>("/v1/advisor/sessions", {
    method: "POST",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
  return res.data;
}

export async function getAdvisorSession(sessionId: string): Promise<AdvisorSessionDetail> {
  const { accessToken, workspaceId } = getAuthContext();
  const res = await apiFetch<ApiResponse<AdvisorSessionDetail>>(`/v1/advisor/sessions/${sessionId}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
  return res.data;
}

export async function updateAdvisorSession(
  sessionId: string,
  body: { title?: string; status?: "active" | "archived" },
): Promise<AdvisorSession> {
  const { accessToken, workspaceId } = getAuthContext();
  const res = await apiFetch<ApiResponse<AdvisorSession>>(`/v1/advisor/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
  return res.data;
}

export async function deleteAdvisorSession(sessionId: string): Promise<void> {
  const { accessToken, workspaceId } = getAuthContext();
  await apiFetch<void>(`/v1/advisor/sessions/${sessionId}`, {
    method: "DELETE",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
