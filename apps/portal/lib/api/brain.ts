/**
 * AI Brain API client — wraps ai-service brain endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeDoc {
  id: string;
  workspace_id: string;
  doc_type: string;
  title: string;
  is_active: boolean;
  embedding_status: string;
  version: number;
  chunk_count: number;
}

export interface KnowledgeDocDetail extends KnowledgeDoc {
  content: string;
}

export interface DocumentUpdateInput {
  title?: string;
  doc_type?: string;
  content?: string;
}

export interface WizardState {
  answers: Record<string, string>;
}

export interface WizardSubmitInput {
  answers: Record<string, unknown>;
}

export interface DocumentUploadInput {
  title: string;
  doc_type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SearchInput {
  query: string;
  doc_types?: string[];
  limit?: number;
}

export interface SearchResult {
  chunk_id: string;
  doc_id: string;
  doc_type: string;
  title: string;
  content: string;
  score: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchBrainDocuments(): Promise<KnowledgeDoc[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<KnowledgeDoc[]>("/v1/brain/documents", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function submitWizard(input: WizardSubmitInput): Promise<KnowledgeDoc> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<KnowledgeDoc>("/v1/brain/wizard/submit", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function uploadDocument(input: DocumentUploadInput): Promise<KnowledgeDoc> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<KnowledgeDoc>("/v1/brain/documents", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const { accessToken, workspaceId } = getAuthContext();
  await apiFetch<void>(`/v1/brain/documents/${id}`, {
    method: "DELETE",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function searchBrain(input: SearchInput): Promise<SearchResult[]> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<SearchResult[]>("/v1/brain/search", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function getDocument(id: string): Promise<KnowledgeDocDetail> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<KnowledgeDocDetail>(`/v1/brain/documents/${id}`, {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function updateDocument(id: string, input: DocumentUpdateInput): Promise<KnowledgeDoc> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<KnowledgeDoc>(`/v1/brain/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function reindexDocument(id: string): Promise<void> {
  const { accessToken, workspaceId } = getAuthContext();
  await apiFetch<void>(`/v1/brain/documents/${id}/reindex`, {
    method: "POST",
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function fetchWizardState(): Promise<WizardState> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<WizardState>("/v1/onboarding/wizard", {
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}

export async function saveWizardAnswers(answers: Record<string, string>): Promise<WizardState> {
  const { accessToken, workspaceId } = getAuthContext();
  return apiFetch<WizardState>("/v1/onboarding/wizard/answers", {
    method: "PATCH",
    body: JSON.stringify({ answers }),
    accessToken: accessToken ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });
}
