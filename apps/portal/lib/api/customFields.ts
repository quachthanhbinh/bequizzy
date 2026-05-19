/**
 * Custom Field Definitions API client — wraps lead-service /v1/leads/custom-fields.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomFieldType = "text" | "number" | "date" | "boolean" | "url" | "select";

export interface CustomFieldDefinition {
  id: string;
  workspaceId: string;
  campaignId: string | null;
  name: string;
  key: string;
  fieldType: CustomFieldType;
  options: string[];
  required: boolean;
  position: number;
  createdAt: string;
}

export interface CreateCustomFieldInput {
  name: string;
  fieldType: CustomFieldType;
  campaignId?: string;
  key?: string;
  options?: string[];
  required?: boolean;
  position?: number;
}

export interface UpdateCustomFieldInput {
  name?: string;
  fieldType?: CustomFieldType;
  options?: string[];
  required?: boolean;
  position?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDef(raw: Record<string, unknown>): CustomFieldDefinition {
  return {
    id: raw.id as string,
    workspaceId: raw.workspace_id as string,
    campaignId: (raw.campaign_id as string | null) ?? null,
    name: raw.name as string,
    key: raw.key as string,
    fieldType: raw.field_type as CustomFieldType,
    options: (raw.options as string[]) ?? [],
    required: Boolean(raw.required),
    position: (raw.position as number) ?? 0,
    createdAt: raw.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchCustomFieldDefinitions(
  params?: { campaignId?: string; workspaceId?: string; accessToken?: string },
): Promise<CustomFieldDefinition[]> {
  const auth = getAuthContext();
  const workspaceId = params?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = params?.accessToken ?? auth.accessToken ?? undefined;

  const qp = new URLSearchParams();
  if (params?.campaignId) qp.set("campaign_id", params.campaignId);
  const path = `/v1/leads/custom-fields${qp.toString() ? `?${qp}` : ""}`;

  const raw = await apiFetch<Record<string, unknown>[]>(path, { workspaceId, accessToken });
  return raw.map(mapDef);
}

export async function createCustomFieldDefinition(
  input: CreateCustomFieldInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<CustomFieldDefinition> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const body: Record<string, unknown> = {
    name: input.name,
    field_type: input.fieldType,
  };
  if (input.campaignId !== undefined) body.campaign_id = input.campaignId;
  if (input.key !== undefined) body.key = input.key;
  if (input.options !== undefined) body.options = input.options;
  if (input.required !== undefined) body.required = input.required;
  if (input.position !== undefined) body.position = input.position;

  const raw = await apiFetch<Record<string, unknown>>("/v1/leads/custom-fields", {
    method: "POST",
    body: JSON.stringify(body),
    workspaceId,
    accessToken,
  });
  return mapDef(raw);
}

export async function updateCustomFieldDefinition(
  id: string,
  input: UpdateCustomFieldInput,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<CustomFieldDefinition> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.fieldType !== undefined) body.field_type = input.fieldType;
  if (input.options !== undefined) body.options = input.options;
  if (input.required !== undefined) body.required = input.required;
  if (input.position !== undefined) body.position = input.position;

  const raw = await apiFetch<Record<string, unknown>>(`/v1/leads/custom-fields/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    workspaceId,
    accessToken,
  });
  return mapDef(raw);
}

export async function deleteCustomFieldDefinition(
  id: string,
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<void> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  await apiFetch<void>(`/v1/leads/custom-fields/${id}`, {
    method: "DELETE",
    workspaceId,
    accessToken,
  });
}
