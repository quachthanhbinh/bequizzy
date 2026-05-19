/**
 * AI Brain Harvester API client — Spec 39
 * Wraps ai-service /v1/brain/harvester/* endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HarvesterSessionStatus = "active" | "draft" | "committed" | "deleted";
export type HarvesterSessionMode = "chat" | "dump";

export interface HarvesterSession {
  id: string;
  workspace_id: string;
  user_id: string;
  status: HarvesterSessionStatus;
  mode: HarvesterSessionMode;
  topic: string;
  template_id: string | null;
  messages: HarvesterMessage[];
  draft_markdown: string | null;
  draft_version: number;
  committed_doc_id: string | null;
  turn_count: number;
  synthesis_count: number;
  language_hint: string | null;
  created_at: string;
  updated_at: string;
}

export interface HarvesterMessage {
  role: "user" | "assistant";
  content: string;
  turn_id: string;
  created_at: string;
}

export interface HarvesterTemplate {
  id: string;
  topic_slug: string;
  name: string;
  description: string | null;
  tags: string[];
  seed_questions: Array<{ order: number; question: string }>;
  sort_order: number;
}

export interface CreateSessionInput {
  topic: string;
  mode?: HarvesterSessionMode;
  template_id?: string;
  language_hint?: string;
}

export interface TurnInput {
  message: string;
  turn_id: string;
}

export interface DumpInput {
  content: string;
  turn_id: string;
}

export interface ConsentInput {
  consent_type?: string;
  source?: string;
}

export interface CommitResponse {
  doc_id: string;
  title: string;
  status: string;
}

export interface ReflectSuggestion {
  topic: string;
  reason: string;
  template_id: string | null;
}

export interface ReflectResponse {
  suggestions: ReflectSuggestion[];
}

// ---------------------------------------------------------------------------
// Session CRUD
// ---------------------------------------------------------------------------

export async function createHarvesterSession(input: CreateSessionInput): Promise<HarvesterSession> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<HarvesterSession>("/v1/brain/harvester/sessions", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function listHarvesterSessions(
  status?: HarvesterSessionStatus,
  limit = 20,
  cursor?: string
): Promise<HarvesterSession[]> {
  const { accessToken, workspaceId } = getAuthContext();
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set("status", status);
  if (cursor) params.set("cursor", cursor);
  return apiFetch<HarvesterSession[]>(`/v1/brain/harvester/sessions?${params}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function getHarvesterSession(id: string): Promise<HarvesterSession> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<HarvesterSession>(`/v1/brain/harvester/sessions/${id}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function getHarvesterDraft(id: string, version?: number): Promise<{ markdown: string; version: number }> {
  const { accessToken, workspaceId } = getAuthContext();
  const params = version ? `?version=${version}` : "";
  return apiFetch<{ markdown: string; version: number }>(
    `/v1/brain/harvester/sessions/${id}/draft${params}`,
    {
      accessToken: accessToken ?? undefined,
      workspaceId: workspaceId ?? undefined,
    }
  );
}

export async function resumeHarvesterSession(id: string): Promise<HarvesterSession> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<HarvesterSession>(`/v1/brain/harvester/sessions/${id}/resume`, {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function commitHarvesterSession(id: string): Promise<CommitResponse> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<CommitResponse>(`/v1/brain/harvester/sessions/${id}/commit`, {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function deleteHarvesterSession(id: string): Promise<void> {
  const { accessToken, workspaceId } = getAuthContext();
  await apiFetch<void>(`/v1/brain/harvester/sessions/${id}`, {
    method: "DELETE",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listHarvesterTemplates(): Promise<HarvesterTemplate[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<HarvesterTemplate[]>("/v1/brain/harvester/templates", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Reflection
// ---------------------------------------------------------------------------

export async function runReflection(): Promise<ReflectResponse> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<ReflectResponse>("/v1/brain/harvester/reflect", {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export async function grantHarvesterConsent(input?: ConsentInput): Promise<{ id: string }> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<{ id: string }>("/v1/brain/harvester/consent", {
    method: "POST",
    body: JSON.stringify(input ?? { consent_type: "ai_data_processing", source: "harvester" }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// SSE streaming helpers
// Probe turns, synthesis, and dump all use Server-Sent Events.
// ---------------------------------------------------------------------------

export type SSEEventType = "meta" | "delta" | "done" | "error";

export interface SSEMeta {
  session_id: string;
  turn_count: number;
  synthesis_count?: number;
}

export interface SSEDone {
  session_id: string;
  markdown?: string;
  turn_count?: number;
  synthesis_count?: number;
}

export interface SSEError {
  code: string;
  message: string;
}

export type SSEEvent =
  | { type: "meta"; data: SSEMeta }
  | { type: "delta"; data: { text: string } }
  | { type: "done"; data: SSEDone }
  | { type: "error"; data: SSEError };

/**
 * Call a harvester SSE endpoint and yield parsed SSEEvent objects.
 * Caller provides the path and body.
 */
export async function* harvesterStream(
  path: string,
  body: unknown
): AsyncGenerator<SSEEvent> {
  const { accessToken, workspaceId } = getAuthContext();
  const apiBase =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
      : "http://localhost:8000";

  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(workspaceId ? { "X-Workspace-ID": workspaceId } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let errorData: SSEError = { code: "STREAM_ERROR", message: text };
    try {
      const parsed = JSON.parse(text);
      errorData = { code: parsed.code ?? "STREAM_ERROR", message: parsed.message ?? text };
    } catch {
      // keep default
    }
    yield { type: "error", data: errorData };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    let eventType = "delta";
    let dataLine = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        dataLine = line.slice(6).trim();
      } else if (line === "" && dataLine) {
        try {
          const parsed = JSON.parse(dataLine);
          yield { type: eventType as SSEEventType, data: parsed } as SSEEvent;
        } catch {
          // skip malformed line
        }
        eventType = "delta";
        dataLine = "";
      }
    }
  }
}

export function harvesterProbeTurnStream(
  sessionId: string,
  input: TurnInput
): AsyncGenerator<SSEEvent> {
  return harvesterStream(`/v1/brain/harvester/sessions/${sessionId}/turn`, input);
}

export function harvesterSynthesizeStream(sessionId: string): AsyncGenerator<SSEEvent> {
  return harvesterStream(`/v1/brain/harvester/sessions/${sessionId}/synthesize`, {});
}

export function harvesterDumpStream(
  sessionId: string,
  input: DumpInput
): AsyncGenerator<SSEEvent> {
  return harvesterStream(`/v1/brain/harvester/sessions/${sessionId}/dump`, input);
}
