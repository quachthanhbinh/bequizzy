# 40 — AI Employee Platform — DESIGN

**Status:** ✅ Approved (2026-05-18)
**Confidence:** 7/10
**Last updated:** 2026-05-18

## v1 Scope Recap

v1 = **platform foundation only**. Catalog table exists but is empty at launch; the marketplace renders a "coming soon" state. All vertical agents (Specs 41–46) ship in follow-up specs. Ad-spend pass-through (formerly Q3) deferred to Spec 41.

Billing model (per user decision Q2):
- **Rental fee** = flat **prepaid** monthly Paddle subscription per agent rented. Covers the agent license only. Cancellation = `cancel_at_period_end`, no prorated refund.
- **Token cost** = metered per run with the rental's selected model rate, 30% margin, charged to workspace credits via reserve-then-settle.
- **Per-agent model selection** = owner picks LLM model per rental from `ai_models` table; rate is published and shown in the UI.

## Architecture

**Owning service:** `ai-employee-service` (new — Cloud Run, asia-southeast1, ingress=internal except for `/v1/employees/*` exposed via api-gateway)

**Touches:**
- `ai-service` (REST `POST /ai/graph/run` — invokes Spec 37 LangGraph; never calls LiteLLM directly)
- `billing-service` (REST `/credits/deduct`, `/credits/refund`, new `/paddle/line-items` endpoints)
- `integration-service` (OAuth credentials for Google Ads, Facebook Ads, LinkedIn API; followed Spec 15 pattern)
- `outreach-service` (when an agent's tool dispatches an outbound message — suppression check stays here)
- `notification-service` (Novu workflow `ai_employee_approval` + `ai_employee_auto_paused`)
- `workspace-service` (read-only: lookup workspace plan + Pro/Business gate enforcement via Spec 33)
- `analytics-service` (consumes `ai.employee.*` events for dashboards)

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (apps/portal)                │
│   /employees (catalog)  /employees/[rentalId] (settings)    │
│   approval inbox (embedded in Spec 31 NotificationDrawer)   │
└─────────────────────────────────────────────────────────────┘
                           │ HTTPS + JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       api-gateway (Cloud Run)               │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼────────────────────────────────┐
        ▼                  ▼                                ▼
┌────────────────┐  ┌─────────────────────────┐   ┌─────────────────┐
│ ai-employee-   │  │ billing-service          │   │ ai-service      │
│ service        │──│ /credits/deduct          │──▶│ /ai/graph/run   │
│                │  │ /paddle/line-items       │   │ (Spec 37)       │
│ - catalog API  │  └─────────────────────────┘   └─────────────────┘
│ - rentals API  │                                          │
│ - SOPs API     │                                          ▼
│ - approvals API│                                ┌─────────────────┐
│ - runs API     │                                │ LiteLLM router  │
│ - tool runner  │──┐                             └─────────────────┘
└────────────────┘  │
                    │ tool execution (per tool ToolSpec.executor)
                    ▼
        ┌───────────────────────────────────────┐
        │ integration-service                   │
        │   /tools/google-ads/{op}              │
        │   /tools/facebook-ads/{op}            │
        │   /tools/social/post                  │
        │   (OAuth tokens from Secret Manager;  │
        │    pattern: Spec 15)                  │
        └───────────────────────────────────────┘

                    Async event flow
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ outbox_events → Pub/Sub               │
        │   ai.employee.rented                  │
        │   ai.employee.run.completed           │
        │   ai.employee.approval.requested      │
        │   ai.employee.approval.approved       │
        │   ai.employee.spend_cap_hit           │
        │   ai.employee.auto_paused             │
        └───────────────────────────────────────┘
              │                  │                │
              ▼                  ▼                ▼
       notification-       analytics-       Spec 31
       service             service          (forwards approval
       (Novu push)         (dashboards)      to advisor_notif.)

        Scheduled jobs (Cloud Scheduler → Cloud Run Job)
          - hourly: runaway-loop sweeper (idempotent)
          - nightly: eval runner per active rental
          - daily: expired-approval cleanup
          - daily: Paddle line-item reconciliation
```

**Bounded-context boundaries:**
- `ai-employee-service` NEVER queries `ai-service` tables (uses REST `/ai/graph/run`).
- `ai-employee-service` NEVER reads `workspaces.credits_balance` directly (uses billing REST API).
- All external API calls (Google Ads, Meta, LinkedIn) are routed through `integration-service` — `ai-employee-service` never holds OAuth tokens directly.

---

## Multi-Agent Orchestration Model

We deliberately do **not** invent a new orchestration framework. Instead:

- **Each agent run = one Spec 37 LangGraph invocation** with a per-catalog-entry graph definition that lives in `ai-service` (registered at deploy time via `services/ai-service/app/employees/graphs/{slug}.py`).
- The graph is a **supervisor + worker** pattern (single-agent perspective). The supervisor node decides which tool(s) to call; worker nodes are the tool invocations.
- **No agent-to-agent direct calls** in v1. If Agent A's run produces output that Agent B should consume, the flow is:
  1. Agent A run completes → emits `ai.employee.run.completed`
  2. Workflow Automation (Spec 13) rule triggers
  3. Workflow Automation calls `ai-employee-service POST /runs` for Agent B with Agent A's run_id in inputs
- Shared context: every agent reads from the same `ai_brain_chunks` table (Spec 02) scoped by `workspace_id`. The AI Brain IS the shared business knowledge — it is the "company memory" that makes the agents coherent.
- Per-rental working memory lives in `ai_employee_memory` (key-value JSONB). Each agent reads/writes its own keys; cross-rental memory access requires explicit tool grant (deferred to v2).

---

## Data Model

**Owning service:** `ai-employee-service` (all 9 tables below).
**Cross-service soft FKs:** `workspace_id`, `user_id`, `ai_brain_chunk_id`, `paddle_line_item_id` are plain UUIDs (no FK constraint).

### Migration
`alembic/versions/2026_05_18_001_create_ai_employee_platform_tables.py`

### Tables

> **Note:** the `ai_models` reference table and the `paddle_line_items` table are **owned by `billing-service`** (Spec 32 amendment), not `ai-employee-service`. `ai-employee-service` references them by UUID (soft FK). The Spec 32 amendment migration creates them; this spec's migration only creates the 10 platform tables below.

```sql
-- ────────────────────────────────────────────────────────────────────
-- 1. Catalog: system-owned rows (workspace_id IS NULL). One row per
--    publishable agent type. RLS: SELECT-only for authenticated users.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_catalog (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        TEXT NOT NULL UNIQUE,    -- 'ads-intelligence', 'social-writer', ...
  name                        TEXT NOT NULL,
  category                    TEXT NOT NULL CHECK (category IN ('marketing','growth','sales','support','ops')),
  description                 TEXT NOT NULL,
  graph_module                TEXT NOT NULL,           -- e.g. 'employees.graphs.social_writer'
  monthly_rental_price_usd    NUMERIC(10,2) NOT NULL,
  credits_per_run_estimate    INTEGER NOT NULL,        -- shown to user; ACTUAL is metered per run
  default_daily_spend_cap_usd NUMERIC(10,2) NOT NULL,
  default_monthly_spend_cap_usd NUMERIC(10,2) NOT NULL,
  required_oauth_scopes       TEXT[] NOT NULL DEFAULT '{}',
  default_dry_run_days        INTEGER NOT NULL DEFAULT 7,
  default_per_run_cost_ceiling_usd NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  is_published                BOOLEAN NOT NULL DEFAULT false,
  min_plan                    TEXT NOT NULL DEFAULT 'pro' CHECK (min_plan IN ('pro','business','agency')),
  version                     INTEGER NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────
-- 2. Rentals: workspace's active instance of a catalog entry.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_rentals (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID NOT NULL,
  catalog_id               UUID NOT NULL,                -- soft FK to ai_employee_catalog
  rented_by_user_id        UUID NOT NULL,                -- soft FK to users
  model_id                 UUID NOT NULL,                -- soft FK to billing-service.ai_models; per-rental model selection
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','paused','auto_paused','cancelling','cancelled')),
  pause_reason             TEXT,
  daily_spend_cap_usd      NUMERIC(10,2) NOT NULL,
  monthly_spend_cap_usd    NUMERIC(10,2) NOT NULL,
  per_run_credit_ceiling   INTEGER NOT NULL,             -- computed at rental time from catalog.default_per_run_cost_ceiling_usd × model rate × 1.30 / credit_unit_price
  dry_run_until            TIMESTAMPTZ,                  -- NULL = no dry run
  paddle_line_item_id      TEXT,                         -- soft FK to billing-service
  paddle_period_end_at     TIMESTAMPTZ,                  -- updated by billing-service on each Paddle renewal webhook; used as cancellation deadline
  cancellation_grace_ends_at TIMESTAMPTZ,                -- set on cancel: min(paddle_period_end_at, now()+7d)
  config                   JSONB NOT NULL DEFAULT '{}',  -- per-rental tunables (brand tone, etc.)
  cancelled_at             TIMESTAMPTZ,                  -- set when status becomes 'cancelled' (after grace window)
  cancelling_at            TIMESTAMPTZ,                  -- set when status becomes 'cancelling' (start of grace window)
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enforce one-active-rental rule (cancelled allowed to repeat):
CREATE UNIQUE INDEX idx_one_active_rental_per_catalog
  ON ai_employee_rentals (workspace_id, catalog_id)
  WHERE status IN ('active','paused','auto_paused','cancelling');

CREATE INDEX idx_rentals_workspace ON ai_employee_rentals (workspace_id, status);

-- ────────────────────────────────────────────────────────────────────
-- 3. SOPs: versioned markdown attached to a rental or to the workspace.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_sops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  rental_id       UUID,                              -- NULL = workspace-global SOP
  title           TEXT NOT NULL,
  body_markdown   TEXT NOT NULL,                     -- max 20 KB enforced in API layer
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(body_markdown) <= 20480)
);
CREATE INDEX idx_sops_workspace_rental ON ai_employee_sops (workspace_id, rental_id, is_active);

-- ────────────────────────────────────────────────────────────────────
-- 4. Tools: per-catalog tool manifests (system-owned).
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_tools (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id                 UUID NOT NULL,
  name                       TEXT NOT NULL,                  -- 'publish_facebook_ad'
  description                TEXT NOT NULL,
  executor                   TEXT NOT NULL,                  -- 'integration:google-ads:create_campaign'
  required_oauth_scopes      TEXT[] NOT NULL DEFAULT '{}',
  required_capabilities      TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {'vision','function_calling'} — model must support these
  side_effect_class          TEXT NOT NULL
                             CHECK (side_effect_class IN ('read','write','spend','publish_public')),
  requires_approval_above_usd NUMERIC(10,2),                 -- NULL = never auto-approve if side_effect_class != 'read'
  max_per_run                INTEGER NOT NULL DEFAULT 5,     -- cap on N invocations per run
  UNIQUE (catalog_id, name)
);

-- ────────────────────────────────────────────────────────────────────
-- 5. Runs: one row per agent invocation. Append-only audit trail.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL,
  rental_id         UUID NOT NULL,
  triggered_by      TEXT NOT NULL CHECK (triggered_by IN ('manual','schedule','workflow','approval')),
  triggered_by_id   UUID,                                    -- approval_id / workflow_id / user_id
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','succeeded','failed','cancelled')),
  inputs            JSONB NOT NULL DEFAULT '{}',
  output            JSONB,
  error             TEXT,
  model_id          UUID NOT NULL,                           -- snapshot of rental.model_id at dispatch time; soft FK to ai_models
  input_tokens      INTEGER NOT NULL DEFAULT 0,
  output_tokens     INTEGER NOT NULL DEFAULT 0,
  llm_cost_usd      NUMERIC(10,4) NOT NULL DEFAULT 0,        -- computed = (input_tokens × in_rate + output_tokens × out_rate) / 1000
  tool_cost_usd     NUMERIC(10,4) NOT NULL DEFAULT 0,
  credits_reserved  INTEGER NOT NULL DEFAULT 0,              -- credits held before run via /credits/reserve
  credits_settled   INTEGER NOT NULL DEFAULT 0,              -- credits actually charged after settle (NULL until completed)
  duration_ms       INTEGER,
  is_dry_run        BOOLEAN NOT NULL DEFAULT false,
  graph_trace_id    TEXT,                                    -- correlates to Spec 37 logs
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_runs_workspace_rental_created
  ON ai_employee_runs (workspace_id, rental_id, created_at DESC);
CREATE INDEX idx_runs_workspace_status ON ai_employee_runs (workspace_id, status)
  WHERE status IN ('pending','running');

-- ────────────────────────────────────────────────────────────────────
-- 6. Tool invocations: one row per tool call within a run. Append-only.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_tool_invocations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL,
  run_id                UUID NOT NULL,
  rental_id             UUID NOT NULL,
  tool_id               UUID NOT NULL,                       -- soft FK to ai_employee_tools
  outcome               TEXT NOT NULL CHECK (outcome IN ('success','failure','simulated','skipped_cap')),
  cost_usd              NUMERIC(10,4) NOT NULL DEFAULT 0,
  side_effects_json     JSONB NOT NULL DEFAULT '{}',
  external_reference_id TEXT,                                -- e.g. Google Ads campaign ID
  request_payload       JSONB NOT NULL DEFAULT '{}',
  response_payload      JSONB,
  error                 TEXT,
  duration_ms           INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tool_invocations_workspace_rental
  ON ai_employee_tool_invocations (workspace_id, rental_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────
-- 7. Approval requests: fail-closed proposal-and-approve.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_approval_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL,
  rental_id           UUID NOT NULL,
  run_id              UUID NOT NULL,                          -- the run that paused waiting for approval
  tool_id             UUID NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','expired')),
  proposed_action     JSONB NOT NULL,                         -- exact payload that will execute on approve
  reasoning           TEXT NOT NULL,
  expected_outcome    TEXT NOT NULL,
  rollback_plan       TEXT,
  risk_score          INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  estimated_cost_usd  NUMERIC(10,2) NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  decided_by          UUID,
  decided_at          TIMESTAMPTZ,
  resulting_invocation_id UUID,                               -- written after approve
  idempotency_key     TEXT NOT NULL UNIQUE,                   -- prevents double-execute on retry
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_workspace_status
  ON ai_employee_approval_requests (workspace_id, status, expires_at)
  WHERE status = 'pending';

-- ────────────────────────────────────────────────────────────────────
-- 8. Memory: per-rental key-value JSONB (working memory).
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_memory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  rental_id    UUID NOT NULL,
  key          TEXT NOT NULL,
  value        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, rental_id, key)
);

-- ────────────────────────────────────────────────────────────────────
-- 9. Run feedback: per-run rating, feeds nightly eval suite.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_run_feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  rental_id    UUID NOT NULL,
  run_id       UUID NOT NULL,
  user_id      UUID NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, user_id)
);
CREATE INDEX idx_feedback_workspace_rental_created
  ON ai_employee_run_feedback (workspace_id, rental_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────
-- 10. Workspace settings (AI-employee-scoped): disclosure template.
--     One row per workspace, created on first rental of a publish_public agent.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_workspace_settings (
  workspace_id            UUID PRIMARY KEY,
  ai_disclosure_template  TEXT NOT NULL DEFAULT '[Posted by AI on behalf of {workspace_name}]',
  updated_by              UUID,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(ai_disclosure_template) BETWEEN 1 AND 280)
);
```

### `ai_models` reference table (owned by billing-service — Spec 32 amendment)

```sql
-- Lives in billing-service migration, NOT this spec's migration.
-- Listed here for clarity because ai-employee-service references it by UUID.
CREATE TABLE ai_models (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     TEXT NOT NULL UNIQUE,        -- 'openai/gpt-4o-mini', 'anthropic/claude-3-5-sonnet'
  provider                 TEXT NOT NULL,               -- 'openai' | 'anthropic' | 'google' | 'litellm'
  display_name             TEXT NOT NULL,
  input_rate_per_1k_usd    NUMERIC(10,6) NOT NULL,      -- LiteLLM-published rate
  output_rate_per_1k_usd   NUMERIC(10,6) NOT NULL,
  capabilities             TEXT[] NOT NULL DEFAULT '{}',-- {'vision','function_calling','long_context','json_mode'}
  is_active                BOOLEAN NOT NULL DEFAULT true,
  min_plan                 TEXT NOT NULL DEFAULT 'pro',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: SELECT-only for any authenticated user.
```

Seed catalog at v1 launch: `openai/gpt-4o-mini` (default), `anthropic/claude-3-5-sonnet`, `google/gemini-flash`, `openai/gpt-5` (when published). Rates pulled from LiteLLM's published price table at seed time; updated by a periodic reconcile job (Spec 32 follow-up).

### RLS Policies

Standard workspace-scope RLS (same template as every other service):

```sql
ALTER TABLE ai_employee_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_rentals_workspace ON ai_employee_rentals
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);
-- (repeat for: sops, runs, tool_invocations, approval_requests, memory, run_feedback)

-- Catalog: SELECT-only for any authenticated user
ALTER TABLE ai_employee_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_catalog_read ON ai_employee_catalog FOR SELECT USING (is_published = true);
CREATE POLICY rls_catalog_admin ON ai_employee_catalog FOR ALL
  USING (current_setting('app.is_system_admin')::boolean = true);

-- Tools: SELECT scoped by catalog; catalog readable by all → tools readable by all (system-owned)
ALTER TABLE ai_employee_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_tools_read ON ai_employee_tools FOR SELECT USING (true);
CREATE POLICY rls_tools_admin ON ai_employee_tools FOR ALL
  USING (current_setting('app.is_system_admin')::boolean = true);
```

---

## API Contract

All routes under `services/ai-employee-service/app/api/v1/`. Standard envelope `{ data, error, meta }`.

### Marketplace
- `GET  /v1/employees/catalog?cursor=&limit=20` → paginated catalog (public to authenticated users).
- `GET  /v1/employees/catalog/{slug}` → single catalog entry detail including its tool manifest and required scopes.

### Rentals
- `POST /v1/employees/rent` → `{ catalog_id, model_id, daily_spend_cap_usd?, monthly_spend_cap_usd?, per_run_credit_ceiling?, dry_run_days? }`
  → 201 with rental row OR 402 + Paddle checkout URL OR 422 `DISCLOSURE_TEMPLATE_REQUIRED` (if `publish_public` tool + blank workspace disclosure template).
  Validates `model_id ∈ catalog.allowed_model_ids` and that the model has all capabilities the catalog's tools require.
  Creates the rental, computes `per_run_credit_ceiling` from `default_per_run_cost_ceiling_usd × model rate × 1.30 / credit_unit_price`, calls `billing-service` to create the **prepaid** Paddle line item.
- `GET  /v1/employees/rentals?status=active&cursor=&limit=50`
- `GET  /v1/employees/rentals/{id}`
- `PATCH /v1/employees/rentals/{id}` → spend caps, dry-run extension, config
- `PATCH /v1/employees/rentals/{id}/model` → `{ model_id }` (recomputes `per_run_credit_ceiling`; takes effect next run)
- `POST /v1/employees/rentals/{id}/pause` / `/resume`
- `POST /v1/employees/rentals/{id}/cancel` → see §Cancellation Lifecycle

### Workspace settings
- `GET  /v1/employees/workspace-settings`
- `PUT  /v1/employees/workspace-settings` → `{ ai_disclosure_template }` (1–280 chars; must contain at least `{workspace_name}` OR plain text)

### SOPs
- `GET  /v1/employees/rentals/{id}/sops` (rental-scoped + workspace globals)
- `POST /v1/employees/rentals/{id}/sops` → `{ title, body_markdown, is_global? }`
- `PATCH /v1/employees/sops/{id}` → produces a new `version` row (immutable history)
- `DELETE /v1/employees/sops/{id}` → soft-delete (sets `is_active = false`)

### Runs
- `POST /v1/employees/rentals/{id}/runs` → triggers a run; returns 202 + run_id; async dispatch via Cloud Tasks
- `GET  /v1/employees/rentals/{id}/runs?cursor=&limit=50` → cursor pagination on `(created_at DESC, id DESC)`
- `GET  /v1/employees/runs/{id}` → full run detail + tool invocations
- `POST /v1/employees/runs/{id}/feedback` → `{ rating: 1..5, note? }`

### Approvals
- `GET  /v1/employees/approvals?status=pending&cursor=&limit=50`
- `GET  /v1/employees/approvals/{id}`
- `POST /v1/employees/approvals/{id}/approve` (idempotent on `idempotency_key`)
- `POST /v1/employees/approvals/{id}/reject` → `{ reason? }`

### Internal (service-to-service, OIDC)
- `POST /v1/internal/tools/invoke` → called by ai-service LangGraph nodes to execute a tool

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `INSUFFICIENT_CREDITS` | 402 | Pre-run credit reservation failed |
| `RENTAL_NOT_ACTIVE` | 409 | Tried to run on paused/cancelling/cancelled rental |
| `SPEND_CAP_EXCEEDED` | 409 | Daily or monthly spend cap would be exceeded |
| `PER_RUN_CEILING_EXCEEDED` | 409 | This run's projected credits > per-run credit ceiling |
| `APPROVAL_EXPIRED` | 410 | Tried to approve expired request |
| `APPROVAL_ALREADY_DECIDED` | 409 | Idempotent re-decide attempt with different verb |
| `PLAN_GATE_REQUIRED` | 402 | Free plan tried to rent; returns Spec 33 upgrade payload |
| `OAUTH_SCOPE_MISSING` | 412 | Required integration not connected or missing scope |
| `RUNAWAY_LOOP_DETECTED` | 429 | Hourly run cap hit |
| `SOP_TOO_LARGE` | 422 | > 20 KB |
| `DISCLOSURE_TEMPLATE_REQUIRED` | 422 | Workspace disclosure template is blank but rented agent has `publish_public` tool |
| `MODEL_NOT_ALLOWED` | 422 | Chosen `model_id` not in catalog `allowed_model_ids` or lacks required capabilities |
| `MODEL_INACTIVE` | 422 | Chosen `model_id` is no longer active |

---

## Event / Outbox Design

All events written to `outbox_events` atomically with the DB write. Subscribers idempotent on the event_id.

| Event type | Producer | Subscribers | Payload (UUIDs as strings) |
|---|---|---|---|
| `ai.employee.rented` | ai-employee-service | analytics, billing-service (verify Paddle), notification-service | `{ workspace_id, rental_id, catalog_slug, model_id, daily_cap, monthly_cap, per_run_credit_ceiling }` |
| `ai.employee.model_changed` | ai-employee-service | analytics | `{ workspace_id, rental_id, old_model_id, new_model_id }` |
| `ai.employee.run.completed` | ai-employee-service | analytics, Spec 13 workflow-automation, Spec 31 advisor | `{ workspace_id, rental_id, run_id, model_id, status, input_tokens, output_tokens, llm_cost_usd, tool_cost_usd, credits_settled }` |
| `ai.employee.approval.requested` | ai-employee-service | notification-service, Spec 31 advisor (forward to advisor_notifications) | `{ workspace_id, rental_id, approval_id, risk_score, expires_at }` |
| `ai.employee.approval.approved` | ai-employee-service | analytics | `{ workspace_id, approval_id, decided_by, latency_ms }` |
| `ai.employee.spend_cap_hit` | ai-employee-service | notification-service (urgent push), analytics | `{ workspace_id, rental_id, cap_type, cap_usd, attempted_usd }` |
| `ai.employee.auto_paused` | ai-employee-service | notification-service, Spec 31 advisor | `{ workspace_id, rental_id, reason }` |
| `ai.employee.cancelled` | ai-employee-service | analytics, billing-service | `{ workspace_id, rental_id, cancelled_at, auto_rejected_approvals_count }` |

Idempotency: `outbox_events.event_id` is the dedup key everywhere.

---

## Credits & Cost

Billing is two independent streams. **They are never combined on one invoice line.**

### Stream 1 — Rental fee (Paddle subscription, prepaid)
- One Paddle subscription line item per rental.
- Billed monthly **upfront** (charge at rental creation for the coming month; auto-renewed by Paddle every month).
- Cancellation = `cancel_at_period_end=true`. **No prorated refund.** Workspace retains access until `paddle_period_end_at`, intersected with the 7-day grace per AC-3.
- Owned by `billing-service` via new `paddle_line_items` table (Spec 32 amendment).
- Rental fee covers the **agent license only** — it does NOT cover any LLM tokens or tool costs.

### Stream 2 — Per-token credit metering (reserve-then-settle, deducted from workspace credits)

Flow per run:

1. **Pre-flight reservation.** ai-employee-service computes `estimated_credits = ceil((estimated_input_tokens × model.input_rate_per_1k + estimated_output_tokens × model.output_rate_per_1k) × 1.30 / credit_unit_price)`, capped at `rental.per_run_credit_ceiling`. Calls `billing-service POST /v1/internal/credits/reserve` with `idempotency_key = run_id`. If 402 → run never starts, status `failed`, reason `INSUFFICIENT_CREDITS`.
2. **Dispatch.** Cloud Tasks enqueues the graph invocation; ai-service runs the LangGraph; tool calls go through integration-service.
3. **Settlement.** On completion, ai-employee-service has actual `input_tokens`, `output_tokens` from the LiteLLM response, and actual `tool_cost_usd` from `ai_employee_tool_invocations`. Computes `actual_credits = ceil((actual_input_tokens × model.input_rate_per_1k + actual_output_tokens × model.output_rate_per_1k + actual_tool_cost_usd) × 1.30 / credit_unit_price)`. Calls `billing-service POST /v1/internal/credits/settle` with `{ reservation_idempotency_key: run_id, actual_credits }`. Billing-service adjusts the ledger atomically: if actual > reserved → deduct delta; if actual < reserved → release delta. Idempotent on `run_id:settle`.
4. **Failure refund.** If the run failed BEFORE any external side effect (`ai_employee_tool_invocations` has zero rows with `outcome='success'`), the entire reservation is released; `credits_settled = 0`.

### Per-rental model selection
- Each rental row carries `model_id`. Owner picks from `catalog.allowed_model_ids`. Default = `catalog.default_model_id`.
- `PATCH /rentals/{id}/model` swaps the model; recomputes `per_run_credit_ceiling`; takes effect on the next dispatched run. In-flight runs keep their snapshot `runs.model_id`.
- Tool capability check at rent / model-change time: every tool's `required_capabilities` must be a subset of `model.capabilities`. Reject otherwise (`MODEL_NOT_ALLOWED`).

### Transparency
Every run row exposes `model_id`, `input_tokens`, `output_tokens`, `llm_cost_usd`, `tool_cost_usd`, `credits_reserved`, `credits_settled`. Surfaced in run detail UI and in the workspace monthly statement (Spec 32 extension).

### Ad-spend pass-through (DEFERRED)
Not in v1. Deferred to Spec 41 (Ads Intelligence) which introduces the first `side_effect_class='spend'` tool. The accounting model (pass-through vs marketplace markup, Google/Meta Premier Partner constraints) will be decided in that spec.

---

## Cancellation Lifecycle (per AC-3 / user answer Q8)

```
                ┌────────────────────────────────────┐
                │  POST /rentals/{id}/cancel         │
                └────────────────┬───────────────────┘
                                 │ (immediately, single transaction)
                                 ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ status: active → cancelling                                       │
  │ cancelling_at = now()                                             │
  │ cancellation_grace_ends_at = min(paddle_period_end_at, now()+7d)  │
  │ Paddle: subscription cancel_at_period_end=true (no refund)        │
  │ Cloud Tasks: pause all queued runs for this rental (idempotent)   │
  │ Outbox: ai.employee.cancelled NOT emitted yet                     │
  └──────────────────────────────────────────────────────────────────┘
                                 │
     ┌───────────────────────────┼────────────────────────────────┐
     │                           │                                │
     ▼                           ▼                                ▼
 In-flight runs            Queued/scheduled runs            Pending approvals
 (status=running)          (Cloud Task pending)             (status=pending)
     │                           │                                │
     │ allowed to finish         │ NOT dispatched                 │ remain VALID during grace.
     │ current graph step,       │ (Cloud Tasks ACK + drop on     │ user MAY approve;
     │ then stop at next         │ tool-runner pre-check that      │ approving triggers ONE-TIME
     │ node boundary.            │ rejects with RENTAL_NOT_ACTIVE) │ tool invocation; rejecting
     │                           │                                │ marks approval rejected.
     │                           │                                │
     ▼                           ▼                                ▼
  Completion writes credits_settled and emits ai.employee.run.completed.

                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Hourly sweeper checks: now() ≥ cancellation_grace_ends_at?       │
  │   AND no in-flight runs for this rental?                          │
  │ If yes:                                                           │
  │   status: cancelling → cancelled                                  │
  │   cancelled_at = now()                                            │
  │   For each remaining pending approval:                            │
  │     status: pending → rejected, reason='rental_cancelled'         │
  │   Outbox: ai.employee.cancelled (payload includes                 │
  │           auto_rejected_approvals_count)                          │
  └──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                       90-day audit retention,
                       then GDPR-soft-delete (existing pattern).
```

Edge cases:
- User attempts to dispatch a new run while `status='cancelling'` → 409 `RENTAL_NOT_ACTIVE`.
- Paddle period ends before 7 days are up (e.g. cancelled near period end) → grace ends at the earlier of the two timestamps.
- User attempts to `PATCH /model` during `cancelling` → 409.
- User attempts to un-cancel by `POST /resume` during `cancelling` → not allowed in v1 (must rent a new instance).

---

## Scale Design

**Target:** 100 workspaces × ~5 rentals each × ~50 runs/day = 25,000 runs/day = ~1 run/sec average, ~10 run/sec peak.

| Concern | Plan |
|---|---|
| Runs table growth | ~9M rows/year; partition by month at 50M (deferred); cursor pagination on `(created_at, id)` |
| Hot-path query (advisor approval inbox) | `idx_approvals_workspace_status WHERE status='pending'` — partial index keeps it tiny (typical workspace < 50 pending) |
| Concurrent run dispatch | Cloud Tasks queue per workspace (`ai-employee-{workspace_id_first_2_chars}` — 256 sharded queues) to prevent one workspace starving the rest |
| Spend-cap atomicity | `SELECT ... FOR UPDATE` on `ai_employee_rentals` row before each tool invocation; rolling 24h spend computed from `ai_employee_tool_invocations` aggregated and cached in Redis (`rental:spend:{rental_id}` TTL 60s, invalidated on each invocation) |
| LLM cost per request | Hard ceiling `per_run_cost_ceiling_usd` enforced inside ai-service graph runner (Spec 37 needs amendment — listed as a follow-up in IMPLEMENTATION.md) |
| Eval runner (nightly) | One Cloud Run Job per catalog slug, processes all active rentals of that slug; idempotent on `(rental_id, eval_date)` |
| Runaway-loop sweeper | Hourly: aggregate `ai_employee_runs` by `(rental_id, hour)`; pause rentals with > 50 runs/h; idempotent on `(rental_id, hour)` in Redis SET |
| Memory table | Bounded growth via per-rental key cap (default 1,000 keys); eviction is rental's responsibility |
| Pub/Sub fan-out | All 6 events use existing `outbox_events` table → publisher already battle-tested |

**10× load behaviour:** runs table writes are the hottest path → 100 inserts/sec at 10×. Within Supabase write capacity (Pro-tier). LLM cost is now **passed through to the workspace via per-token credits** (not absorbed by the platform), so the previous "aggregate platform LLM cost" scale-gate concern no longer applies — the cost scales with usage and is paid for by the workspace.

---

## Disclosure Template (per AC-14b/14c / user answer Q6)

Stored in `ai_employee_workspace_settings.ai_disclosure_template` (TEXT, 1–280 chars). Default value at row insert: `[Posted by AI on behalf of {workspace_name}]`.

Variable interpolation at tool-invocation time:
- `{workspace_name}` → from workspace-service
- `{agent_name}` → from `catalog.name`
Unknown variables left as literal text. Curly braces other than recognized variables are escaped.

Validation:
- Non-empty (length ≥ 1).
- ≤ 280 chars.
- May be plain text (no required variables). Owner may choose any wording.

Enforcement:
- Rent endpoint rejects with 422 `DISCLOSURE_TEMPLATE_REQUIRED` if any of the catalog's tools have `side_effect_class='publish_public'` AND the workspace row in `ai_employee_workspace_settings` does not exist OR has empty template (the default value satisfies this; the check exists to catch the case where the owner explicitly blanked it).
- Tool invocation appends the rendered disclosure to the content footer of any `publish_public` action; integration-service is the enforcement boundary (the rendered disclosure is part of the request payload).

---

## CPO ↔ CTO Debate

> Note: this Planner conducts the debate inline because no `Task` subagent tool is available in this Copilot environment. Both voices are written by the Planner using the personas in `.claude/agents/cpo-advisor.md` and `.claude/agents/cto-advisor.md`. Future sessions running in Claude Code with the real Task tool should re-run this debate to validate.

### Planner Context Summary (gathered before Round 1)
- Read: `CLAUDE.md`; `docs/PRD.md` §10.9; `docs/ARCHITECTURE.md` §1–4 + §11; `docs/BUSINESS.md` §4 + §7; `docs/DATABASE_SCHEMA.md` §service-ownership-map; `docs/specs/_TEMPLATE/*`; `docs/specs/02_AI_BRAIN_ONBOARDING/{README,DESIGN}`; `docs/specs/32_BILLING_CREDITS_SERVICE/{README,DESIGN}`; `docs/specs/35_SOLO_OPERATOR_MODE/{README,DESIGN}`; `docs/specs/37_LANGGRAPH_AI_ORCHESTRATION/{README,DESIGN}`; `docs/specs/31_AI_ADVISOR/{README,DESIGN}`; `docs/specs/15_INTEGRATIONS_COMPLIANCE_LOCALIZATION/{README,DESIGN}`; `docs/specs/13_WORKFLOW_AUTOMATION/{README,DESIGN}`; `docs/specs/33_FREEMIUM_FEATURE_GATES/README`; `docs/specs/14_AGENCY_WORKSPACE_MANAGEMENT/README`.
- Did NOT explore in this pass: `services/*` runtime code (services not yet implemented — repo is spec-first).
- Existing patterns to reuse: Spec 32 (`/credits/deduct`), Spec 35 (`step_approval_queue` lifecycle), Spec 37 (`AdvisorGraph.ainvoke`), Spec 15 (OAuth token storage), Spec 31 (`advisor_notifications` as the unified inbox), Spec 02 (`<sop>` tag wrapping for prompt-injection isolation mirrors Spec 02's `<answer label>` pattern).

### Round 1 — Opening Positions

**CPO (confidence: 8)** — This is a category move. RevLooper today is a smarter sales tool; with this it becomes the AI operating system for a one-person SEA SMB. Revenue thesis is sound: 100 paying workspaces × 3 rentals × $20/mo = $6K/mo new ARR per 100 customers, on top of subscription. The user's request maps to clear scope: marketplace UI, rent flow, SOP authoring, approval inbox, audit timeline, vertical agents. Ship in 6 weeks. Don't over-engineer orchestration — every agent is a thin wrapper over RAG + 1–2 tools. The marketplace itself is just a CRUD list view.

**CTO (confidence: 4)** — Three structural blockers.
1. **Autonomous-spend liability.** An Ads AI burning $50/min on a brand-new workspace, posting to a public Facebook page, or sending compromised brand content is a category of risk RevLooper has never carried. Without hard spending caps, dry-run defaults, per-tool side-effect classification, and a fail-closed approval inbox, this *cannot* ship.
2. **No agent-execution runtime exists.** Spec 37 LangGraph is scoped to the Advisor chat only. Building a second graph runner inside `ai-employee-service` violates "no shared libraries" and forks our orchestration story. We must extend Spec 37 to be the platform-wide graph runtime first.
3. **Scope creep.** "Ads Intelligence, Social Writer, Blog Writer, Competitor Monitor, Customer Service, Growth, Marketing, Sales" in one umbrella is 6 distinct EDD efforts. Each catalog entry needs its own golden dataset, eval suite, and per-vertical guardrails. **You cannot ship a multi-agent platform AND its catalog in one spec.**

Also: Ads API ToS prohibits marking up ad spend without Premier Partner status. Revenue model needs the pass-through structure.

**Round 1 gap: 4. Not converged.**

### Round 2 — Rebuttal

**CPO (confidence: 7)** — Accept all 3 CTO blockers. Restructure:
- **Umbrella spec ships platform foundations only.** Tables, service, billing extension, approval inbox, runs/tools framework, safety guardrails, observability. NO catalog entries.
- **Each catalog entry becomes its own child spec** (41 Ads, 42 Social Writer, 43 Blog Writer, 44 Competitor Monitor, 45 Customer Support Triage). EDD discipline per spec.
- **Liability handling:** dry-run default 7 days, daily + monthly spend caps required at rental, per-run cost ceiling ($2 default), per-tool `side_effect_class` (read/write/spend/publish_public) + `requires_approval_above_usd`, runaway-loop guard at 50 runs/hour, auto-pause on regression. Pass-through ad spend + 10% capped management fee — accepted.
- v1 launches with **2 low-blast-radius catalog agents** (Content Writer drafts only, no auto-publish; Competitor Monitor is read-only). Ads Intelligence delayed to v1.1 once real spend telemetry exists.

**CTO (confidence: 5)** — Better. Two new concerns:
1. **Spec 37 graph runtime fork.** If `ai-employee-service` invokes ai-service `POST /ai/graph/run` for every agent run, fine — but Spec 37 today only knows one graph (`AdvisorGraph`). We need a Spec 37 amendment to register multiple graphs by slug. This is a real coupling that must be acknowledged as a hard dependency, not glossed over.
2. **Spend-cap atomicity at 10× load.** The proposal is `SELECT ... FOR UPDATE` on rentals + Redis-cached rolling 24h spend. At 10 runs/sec for a popular workspace, the rental row becomes a write hotspot. Need explicit serialization queue per `rental_id` (Cloud Tasks queue-per-rental, not per-workspace) OR move the cap-check into a single billing-service call (which already has the FOR UPDATE pattern).
3. **OAuth scope minimisation.** Catalog declares `required_oauth_scopes`, but workspace owner may have already granted broader scopes for other features. Need scope-stripping at tool-invocation time (pass minimum-required scope subset to integration-service).

Also: "soft FK paddle_line_item_id" → new `paddle_line_items` table in billing-service must be specced — that's a billing-service amendment. List it explicitly in the dependency.

**Round 2 gap: 2. CTO < 7. Not converged.**

### Round 3 — Convergence Attempt

**CPO (confidence: 7)** — Accept all 3 new CTO concerns:
1. Spec 37 amendment listed as hard prerequisite in IMPLEMENTATION.md §Dependencies-on-other-specs. Specifically: Spec 37 graph runtime gains a `graph_registry` (slug → graph factory) and a `POST /v1/internal/graph/run` endpoint accepting `{slug, state}` payload.
2. Cloud Tasks **queue per rental** (sharded by first 2 chars of rental_id UUID → 256 queues) for serialization, AND the cap-check is delegated to billing-service via a new `/v1/internal/budgets/check-and-reserve` endpoint that uses the same `SELECT FOR UPDATE` pattern as Spec 32 credit deduction.
3. OAuth scope stripping at the integration-service boundary: tool invocations declare the minimum subset; integration-service uses the workspace's stored token but passes only the requested scope to the external API call (Google Ads supports per-request scope via OAuth `scope` parameter on access token exchange).

**CTO (confidence: 6)** — Three remaining concerns keep me below 7:
1. **Spec 37 amendment is non-trivial.** The current Spec 37 is in draft, the registry pattern doesn't exist there yet, and amending an unshipped spec compounds risk. CTO 6 hold until user approves Spec 37 amendment scope.
2. **Vertical agent feasibility is unknown.** Even the "low-blast-radius" Content Writer needs to produce brand-safe content at SEA cultural quality, and Competitor Monitor needs scraping infrastructure (or a paid API) we haven't specced. Until child spec 42 + 44 are at least sketched, the umbrella has a hidden long pole.
3. **Cost behavior at scale.** 25,000 runs/day × $0.05 LLM is $37K/month aggregate LLM cost. Margin floor is 30%, so list price needs to cover ~$48K/month before rental fees. At 100 workspaces that's $480/workspace/month in pure usage — well above current Pro plan price. Either runs-per-month per rental is much lower in practice or pricing assumptions need work. **This is the scale gate concern: per-Scale-Hard-Gate, confidence is capped at 5 unless resolved.**

Actually since the binding constraint is *cost* (LLM) rather than *throughput* (the DB design is fine), and the cost can be bounded by per-run ceiling + plan-based monthly run cap, CTO concedes the scale-gate risk is *mitigatable* but not yet mitigated — cap at 6, not 5.

**Round 3: CPO 7 / CTO 6. Gap = 1. Neither ≥ 7 (CTO is 6). NOT CONVERGED by strict rule, but gap closed and remaining concerns are user-decision items, not engineering blockers.**

### Final Verdict

Per the planner protocol: `gap ≤ 2 AND both ≥ 7` is the convergence rule. We have `gap = 1 AND CTO = 6` → **NOT converged**. Per Scale Hard Gate: any CTO scale concern caps confidence at 5; CTO downgraded to "mitigatable", so cap raised to **6**.

**Final confidence: 6/10.** User approval is required (any score < 9 mandates user gating, and < 7 mandates user resolves the open questions before plan/implementation).

**Why not higher:**
- Spec 37 amendment is a co-required precursor; cannot ship this umbrella without it.
- v1 catalog scope (Ads-or-no-Ads) is an unresolved product decision.
- Pricing assumptions need real telemetry to validate (chicken-and-egg) — recommend launching closed beta with 5 workspaces and free rentals to gather cost/value data before public marketplace.
- Child specs 41–46 are listed but not written — the umbrella defines the slot; each vertical agent's quality bar is set by its own EDD spec.

---

## UI/UX (skeleton)

Frontend lives under `apps/portal/app/(dashboard)/employees/`:

```
employees/
  page.tsx                    # Marketplace (grid of catalog entries with filter chips)
  catalog/[slug]/page.tsx     # Catalog detail + "Rent this employee" CTA + scope/cost preview
  page.tsx                    # "My employees" tab (rented list)
  [rentalId]/
    page.tsx                  # Settings: caps, dry-run, SOPs editor, status
    runs/page.tsx             # Run timeline
    runs/[runId]/page.tsx     # Run detail with tool-invocation drilldown
    approvals/page.tsx        # Approval requests for this rental (also surfaced in global advisor drawer)
```

- Marketplace is a TanStack Query infinite scroll on `GET /v1/employees/catalog`.
- Rent flow uses React Hook Form + Zod. Submitting calls `/v1/employees/rent`; if 402 → redirect to Paddle checkout.
- SOP editor: simple markdown textarea with byte-count meter (capped at 20 KB client-side).
- Approval request card (in `apps/portal/components/employees/ApprovalRequestCard.tsx`): shows `proposed_action` JSON in a collapsible, `reasoning`, `expected_outcome`, `rollback_plan`, `risk_score` badge, `estimated_cost_usd`, expiry countdown, Approve/Reject buttons (Approve requires `risk_score >= 70` confirmation modal).
- Run timeline reuses existing event-list component (Spec 21 taxonomy).
- All screens 375px-min, touch targets ≥44px, shadcn/ui only.

---

## Edge Cases & Error Handling

- **Race: 2 simultaneous run dispatches both pass the cap check** → serialized by per-rental Cloud Tasks queue; second one will see updated spend on its own pre-flight FOR UPDATE.
- **Approval approved twice** → idempotency_key prevents double-execute; second call returns the first call's response.
- **Rental cancelled while a run is mid-graph** → graph completes (we don't kill mid-flight); next dispatch attempt sees `RENTAL_NOT_ACTIVE` and returns 409.
- **Paddle webhook out-of-order** → billing-service Spec 32 handles ordering via webhook idempotency; rental status follows Paddle line-item lifecycle.
- **Workspace credits exhausted mid-run** → run completes if already past pre-flight; subsequent reconciliation deduction may take credits negative, then workspace cannot start new runs until top-up. (Same pattern as Spec 32 over-spend tolerance.)
- **External API (Google Ads) returns 5xx** → tool invocation marked `failure`; per-tool retry policy (max 3 attempts with exponential backoff) defined in `ai_employee_tools.config` (JSONB, deferred to Phase 2).
- **SOP contains prompt injection** → `<sop>` tag wrapping + HTML-escape `</sop>` in body before injection (mirrors Spec 02).

---

## Security Considerations

Workspace_id scope: confirmed on every query (RLS + application-layer dependency).
Auth/AuthZ: standard JWT + workspace membership; system admin for catalog mutations.
Input validation: Pydantic (Python) + Zod (frontend); ad-budget inputs strict numeric with min/max.
OAuth: tokens never leave Secret Manager; integration-service is the only consumer; per-invocation scope-stripping.
Audit: every tool invocation is append-only; every approval decision is logged with `decided_by + decided_at`.
SEA consent: one-time `consent_log` row at rental time for `publish_public` side-effect agents.
Data exposure: agent outputs go through standard XSS-safe rendering in frontend.
🔴 Full OWASP Top 10 walkthrough required in SECURITY.md (separate file).

---

## Testing Strategy (high-level — see TESTS.md)

- Unit tests per service file (≥ 90% coverage on `ai-employee-service`).
- Integration tests against real Supabase (testcontainers).
- E2E tests via Playwright covering: rent → SOP author → trigger run → approval inbox → approve → audit.
- **EDD per catalog agent** is mandatory and lives in each child spec (41–46). Umbrella spec only tests the platform's eval *infrastructure* (golden dataset loader, nightly runner, regression auto-pause).

---

## Rollout Plan (high-level — see IMPLEMENTATION.md)

4 phases, behind feature flag `ai_employee_platform_enabled`:

1. **Phase 0** — Spec 37 amendment (graph registry) + billing-service `paddle_line_items` extension.
2. **Phase 1** — Platform tables + APIs + no catalog (devs can register internal test agents).
3. **Phase 2** — First catalog agent (Content Writer, dry-run only). Beta to 5 invited workspaces.
4. **Phase 3** — Second catalog agent (Competitor Monitor). Public marketplace opens for Pro+ plans.
5. **Phase 4 (post-v1)** — Ads Intelligence (after spend-cap telemetry validated).

---

## Open Questions

All 8 PRD open questions resolved 2026-05-18 by user. See PRD.md §Open Questions Resolution Log and RESULT.md.


---

# Phase 2 — Authoring Platform DESIGN (merged from Spec 47 on 2026-05-18)

## Phase 2 Architecture

**Owning service:** `ai-employee-service` (extends Phase 1's service — adds `/v1/admin/*` namespace + 5 new tables; **no new microservice**).

**Why no new microservice?** The authoring data model is tightly coupled to the runtime data model (catalog, rentals, runs). Splitting authoring into its own service would require either (a) cross-service joins for the upgrade worker, or (b) a redundant copy of catalog data. Bounded-context principle: authoring and runtime share the same bounded context (catalog management). Phase 2 is best modelled as an additive surface on the same service.

**Why a separate admin app (`apps/admin/`)?** Per Q1 resolution (2026-05-18), the admin UI ships as a **separate Next.js 14 app**, NOT as a route group inside `apps/portal/`. Tradeoffs:

| Concern | Separate app (chosen) | Route group inside portal (rejected) |
|---|---|---|
| XSS/CSRF blast radius | Isolated origin — portal XSS cannot reach admin cookies | Shared origin — portal XSS can escalate |
| CSP strictness | Admin app can enforce zero-third-party-script CSP without breaking portal analytics/marketing pixels | Portal CSP must be relaxed for marketing; admin inherits weaker CSP |
| Auth surface | Distinct origin makes "are you on the admin app?" obvious to staff and SecOps logs | Same origin; harder to distinguish in logs |
| Mandatory MFA | Easy to enforce app-wide | Conditional middleware required |
| Deploy cadence | Independent — admin can ship without portal release | Coupled — admin changes redeploy portal |
| Cost | +1 Cloudflare Pages project, +1 `wrangler.toml`, +1 CI workflow | None |
| Code-share | Shared via local workspace package (already a yarn-workspaces / pnpm-workspaces repo) | Native imports |

The accepted cost (+1 deploy target) is small; the security benefit (origin isolation) is material for a HIGH-flag spec.

**Touches (in addition to Phase 1's touches):**
- `billing-service` (REST `/credits/charge-internal` for eval dry-run; new `internal_billing_accounts` table; Paddle subscription price update on `PATCH /rentals/{id}/version`)
- `notification-service` (Novu workflow `ai_employee_version_lifecycle`)
- `ai-service` (REST `POST /v1/internal/graph/run` — reuses Phase 1's call for eval dry-run)

```
┌─────────────────────────────────────────────────────────────┐
│   apps/admin/  (NEW Next.js app — separate Cloudflare       │
│   Pages deploy, origin: admin.revlooper.com,                │
│   strict CSP, mandatory MFA, staff IdP gate)                │
│  /admin/agents (list)                                       │
│  /admin/agents/[id]/versions (history, diff, eval results)  │
│  /admin/agents/[id]/versions/new (draft editor)             │
│  /admin/tool-registry (read-only list)                      │
│  /admin/staff (role assignment)                             │
│  /admin/audit (event stream)                                │
└─────────────────────────────────────────────────────────────┘
             │ HTTPS + JWT (is_internal_staff=true + role claims)
             │ + corporate VPN IP allowlist (enforced at api-gateway)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                       api-gateway (Cloud Run)               │
│   /v1/admin/* — IP-allowlist + staff-claim + role-claim     │
│   middleware (defence-in-depth: server also re-checks       │
│   internal_staff_roles row)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           ai-employee-service (Cloud Run — Phase 1)         │
│                                                             │
│  Phase 1 routes (workspace-owner-facing):                   │
│    /v1/employees/*  (catalog, rent, sops, runs, approvals)  │
│                                                             │
│  Phase 2 routes (internal-staff-facing):                    │
│    /v1/admin/agents                                         │
│    /v1/admin/agents/{id}/versions                           │
│    /v1/admin/agents/{id}/versions/{v}/eval                  │
│    /v1/admin/tool-registry                                  │
│    /v1/admin/staff                                          │
│    /v1/admin/audit                                          │
│                                                             │
│  Phase 2 workspace-owner extensions:                        │
│    PATCH /v1/employees/rentals/{id}/version                 │
│    POST  /v1/employees/rentals/{id}/version/rollback        │
│    GET   /v1/employees/rentals/{id}/version/diff            │
│    GET   /v1/employees/agents/{id}/versions/available       │
└─────────────────────────────────────────────────────────────┘
             │
             │  ai_employee.author.version.published → outbox
             ▼
┌─────────────────────────────────────────────────────────────┐
│      Pub/Sub → AutoUpgradeWorker (in-service subscriber)    │
│   per-rental: classify diff → auto-upgrade OR notify        │
└─────────────────────────────────────────────────────────────┘
             │
             ├─► Novu (workspace owner notifications)
             ├─► Cloud Run Jobs:
             │     - weekly: deprecated-reminder-sweeper
             │     - daily:   force-upgrade-processor
             └─► outbox: ai_employee.rental.version.upgraded
                        ai_employee.rental.version.force_upgraded
```

**Bounded-context boundaries (Phase 2):**
- Authoring tables (`agent_versions`, `tool_registry`, `internal_staff_roles`, audit projections) are system-owned (`workspace_id IS NULL`).
- Per-rental upgrade history is workspace-scoped.
- No new cross-service calls beyond Phase 1's existing ones plus internal eval billing.

## Phase 2 Data Model

**Owning service:** `ai-employee-service` (all 5 new tables + column additions). **Cross-service soft FKs:** `user_id`, `workspace_id`, `tool_registry_id` references.

### Phase 2 Migration

`alembic/versions/2026_06_15_001_ai_employee_authoring_platform.py` (additive — does not modify Phase 1's migration). Backfills existing catalog rows to `1.0.0` published versions.

### Phase 2 Tables

```sql
-- ────────────────────────────────────────────────────────────────────
-- 1. agent_versions: immutable-once-published version of a catalog row
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE agent_versions (
  id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                          UUID NOT NULL,                      -- soft FK to ai_employee_catalog
  version_label                     TEXT NOT NULL,                      -- 'MAJOR.MINOR.PATCH'
  major                             INTEGER NOT NULL,
  minor                             INTEGER NOT NULL,
  patch                             INTEGER NOT NULL,
  status                            TEXT NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft','in_review','published','deprecated','archived')),
  is_breaking_change                BOOLEAN NOT NULL DEFAULT false,
  breaking_changes_summary          TEXT,                               -- required if is_breaking_change=true
  system_prompt                     TEXT NOT NULL,                      -- max 50KB
  allowed_model_ids                 UUID[] NOT NULL,
  default_model_id                  UUID NOT NULL,
  default_daily_spend_cap_usd       NUMERIC(10,2) NOT NULL,
  default_monthly_spend_cap_usd     NUMERIC(10,2) NOT NULL,
  default_per_run_cost_ceiling_usd  NUMERIC(10,2) NOT NULL,
  default_dry_run_days              INTEGER NOT NULL DEFAULT 7,
  monthly_rental_price_usd          NUMERIC(10,2) NOT NULL,
  min_plan                          TEXT NOT NULL CHECK (min_plan IN ('pro','business','agency')),
  tool_registry_ids                 UUID[] NOT NULL,                    -- references tool_registry.id
  default_sops                      JSONB NOT NULL DEFAULT '[]',        -- [{title, body_markdown}]
  eval_dataset_ref                  TEXT,                               -- e.g. 'datasets/agents/ads-intelligence/v2'
  created_by_user_id                UUID NOT NULL,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_for_review_at           TIMESTAMPTZ,
  submitted_for_review_by_user_id   UUID,
  published_at                      TIMESTAMPTZ,
  published_by_user_id              UUID,                               -- two-person rule: must != created_by_user_id for minor/major
  self_published_reason             TEXT,                               -- required if same-person publish on patch
  rejected_at                       TIMESTAMPTZ,
  rejected_by_user_id               UUID,
  rejection_reason                  TEXT,
  deprecated_at                     TIMESTAMPTZ,
  deprecated_by_user_id             UUID,
  deprecation_reason                TEXT,
  deprecation_force_upgrade_at      TIMESTAMPTZ,                        -- when this version forces upgrade
  archived_at                       TIMESTAMPTZ,
  eval_regression_override_reason   TEXT,                               -- if pass-rate drop > 15% but published anyway
  CHECK (length(system_prompt) <= 51200),
  CHECK (length(coalesce(breaking_changes_summary, '')) <= 4096),
  UNIQUE (agent_id, version_label)
);
CREATE INDEX idx_agent_versions_agent_status ON agent_versions (agent_id, status);
CREATE INDEX idx_agent_versions_agent_sort ON agent_versions (agent_id, major DESC, minor DESC, patch DESC);

-- Only one published version per (agent_id, major) at a time:
CREATE UNIQUE INDEX idx_one_published_per_major
  ON agent_versions (agent_id, major)
  WHERE status = 'published';

-- ────────────────────────────────────────────────────────────────────
-- 2. tool_registry: first-class system-owned tool catalog
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE tool_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        TEXT NOT NULL UNIQUE,                     -- 'publish_facebook_ad'
  name                        TEXT NOT NULL,
  description                 TEXT NOT NULL,
  executor                    TEXT NOT NULL,                            -- 'integration:google-ads:create_campaign'
  side_effect_class           TEXT NOT NULL CHECK (side_effect_class IN ('read','write','spend','publish_public')),
  required_oauth_scopes       TEXT[] NOT NULL DEFAULT '{}',
  required_capabilities       TEXT[] NOT NULL DEFAULT '{}',
  requires_approval_above_usd NUMERIC(10,2),
  max_per_run                 INTEGER NOT NULL DEFAULT 5,
  is_published                BOOLEAN NOT NULL DEFAULT false,           -- false until code deploy lands
  owning_service              TEXT NOT NULL,                            -- e.g. 'integration-service'
  deployed_in_version         TEXT,                                     -- e.g. integration-service v1.4.0
  deprecated_at               TIMESTAMPTZ,
  archived_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Phase 1's ai_employee_tools is preserved for backward compat for one release;
-- a follow-up migration in Phase 2's second sub-phase collapses it into tool_registry.

-- ────────────────────────────────────────────────────────────────────
-- 3. agent_version_eval_runs: persisted eval dry-run results
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE agent_version_eval_runs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id         UUID NOT NULL,
  triggered_by_user_id     UUID NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','running','succeeded','failed')),
  eval_dataset_ref         TEXT NOT NULL,
  num_examples             INTEGER NOT NULL DEFAULT 0,
  num_passed               INTEGER NOT NULL DEFAULT 0,
  pass_rate                NUMERIC(5,4),
  baseline_pass_rate       NUMERIC(5,4),                                -- prev published version's last pass_rate
  per_example_results      JSONB,
  llm_cost_usd             NUMERIC(10,4) NOT NULL DEFAULT 0,
  credits_charged_internal INTEGER NOT NULL DEFAULT 0,                  -- charged to internal_billing_account
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eval_runs_version ON agent_version_eval_runs (agent_version_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────
-- 4. ai_employee_rental_version_history: per-rental upgrade audit
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE ai_employee_rental_version_history (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID NOT NULL,
  rental_id                UUID NOT NULL,
  from_version_id          UUID,                                        -- NULL on initial rent
  to_version_id            UUID NOT NULL,
  transition_type          TEXT NOT NULL CHECK (transition_type IN ('initial_rent','manual_upgrade','auto_upgrade','rollback','force_upgrade')),
  triggered_by_user_id     UUID,                                        -- NULL for auto/force
  acknowledged_breaking_changes BOOLEAN NOT NULL DEFAULT false,
  reason                   TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rental_version_history_rental ON ai_employee_rental_version_history (workspace_id, rental_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────
-- 5. internal_staff_roles: RBAC for authoring platform
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE internal_staff_roles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,                                    -- soft FK to users (must have is_staff=true)
  role                TEXT NOT NULL CHECK (role IN ('author','reviewer','publisher')),
  granted_by_user_id  UUID NOT NULL,
  granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at          TIMESTAMPTZ,
  revoked_by_user_id  UUID,
  UNIQUE (user_id, role) WHERE revoked_at IS NULL
);
CREATE INDEX idx_staff_roles_user_active ON internal_staff_roles (user_id) WHERE revoked_at IS NULL;
```

### Phase 2 column additions to Phase 1 tables

```sql
ALTER TABLE ai_employee_catalog
  ADD COLUMN current_published_version_id UUID;                          -- soft FK to agent_versions.id

ALTER TABLE ai_employee_rentals
  ADD COLUMN pinned_version_id           UUID NOT NULL,                  -- backfilled by migration
  ADD COLUMN auto_upgrade_policy         TEXT NOT NULL DEFAULT 'minor_and_patch'
    CHECK (auto_upgrade_policy IN ('manual','patch_only','minor_and_patch','all')),
  ADD COLUMN last_upgrade_at             TIMESTAMPTZ,
  ADD COLUMN last_upgraded_from_version_id UUID;

ALTER TABLE ai_employee_runs
  ADD COLUMN agent_version_id UUID NOT NULL;                             -- backfilled by migration
```

### Phase 2 RLS

- `agent_versions`, `tool_registry`, `internal_staff_roles`: SELECT-only for any authenticated user; ALL only for JWT with `is_internal_staff=true` AND appropriate role claim.
- `agent_version_eval_runs`: SELECT/ALL only for internal staff.
- `ai_employee_rental_version_history`: workspace-scoped (standard RLS).

### Phase 2 Audit projection

No new table — reuses Spec 21's `events` table. Phase 2 reserves the `ai_employee.author.*` and `ai_employee.rental.version.*` event namespaces.

## Phase 2 API Surface

### Admin endpoints (all require `is_internal_staff=true` + IP allowlist; called from `apps/admin/`)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/v1/admin/agents` | author+ | List agents with version summary |
| POST | `/v1/admin/agents` | author+ | Create new agent (draft catalog row) |
| GET | `/v1/admin/agents/{id}/versions` | author+ | List all versions of an agent |
| POST | `/v1/admin/agents/{id}/versions` | author+ | Create draft version |
| PATCH | `/v1/admin/agents/{id}/versions/{v}` | author+ (own draft) / reviewer+ (any draft) | Edit draft (409 if not draft) |
| DELETE | `/v1/admin/agents/{id}/versions/{v}` | author+ (own draft) | Delete draft |
| POST | `/v1/admin/agents/{id}/versions/{v}/submit-for-review` | author+ | Transition draft → in_review |
| POST | `/v1/admin/agents/{id}/versions/{v}/reject` | reviewer+ | Transition in_review → draft with reason |
| POST | `/v1/admin/agents/{id}/versions/{v}/publish` | reviewer+ (two-person) / publisher | Transition in_review → published |
| POST | `/v1/admin/agents/{id}/versions/{v}/deprecate` | publisher | Transition published → deprecated |
| POST | `/v1/admin/agents/{id}/versions/{v}/eval` | author+ | Start eval dry-run |
| GET | `/v1/admin/agents/{id}/versions/{v}/eval/{run_id}` | author+ | Read eval result |
| GET | `/v1/admin/agents/{id}/versions/diff?from=X&to=Y` | author+ | Diff two versions (system_prompt, tools, caps, price, SOPs) |
| GET | `/v1/admin/tool-registry` | author+ | List tools |
| GET | `/v1/admin/staff` | publisher | List staff with roles |
| POST | `/v1/admin/staff/{user_id}/roles` | publisher | Assign role |
| DELETE | `/v1/admin/staff/{user_id}/roles/{role}` | publisher | Revoke role |
| GET | `/v1/admin/audit` | publisher | Query audit events |

### Workspace-owner endpoints (Phase 1 extensions, called from `apps/portal/`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/employees/agents/{id}/versions/available` | List published versions the workspace can upgrade to (filtered by min_plan + version-policy eligibility) |
| GET | `/v1/employees/rentals/{id}/version/diff?target=Y` | Show diff between current and target version |
| PATCH | `/v1/employees/rentals/{id}/version` | Opt-in upgrade (body: target_version_id + acknowledged_breaking_changes_summary if applicable) |
| POST | `/v1/employees/rentals/{id}/version/rollback` | Roll back to last_upgraded_from_version_id if within 30 days |

## Phase 2 State Machines

### Version lifecycle
```
       ┌──────┐  submit  ┌────────────┐  reject (with reason)  ┌──────┐
       │draft │─────────▶│ in_review  │───────────────────────▶│draft │
       └──────┘          └────────────┘                        └──────┘
          │                    │
          │ delete             │ publish (two-person; eval-pass)
          │                    ▼
          │              ┌────────────┐  deprecate (publisher)   ┌────────────┐
          │              │ published  │─────────────────────────▶│ deprecated │
          │              └────────────┘                          └────────────┘
          │                                                            │
          │                                                            │ force_upgrade_at reached;
          │                                                            │ all rentals migrated or paused
          │                                                            ▼
          │                                                       ┌──────────┐
          └──────────────────────────────────────────────────────▶│ archived │
                                                                  └──────────┘
```

### Rental upgrade flow on new-version-published event
```
new version published
        │
        ▼
for each active rental of this agent:
  classify diff vs rental.pinned_version_id:
    - bump_type ∈ {patch, minor, major}
    - is_breaking_change?
    - price_increase?
  ┌────────────────────────────────────────────────────────────┐
  │ if is_breaking_change OR price_increase:                   │
  │     enqueue Novu notification (no auto-upgrade)            │
  │     (price_increase rentals stay grandfathered at old      │
  │      price — see AC-P-4 / Q4)                              │
  │ elif policy='manual':                                      │
  │     enqueue Novu notification (no auto-upgrade)            │
  │ elif policy='patch_only' AND bump=patch:                   │
  │     auto-upgrade                                           │
  │ elif policy='minor_and_patch' (DEFAULT) AND bump IN        │
  │   {patch,minor}:                                           │
  │     auto-upgrade                                           │
  │ elif policy='all' AND bump IN {patch,minor}:               │
  │     auto-upgrade                                           │
  │ elif policy='all' AND bump=major:                          │
  │     # 'all' does NOT bypass breaking-change marker;        │
  │     # major bump without is_breaking_change=true:          │
  │     auto-upgrade                                           │
  │ else:                                                      │
  │     enqueue Novu notification                              │
  └────────────────────────────────────────────────────────────┘
```

### Deprecation timeline
```
T+0:  publisher deprecates v1.0.0; deprecation_force_upgrade_at = T+90d
T+0:  immediate Novu notification to rentals on v1.0.0
T+7,14,21,...: weekly reminder
T+83 to T+89: daily reminder
T+90: force-upgrade-processor Cloud Run Job:
       for each rental on v1.0.0:
         if latest non-deprecated minor on same major exists AND no breaking change AND no price increase:
           force-upgrade
         else:
           pause rental with pause_reason='version_lifecycle_expired'; notify
T+~90 (or later, once all rentals off): v1.0.0 → archived
```

## Phase 2 Outbox Events Added

| Event | When |
|---|---|
| `ai_employee.author.agent.created` | New catalog row created |
| `ai_employee.author.version.created` | New draft version |
| `ai_employee.author.version.submitted_for_review` | draft → in_review |
| `ai_employee.author.version.rejected` | in_review → draft |
| `ai_employee.author.version.published` | in_review → published (triggers AutoUpgradeWorker) |
| `ai_employee.author.version.deprecated` | published → deprecated |
| `ai_employee.author.version.eval_completed` | Eval dry-run done |
| `ai_employee.rental.version.upgraded` | Manual or auto upgrade |
| `ai_employee.rental.version.rolled_back` | Rollback within 30d |
| `ai_employee.rental.version.force_upgraded` | Force-upgrade at deprecation deadline |
| `ai_employee.staff_role.assigned` | Role granted |
| `ai_employee.staff_role.revoked` | Role revoked |

## Phase 2 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Insider pushes malicious system prompt across all workspaces | HIGH | Two-person publish, eval gate, audit, immutable versions, IP allowlist, separate admin origin |
| Auto-upgrade breaks workspace customisations | MEDIUM | Conservative default policy `minor_and_patch`; per-rental override; rollback window 30d |
| Pricing change on auto-upgrade creates billing dispute | LOW | Q4 resolution: grandfather old price for non-upgrading rentals; auto-upgrade always suppressed on price increase; 14d pre-notice on opt-in |
| Deprecation force-upgrade pauses critical-path rentals | MEDIUM | 90-day window; weekly + daily reminders; force-upgrade chooses safest target or pauses with notification |
| Migration of existing seeded agents botches `pinned_version_id` backfill | HIGH | Migration includes data validation step (every rental's pinned_version_id matches a published version); rollback path in migration |
| Two-person rule unenforceable in early team (1–2 staff) | MEDIUM | Bootstrap requirement: at least 2 publisher accounts before flag enabled; same-person `patch` allowed with reason (per Q5) |
| Audit trail tampering | HIGH | RLS forbids UPDATE/DELETE on events even for publishers; BigQuery export within 1h for immutable off-site log |
| `apps/admin/` deploy duplication (build/CI overhead) | LOW | Accepted cost; offset by origin-isolation security gain |
