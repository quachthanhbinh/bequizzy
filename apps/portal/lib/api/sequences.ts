/**
 * Sequences API client — wraps campaign-service sequence endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SequenceStatus = "draft" | "active" | "paused" | "archived";

export type StepType = "email" | "wait" | "condition" | "ab_split" | "linkedin" | "sms";

export interface Sequence {
  id: string;
  workspaceId: string;
  campaignId: string;
  name: string;
  status: SequenceStatus;
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepType: StepType;
  position: number;
  config: Record<string, unknown>;
}

export interface CreateSequenceInput {
  campaignId: string;
  name: string;
}

export interface AddStepInput {
  stepType: StepType;
  position: number;
  config?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapSequence(raw: Record<string, unknown>): Sequence {
  return {
    id: raw.id as string,
    workspaceId: raw.workspace_id as string,
    campaignId: raw.campaign_id as string,
    name: raw.name as string,
    status: (raw.status as SequenceStatus) ?? "draft",
  };
}

function mapStep(raw: Record<string, unknown>): SequenceStep {
  return {
    id: raw.id as string,
    sequenceId: raw.sequence_id as string,
    stepType: raw.step_type as StepType,
    position: raw.position as number,
    config: (raw.config as Record<string, unknown>) ?? {},
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchSequences(
  params?: { campaignId?: string; page?: number; pageSize?: number },
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Sequence[]> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const qp = new URLSearchParams();
  if (params?.campaignId) qp.set("campaign_id", params.campaignId);
  if (params?.page) qp.set("page", String(params.page));
  if (params?.pageSize) qp.set("page_size", String(params.pageSize));

  const raw = await apiFetch<Record<string, unknown>[]>(
    `/v1/sequences${qp.toString() ? `?${qp}` : ""}`,
    { workspaceId, accessToken },
  );
  return raw.map(mapSequence);
}

export async function fetchSequence(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Sequence> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/sequences/${id}`, {
    workspaceId,
    accessToken,
  });
  return mapSequence(raw);
}

export async function createSequence(
  input: CreateSequenceInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<Sequence> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>("/v1/sequences", {
    method: "POST",
    body: JSON.stringify({ campaign_id: input.campaignId, name: input.name }),
    workspaceId,
    accessToken,
  });
  return mapSequence(raw);
}

export async function fetchSequenceSteps(
  sequenceId: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<SequenceStep[]> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>[]>(
    `/v1/sequences/${sequenceId}/steps`,
    { workspaceId, accessToken },
  );
  return raw.map(mapStep);
}

export async function addSequenceStep(
  sequenceId: string,
  input: AddStepInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<SequenceStep> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>>(
    `/v1/sequences/${sequenceId}/steps`,
    {
      method: "POST",
      body: JSON.stringify({
        step_type: input.stepType,
        position: input.position,
        config: input.config ?? {},
      }),
      workspaceId,
      accessToken,
    },
  );
  return mapStep(raw);
}
