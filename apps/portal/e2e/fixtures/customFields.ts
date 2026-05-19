/**
 * Typed mock custom-field-definition data for E2E tests.
 */

export interface MockCustomFieldDef {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  name: string;
  key: string;
  field_type: "text" | "number" | "date" | "boolean" | "url" | "select";
  options: string[];
  required: boolean;
  position: number;
  created_at: string;
}

// ── Campaign-scoped definitions ──

export const MOCK_CF_DEAL_SIZE: MockCustomFieldDef = {
  id: "cf-00000001",
  workspace_id: "e2e-workspace-id",
  campaign_id: "camp-00000001",
  name: "Deal Size (USD)",
  key: "deal_size_usd",
  field_type: "number",
  options: [],
  required: false,
  position: 0,
  created_at: "2025-01-01T00:00:00Z",
};

export const MOCK_CF_PAIN_POINT: MockCustomFieldDef = {
  id: "cf-00000002",
  workspace_id: "e2e-workspace-id",
  campaign_id: "camp-00000001",
  name: "Pain Point",
  key: "pain_point",
  field_type: "select",
  options: ["Cost", "Speed", "Quality"],
  required: true,
  position: 1,
  created_at: "2025-01-02T00:00:00Z",
};

// ── Workspace-global definition ──

export const MOCK_CF_GLOBAL_NOTES: MockCustomFieldDef = {
  id: "cf-00000010",
  workspace_id: "e2e-workspace-id",
  campaign_id: null,
  name: "Internal Notes",
  key: "internal_notes",
  field_type: "text",
  options: [],
  required: false,
  position: 0,
  created_at: "2024-12-01T00:00:00Z",
};

/** Campaign-scoped only response (for /v1/leads/custom-fields?campaign_id=camp-00000001) */
export const CUSTOM_FIELDS_CAMPAIGN_RESPONSE: MockCustomFieldDef[] = [
  MOCK_CF_GLOBAL_NOTES,
  MOCK_CF_DEAL_SIZE,
  MOCK_CF_PAIN_POINT,
];

/** Empty response */
export const CUSTOM_FIELDS_EMPTY: MockCustomFieldDef[] = [];
