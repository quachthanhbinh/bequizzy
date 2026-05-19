/**
 * Typed mock lead data for E2E tests.
 *
 * MOCK_LEAD_* — camelCase constants used in test assertions (display values).
 * RAW_LEAD_*   — snake_case objects matching the actual API response shape
 *                (what fetchLeads receives from the backend, before mapLead()).
 * LEADS_RESPONSE / LEADS_EMPTY — complete API response bodies for route mocking.
 */

/** Camelcase interface used for test assertions against rendered UI text */
export interface MockLead {
  id: string;
  workspace_id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  title: string | null;
  country: string | null;
  source: string;
  status: "verified" | "unverified" | "invalid" | "risky";
  score: number;
  scoreLabel: "hot" | "warm" | "cold";
  suppressed: boolean;
}

// ── Camelcase lead constants (used in assertions: text=${MOCK_LEAD_HOT.firstName}) ──

export const MOCK_LEAD_HOT: MockLead = {
  id: "00000000-0000-0000-0000-000000000001",
  workspace_id: "e2e-workspace-id",
  email: "ana@acmevn.com",
  firstName: "Ana",
  lastName: "Nguyen",
  company: "Acme VN",
  title: "CEO",
  country: "VN",
  source: "csv_import",
  status: "verified",
  score: 88,
  scoreLabel: "hot",
  suppressed: false,
};

export const MOCK_LEAD_WARM: MockLead = {
  id: "00000000-0000-0000-0000-000000000002",
  workspace_id: "e2e-workspace-id",
  email: "binh@techstart.sg",
  firstName: "Binh",
  lastName: "Tran",
  company: "TechStart SG",
  title: "Founder",
  country: "SG",
  source: "manual",
  status: "verified",
  score: 62,
  scoreLabel: "warm",
  suppressed: false,
};

export const MOCK_LEAD_COLD: MockLead = {
  id: "00000000-0000-0000-0000-000000000003",
  workspace_id: "e2e-workspace-id",
  email: "charlie@startup.th",
  firstName: "Charlie",
  lastName: "Chan",
  company: "Startup TH",
  title: null,
  country: "TH",
  source: "form",
  status: "unverified",
  score: 22,
  scoreLabel: "cold",
  suppressed: false,
};

export const MOCK_LEAD_SUPPRESSED: MockLead = {
  ...MOCK_LEAD_HOT,
  id: "00000000-0000-0000-0000-000000000099",
  email: "suppressed@blocked.com",
  suppressed: true,
};

// ── Raw API response items (snake_case, matching what fetchLeads receives) ──
// mapLead() reads: first_name, last_name, email, company, title, country,
// status, score (→ scoreLabel), source, tags, created_at, enriched.

export const RAW_LEAD_HOT = {
  id: MOCK_LEAD_HOT.id,
  first_name: "Ana",
  last_name: "Nguyen",
  email: MOCK_LEAD_HOT.email,
  company: "Acme VN",
  title: "CEO",
  country: "VN",
  status: "verified",
  score: 88,
  source: "csv_import",
  tags: [] as string[],
  created_at: "2025-01-01T00:00:00Z",
  enriched: true,
};

const RAW_LEAD_WARM = {
  id: MOCK_LEAD_WARM.id,
  first_name: "Binh",
  last_name: "Tran",
  email: MOCK_LEAD_WARM.email,
  company: "TechStart SG",
  title: "Founder",
  country: "SG",
  status: "verified",
  score: 62,
  source: "manual",
  tags: [] as string[],
  created_at: "2025-01-05T00:00:00Z",
  enriched: true,
};

const RAW_LEAD_COLD = {
  id: MOCK_LEAD_COLD.id,
  first_name: "Charlie",
  last_name: "Chan",
  email: MOCK_LEAD_COLD.email,
  company: "Startup TH",
  title: null,
  country: "TH",
  status: "unverified",
  score: 22,
  source: "form",
  tags: [] as string[],
  created_at: "2025-01-10T00:00:00Z",
  enriched: false,
};

// \u2500\u2500 API response fixtures (format: what fetchLeads receives from apiFetch) \u2500\u2500
// fetchLeads expects: { items: snake_case_lead[], total, page, page_size }

/** Standard populated list response (3 leads, all score buckets) */
export const LEADS_RESPONSE = {
  items: [RAW_LEAD_HOT, RAW_LEAD_WARM, RAW_LEAD_COLD],
  total: 3,
  page: 1,
  page_size: 50,
};

/** Empty list \u2014 shows "No leads yet." empty state */
export const LEADS_EMPTY = {
  items: [] as typeof RAW_LEAD_HOT[],
  total: 0,
  page: 1,
  page_size: 50,
};

/** Server error \u2014 used with { status: 500 } in mockApi to trigger isError state */
export const LEADS_ERROR = {
  detail: "Internal server error",
};
