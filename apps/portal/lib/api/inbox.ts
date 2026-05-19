/**
 * Inbox API client — threads and messages via inbox-service.
 */
import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreadStatus = "open" | "snoozed" | "archived";
export type MessageDirection = "inbound" | "outbound";
export type IntentClass =
  | "interested"
  | "not_interested"
  | "out_of_office"
  | "question"
  | "meeting_request"
  | "unclassified";

export interface InboxThread {
  id: string;
  workspace_id: string;
  lead_id: string;
  subject: string | null;
  channel: string;
  status: ThreadStatus;
  is_read: boolean;
  last_message_at: string | null;
  from_email: string | null;
  intent_class: IntentClass | null;
}

export interface InboxMessage {
  id: string;
  thread_id: string;
  direction: MessageDirection;
  body: string;
  sent_at: string | null;
  intent_class: IntentClass | null;
  ai_confidence: number | null;
}

export interface AiDraft {
  id: string;
  thread_id: string;
  draft_body: string;
  body: string;
  credits_used: number;
  is_sent: boolean;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchThreads(params?: {
  status?: ThreadStatus;
}): Promise<InboxThread[]> {
  const { accessToken, workspaceId } = getAuthContext();
  const qp = new URLSearchParams();
  if (params?.status) qp.set("status", params.status);
  const path = `/v1/inbox/threads${qp.toString() ? `?${qp}` : ""}`;
  return apiFetch<InboxThread[]>(path, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function fetchThread(threadId: string): Promise<InboxThread> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<InboxThread>(`/v1/inbox/threads/${threadId}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function fetchMessages(threadId: string): Promise<InboxMessage[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<InboxMessage[]>(`/v1/inbox/threads/${threadId}/messages`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function markThreadRead(
  threadId: string,
  isRead: boolean,
): Promise<InboxThread> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<InboxThread>(`/v1/inbox/threads/${threadId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: isRead }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function updateThreadStatus(
  threadId: string,
  status: ThreadStatus,
): Promise<InboxThread> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<InboxThread>(`/v1/inbox/threads/${threadId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function sendMessage(
  threadId: string,
  body: string,
): Promise<InboxMessage> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<InboxMessage>(`/v1/inbox/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ direction: "outbound", body }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function generateDraft(threadId: string): Promise<AiDraft> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<AiDraft>(`/v1/inbox/threads/${threadId}/draft`, {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function sendDraft(draftId: string): Promise<AiDraft> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<AiDraft>(`/v1/inbox/drafts/${draftId}/send`, {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
