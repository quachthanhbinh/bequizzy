# 40 — AI Employee Platform — TASKS (Phase 1 only)

**Status:** ✅ Approved (2026-05-18) — Ready for plan once Phase 0 amendments confirmed.

This TASKS file covers **Phase 1 only** (platform foundations; **no catalog entries** in v1). The first vertical agent ships in Spec 41 after this platform is in production ≥ 14 days.

Each task: RED (write failing test) → Verify-RED (run, observe failure) → GREEN (minimum implementation) → Verify-GREEN (run, observe pass + coverage) → Commit.

## Phase 0 — Cross-spec amendments (NOT in this spec's PR; tracked here for visibility)

| # | Task | Owner spec | Required for |
|---|---|---|---|
| P0.1 | Spec 37 `graph_registry` + `POST /v1/internal/graph/run` | Spec 37 | Task 8 |
| P0.2 | Spec 32 `ai_models` reference table (seeded: GPT-4o-mini, GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash) | Spec 32 | Tasks 1, 4 |
| P0.3 | Spec 32 `paddle_line_items` table | Spec 32 | Task 4 |
| P0.4 | Spec 32 `POST /credits/reserve` + `POST /credits/settle` (idempotent on caller key; reservation stores rate snapshot) | Spec 32 | Tasks 6, 8 |
| P0.5 | Spec 32 monthly-statement view extended with per-rental token + credit breakdown | Spec 32 | Acceptance only |

Phase 1 PR is blocked until P0.1–P0.4 are merged.

## Phase 1 Tasks (≤ 18)

| # | Task | Files (create unless noted) | Tests added |
|---|---|---|---|
| 1 | Alembic migration: 10 tables (incl. `ai_employee_workspace_settings`) + indexes + RLS policies; references `ai_models.id` from Spec 32 | `alembic/versions/2026_05_18_001_create_ai_employee_platform_tables.py` | `tests/migrations/test_001_roundtrip.py` |
| 2 | SQLAlchemy models for all 10 tables (incl. workspace_settings) | `services/ai-employee-service/app/models/*.py` | `tests/unit/models/test_models_roundtrip.py` |
| 3 | Repositories (CRUD per table) | `services/ai-employee-service/app/repositories/*.py` | `tests/unit/repositories/test_*.py` |
| 4 | `WorkspaceSettingsService` + `GET/PUT /v1/employees/workspace-settings` + disclosure template validation (1–280 chars) + interpolation helper (`{workspace_name}`, `{agent_name}`) | `app/services/workspace_settings_service.py`, `app/api/v1/workspace_settings.py` | `tests/unit/services/test_workspace_settings_service.py` |
| 5 | `RentalService` + `POST /v1/employees/rent` + model_id validation against `catalog.allowed_model_ids` + capability check against tools' `required_capabilities` + publish_public disclosure-template gate + prepaid Paddle line-item creation | `app/services/rental_service.py`, `app/api/v1/rentals.py`, `app/clients/billing_client.py` | `tests/unit/services/test_rental_service.py`, `tests/integration/test_rent_to_paddle.py` |
| 6 | `PATCH /v1/employees/rentals/{id}/model` — model swap, recompute `per_run_credit_ceiling`, emit `ai.employee.model_changed` | extend `app/services/rental_service.py`, `app/api/v1/rentals.py` | `tests/integration/test_model_switch.py` |
| 7 | `SopService` + SOP API (versioned, 20KB cap, escape `</sop>`) | `app/services/sop_service.py`, `app/api/v1/sops.py` | `tests/unit/services/test_sop_service.py`, `tests/security/test_sop_prompt_injection.py` |
| 8 | `SpendCapService` (per-rental monthly run cap + per-run credit ceiling) | `app/services/spend_cap_service.py` | `tests/unit/services/test_spend_cap_service.py`, `tests/integration/test_spend_cap_race.py` |
| 9 | `RunService`: dispatch via Cloud Tasks, ai-service graph invocation, lifecycle, **reserve credits at dispatch / settle at completion** (with model rate snapshot), full release on pre-side-effect failure | `app/services/run_service.py`, `app/services/billing_split_service.py`, `app/api/v1/runs.py`, `app/clients/ai_service_client.py` | `tests/unit/services/test_run_service.py`, `tests/unit/services/test_billing_split.py`, `tests/integration/test_rent_to_run_flow.py` |
| 10 | `ApprovalService` + Approval API (idempotent, fail-closed expiry, **publish_public 30-day lock-in**: always require approval during dry-run + first 30 days of rental) | `app/services/approval_service.py`, `app/api/v1/approvals.py` | `tests/unit/services/test_approval_service.py`, `tests/integration/test_approval_flow.py`, `tests/integration/test_expired_approval_fail_closed.py`, `tests/integration/test_publish_public_approval_lockin.py` |
| 11 | `ToolInvocationService` + integration-service client + **disclosure rendering** for `publish_public` tools (reads template, interpolates, appends to request) | `app/services/tool_invocation_service.py`, `app/clients/integration_client.py` | `tests/unit/services/test_tool_service.py`, `tests/security/test_oauth_scope_strip.py`, `tests/integration/test_disclosure_rendering.py` |
| 12 | Dry-run mode (simulation outputs; no external side effects) | wire into `tool_invocation_service.py` | `tests/integration/test_dry_run_mode.py` |
| 13 | **Cancellation lifecycle**: `POST /rentals/{id}/cancel` → status=cancelling, set `cancellation_grace_ends_at=min(paddle_period_end_at, now()+7d)`, pause queued runs immediately, let in-flight runs finish current step, keep approvals valid; tool runner pre-check rejects `RENTAL_NOT_ACTIVE` for cancelled | `app/services/rental_service.py`, `app/services/tool_invocation_service.py` | `tests/integration/test_cancellation_lifecycle.py`, `tests/security/test_cancellation_grace_bypass.py` |
| 14 | Outbox event emission for all 7 events (atomic with DB writes); includes `ai.employee.model_changed`, `ai.employee.cancelled` | `app/services/outbox.py` (reuse shared template) | `tests/integration/test_outbox_emission.py` |
| 15 | Runaway-loop sweeper Cloud Run Job | `app/workers/runaway_loop_sweeper.py`, `infra/terraform/.../scheduler.tf` | `tests/integration/test_runaway_loop_sweeper.py` |
| 16 | Expired-approval sweeper + **cancellation finaliser sweeper** (hourly): finds `status=cancelling AND now() ≥ cancellation_grace_ends_at`, flips to `cancelled`, auto-rejects all remaining pending approvals, emits `ai.employee.cancelled` with `auto_rejected_approvals_count` | `app/workers/expired_approval_sweeper.py`, `app/workers/cancellation_finaliser.py` | `tests/integration/test_expired_sweeper.py`, `tests/integration/test_cancellation_finaliser.py` |
| 17 | Frontend: marketplace empty-state ("Coming Soon" + roadmap link); rental settings (model picker + disclosure template editor); cancellation banner; internal dev-only agent under `ai_employee_dev_agent` flag for path validation | `apps/portal/app/(dashboard)/employees/**`, `apps/portal/components/employees/**`, `apps/portal/lib/api/employees.ts` | `apps/portal/e2e/employees/marketplace.spec.ts`, `rent-flow-dev-agent.spec.ts`, `model-switch.spec.ts`, `cancellation.spec.ts`, `disclosure-template.spec.ts`, `approval-inbox.spec.ts` |
| 18 | Cross-tenant lockdown + verification-loop sweep (final) + `ai_models` rate-snapshot test | n/a — adds tests only | `tests/security/test_cross_tenant_lockdown.py`, `tests/security/test_model_rate_snapshot.py`, `apps/portal/e2e/employees/cross-tenant.spec.ts` |

## Estimated Effort
Not specified per project convention (no time estimates). Each task is one focused TDD cycle.

## Definition of Done (Phase 1)
- [ ] All 18 tasks merged behind `ai_employee_platform_enabled` flag (off in prod)
- [ ] All tests green; coverage gates met (per TESTS.md)
- [ ] Migration round-trip green; `ai_models` seeded with at least 4 active models
- [ ] Spec 37 + Spec 32 amendments merged
- [ ] security-auditor agent review pass
- [ ] qa-engineer Playwright E2E green
- [ ] Internal dev-only agent (`ai_employee_dev_agent`) used by team to dogfood end-to-end (rent → model-switch → SOP → run with reserve/settle → approval → cancel → grace finaliser) at least once
- [ ] `docs/specs/40_AI_EMPLOYEE_PLATFORM/RESULT.md` filled in with launch outcomes
- [ ] Marketing/landing pages NOT updated to mention AI Employees until first child spec (41) is shipped


---

# Phase 2 — Authoring Platform TASKS (merged from Spec 47 on 2026-05-18)

**Status:** Approved 2026-05-18. Cannot start until Phase 1 is in production ≥ 14 days AND Phase 2 P2-0 cross-spec amendments are merged.

> **Plan-document note:** Phase 1 (18 tasks above) + Phase 2 (20 tasks below) = 38 tasks. Per the `writing-plans` skill (≤ 15 tasks per plan document), the implementation plan must be split into **two separate plan documents** — one per phase — when `writing-plans` runs. Do NOT attempt a single combined plan.

Each task: RED → Verify-RED → GREEN → Verify-GREEN → Commit.

## Phase 2 P2-0 — Cross-spec amendments (tracked here, owned elsewhere)

| # | Task | Owner spec | Required for |
|---|---|---|---|
| P2-0.1 | Staff IdP path + MFA + `is_internal_staff=true` claim + `users.is_staff` column | Spec 01 | Tasks P2-4, P2-17 |
| P2-0.2 | `internal_billing_accounts` table + `/credits/charge-internal` endpoint + Paddle price update on rental upgrade (no proration) + price grandfather logic | Spec 32 | Tasks P2-11, P2-14 |
| P2-0.3 | api-gateway: IP allowlist + staff-claim middleware for `/v1/admin/*`; CORS rules for `admin.revlooper.com` | Spec 04 (api-gateway) | Task P2-4 |
| P2-0.4 | Novu workflow `ai_employee_version_lifecycle` with 6 templates | notification-service | Tasks P2-13, P2-15 |
| P2-0.5 | Reserve event namespaces in Spec 21 | Spec 21 | Task P2-12 |
| P2-0.6 | `ai_employee_authoring_enabled` feature flag with per-staff-user targeting | Spec 23 | Tasks P2-16, P2-17, P2-18 |
| P2-0.7 | Cloudflare Pages project + DNS for `admin.revlooper.com` | DevOps / infra | Task P2-17 |

P2-1 is blocked until P2-0.1–P2-0.4 + P2-0.7 are merged.

## Phase 2 Tasks (20)

| # | Task | Files (create unless noted) | Tests added |
|---|---|---|---|
| P2-1 | Alembic migration: 5 new tables, 5 added columns, 2 triggers (immutable_after_publish, events_append_only), backfill existing catalog rows to v1.0.0 published + rentals.pinned_version_id + runs.agent_version_id | `alembic/versions/2026_06_15_001_ai_employee_authoring_platform.py` | `tests/migrations/test_authoring_001_roundtrip.py`, `test_authoring_001_backfill.py` |
| P2-2 | SQLAlchemy models for 5 new tables + extended Rental, Run, Catalog models | `services/ai-employee-service/app/admin/models/*.py`, extend `app/models/rental.py`, `app/models/run.py`, `app/models/catalog.py` | `tests/unit/admin/test_models_roundtrip.py` |
| P2-3 | Repositories for the 5 new tables | `app/admin/repositories/*.py` | `tests/unit/admin/repos/test_*.py` |
| P2-4 | `RBACService` + `get_staff_with_role(roles)` dependency + staff-claim middleware integration | `app/admin/services/rbac_service.py`, `app/admin/dependencies.py` | `tests/unit/admin/test_rbac.py`, `tests/security/admin/test_jwt_claim_forgery.py`, `tests/security/admin/test_ip_allowlist.py` |
| P2-5 | `AgentService` (create/list agents) + `GET/POST /v1/admin/agents` | `app/admin/services/agent_service.py`, `app/admin/api/agents.py` | `tests/unit/admin/test_agent_service.py`, `tests/integration/admin/test_create_agent_endpoint.py` |
| P2-6 | `VersionService` create/edit draft + state machine + tool_registry validation + capability check vs models | `app/admin/services/version_service.py`, `app/admin/api/versions.py` | `tests/unit/admin/test_version_service.py`, `tests/unit/admin/test_state_machine.py`, `tests/unit/admin/test_tool_registry_validation.py` |
| P2-7 | `DiffService` (system_prompt unified diff, tool list diff, caps diff, price diff) + `GET /versions/diff` | `app/admin/services/diff_service.py`, extend `app/admin/api/versions.py` | `tests/unit/admin/test_audit_diff.py`, `tests/unit/admin/test_diff_service.py` |
| P2-8 | `PublishService`: breaking-change auto-detector + patch-label anti-abuse + **two-person rule (with Q5 patch-same-person exception)** + eval freshness check + `POST .../publish` + `POST .../submit-for-review` + `POST .../reject` + `POST .../deprecate` | `app/admin/services/publish_service.py` | `tests/unit/admin/test_publish_two_person_rule.py`, `tests/unit/admin/test_breaking_change_auto_detect.py`, `tests/unit/admin/test_patch_label_anti_abuse.py`, `tests/integration/admin/test_eval_required_for_publish.py`, `tests/integration/admin/test_eval_regression_blocks_publish.py` |
| P2-9 | Published-version immutability (Postgres trigger + service-layer block) | trigger in migration (P2-1); service-layer assertion in `version_service.py` | `tests/security/admin/test_published_version_db_mutation.py`, `tests/unit/admin/test_published_version_immutable.py` |
| P2-10 | `ToolRegistry` read-only API + seed from existing `ai_employee_tools` (one-time seed in migration) | `app/admin/api/tool_registry.py`, `app/admin/services/tool_registry_service.py` | `tests/integration/admin/test_tool_registry_seed.py` |
| P2-11 | `EvalService`: schedule via Cloud Tasks → ai-service `/v1/internal/graph/run` per example → persist `agent_version_eval_runs` → charge `internal_billing_account` | `app/admin/services/eval_service.py`, `app/admin/workers/eval_runner.py`, `app/clients/internal_billing_client.py` | `tests/unit/admin/test_eval_service.py`, `tests/evals/admin/test_eval_runner_authoring.py`, `tests/evals/admin/test_baseline_lookup.py` |
| P2-12 | `AuditService` + audit event emission via outbox for all 12 event types + `GET /v1/admin/audit` | `app/admin/services/audit_service.py`, `app/admin/api/audit.py`, extend `app/services/outbox.py` | `tests/integration/admin/test_audit_completeness.py`, `tests/security/admin/test_audit_immutability.py`, `tests/security/admin/test_self_role_grant_alert.py` |
| P2-13 | `AutoUpgradeWorker` Pub/Sub subscriber: classify diff → upgrade or notify per AC-U-1/2 + Novu enqueue + **grandfather-price logic per Q4** | `app/admin/workers/auto_upgrade_worker.py` | `tests/integration/admin/test_auto_upgrade_minor.py`, `tests/integration/admin/test_auto_upgrade_blocked_breaking.py`, `tests/integration/admin/test_auto_upgrade_blocked_price.py`, `tests/integration/admin/test_grandfathered_price.py` |
| P2-14 | Rental upgrade/rollback API: `PATCH /v1/employees/rentals/{id}/version`, `POST .../rollback`, `GET .../version/diff`, `GET /agents/{id}/versions/available` + `RentalVersionService` + history table writes + run pinning + Paddle price update via billing-service | extend `app/api/v1/rentals.py`, new `app/services/rental_version_service.py`, new `app/api/v1/agents.py` | `tests/integration/admin/test_manual_upgrade.py`, `tests/integration/admin/test_rollback_within_30d.py`, `tests/integration/admin/test_rollback_after_30d.py`, `tests/integration/admin/test_run_pins_version.py` |
| P2-15 | Cloud Run Jobs: `deprecation_reminder_sweeper.py` (weekly Novu fan-out for active rentals on deprecated versions), `force_upgrade_processor.py` (daily — at deprecation_force_upgrade_at, force-upgrade to safe target OR pause) | `app/admin/workers/deprecation_reminder_sweeper.py`, `app/admin/workers/force_upgrade_processor.py`, `infra/terraform/.../scheduler.tf` | `tests/integration/admin/test_deprecation_force_upgrade.py`, `tests/integration/admin/test_deprecation_pauses_when_no_safe_target.py` |
| P2-16 | `AuditReconciliationJob` (nightly): every published version has matching eval run; every state transition has matching event row | `app/admin/workers/audit_reconciliation_job.py` | `tests/security/admin/test_eval_reconciliation.py`, `tests/integration/admin/test_reconciliation_complete.py` |
| P2-17 | **Scaffold `apps/admin/`** (NEW Next.js 14 app, per Q1): `apps/admin/wrangler.toml`, `next.config.mjs` (strict CSP), `middleware.ts` (staff-claim gate + MFA check + redirect to `/unauthorized`), `app/layout.tsx`, base shadcn/Tailwind config, supabase client configured for staff-claim, Cloudflare Pages CI workflow, smoke E2E test | `apps/admin/**` (new app skeleton) | `apps/admin/e2e/smoke.spec.ts`, `apps/admin/e2e/mfa-required.spec.ts`, `tests/security/admin/test_admin_origin_isolation.py` |
| P2-18 | Admin frontend views: `/admin/agents` list; agent detail; draft editor; version diff viewer; eval results page; tool registry read-only list; staff role assigner; audit stream | `apps/admin/app/agents/**`, `apps/admin/app/tool-registry/**`, `apps/admin/app/staff/**`, `apps/admin/app/audit/**`, `apps/admin/components/**`, `apps/admin/lib/api/admin-*.ts` | `apps/admin/e2e/agents-list.spec.ts`, `create-agent-and-publish.spec.ts`, `two-person-rule.spec.ts`, `version-diff.spec.ts`, `eval-dry-run.spec.ts`, `deprecate.spec.ts` |
| P2-19 | Frontend workspace-owner upgrade UX in `apps/portal/`: notification badge integration with Spec 31 advisor drawer; `/employees/[rentalId]/version` (pinned + available list); diff page; rollback button (visible only within 30d) | `apps/portal/app/(dashboard)/employees/[rentalId]/version/**`, `apps/portal/components/employees/UpgradePrompt.tsx`, `BreakingChangeAcknowledgement.tsx`, `apps/portal/lib/api/rental-versions.ts` | `apps/portal/e2e/employees/upgrade-prompt.spec.ts`, `breaking-change-acknowledge.spec.ts`, `rollback.spec.ts` |
| P2-20 | Rate limiting on admin routes per SECURITY §Rate Limiting + cross-tenant + verification-loop sweep (final) | reuse Spec 04 sliding-window middleware; configure limits in `app/admin/api/*.py` | `tests/security/admin/test_rate_limit_publish.py`, `tests/security/admin/test_cross_workspace_version_diff.py`, full `verification-loop` skill checklist |

## Phase 2 Estimated Effort
Not specified per project convention. Each task is one focused TDD cycle.

## Phase 2 Definition of Done
- [ ] All 20 P2 tasks merged behind `ai_employee_authoring_enabled` flag (off in prod)
- [ ] Migration round-trip + backfill green against staging Phase 1 data
- [ ] Coverage gates met (per TESTS.md §Phase 2)
- [ ] All P2-0 amendments merged
- [ ] security-auditor agent review pass
- [ ] qa-engineer Playwright E2E green for both `apps/admin/e2e/` and `apps/portal/e2e/employees/`
- [ ] At least 2 publisher + 1 reviewer staff accounts provisioned with MFA
- [ ] `admin.revlooper.com` DNS + Cloudflare Pages live with strict CSP verified
- [ ] Internal dogfood: staff publishes v1.1.0 of the existing internal dev agent end-to-end via `apps/admin/` UI (draft → eval → review → publish → auto-upgrade fan-out validated against a test rental); grandfather-price scenario validated with two test rentals (one upgrades, one stays)
- [ ] Audit reconciliation job runs clean

## Phase 2 Production-enablement Definition of Done
- [ ] Flag enabled for staff users in production
- [ ] First real authored agent version published via admin UI (likely a Spec 41 patch)
- [ ] No publish-rate-limit hits in first 30 days
- [ ] Zero two-person-rule bypass attempts
- [ ] Zero audit-immutability violations
