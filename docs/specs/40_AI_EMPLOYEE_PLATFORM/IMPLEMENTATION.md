# 40 — AI Employee Platform — IMPLEMENTATION

**Status:** ✅ Approved (2026-05-18)

## v1 Scope Reminder

v1 ships the **platform foundation only**. No vertical agents ship in this spec. The catalog API returns an empty list (with `meta.coming_soon=true`) until child specs land. The first vertical agent is Spec 41 (Ads Intelligence), drafted only AFTER this platform is in production for ≥ 14 days.

## Phasing & Feature Flag

Behind feature flag `ai_employee_platform_enabled` (Spec 23). Default `false`; enabled per-workspace for internal dogfood only until first child spec ships.

| Phase | Scope | Exit criteria |
|---|---|---|
| **P0 — Prerequisites** | (a) Spec 37 amendment: `graph_registry` + `POST /v1/internal/graph/run`; (b) Spec 32 amendments: `ai_models` reference table seeded with current LiteLLM-routed models, `paddle_line_items` table, `POST /v1/internal/credits/reserve`, `POST /v1/internal/credits/settle`, reservation row stores rate snapshot; (c) Spec 15 per-request OAuth scope stripping confirmed | All PRs merged, integration tests green, `ai_models` table contains at least: GPT-4o-mini, GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash with current rates |
| **P1 — Platform foundations (this spec)** | New `ai-employee-service`, 10 tables (incl. `ai_employee_workspace_settings`), 15+ APIs (incl. `PATCH /rentals/{id}/model`, `PUT /workspace-settings`), 7 outbox events, cancellation lifecycle state machine + hourly finaliser sweeper, frontend marketplace skeleton (empty-state UI), internal-only dev agent for path validation, feature flag off in production | All tests in TESTS.md green; spec self-review pass; internal team rents the dev agent end-to-end (rent → SOP → run → approval → settle → cancel) at least once |
| **P2+ — Vertical agents** | Each agent ships in its own child spec (41–46). No vertical agent code in this spec. | See child specs |

## Follow-up Child Specs (drafted AFTER this umbrella in production ≥ 14 days)

| Spec # | Title | Owner | Order rationale |
|---|---|---|---|
| 41 | AI Employee — Ads Intelligence | Planner | Highest commercial pull, biggest blast radius — ship first to validate spend-cap + ad-spend reconciliation under real load |
| 42 | AI Employee — Content Writer (Social + Blog) | Planner | Validates `publish_public` flow + disclosure rendering |
| 43 | AI Employee — Competitor Monitor | Planner | Validates scheduled/triggered (non-on-demand) runs |
| 44 | AI Employee — Customer Support Triage | Planner | Validates inbound integration + high-volume runs |
| 45 | AI Employee — Growth Researcher | Planner | Validates long-running multi-step research graphs |
| 46 | AI Employee — Agency-Scoped Rental Sharing | Planner | Multi-workspace deployment surface (orthogonal to agent vertical) |

> **Note:** The former Spec 47 (Authoring Platform) has been merged back into this spec as **Phase 2** (2026-05-18). Until Phase 2 ships, agents continue to be seeded via Alembic per Phase 1's design.

**Order is not fixed** — the planner will re-prioritise based on platform telemetry from P1 dogfood + GTM signal. Risk-ordered shipping (lowest blast radius first: Competitor Monitor → Content Writer → Ads) is a valid alternative the planner may choose at the time.

Each child spec MUST contain:
- Catalog entry definition (graph_module path, tool manifest, default caps, min_plan)
- LangGraph node definitions registered in ai-service `graph_registry`
- Per-agent golden eval dataset (≥ 50 examples) + LLM-as-judge rubric
- Per-agent SEA-specific guardrails (cultural/language)
- Per-agent example SOP template (helps onboarding)

Child specs are blocked on this umbrella being approved.

## Dependencies on Other Specs (hard prerequisites)

| Spec | Required change | Status |
|---|---|---|
| Spec 37 LangGraph Orchestration | Add `graph_registry` (slug → factory) and `POST /v1/internal/graph/run` endpoint | **Amendment required — listed as P0** |
| Spec 32 Billing & Credits | (a) New `ai_models` reference table seeded with current LiteLLM-routed models; (b) `paddle_line_items` table; (c) `POST /v1/internal/credits/reserve` (idempotent on caller-supplied key); (d) `POST /v1/internal/credits/settle` (reads rate snapshot from reservation); (e) reservation row stores `{model_id, input_rate_per_1k_usd, output_rate_per_1k_usd, margin_pct}` snapshot so settlement uses the SAME rate even if `ai_models` mutates mid-run; (f) extend monthly statement view to include per-rental token + credit breakdown | **Amendment required — listed as P0 (scope expanded vs original)** |
| Spec 15 Integrations | Per-request OAuth scope stripping for Google Ads / Meta Ads / LinkedIn tool calls | **Amendment required — confirm with Spec 15 owner; deferred to Spec 41 if scope-stripping only matters for ad agents** |
| Spec 31 AI Advisor | `advisor_notifications` subscribes to `ai.employee.approval.requested` (forward into unified inbox) | **Additive — non-breaking** |
| Spec 33 Freemium Feature Gates | New gate `ai_employee_marketplace` (Pro+, Business+) | **Additive — non-breaking** |
| Spec 35 Solo Operator Mode | None — we mirror the approval pattern but in a new table | None |
| Spec 13 Workflow Automation | New trigger source `ai_employee.run.completed` + new action `dispatch_ai_employee_run` | **Additive — non-breaking** |

## Service & Repo Layout

```
services/ai-employee-service/
  app/
    api/v1/
      catalog.py
      rentals.py
      sops.py
      runs.py
      approvals.py
      internal_tools.py        # service-to-service
    services/
      rental_service.py
      sop_service.py
      run_service.py
      approval_service.py
      spend_cap_service.py
      tool_invocation_service.py
      eval_service.py
    repositories/
      catalog_repo.py
      rental_repo.py
      sop_repo.py
      run_repo.py
      approval_repo.py
      tool_repo.py
      memory_repo.py
      feedback_repo.py
    models/                     # SQLAlchemy
      catalog.py
      rental.py
      sop.py
      run.py
      tool.py
      approval.py
      memory.py
      feedback.py
    clients/
      ai_service_client.py     # POST /v1/internal/graph/run
      billing_client.py        # /credits/deduct, /budgets/check-and-reserve
      integration_client.py    # /tools/{provider}/{op}
      notification_client.py
    workers/                   # Cloud Run Jobs
      runaway_loop_sweeper.py
      expired_approval_sweeper.py
      eval_runner.py
      ad_spend_reconciler.py
    main.py
  tests/
    unit/
    integration/
    security/
  Dockerfile
  pyproject.toml
  cloudbuild.yaml

alembic/versions/
  2026_05_18_001_create_ai_employee_platform_tables.py

apps/portal/app/(dashboard)/employees/
  page.tsx
  catalog/[slug]/page.tsx
  my/page.tsx
  [rentalId]/
    page.tsx
    sops/page.tsx
    runs/page.tsx
    runs/[runId]/page.tsx
    approvals/page.tsx
apps/portal/components/employees/
  CatalogCard.tsx
  RentalCard.tsx
  SopEditor.tsx
  RunTimeline.tsx
  ApprovalRequestCard.tsx
  SpendCapControls.tsx
apps/portal/lib/api/employees.ts

infra/terraform/services/ai-employee-service/
  main.tf
  cloud_run.tf
  cloud_tasks.tf                # 256 queues
  scheduler.tf                  # nightly eval, hourly sweeper, daily reconciler
```

## Cloud Tasks Queues

- `ai-employee-run-{00..ff}` — 256 queues, sharded by first 2 chars of rental_id hex.
  - max_concurrent_dispatches=10, max_dispatches_per_second=5 per queue → 1280 RPS theoretical ceiling, well above 10 RPS target.

## Cloud Scheduler Jobs

- `ai-employee-runaway-sweeper` — every 1h
- `ai-employee-expired-approvals` — every 1h
- `ai-employee-eval-runner` — daily 02:00 UTC
- `ai-employee-ad-spend-reconciler` — daily 04:00 UTC

## Monitoring & Alerts

| Metric | Source | Alert threshold |
|---|---|---|
| `ai_employee_run_failure_rate` | run completion logs | > 10% over 1h |
| `ai_employee_spend_cap_hits_per_hour` | event | > 50 (likely misconfiguration) |
| `ai_employee_auto_pause_rate` | event | > 5 per 1h |
| `ai_employee_approval_inbox_lag_p95` | derived | > 24h |
| `ai_employee_per_run_cost_p95_usd` | runs table | > $1.50 |
| `ad_spend_reconciliation_discrepancy_pct` | reconciler job | > 5% per workspace per day |

Dashboard in Looker Studio (Spec 26 pattern).

## Runbooks (high-level)

1. **Spend-cap hit alert** — verify cap config; if intentional → resume rental; if not → investigate workspace, possibly tighten ceiling.
2. **Ad-spend reconciliation discrepancy** — pull integration-service Google Ads spend report; diff against `ai_employee_tool_invocations`; manual Paddle credit/debit memo.
3. **Auto-paused rental** — read `pause_reason`; check last 10 runs; if eval regression → rollback agent version (child spec maintains agent version pins).
4. **Approval inbox backlog** — auto-notify workspace owner via Novu (already wired); escalation TBD per child agent.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Spec 32 amendment scope grew (ai_models + reserve/settle + rate snapshot) | HIGH | Block P1 release until P0 done; co-design with billing-service owner before starting |
| Spec 37 amendment not completed before P1 | HIGH | Block P1 release until P0 done; alternative: ai-employee-service hosts its own LangGraph (rejected — fragments orchestration) |
| **Product narrative: empty marketplace at launch** | HIGH | Internal dev-only agent (`ai_employee_dev_agent` flag) for end-to-end validation; explicit "Coming Soon" empty state + roadmap link on /employees; do NOT mention platform on landing pages until first child spec ships |
| Per-token billing rate desync (ai_models mutated mid-run) | MEDIUM | Reservation snapshots rate; settlement reads snapshot, not live; tested in test_model_rate_snapshot |
| `ai_models` rate freshness (LLM providers change pricing) | MEDIUM | Quarterly manual reconcile job + ops runbook; alert if any active model is > 90 days since last `rate_changed` event |
| LLM cost overrun at scale | LOW (was MEDIUM) | Per-token reserve+settle removes the open-loop risk that existed in old per-run-estimate model; per-rental ceiling still enforced |
| Cancellation grace race (approval slips after cancellation) | MEDIUM | Atomic state transition in finaliser + tool runner pre-check; tested in test_cancellation_grace_bypass |
| Eval-driven auto-pause too aggressive | LOW | Deferred — no vertical agents in v1; first child spec tunes |
| Workspace owners ignore approval inbox | MEDIUM | Push notification via Novu; escalation rule deferred to v2 |
| Cross-tenant exposure via catalog | LOW | Catalog is intentionally public to authenticated users; per-workspace data is RLS-protected; T1 E2E test |

## Open Decisions Blocking Implementation Start

All 8 PRD open questions resolved 2026-05-18 by user. None blocking.


---

# Phase 2 — Authoring Platform IMPLEMENTATION (merged from Spec 47 on 2026-05-18)

## Phase 2 Phasing & Feature Flag

Behind feature flag `ai_employee_authoring_enabled` (Spec 23). Default `false`; per-staff-user enable for dogfood. **Phase 2 is gated on Phase 1 being in production ≥ 14 days.**

| Phase | Scope | Exit criteria |
|---|---|---|
| **P2-0 — Prereqs (cross-spec amendments)** | (a) Spec 01: staff IdP path that issues JWT with `is_internal_staff=true` + MFA + `users.is_staff` column; (b) Spec 21: reserve `ai_employee.author.*` and `ai_employee.rental.version.*` event names; (c) Spec 32: `internal_billing_accounts` table + `/credits/charge-internal` endpoint + Paddle subscription price update on `PATCH /rentals/{id}/version`; (d) Spec 23: `ai_employee_authoring_enabled` flag + per-staff-user targeting; (e) Novu workflow `ai_employee_version_lifecycle` (6 templates: upgrade_available, breaking_change_available, price_change_available, deprecation_reminder, deprecation_imminent, force_upgrade_executed); (f) api-gateway middleware: IP allowlist + staff-claim validation for `/v1/admin/*`; (g) DNS + Cloudflare Pages project for `admin.revlooper.com`. | All PRs merged, integration tests green, 2 publisher accounts + 1 reviewer account bootstrapped, `admin.revlooper.com` resolves to placeholder app. |
| **P2-1 — Authoring runtime** | New 5 tables + 5 column additions; admin APIs (~20 endpoints) on `ai-employee-service`; RBAC + two-person rule + breaking-change auto-detect + eval dry-run + audit; AutoUpgradeWorker subscriber; Cloud Run Jobs (deprecation-reminder weekly, force-upgrade daily); migration of seeded agents to v1.0.0. | All tests green; coverage gate met; staff dogfood publishes the existing internal dev agent as v1.1.0 (no-op patch, validates flow end-to-end) via direct API call; reconciliation job clean. |
| **P2-2 — Admin frontend (`apps/admin/`)** | NEW Next.js 14 app at `apps/admin/`, separate `wrangler.toml`, Cloudflare Pages project, strict CSP, staff auth gate, MFA enforcement. All admin views: agents list, draft editor, version diff viewer, eval results page, tool registry read-only, staff role assigner, audit stream. Workspace-owner upgrade UX added to `apps/portal/`. | All Playwright specs green (both `apps/admin/e2e/` and `apps/portal/e2e/employees/`); staff completes draft-to-publish flow via UI; workspace-owner upgrade flow validated against internal dogfood agent. |
| **P2-3 — Production enablement** | Flip `ai_employee_authoring_enabled` for staff users; first real authored version of Spec 41 Ads Intelligence agent publishes via admin UI (post-Spec 41 launch). | First real agent published via admin without code deploy. |

## Phase 2 Dependencies on Other Specs (hard prereqs)

| Spec | Required change | Status |
|---|---|---|
| Phase 1 (this spec) | None — Phase 2 is purely additive (new tables, new columns, new routes) | **No amendment required** |
| Spec 01 Auth | Staff IdP path + MFA + `is_internal_staff=true` claim + `is_staff=true` flag on `users` | **Amendment required — P2-0** |
| Spec 21 Event Taxonomy | Reserve event namespaces | **Additive — non-breaking** |
| Spec 23 Feature Flags | New flag with per-user targeting | **Additive — non-breaking** |
| Spec 32 Billing | `internal_billing_accounts` table + `/credits/charge-internal` + Paddle price update on rental upgrade (no proration) + price grandfather logic | **Amendment required — P2-0** |
| Spec 37 LangGraph | None (reuses Phase 1's graph_run endpoint) | None |
| notification-service | New Novu workflow `ai_employee_version_lifecycle` with 6 templates | **Amendment required — P2-0** |
| api-gateway | `/v1/admin/*` IP allowlist + staff-claim middleware; CORS rules to allow `admin.revlooper.com` | **Amendment required — P2-0** |
| Cloudflare / DNS | New Pages project + DNS record for `admin.revlooper.com` | **Infra task — P2-0** |

## Phase 2 Service & Repo Layout (additive)

```
services/ai-employee-service/
  app/
    admin/                          # NEW namespace (Phase 2)
      api/
        agents.py
        versions.py
        eval.py
        tool_registry.py
        staff.py
        audit.py
      services/
        agent_service.py
        version_service.py
        publish_service.py          # two-person rule + breaking-change auto-detect
        eval_service.py
        rbac_service.py
        audit_service.py
        diff_service.py
      models/
        agent_version.py
        tool_registry.py
        agent_version_eval_run.py
        internal_staff_role.py
        rental_version_history.py
      workers/
        auto_upgrade_worker.py        # Pub/Sub subscriber
        deprecation_reminder_sweeper.py
        force_upgrade_processor.py
        audit_reconciliation_job.py
    api/v1/
      # Phase 1 routes unchanged
      rentals.py                       # EXTENDED with version upgrade/rollback routes
      agents.py                        # NEW: GET /agents/{id}/versions/available

alembic/versions/
  2026_06_15_001_ai_employee_authoring_platform.py
    # - creates 5 new tables
    # - adds 5 columns to existing tables
    # - backfills pinned_version_id + runs.agent_version_id from seeded data
    # - installs Postgres trigger: agent_versions_immutable_after_publish
    # - installs Postgres trigger: events_append_only_after_insert (if not already from Spec 21)

apps/admin/                            # NEW Next.js 14 app (separate Cloudflare Pages deploy)
  wrangler.toml                        # admin.revlooper.com
  next.config.mjs                      # strict CSP, no third-party scripts
  middleware.ts                        # staff-claim gate; redirect to /unauthorized if missing
  app/
    layout.tsx
    page.tsx                           # redirect to /agents
    agents/
      page.tsx                         # list
      new/page.tsx                     # create agent
      [agentId]/
        page.tsx                       # agent detail + version history
        versions/
          new/page.tsx                 # draft editor
          [versionId]/
            page.tsx                   # version detail
            edit/page.tsx              # draft editor (existing draft)
            eval/page.tsx              # eval results
            diff/page.tsx              # diff vs prev
    tool-registry/page.tsx             # read-only list
    staff/page.tsx                     # role assignment
    audit/page.tsx                     # audit event stream
  components/
    AgentDraftEditor.tsx
    VersionDiffViewer.tsx
    EvalResultsTable.tsx
    TwoPersonRuleBanner.tsx
    BreakingChangeBadge.tsx
    StaffRoleAssigner.tsx
  lib/
    api/admin-agents.ts
    api/admin-versions.ts
    api/admin-staff.ts
    auth/staff-gate.ts

apps/portal/app/(dashboard)/employees/[rentalId]/version/    # workspace-owner upgrade UX (extends Phase 1 portal)
  page.tsx                              # current pinned version + upgrade prompt + available list
  diff/page.tsx                         # diff vs target
  rollback/page.tsx                     # rollback action

apps/portal/components/employees/
  UpgradePrompt.tsx
  BreakingChangeAcknowledgement.tsx

apps/portal/lib/api/
  rental-versions.ts

infra/terraform/services/ai-employee-service/
  scheduler.tf                          # ADD: weekly deprecation reminder, daily force-upgrade
  cloud_run.tf                          # ADD: ingress=internal restriction on /v1/admin/* (via api-gateway routing rule)

infra/terraform/cloudflare/
  pages_admin.tf                        # NEW: admin.revlooper.com Cloudflare Pages project
```

## Phase 2 Cloud Tasks / Scheduler Additions

- `ai-employee-eval-dryrun` queue: max_concurrent=5, max_dispatches/s=2 (eval is expensive)
- `ai-employee-deprecation-reminder` Cloud Scheduler: weekly Mon 09:00 SGT
- `ai-employee-force-upgrade` Cloud Scheduler: daily 03:00 SGT
- `ai-employee-audit-reconciliation` Cloud Scheduler: nightly 02:00 SGT

## Phase 2 Monitoring & Alerts

| Metric | Source | Alert threshold |
|---|---|---|
| `ai_employee_admin_rbac_failures` | structured log | > 5 per user per 10 min → page |
| `ai_employee_admin_self_role_grants` | events | any single occurrence → page |
| `ai_employee_admin_published_per_day` | events | > 10 per user per day → page (anti-burst) |
| `ai_employee_rollback_rate` | events | > 10% of upgrades in 24h → warn (regression signal) |
| `ai_employee_force_upgrade_pause_rate` | events | > 10% of force-upgrades pause rental → warn |
| `ai_employee_audit_reconciliation_mismatches` | nightly job | > 0 → page |
| `ai_employee_eval_internal_billing_burn_usd` | reservation | > $50/day → warn |

Dashboard in Looker Studio.

## Phase 2 Runbooks (high-level)

1. **Two-person rule blocking small team** — runbook: bootstrap requires 2 publishers; if hitting friction on patch fixes, use same-person `patch` with reason (per Q5); never disable rule.
2. **Bad version auto-upgraded to many rentals** — deprecate the bad version immediately (publisher action) with `deprecation_force_upgrade_at=now()+7d`; weekly deprecation reminder + daily in final 7 → owners encouraged to rollback (within 30d window) or accept forced upgrade to safe version.
3. **Eval dry-run cost spike** — check internal billing dashboard; identify staff user; pause via flag or quota.
4. **Force-upgrade paused too many rentals** — investigate which version chain broke (likely missing safe minor target); patch the latest non-deprecated version to be backward-compatible; manually unpause.
5. **`admin.revlooper.com` outage** — Cloudflare Pages status check; portal continues to function; runtime continues to function (admin app is read/write of authoring data only, not runtime). Failover: route to maintenance page until restored.

## Phase 2 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Spec 32 amendment (internal_billing_accounts + price-grandfather) delayed | MEDIUM | Block P2-1 until merged; alternative for v1: eval dry-run uses a single hardcoded internal Paddle account (less granular but unblocks). |
| Staff IdP amendment (Spec 01) delayed | HIGH | Block P2-1 until merged; cannot ship admin tool without secure auth. |
| Backfill migration corrupts Phase 1 production data | HIGH | Migration runs in transaction; dry-run against staging clone first; backup before run; validate every rental has matching pinned_version_id before commit. |
| Auto-upgrade fans out to many rentals before regression detected | MEDIUM | Conservative default policy (`minor_and_patch`); eval gate at publish; staged rollout: enable auto-upgrade for ≤ 10 rentals first (admin flag), then all. |
| Two-person rule too strict for early team | MEDIUM | Patch same-person allowed with reason (Q5); runbook documents bootstrap requirements; reviewer role can be held by founders. |
| Audit trail tampering by privileged DB access | HIGH | Postgres trigger + BigQuery off-site export + RLS revocation of UPDATE/DELETE for all roles. |
| Workspace-owner confusion about version semantics | MEDIUM | Diff viewer with plain-English summary; "what's new" auto-generated from diff_json; help docs. |
| `apps/admin/` build/deploy duplication overhead | LOW | Accepted cost per Q1; shared workspace lockfile minimises drift. |

## Phase 2 Open Decisions Blocking Implementation

All 5 Phase 2 PRD questions (Q1–Q5) resolved 2026-05-18 by user. None blocking. See RESULT.md §Open Questions Resolution Log.
