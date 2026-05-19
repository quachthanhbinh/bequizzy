/**
 * Typed mock campaign + sequence data for E2E tests.
 *
 * MOCK_CAMPAIGN_* — camelCase constants for test assertions.
 * RAW_CAMPAIGN_*  — snake_case objects matching actual API response (before mapCampaign()).
 * CAMPAIGNS_RESPONSE etc. — complete API response bodies for route mocking.
 *
 * fetchCampaigns expects: { items: snake_case_campaign[], total, page, page_size }
 * fetchSequences expects: snake_case_sequence[] (plain array)
 */

/** Camelcase interface used in test assertions */
export interface MockCampaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "archived";
  leads: number;
  openRate: number;
  replyRate: number;
  meetings: number;
}

export interface MockSequence {
  id: string;
  workspace_id: string;
  campaign_id: string;
  name: string;
  status: "draft" | "active" | "paused";
}

export interface MockSequenceStep {
  id: string;
  sequence_id: string;
  type: "email" | "wait" | "condition" | "linkedin" | "sms";
  position: number;
  config: Record<string, unknown>;
}

// ── Camelcase campaign constants (for assertions) ──

export const MOCK_CAMPAIGN_ACTIVE: MockCampaign = {
  id: "camp-00000001",
  workspace_id: "e2e-workspace-id",
  name: "SaaS Founders SEA Q2",
  description: "Targeting bootstrapped SaaS founders in VN, TH, SG",
  status: "active",
  leads: 124,
  openRate: 42,
  replyRate: 18,
  meetings: 7,
};

export const MOCK_CAMPAIGN_DRAFT: MockCampaign = {
  id: "camp-00000002",
  workspace_id: "e2e-workspace-id",
  name: "Cold Outreach Draft",
  description: "Draft — not yet active",
  status: "draft",
  leads: 0,
  openRate: 0,
  replyRate: 0,
  meetings: 0,
};

export const MOCK_CAMPAIGN_PAUSED: MockCampaign = {
  id: "camp-00000003",
  workspace_id: "e2e-workspace-id",
  name: "Paused Outreach",
  description: "Temporarily paused",
  status: "paused",
  leads: 50,
  openRate: 30,
  replyRate: 10,
  meetings: 2,
};

export const MOCK_SEQUENCE: MockSequence = {
  id: "seq-00000001",
  workspace_id: "e2e-workspace-id",
  campaign_id: "camp-00000001",
  name: "SaaS Founders 5-Step Sequence",
  status: "active",
};

// ── Raw API response items (snake_case, matching what fetchCampaigns/fetchSequences receive) ──
// mapCampaign reads: id, name, description, status, ai_generated, lead_count,
// sent_count, open_rate (0–1), reply_rate (0–1), meeting_count, created_at.

const RAW_CAMPAIGN_ACTIVE = {
  id: MOCK_CAMPAIGN_ACTIVE.id,
  name: MOCK_CAMPAIGN_ACTIVE.name,
  description: MOCK_CAMPAIGN_ACTIVE.description,
  status: "active",
  ai_generated: false,
  lead_count: 124,
  sent_count: 248,
  open_rate: 0.42,
  reply_rate: 0.18,
  meeting_count: 7,
  created_at: "2025-02-01T00:00:00Z",
};

const RAW_CAMPAIGN_DRAFT = {
  id: MOCK_CAMPAIGN_DRAFT.id,
  name: MOCK_CAMPAIGN_DRAFT.name,
  description: MOCK_CAMPAIGN_DRAFT.description,
  status: "draft",
  ai_generated: false,
  lead_count: 0,
  sent_count: 0,
  open_rate: 0,
  reply_rate: 0,
  meeting_count: 0,
  created_at: "2025-03-01T00:00:00Z",
};

// fetchSequences expects a plain Record<string,unknown>[] array (no wrapper)
const RAW_SEQUENCE = {
  id: MOCK_SEQUENCE.id,
  workspace_id: MOCK_SEQUENCE.workspace_id,
  campaign_id: MOCK_SEQUENCE.campaign_id,
  name: MOCK_SEQUENCE.name,
  status: MOCK_SEQUENCE.status,
};

// ── API response fixtures ──

export const CAMPAIGNS_RESPONSE = {
  items: [RAW_CAMPAIGN_ACTIVE, RAW_CAMPAIGN_DRAFT],
  total: 2,
  page: 1,
  page_size: 50,
};

export const CAMPAIGNS_EMPTY = {
  items: [] as typeof RAW_CAMPAIGN_ACTIVE[],
  total: 0,
  page: 1,
  page_size: 50,
};

/** fetchCampaigns detail endpoint returns a single campaign (same shape as list item) */
export const CAMPAIGN_DETAIL_RESPONSE = RAW_CAMPAIGN_ACTIVE;

/** fetchSequences returns a plain array */
export const SEQUENCES_RESPONSE = [RAW_SEQUENCE];
export const SEQUENCES_EMPTY: typeof RAW_SEQUENCE[] = [];
