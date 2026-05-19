/**
 * Typed mock CRM stage and deal data for E2E tests.
 *
 * fetchDealStages returns DealStage[] directly (no envelope).
 * fetchDeals returns Deal[] directly (no envelope).
 */

export interface MockStage {
  id: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost?: boolean;
}

export interface MockDeal {
  id: string;
  stage_id: string;
  title: string;
  lead_id: string | null;
  amount: number | null;
  status: "open" | "won" | "lost";
  created_at: string;
}

export const MOCK_STAGES: MockStage[] = [
  { id: "stage-1", name: "Prospect",    position: 1, is_won: false },
  { id: "stage-2", name: "Qualified",   position: 2, is_won: false },
  { id: "stage-3", name: "Proposal",    position: 3, is_won: false },
  { id: "stage-4", name: "Negotiation", position: 4, is_won: false },
  { id: "stage-5", name: "Closed Won",  position: 5, is_won: true  },
];

export const MOCK_DEAL_OPEN: MockDeal = {
  id: "deal-00000001",
  stage_id: "stage-1",
  title: "Acme VN — RevLooper Pro",
  lead_id: "00000000-0000-0000-0000-000000000001",
  amount: 1200,
  status: "open",
  created_at: "2025-05-01T00:00:00Z",
};

export const MOCK_DEAL_WON: MockDeal = {
  id: "deal-00000002",
  stage_id: "stage-5",
  title: "TechStart SG — Starter",
  lead_id: "00000000-0000-0000-0000-000000000002",
  amount: 588,
  status: "won",
  created_at: "2025-04-01T00:00:00Z",
};

// fetchDealStages/fetchDeals return plain arrays — no envelope wrapper.
export const STAGES_RESPONSE: MockStage[] = MOCK_STAGES;
export const STAGES_EMPTY: MockStage[] = [];
export const DEALS_RESPONSE: MockDeal[] = [MOCK_DEAL_OPEN, MOCK_DEAL_WON];
export const DEALS_EMPTY: MockDeal[] = [];
