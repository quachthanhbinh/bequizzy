# 40 — AI Employee Platform — PRD

**Status:** ✅ Approved (2026-05-18 — user resolved Q1, Q2, Q3, Q5, Q6, Q8; see RESULT.md)
**Confidence:** 7/10 (raised from 6 after scope narrowed to platform-only and per-token / per-model billing replaced ad-hoc cost estimation)
**Security flag:** 🔴 HIGH
**Last updated:** 2026-05-18

## v1 Scope Decision

v1 of this spec ships the **multi-agent platform foundation only**. **No vertical agents** are included. The catalog table will exist but be empty at launch; the marketplace UI shows a "first agent coming soon (Spec 41)" state. All vertical agents (Specs 41–46) are deferred until the platform is validated in production. Ad-spend pass-through accounting (formerly Q3) is also deferred to Spec 41 because no Ads agent exists in v1 to need it.

### Phase 1 / Phase 2 split (2026-05-18 merge of former Spec 47)

The user requirement for a **system-owner-facing authoring + versioning platform** (creating, modifying, upgrading catalog agents without code deploys) is delivered as **Phase 2 of this spec** (originally drafted as standalone Spec 47, merged in 2026-05-18). **Phase 1** (the original Spec 40 scope) ships a usable, billable platform with a **single implicit version per catalog row** — agents are seeded via Alembic. **Phase 2** lands additively on Phase 1: 5 new tables, 5 added columns, ~20 new admin endpoints under `/v1/admin/*`, a new `apps/admin/` Next.js app (separate Cloudflare Pages deploy + separate staff auth flow), version lifecycle, RBAC, two-person publish rule, audit trail, eval dry-run, rollback, deprecation timeline. Phase 2 acceptance criteria live in §Phase 2 Acceptance Criteria below.

### Runtime invariant established in Phase 1, extended in Phase 2

- AC-RUN-PIN: Every `ai_employee_runs` row pins ALL inputs it depends on at dispatch time (Phase 1: `model_id` snapshot, SOPs version-stamped in `inputs.sops_versions[]`, catalog `version` snapshot stored in `inputs.catalog_version`). In Phase 2 this invariant extends additively with `runs.agent_version_id`. A run that started on version N **always finishes on version N** even if a new version publishes mid-run.

## Problem Statement

The system owner of RevLooper has built an AI sales rep (Spec 02 + 31 + 37) that knows each workspace's business via its private AI Brain. But every workspace owner still has to **personally do** all the other work a real business needs: ads management, content writing, competitor watching, social posting, customer service triage. SEA SMB owners cannot afford to hire a marketing team, struggle with employment law and onboarding overhead, and burn out trying to do it all themselves.

The system owner wants a **second revenue stream** beyond per-workspace subscriptions: a **marketplace of AI specialists** (Ads, Content, Social, Competitor, Support) that workspace owners rent from the platform, configure once with their SOPs, and supervise via a CEO-style approval inbox. The same workspace AI Brain becomes the shared "company knowledge" all agents draw from — turning the workspace into a one-person company with an AI staff.

Today this does not exist. The platform has no concept of a rentable agent, no place for a workspace owner to manage SOPs across multiple specialists, no per-agent spend cap, no proposal-and-approve loop for autonomous actions, and no audit trail of what each agent did and why.

### Evidence
- User research quoted directly in the request: "It's difficult to hire — recruiting, benefits, policies, government regulations."
- Spec 31 (AI Advisor) addresses *what to do* but does no execution beyond drafting; users have explicitly asked "can it just do it?"
- Spec 35 (Solo Operator Mode) ships an approval queue *for the existing sequence-worker* — the same pattern is requested for every other future agent.
- Competitive scan: 11x.ai sells one persona (Alice/Mike); no SEA-priced multi-agent platform exists with shared workspace memory.

### Who has this problem
- Solo founders and 1–10 person SMB owners in Vietnam, Thailand, Indonesia, Philippines.
- Workspace owners on **Pro** and **Business** plans (Free plan does not include rentals — gated by Spec 33).
- Agency parent workspaces (Spec 14) that want to deploy the same agent across client workspaces (deferred to v2).

## Goals
1. Workspace owner can browse a marketplace of AI specialists (initially empty, with a clear "coming soon" state) and rent one in under 60 seconds once available.
2. Once rented, the agent reads the workspace's AI Brain (Spec 02) and the SOPs the owner authored, then operates inside hard spending and side-effect caps, **using the LLM model the owner selected for this rental**.
3. Any high-stakes action (ad publish, social post, sequence change, budget increase) produces a **proposal** with full reasoning and an approve/reject button — never executes silently. Any `publish_public` action **always** requires approval during dry-run + the first 30 days of any rental.
4. The system owner earns recurring revenue per rental (flat monthly Paddle subscription, prepaid) **plus** a fully-transparent margin on per-token LLM cost (metered with the rented model's published per-1K-token rate, 30% margin, deducted from workspace credits via reserve-then-settle).
5. A regressing agent (eval pass-rate drop or runaway spend) auto-pauses and alerts the owner before damage compounds.
6. **No vertical agents ship in v1.** The platform must be safe and observable enough that the first child spec (41 — Ads Intelligence) can land in production with zero changes to the chassis.

## Non-Goals
- ❌ **No vertical agents** in v1 catalog. Each catalog entry (Ads Intelligence 41, Content Writer 42, Blog Writer 43, Competitor Monitor 44, Customer Support Triage 45, Agency sharing 46) is its own child spec with its own EDD golden dataset; **none ship with v1**.
- ❌ No ad-spend pass-through / management-fee accounting in this spec (no Ads agent exists in v1 to need it; deferred to Spec 41).
- ❌ No cross-agent autonomous goal planning ("agent team plans Q3 growth"). v1 is supervisor-routed only.
- ❌ No agent-to-agent direct messaging. Agents share context via the AI Brain RAG and structured task records.
- ❌ No real-time agent UI (no chat-with-agent surface in v1; agents are job-based, not conversational).
- ❌ No agent customisation beyond SOPs + per-agent model selection + tool config + spend caps in v1 (no prompt editing, no custom tools).
- ❌ Not exposing the marketplace to free-plan workspaces — gated upgrade path (Spec 33).

## Acceptance Criteria

### Marketplace & rental
- [ ] AC-1: `GET /v1/employees/catalog` returns the system catalog, paginated (default 20), for any authenticated workspace user. Each entry includes `name`, `category` (`marketing`|`growth`|`sales`|`support`|`ops`), `description`, `monthly_rental_price_usd`, `default_daily_spend_cap_usd`, `default_monthly_spend_cap_usd`, `default_per_run_credit_ceiling`, `required_oauth_scopes`, `allowed_model_ids[]` (subset of `ai_models` the workspace owner can pick from for this agent), `default_model_id`, `is_published`. **In v1 the result is an empty list** plus a `meta.coming_soon: true` flag the UI uses to render the empty state.
- [ ] AC-2: `POST /v1/employees/rent` with `{catalog_id, model_id, daily_spend_cap_usd?, monthly_spend_cap_usd?, per_run_credit_ceiling?, dry_run_days?}` validates that `model_id` is in the catalog entry's `allowed_model_ids`, creates an `ai_employee_rentals` row, calls Paddle to add the rental as a **prepaid monthly subscription line item** (charges upfront for the coming month), returns 402 + Paddle checkout URL if no Paddle payment method on file, and emits `ai.employee.rented` to outbox.
- [ ] AC-3: `POST /v1/employees/rentals/{id}/cancel` initiates cancellation with **end-of-billing-period semantics + 7-day grace for pending approvals**:
    - Rental status → `cancelling` immediately; Paddle subscription marked `cancel_at_period_end=true` (no prorated refund).
    - All scheduled / queued / pending runs are paused immediately; no new runs may be dispatched.
    - Runs already executing are allowed to complete their current graph step, then stop on the next node boundary.
    - Pending approvals remain valid for 7 days OR until the Paddle period ends (whichever is earlier). Approving a pending approval during grace executes the proposed action one time, then the rental fully terminates.
    - After grace window expires OR all pending approvals are resolved: rental → `cancelled`, all remaining pending approvals auto-rejected with reason `rental_cancelled`, access is removed.
    - 90-day audit retention then GDPR-soft-delete (existing pattern).
- [ ] AC-3a: `PATCH /v1/employees/rentals/{id}/model` changes the active model for this rental. Validates new `model_id` against catalog `allowed_model_ids`. Takes effect on the next dispatched run (in-flight runs keep the old model). Emits `ai.employee.model_changed` for analytics.

### SOP management
- [ ] AC-4: `POST /v1/employees/rentals/{id}/sops` accepts a markdown SOP up to 20 KB, validates Pydantic schema, versions it (`version` auto-increments), and stores it in `ai_employee_sops` scoped by `(workspace_id, rental_id)`.
- [ ] AC-5: SOPs are injected verbatim into the agent's system prompt at run time wrapped in `<sop version="N">...</sop>` tags (prompt-injection isolation, same pattern as Spec 02 wizard answers).
- [ ] AC-6: SOPs can be marked `is_global` (per-workspace, applies to all that workspace's rentals) or `rental_scoped`.

### Approval inbox (CEO)
- [ ] AC-7: When an agent decides on an action that exceeds an approval threshold (defined per-tool in `ai_employee_tools.requires_approval_above_usd`), it writes a `ai_employee_approval_requests` row with `proposed_action`, `reasoning`, `expected_outcome`, `rollback_plan`, `expires_at`, `risk_score (0..100)`, and emits `ai.employee.approval.requested` instead of executing.
- [ ] AC-7a: **Every** tool with `side_effect_class='publish_public'` **always** requires approval (regardless of cost or risk_score) under either condition: (a) the rental is still in dry-run period, OR (b) the rental is less than 30 days old (`now() - rental.created_at < 30 days`). This is non-overridable by per-tool config in v1.
- [ ] AC-8: `GET /v1/employees/approvals?status=pending` returns the workspace's pending approvals; `POST /v1/employees/approvals/{id}/approve` and `/reject` close them. Approve triggers the originally-proposed tool invocation idempotently; the approval row stores the resulting `run_id`.
- [ ] AC-9: Pending approvals show up in Spec 31 AI Advisor `advisor_notifications` (single inbox UX) via outbox subscription — no duplicate notification table.
- [ ] AC-10: Approval requests expire after 72h (configurable per-tool); on expiry the proposed action is **never** auto-executed (fail-closed), status becomes `expired`, owner is notified. On rental cancellation, the 7-day grace per AC-3 overrides the per-tool expiry only by being shorter, never longer.

### Safety & spend
- [ ] AC-11: Every rental has a `daily_spend_cap_usd` and `monthly_spend_cap_usd`. The tool layer rejects any invocation that would cause cumulative `ai_employee_tool_invocations.cost_usd` for the rental to exceed the cap; emits `ai.employee.spend_cap_hit` and pauses the rental.
- [ ] AC-12: Default `dry_run_until` is `rental.created_at + 7 days`. While dry-run, tools execute in simulation mode (no external side effects) and produce a "what would have happened" report.
- [ ] AC-13: Runaway-loop guard: a rental that emits ≥ 50 runs in a rolling hour OR ≥ 3 consecutive failures is auto-paused via `ai.employee.auto_paused` event; resumes only via owner action.
- [ ] AC-14: Per-run feedback (`POST /v1/employees/runs/{id}/feedback {rating: 1..5, note?}`) feeds a per-rental eval dataset. Nightly Cloud Run Job runs the agent's golden eval suite (defined in child specs); if pass-rate drops > 15% vs baseline, agent auto-pauses.
- [ ] AC-14a: Per-rental **per-run credit ceiling** (`per_run_credit_ceiling`, default = ceil($2 × model rate at rental time)). Computed at rental creation from the selected model's rate so the cap is expressed in credits, not dollars; rechecked at the start of each run; run aborted with `PER_RUN_CEILING_EXCEEDED` if the reservation would exceed it.

### SEA AI-disclosure (Q6)
- [ ] AC-14b: Workspaces store a configurable `ai_disclosure_template` (text, max 280 chars) at the workspace level (in `ai_employee_workspace_settings`). Default value: `[Posted by AI on behalf of {workspace_name}]`. Variable interpolation supports `{workspace_name}` and `{agent_name}`. Any `publish_public` tool invocation appends the rendered disclosure to the published content footer.
- [ ] AC-14c: Renting any agent that contains a `publish_public` tool requires the workspace `ai_disclosure_template` to be non-empty; rent endpoint returns 422 `DISCLOSURE_TEMPLATE_REQUIRED` with a pointer to settings if blank.

### Billing & credits

Billing is split into **two independent streams** — rental fee (Paddle subscription) and token cost (credits). They are never combined.

- [ ] AC-15: **Rental fee** = a flat monthly Paddle subscription line item managed by `billing-service` (extends Spec 32 — new `paddle_line_items` table). **Prepaid:** charged upfront at rental creation for the coming month, then renewed monthly. Cancellation uses `cancel_at_period_end=true` (no prorated refund); access continues until the period end, intersected with the 7-day grace per AC-3. Rental fee covers the **agent license only** — it does NOT include LLM token cost.
- [ ] AC-15a: **Per-token credit metering** (separate from rental fee):
    - Before each run, the platform reserves credits in `billing-service` via `POST /v1/internal/credits/reserve` with `idempotency_key = run_id`. Reservation amount = `ceil((estimated_input_tokens × model.input_rate_per_1k + estimated_output_tokens × model.output_rate_per_1k) × 1.30 / credit_unit_price_usd)`, capped at `rental.per_run_credit_ceiling`.
    - After run completion, `POST /v1/internal/credits/settle` reconciles to actual usage: `actual_credits = ceil((actual_input_tokens × model.input_rate_per_1k + actual_output_tokens × model.output_rate_per_1k + actual_tool_cost_usd) × 1.30 / credit_unit_price_usd)`. If actual > reserved → deduct the difference; if actual < reserved → release the difference; idempotent on `run_id:settle`.
    - If the run fails BEFORE any external side effect, the entire reservation is released (full refund).
- [ ] AC-15b: **Per-agent model selection.** The workspace owner picks the LLM model for each rental from the catalog's `allowed_model_ids`. The rental row stores `model_id`. Defaults to the catalog entry's `default_model_id`. UI exposes the choice per rental; pricing impact (per-1K-token rate × 1.30 margin → credits) is shown alongside each option.
- [ ] AC-15c: **Model catalog.** A new system-owned `ai_models` reference table stores: `id, slug, provider, display_name, input_rate_per_1k_usd, output_rate_per_1k_usd, capabilities[]` (e.g. `vision`, `function_calling`, `long_context`), `is_active`, `min_plan`. Catalog tools may require specific capabilities (`tool.required_capabilities[]`); the API rejects `rent` if the chosen model lacks them.
- [ ] AC-15d: **Transparency.** Every `ai_employee_runs` row stores `model_id`, `input_tokens`, `output_tokens`, `tool_cost_usd`, `credits_reserved`, `credits_settled`. These fields are returned by `GET /v1/employees/runs/{id}` and aggregated in the workspace monthly statement (Spec 32 extension).
- [ ] AC-16: **Ad-spend pass-through and management fee are NOT in v1.** Deferred to Spec 41 (Ads Intelligence), which is the only agent in the roadmap that touches real ad spend. v1 ships zero `side_effect_class='spend'` tools.

### Observability & audit
- [ ] AC-17: `GET /v1/employees/rentals/{id}/runs?cursor=...` returns paginated run history (default 50, cursor pagination on `(created_at, id)`). Each run includes inputs, output, tool calls, costs, latency.
- [ ] AC-18: Every tool invocation writes to `ai_employee_tool_invocations` (append-only, never updated). Includes `outcome (success|failure|simulated)`, `cost_usd`, `side_effects_json`, `external_reference_id` (e.g. Google Ads campaign ID).
- [ ] AC-19: Frontend timeline page shows the agent's day-by-day actions with the proposal/approval pair, the resulting tool calls, and the outcome, scoped to that rental only.

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Platform safety (cross-tenant leak events) | 0 over 90 days | security audit log |
| Per-token billing accuracy (credits charged vs LiteLLM cost × 1.30) | within ±1% per workspace per month | reconciliation job |
| Approval inbox UX validated end-to-end with internal dev-only agent | ≥ 1 round-trip per day during beta | run history |
| Time-to-ship Spec 41 (first real agent) after platform launch | ≤ 6 weeks | calendar |
| Spec 32 amendment (paddle_line_items + reserve/settle + model rates) shipped before P1 | done | PR merge |
| Spec 37 amendment (graph_registry) shipped before P1 | done | PR merge |

Product adoption metrics (rental conversion, retention, approval SLA, auto-pause rate, margin) are deferred to Spec 41 success metrics because no end-user-facing agent exists in v1 to measure them.

## In-Scope Deliverables

- New service `ai-employee-service` (Cloud Run, asia-southeast1)
- **10 new tables** (9 platform tables + `ai_employee_workspace_settings` for disclosure template; see DESIGN.md §Data Model). Plus **`ai_models`** reference table owned by `billing-service` (Spec 32 amendment).
- **15+ new API endpoints** (see DESIGN.md §API — includes `PATCH /rentals/{id}/model` and workspace settings endpoints)
- Alembic migration `2026_05_18_001_create_ai_employee_platform_tables.py` (+ a Spec 32 amendment migration for `ai_models` + `paddle_line_items` + reserve/settle ledger columns)
- **7 new outbox event types** (`rented`, `model_changed`, `run.completed`, `approval.requested`, `approval.approved`, `spend_cap_hit`, `auto_paused`)
- 2 new Cloud Run Jobs: nightly eval runner (operates on fixture data in v1 — real golden datasets live in child specs), hourly runaway-loop sweeper
- Daily expired-approval sweeper
- Extension to `billing-service`: `paddle_line_items` table, `ai_models` reference table, `/v1/internal/credits/reserve` + `/v1/internal/credits/settle` endpoints, monthly statement extension to surface per-rental token spend
- Extension to `notification-service`: forward `ai.employee.approval.requested` → Novu workflow
- Frontend: `/employees` marketplace page **(empty "coming soon" state)**, `/employees/[rentalId]` settings (caps + SOPs + **model selector**) + run timeline showing `model_used` + `input_tokens` + `output_tokens` + `credits_settled`, approval inbox embedded into existing Spec 31 advisor notification drawer, workspace settings page for `ai_disclosure_template`
- Feature flag `ai_employee_platform_enabled` (Spec 23) — internal-only at v1 launch (no public catalog), flips to beta on first agent (Spec 41)
- One internal dev-only catalog entry registered behind `ai_employee_dev_agent` flag to exercise the rent→run→approval path end-to-end without exposing anything to users

## Out of Scope (deferred)
- **All vertical agents** (Specs 41–46) — ship after Phase 1 of this platform is validated in production
- Ad-spend pass-through accounting + management fee (deferred to Spec 41)
- Per-agent prompt editing for workspace owners — explicitly never in v1 (system-owner authoring lands in Phase 2 of this spec)
- **Per-workspace custom agents** (workspace-owner-authored agents) — Phase 2 ships system-owner-authored only; per-workspace authoring deferred to a future agency-tier spec (likely Spec 46+)
- Tool code authoring in admin UI — tools remain code-deployed; Phase 2 supplies `tool_registry` for data-driven metadata only
- A/B testing across agent versions — deferred until ≥ 3 active versions per agent
- Auto-rollback on production regression — Phase 2 ships manual rollback only
- Agent forking — deferred
- Agent-to-agent direct messaging
- Real-time chat with a deployed agent
- Goal-oriented multi-agent planner
- Episodic vector memory per agent (key-value JSONB only in v1)
- Per-post AI-disclosure checkbox (one-time workspace consent + workspace-configurable template only; per-post UX deferred until any agent emits public content in Spec 42+)

## Dependencies

| Dep | What we need from it |
|---|---|
| Spec 02 (AI Brain) | `search_workspace_rag()` retriever; chunks consumed by every agent run |
| Spec 13 (Workflow Automation) | Optional trigger → "when lead.replied, run customer-support-triage agent" |
| Spec 15 (Integrations) | OAuth pattern for Google Ads / Facebook Ads / LinkedIn API; Secret Manager token storage |
| Spec 31 (AI Advisor) | `advisor_notifications` table receives forwarded approval requests |
| Spec 32 (Billing & Credits) | `/credits/deduct` for per-run cost; extension for Paddle subscription line items |
| Spec 35 (Solo Operator Mode) | Approval-queue lifecycle pattern (status machine, idempotent approve, expiry cron) |
| Spec 37 (LangGraph Orchestration) | Graph runtime hosted in `ai-service` — `ai-employee-service` invokes it via REST `POST /ai/graph/run` |

## Test Checklist (PRD level — full in TESTS.md)
- [ ] Renting an agent without sufficient credits returns 402 with Paddle checkout URL
- [ ] Renting any `publish_public` agent with blank `ai_disclosure_template` returns 422 `DISCLOSURE_TEMPLATE_REQUIRED`
- [ ] Dry-run rental never invokes external APIs (asserted by integration test stubbing every adapter)
- [ ] Approving a 75-hour-old (expired) approval returns 410 Gone and does not execute
- [ ] Spend-cap-hit pauses the rental atomically (no concurrent run sneaks through)
- [ ] Workspace A cannot read Workspace B's rentals, runs, SOPs, or approvals (cross-tenant E2E)
- [ ] SOP markdown containing `</sop>` injection attempts is HTML-escaped before prompt injection
- [ ] Auto-pause is triggered on the 51st run in a rolling hour
- [ ] Refund (reservation release) executes if the agent's first LLM call succeeds but the tool execution fails before any external side effect
- [ ] Per-token settlement: actual_tokens × model.rate × 1.30 / credit_unit = credits_settled — reconciliation always within ±1 credit of the formula
- [ ] Changing rental model via `PATCH /rentals/{id}/model` updates rental.model_id without affecting in-flight runs
- [ ] Cancellation flow: status → `cancelling` immediately, queued runs paused, in-flight runs finish current step, pending approvals valid for 7 days; after grace: status → `cancelled`, pending approvals auto-rejected
- [ ] `publish_public` tool invoked while rental.age < 30 days requires approval even if cost is below threshold and risk_score is low
- [ ] Disclosure template renders with `{workspace_name}` and `{agent_name}` variables substituted at tool invocation time

## Open Questions Resolution Log

All blocking questions resolved 2026-05-18 by user. See RESULT.md for the full log. Summary:

| Q | Topic | Resolution |
|---|---|---|
| Q1 | v1 catalog scope | Defer ALL vertical agents to follow-up specs (broader than original recommendation) |
| Q2 | Pricing model | Split: flat prepaid Paddle subscription for license + per-token credits for usage; per-agent model selection; new `ai_models` reference table |
| Q3 | Ad-spend handling | Deferred to Spec 41 (Ads Intelligence) — no Ads agent in v1 |
| Q4 | Agency rentals | NO in v1, deferred to Spec 46 (unchanged from planner recommendation) |
| Q5 | Approval defaults | YES — `publish_public` always requires approval during dry-run + first 30 days; non-overridable in v1 (AC-7a) |
| Q6 | SEA disclosure | Workspace-configurable template (text), default `[Posted by AI on behalf of {workspace_name}]`, variable interpolation `{workspace_name}`, `{agent_name}`, non-empty required if any `publish_public` agent rented (AC-14b/14c) |
| Q7 | Per-run credit ceiling | YES, $2 default — converted to credits via model rate at rental time (AC-14a); user can override |
| Q8 | Cancellation lifecycle | End-of-billing-period + 7-day grace for pending approvals; in-flight runs finish current step then stop; queued runs paused immediately (AC-3) |


---

# Phase 2 — Authoring Platform (merged from Spec 47 on 2026-05-18)

## Phase 2 Problem Statement

The system owner of RevLooper needs to **create more specialized AI agents on demand** as client requests arrive, modify existing agents, and ship new versions — **without** a microservice deploy per change. After Phase 1 ships, agents are seeded via Alembic migration with a single implicit version. This:

- Caps GTM velocity at ~1 new agent per sprint and blocks client-driven customisation.
- Has no version concept beyond `ai_employee_catalog.version INTEGER` (no published/deprecated lifecycle, no per-rental pinning, no upgrade UX, no rollback).
- Has no RBAC — anyone with DB access can change a system prompt that immediately affects every active rental.
- Has no audit trail of who changed what when.
- Has no eval dry-run — prompt tweaks reach production without quality gating.

For an autonomous-spend product, a silent system-prompt change is **a supply-chain attack vector**. We need an authoring platform with the same operational rigour as a CD pipeline: drafts, review, two-person publish, immutable versions, per-rental pinning, audit, rollback.

User requirement (verbatim, 2026-05-18): *"During the system's operational phase, I will create more specialized AI agents depending on the needs of the client. Therefore, I need a good platform to create additional AI agents or modify and upgrade existing ones, as the AI agents may have multiple versions."*

## Phase 2 Goals
1. Internal staff can create a new agent draft, run it against a golden eval dataset, request review, and publish a v1.0.0 in under 30 minutes without a code deploy (assuming the required tools already exist in `tool_registry`).
2. Existing agents can be modified by creating a new draft version off the latest published version; the previous version stays live until the new version is published; on publish, rentals follow their `auto_upgrade_policy`.
3. Workspace owners are never silently upgraded across a breaking change; auto-upgrades respect their per-rental policy; rollback within 30 days is always available.
4. Every authoring action is auditable with actor, diff, and timestamp; immutable.
5. Two-person publish rule on `minor` and `major` versions prevents single-actor supply-chain abuse.
6. Eval dry-run is mandatory before publish; publish blocked if pass-rate regresses > 15% vs previous version unless reviewer overrides with reason.

## Phase 2 Non-Goals
- ❌ Workspace-owner-authored agents (Phase 2 is system-owner only; per-workspace custom agents deferred — see Q3 resolution in RESULT.md)
- ❌ Tool code authoring in the admin UI (tools remain code-deployed; only `tool_registry` metadata is data-driven)
- ❌ A/B testing across versions (deferred)
- ❌ Auto-rollback on production regression (manual only)
- ❌ Marketplace for third-party agent authors
- ❌ Forking / cloning an existing agent (deferred)
- ❌ Editing a published version in place (versions are immutable — new version required)

## Phase 2 Acceptance Criteria

### Authoring CRUD
- [ ] AC-A-1: `POST /v1/admin/agents` creates a new `ai_employee_catalog` row (status=`draft`) with mandatory fields (slug, name, category, description). Returns 409 if slug exists. Requires JWT claim `is_internal_staff=true` AND role in (`author`, `reviewer`, `publisher`); otherwise 403.
- [ ] AC-A-2: `POST /v1/admin/agents/{agent_id}/versions` creates a new draft `agent_versions` row off the latest version (or a blank one if first version). Body includes: `system_prompt`, `allowed_model_ids[]`, `default_model_id`, `default_daily_spend_cap_usd`, `default_monthly_spend_cap_usd`, `default_per_run_cost_ceiling_usd`, `default_dry_run_days`, `monthly_rental_price_usd`, `min_plan`, `tool_registry_ids[]`, `default_sops[]`, `eval_dataset_ref`, `version_label` (`MAJOR.MINOR.PATCH`), `is_breaking_change` (bool). Validates: `version_label` is strictly greater than latest version; `allowed_model_ids` ⊆ active `ai_models`; every `tool_registry_id` is `is_published=true`; `default_sops` total ≤ 100KB.
- [ ] AC-A-3: `PATCH /v1/admin/agents/{agent_id}/versions/{version_id}` allowed ONLY while `status='draft'`. Updating a non-draft version returns 409 `VERSION_IMMUTABLE`.
- [ ] AC-A-4: `DELETE /v1/admin/agents/{agent_id}/versions/{version_id}` allowed ONLY while `status='draft'`. Otherwise 409.
- [ ] AC-A-5: `GET /v1/admin/agents?status=draft|in_review|published|deprecated|archived` returns paginated list (default 20) filtered by status.

### Tool Registry
- [ ] AC-T-1: `tool_registry` is a system-owned table (`workspace_id IS NULL`) seeded by Alembic from the existing `ai_employee_tools` definitions. Each row: `{id, slug, executor, side_effect_class, required_oauth_scopes[], required_capabilities[], requires_approval_above_usd, max_per_run, is_published, owning_service, deployed_in_version, description}`.
- [ ] AC-T-2: Authoring an agent references tools by `tool_registry_id`. Phase 2 introduces NO API for creating tools (tools remain code-deployed); registry rows are created/updated via Alembic migration that lands with the code that ships the tool. A read-only admin UI lists registered tools and their version history.
- [ ] AC-T-3: A draft version that references an unpublished or archived tool fails validation (`TOOL_NOT_AVAILABLE`).

### Version Lifecycle
- [ ] AC-V-1: State machine: `draft → in_review → published → deprecated → archived`. Allowed transitions:
    - `draft → in_review` by any `author`/`reviewer`/`publisher`
    - `in_review → draft` (reject) by any `reviewer`/`publisher` with `rejection_reason`
    - `in_review → published` by a `reviewer` or `publisher` **whose user_id ≠ the version's author user_id** (two-person rule) for `minor`/`major`; **same-person allowed for `patch` if `self_published_reason` is provided** (per Q5 resolution)
    - `published → deprecated` by any `publisher` with `deprecation_reason` and `deprecation_force_upgrade_at` (default = now() + 90 days)
    - `deprecated → archived` automatic on `force_upgrade_at` once all rentals have migrated off or been paused
- [ ] AC-V-2: Publishing requires: (a) successful eval dry-run on the version's `eval_dataset_ref` within last 24h; (b) pass-rate ≥ previous version's baseline − 15% OR reviewer override with `eval_regression_override_reason`; (c) two-person rule satisfied per AC-V-1; (d) breaking-change marker set if any of: removed tool, narrowed `allowed_model_ids`, raised `min_plan`, removed default SOP, raised `monthly_rental_price_usd`.
- [ ] AC-V-3: Publishing atomically: sets version row `status='published'`, sets all-prior-`published`-versions of same agent to `deprecated` (with `deprecation_force_upgrade_at=now()+90d`), updates `ai_employee_catalog.current_published_version_id`, writes audit event, schedules per-rental upgrade notifications per AC-U-1.
- [ ] AC-V-4: A published version is immutable. Any mutation attempt returns 409 `VERSION_IMMUTABLE`. (Operationally, "fixing" a published version means publishing a new patch version.)

### Rental Pinning & Upgrade (workspace-owner-facing)
- [ ] AC-P-1: `ai_employee_rentals` gains columns: `pinned_version_id UUID NOT NULL` (soft FK to `agent_versions`), `auto_upgrade_policy TEXT NOT NULL DEFAULT 'minor_and_patch' CHECK (... IN ('manual','patch_only','minor_and_patch','all'))` **(default `minor_and_patch` per Q2 resolution)**, `last_upgrade_at TIMESTAMPTZ`, `last_upgraded_from_version_id UUID`.
- [ ] AC-P-2: `POST /v1/employees/rent` (Phase 1 endpoint) sets `pinned_version_id` to the catalog's `current_published_version_id` at the moment of rent. Body MAY set `auto_upgrade_policy` (defaults to `minor_and_patch`).
- [ ] AC-P-3: `ai_employee_runs` gains column `agent_version_id UUID NOT NULL` (snapshot of `rental.pinned_version_id` at run dispatch time). In-flight runs always use the snapshotted version even if rental upgrades mid-run.
- [ ] AC-P-4: `PATCH /v1/employees/rentals/{id}/version` accepts `{target_version_id}`. Validates: target is a `published` version of the same agent; target satisfies the rental's plan tier; if target is a `MAJOR` increment or `is_breaking_change=true`, request body MUST include `acknowledged_breaking_changes_summary` matching the version's `breaking_changes_summary`. On success: updates `pinned_version_id`, sets `last_upgrade_at` and `last_upgraded_from_version_id`, writes audit event, emits `ai_employee.rental.version.upgraded`. **Pricing policy (per Q4 resolution):** if the target version's `monthly_rental_price_usd` differs from the current pinned version's, the workspace's next Paddle billing cycle is updated to the target's price (no proration); rentals that do NOT upgrade are **grandfathered at the originally-pinned version's price** for the lifetime of the rental.
- [ ] AC-P-5: `POST /v1/employees/rentals/{id}/version/rollback` rolls back to `last_upgraded_from_version_id` if `last_upgrade_at > now() - 30 days`. Otherwise 410 `ROLLBACK_WINDOW_EXPIRED`. Emits `ai_employee.rental.version.rolled_back`. Rollback also reverts the Paddle subscription price to the pre-upgrade price (next cycle, no proration).

### Auto-Upgrade Worker
- [ ] AC-U-1: When a new version publishes, an outbox event `ai_employee.author.version.published` fans out. A subscriber in `ai-employee-service` enumerates active rentals of that agent, computes per-rental `eligible_for_auto_upgrade` based on `auto_upgrade_policy` + version diff classification, and either:
    - auto-upgrades immediately (atomic — same as AC-P-4 but skips breaking-change acknowledgement because policy precludes auto-upgrade across breaking changes; the policy NEVER permits auto-upgrade on `is_breaking_change=true`); OR
    - enqueues a Novu notification "Agent X v{label} is available [view changes] [upgrade now] [stay on v{current}]".
- [ ] AC-U-2: Auto-upgrade respects pricing change: if new version's `monthly_rental_price_usd` > current, **auto-upgrade is suppressed** regardless of policy and a notification with the price delta and 14-day pre-notice is sent instead (the owner must opt in via `PATCH /version`). Combined with AC-P-4: non-upgrading rentals stay at the grandfathered price.
- [ ] AC-U-3: Deprecated-version reminder: weekly Novu notification while a rental remains on a `deprecated` version; daily notification in the final 7 days before `deprecation_force_upgrade_at`.
- [ ] AC-U-4: At `deprecation_force_upgrade_at`, a daily Cloud Run Job iterates rentals on the deprecated version and:
    - If the latest non-deprecated minor on the same major exists AND it's not a breaking change vs the deprecated version AND no price increase: force-upgrades the rental (audit event `ai_employee.rental.version.force_upgraded`).
    - Otherwise: pauses the rental with `pause_reason='version_lifecycle_expired'`, emits `ai.employee.auto_paused`, notifies the owner.

### RBAC
- [ ] AC-R-1: Three internal roles on a new `internal_staff_roles` table: `author`, `reviewer`, `publisher`. A staff user may hold multiple. Roles are assigned by an admin via `POST /v1/admin/staff/{user_id}/roles` (requires `publisher`). **Per Q3 resolution:** v1 is system-owner-only; the role assignment surface is internal-staff-only and no workspace-tenant role concept exists yet.
- [ ] AC-R-2: Capability matrix enforced at API:
    - `author`: create draft, edit own draft, request review
    - `reviewer`: read all drafts, transition `in_review → draft` (reject), transition `in_review → published` (subject to two-person rule)
    - `publisher`: all of the above + transition `published → deprecated`, assign roles, edit tool registry metadata, set deprecation timelines
- [ ] AC-R-3: Two-person rule enforced on `in_review → published`: actor user_id must differ from version's `created_by_user_id`. **Exception (per Q5): `patch` versions allow same-person if `self_published_reason` is supplied (logged in audit).**
- [ ] AC-R-4: Failed RBAC checks return 403 with `code='INSUFFICIENT_ROLE'` and the missing role; never leak existence info.

### Audit
- [ ] AC-AUD-1: Every authoring action writes to `events` (Spec 21 taxonomy) with event types: `ai_employee.author.agent.created`, `…version.created`, `…version.updated`, `…version.submitted_for_review`, `…version.rejected`, `…version.published`, `…version.deprecated`, `…tool_registry.updated`, `…rental.version.upgraded`, `…rental.version.rolled_back`, `…rental.version.force_upgraded`, `…staff_role.assigned`, `…staff_role.revoked`. Each event includes `actor_user_id`, `version_id`, `agent_id`, `diff_json` (when applicable), `trace_id`.
- [ ] AC-AUD-2: `GET /v1/admin/audit?agent_id=...&from=...&to=...` returns paginated audit history (publisher-only).
- [ ] AC-AUD-3: Audit events are append-only and immutable (no UPDATE/DELETE permitted by RLS even for `publisher`).

### Eval Dry-Run
- [ ] AC-E-1: `POST /v1/admin/agents/{agent_id}/versions/{version_id}/eval` runs the version's `eval_dataset_ref` through `ai-service` graph runtime using the version's system prompt, default model, and default SOPs. Credits charged to internal billing account (Spec 32 amendment). Returns a `dry_run_id`. Asynchronous via Cloud Tasks.
- [ ] AC-E-2: `GET /v1/admin/agents/{agent_id}/versions/{version_id}/eval/{dry_run_id}` returns status + per-example results + overall pass_rate + comparison vs previous published version's last-recorded pass_rate.
- [ ] AC-E-3: Publish (AC-V-2) requires a successful eval dry-run on this version within last 24h. Eval results are persisted in `agent_version_eval_runs` table.

### Migration of Phase 1 seeded agents
- [ ] AC-M-1: Phase 2's first Alembic migration converts any existing `ai_employee_catalog` rows into `agent_versions` rows with `version_label='1.0.0'`, `status='published'`, `created_by_user_id=<system_seed_user_id>`. Sets `current_published_version_id` accordingly. Backfills `pinned_version_id` on every existing rental from the agent's seeded version. Backfills `agent_version_id` on existing runs from the rental's pinned version at the time of the run (using rental's `created_at` as best-effort proxy).

### Admin App Origin Isolation (per Q1 resolution: SEPARATE app)
- [ ] AC-ADMIN-APP-1: The admin UI ships as a **separate Next.js 14 app at `apps/admin/`** with its own `wrangler.toml`, its own Cloudflare Pages deploy, and its own origin (e.g. `admin.revlooper.com`). It does NOT live as a route group inside `apps/portal/`. The portal app continues to be workspace-owner-only.
- [ ] AC-ADMIN-APP-2: The admin app's auth flow uses the same Supabase Auth project as the portal, but gates entry on JWT claim `is_internal_staff=true` issued only after MFA + corporate-email-domain verification on the staff IdP path (Spec 01 amendment). Rationale (justification, per Q1 follow-up): a single Supabase project with a staff role claim avoids the operational overhead of running two IdP infrastructures, keeps the existing `users` table the source of truth (with new `is_staff` flag), and the SecOps benefit of separate Supabase projects is already captured by (a) origin isolation, (b) MFA enforcement, (c) corporate VPN IP allowlist at api-gateway, and (d) defence-in-depth server-side `internal_staff_roles` row check on every `/v1/admin/*` route.
- [ ] AC-ADMIN-APP-3: The admin app enforces strict CSP (no third-party scripts, no inline scripts, no eval); mandatory MFA on staff accounts; session length capped at 8h for `is_internal_staff=true` JWTs.
- [ ] AC-ADMIN-APP-4: The admin app calls `api.revlooper.com` (api-gateway, same as portal) — `/v1/admin/*` routes are protected by the api-gateway middleware (IP allowlist + staff claim + role claim).

## Phase 2 Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Time to ship a new agent (slug → published v1.0.0, assuming tools exist) | ≤ 30 minutes for an experienced author | Admin UI session telemetry |
| Audit completeness (every state transition has a matching event row) | 100% (assertion in nightly job) | `agent_versions` ⋈ `events` reconciliation |
| Two-person rule violations in production | 0 | Audit log inspection |
| Workspace-owner upgrade prompt CTR (any of upgrade/review/dismiss) within 7 days | ≥ 60% | Novu engagement |
| Rollbacks within 30 days of upgrade (signal of regression) | ≤ 5% of upgrades | `events` |
| Force-upgrades resulting in rental pause | ≤ 10% of force-upgrades | `events` |
| Eval dry-run usage (drafts that ran eval before publish attempt) | ≥ 95% | `agent_version_eval_runs` |

## Phase 2 In-Scope Deliverables

- **Separate admin Next.js app at `apps/admin/`** (per Q1) — own `wrangler.toml`, own Cloudflare Pages deploy, own origin, staff-only auth
- 5 new tables: `agent_versions`, `agent_version_eval_runs`, `tool_registry`, `ai_employee_rental_version_history`, `internal_staff_roles`
- 3 column additions to existing Phase 1 tables: `ai_employee_catalog.current_published_version_id`, `ai_employee_rentals.{pinned_version_id, auto_upgrade_policy, last_upgrade_at, last_upgraded_from_version_id}`, `ai_employee_runs.agent_version_id`
- ~20 admin API endpoints under `/v1/admin/*` (on the existing `ai-employee-service`)
- 4 workspace-owner endpoints (`PATCH /rentals/{id}/version`, `POST /rentals/{id}/version/rollback`, `GET /rentals/{id}/version/diff`, `GET /agents/{id}/versions/available`)
- Alembic migration (additive — does NOT modify Phase 1's migration)
- 10+ new outbox event types
- 2 new Cloud Run Jobs: weekly deprecated-version-reminder sweeper, daily force-upgrade processor
- Novu workflow `ai_employee_version_lifecycle` with 6 templates (upgrade_available, breaking_change_available, price_change_available, deprecation_reminder, deprecation_imminent, force_upgrade_executed)
- Spec 32 amendment: `internal_billing_accounts` table for eval dry-run credit charges (does NOT touch workspace credits)
- Feature flag `ai_employee_authoring_enabled` (Spec 23) — off by default; per-staff-user enable for dogfood

## Phase 2 Dependencies

| Dep | What we need |
|---|---|
| Phase 1 of this spec | HARD prereq — all runtime tables, services, and APIs must exist and be in production ≥ 14 days. |
| Spec 01 (Auth) | Internal staff JWT issuance via separate IdP path with `is_internal_staff=true` claim; staff user_ids in same `users` table with `is_staff=true` flag |
| Spec 21 (Event Taxonomy) | Reserve event names `ai_employee.author.*` and `ai_employee.rental.version.*` |
| Spec 23 (Feature Flags) | `ai_employee_authoring_enabled` flag per user |
| Spec 32 (Billing) | New `internal_billing_accounts` table + ability to charge eval dry-run runs to it instead of a workspace; Paddle subscription price update on `PATCH /rentals/{id}/version` (no proration) |
| Spec 37 (LangGraph) | Already has graph_run endpoint from Phase 1; reuse for eval dry-run |
| Novu (notification-service) | New workflow `ai_employee_version_lifecycle` with 6 templates above |
| api-gateway | `/v1/admin/*` IP allowlist + staff-claim middleware; routing rule for `admin.revlooper.com` origin |

## Phase 2 Test Checklist (PRD-level — full in TESTS.md §Phase 2)
- [ ] Two-person rule blocks publish when actor == version's author for minor/major
- [ ] Same-person publish of `patch` succeeds with `self_published_reason`
- [ ] Publish blocked when eval pass-rate regresses > 15% without override
- [ ] Override succeeds with `eval_regression_override_reason` recorded in audit
- [ ] Editing a `published` version returns 409 VERSION_IMMUTABLE
- [ ] In-flight run completes on its snapshotted `agent_version_id` even if rental upgrades
- [ ] Auto-upgrade respects `manual` policy (no upgrade, notification only)
- [ ] Auto-upgrade across breaking change is never executed regardless of policy
- [ ] Auto-upgrade suppressed when new version has higher monthly price (notification only, with 14d pre-notice); non-upgrading rental retains grandfathered price
- [ ] Force-upgrade at deprecation deadline succeeds when safe; pauses rental otherwise
- [ ] Rollback within 30d succeeds; after 30d returns 410; Paddle price also reverts
- [ ] RBAC: author cannot publish, reviewer cannot assign roles, publisher cannot bypass two-person rule
- [ ] Workspace B cannot read Workspace A's rental version history
- [ ] Audit row exists for every state transition (reconciliation job)
- [ ] Cross-tenant: staff JWT with `is_internal_staff=false` returns 403 on every `/v1/admin/*` route
- [ ] IP-allowlist enforced at api-gateway for `/v1/admin/*` (request from outside corporate VPN → 403)
- [ ] Tool registry: draft version referencing an `is_published=false` tool fails validation
- [ ] Migration: existing seeded catalog rows backfilled to `version=1.0.0, status=published` with rentals' `pinned_version_id` populated
- [ ] Admin app served from separate origin (`admin.revlooper.com`); portal cookies / Supabase session do NOT auto-grant admin access without `is_internal_staff=true` claim
