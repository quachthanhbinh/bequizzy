/**
 * Typed mock inbox thread data for E2E tests.
 *
 * fetchThreads returns InboxThread[] directly (no envelope).
 * MockThread matches the InboxThread interface from lib/api/inbox.ts.
 */

export interface MockThread {
  id: string;
  workspace_id: string;
  lead_id: string;
  subject: string | null;
  channel: string;
  status: "open" | "snoozed" | "archived";
  is_read: boolean;
  last_message_at: string | null;
  from_email: string | null;
  intent_class: "interested" | "not_interested" | "out_of_office" | "question" | "meeting_request" | "unclassified" | null;
}

export const MOCK_THREAD_OPEN: MockThread = {
  id: "thread-00000001",
  workspace_id: "e2e-workspace-id",
  lead_id: "00000000-0000-0000-0000-000000000001",
  subject: "Re: Quick question about RevLooper",
  channel: "email",
  status: "open",
  is_read: false,
  last_message_at: "2025-05-01T09:30:00Z",
  from_email: "ana@acmevn.com",
  intent_class: "interested",
};

export const MOCK_THREAD_DONE: MockThread = {
  id: "thread-00000002",
  workspace_id: "e2e-workspace-id",
  lead_id: "00000000-0000-0000-0000-000000000002",
  subject: "Re: Following up",
  channel: "email",
  status: "archived",
  is_read: true,
  last_message_at: "2025-04-28T14:00:00Z",
  from_email: "binh@techstart.sg",
  intent_class: "not_interested",
};

// fetchThreads returns InboxThread[] directly — no envelope.
export const INBOX_RESPONSE: MockThread[] = [MOCK_THREAD_OPEN, MOCK_THREAD_DONE];
export const INBOX_EMPTY: MockThread[] = [];
