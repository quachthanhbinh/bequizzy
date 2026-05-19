/**
 * Outreach API client — mailboxes and suppression list via outreach-service.
 */
import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MailboxProvider = "gmail" | "outlook";

export interface Mailbox {
  id: string;
  email: string;
  display_name: string | null;
  provider: MailboxProvider;
  is_active: boolean;
  daily_send_limit: number;
  created_at: string;
}

export type SuppressionReason = "bounce" | "complaint" | "unsubscribe" | "manual";

export interface SuppressedEmail {
  id: string;
  email: string;
  reason: SuppressionReason;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mailboxes
// ---------------------------------------------------------------------------

export async function fetchMailboxes(): Promise<Mailbox[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<Mailbox[]>("/v1/mailboxes", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Suppression list
// ---------------------------------------------------------------------------

export async function fetchSuppressed(): Promise<SuppressedEmail[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<SuppressedEmail[]>("/v1/suppression", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function addSuppression(
  email: string,
  reason: SuppressionReason = "manual",
): Promise<SuppressedEmail> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<SuppressedEmail>("/v1/suppression", {
    method: "POST",
    body: JSON.stringify({ email, reason }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function removeSuppression(email: string): Promise<void> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<void>(`/v1/suppression/${encodeURIComponent(email)}`, {
    method: "DELETE",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
