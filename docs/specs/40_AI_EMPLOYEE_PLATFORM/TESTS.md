# 40 — AI Employee Platform — TESTS

**Status:** ✅ Approved (2026-05-18)

## v1 Scope Note

This test plan covers the **platform foundation only**. No vertical agent quality tests live here — each child spec (41–46) owns its own EDD golden dataset.

## Coverage Targets

| File / module | Coverage floor |
|---|---|
| `services/ai-employee-service/app/services/*.py` | ≥ 90% line + branch |
| `services/ai-employee-service/app/api/v1/*.py` | ≥ 85% |
| `services/ai-employee-service/app/repositories/*.py` | ≥ 80% |
| `services/billing-service` paddle_line_items extension | ≥ 90% |
| Frontend `apps/portal/app/(dashboard)/employees/**` | ≥ 70% |

All under per-service Codecov gate.

## Test Pyramid

### Unit tests (pytest, in-process; SQLAlchemy `AsyncSession` against testcontainers Postgres)

| File | Tests |
|---|---|
| `tests/unit/services/test_rental_service.py` | rent success, rent without payment method → 402, rent on free plan → 402 with upgrade payload, duplicate active rental rejected, model_id not in catalog allowed_model_ids → 422 MODEL_NOT_ALLOWED, model missing required capability → 422, rent of publish_public agent with blank disclosure → 422 DISCLOSURE_TEMPLATE_REQUIRED, cancel sets status=cancelling + cancellation_grace_ends_at=min(period_end, +7d), `PATCH /model` swaps model_id and recomputes per_run_credit_ceiling |
| `tests/unit/services/test_workspace_settings_service.py` | default template rendered with `{workspace_name}`, `{agent_name}`; reject empty PUT; reject > 280 chars; unknown variables left literal |
| `tests/unit/services/test_billing_split.py` | reservation amount formula correct; settlement deduct delta when actual > reserved; release delta when actual < reserved; full release on pre-side-effect failure; reservation reads model rate snapshot (not live) |
| `tests/unit/services/test_sop_service.py` | create within 20KB ok, > 20KB rejected, edit produces new version row (prev not mutated), is_global toggles |
| `tests/unit/services/test_approval_service.py` | create from tool callback, approve idempotent on idempotency_key, approve expired returns 410, reject persists reason, expired sweeper transitions |
| `tests/unit/services/test_spend_cap_service.py` | cap not exceeded → ok, cap would exceed → SPEND_CAP_EXCEEDED, per-run ceiling exceeded → PER_RUN_CEILING_EXCEEDED, dry-run never reserves spend |
| `tests/unit/services/test_run_service.py` | dispatch enqueues Cloud Task, dispatch on paused rental → RENTAL_NOT_ACTIVE, completion writes feedback row, refund triggered on pre-side-effect failure |
| `tests/unit/services/test_runaway_loop.py` | < 50 runs/h → no pause, 51st run/h → auto-paused, 3 consecutive failures → auto-paused |
| `tests/unit/sop_injection_safety.py` | SOPs with `</sop>` literal are escaped; resulting prompt cannot break out of `<sop>` tag |
| `tests/unit/api/test_catalog_api.py` | list paginated, unpublished entries excluded, system admin sees all |
| `tests/unit/api/test_rentals_api.py` | full CRUD, RLS enforced at API layer (X-Workspace-ID mismatch → 404) |
| `tests/unit/api/test_approvals_api.py` | approve, reject, double-approve idempotent, cross-workspace approve → 404 |

### Integration tests (real Supabase via testcontainers, real Redis, mocked Paddle/Google Ads/Meta Ads/integration-service)

| File | Tests |
|---|---|
| `tests/integration/test_rent_to_run_flow.py` | Full happy path: rent (with model_id) → SOP → run dispatched → graph completes → credits reserved → credits settled (delta reconciled) → outbox event written with model_id + token counts + credits_settled |
| `tests/integration/test_cancellation_lifecycle.py` | Cancel during active runs → status=cancelling immediately, queued runs paused, in-flight runs allowed to finish current step, pending approvals valid for 7 days; approving during grace executes one-time then rental fully terminates; hourly finaliser flips to cancelled and auto-rejects remaining pending approvals; `ai.employee.cancelled` event emitted with auto_rejected_approvals_count |
| `tests/integration/test_model_switch.py` | `PATCH /rentals/{id}/model` updates rental.model_id; in-flight run uses old snapshot; next dispatched run uses new model; rejects switch to model lacking required capabilities; ai.employee.model_changed event emitted |
| `tests/integration/test_publish_public_approval_lockin.py` | publish_public tool invoked during dry-run → approval required (regardless of cost); same tool invoked on day-15 rental → approval required; same tool invoked on day-31 rental with cost below threshold → auto-executes (no approval) |
| `tests/integration/test_disclosure_rendering.py` | Tool invocation renders ai_disclosure_template with `{workspace_name}` and `{agent_name}` substituted; appended to request payload sent to integration-service |
| `tests/integration/test_approval_flow.py` | High-risk action triggers approval → run pauses → approve → tool executes → run completes |
| `tests/integration/test_spend_cap_race.py` | 20 concurrent run dispatches against $10 cap, only the runs that fit succeed, exactly N tool invocations marked `success`, rest `skipped_cap` |
| `tests/integration/test_dry_run_mode.py` | Dry-run rental triggers run; integration-service is asserted NEVER called; output contains "what-would-have-happened" report |
| `tests/integration/test_expired_approval_fail_closed.py` | Approval artificially aged past `expires_at`; sweeper marks expired; approve attempt → 410 |
| `tests/integration/test_paddle_line_item.py` | Rent creates prepaid Paddle line item via stub; charge happens upfront; cancel sets cancel_at_period_end=true (NO prorated refund); paddle_period_end_at populated from webhook |
| `tests/integration/test_outbox_emission.py` | Each of 6 events written atomically with DB row; idempotent on `event_id` |
| `tests/integration/test_cross_tenant.py` | Workspace A creates rental + SOP + approval; Workspace B receives 404 on each |
| `tests/integration/test_runaway_loop_sweeper.py` | Simulate 51 runs in an hour; sweeper Cloud Run Job pauses rental; emits event |
| `tests/integration/test_consent_required.py` | Tool with `side_effect_class='publish_public'` invoked without `consent_log` row → fails |

### Adversarial tests (security)

| File | Tests |
|---|---|
| `tests/security/test_sop_prompt_injection.py` | Run a corpus of 50 adversarial SOP bodies through the prompt assembler; assert no `<sop>` tag breakout in resulting prompt |
| `tests/security/test_cross_tenant_lockdown.py` | For every endpoint, attempt with mismatched workspace JWT → expect 404 (not 403) |
| `tests/security/test_approval_replay.py` | Replay approve with same idempotency_key but reject verb → 409 ALREADY_DECIDED |
| `tests/security/test_oauth_scope_strip.py` | Tool declares scope X; integration-service called with only scope X even if workspace has X+Y |
| `tests/security/test_public_post_disclosure.py` | Posted content always contains rendered disclosure (default OR custom); rent of publish_public agent with empty template → 422 |
| `tests/security/test_model_rate_snapshot.py` | Change ai_models.input_rate_per_1k after reservation; settlement still uses snapshot rate from reservation record |
| `tests/security/test_cancellation_grace_bypass.py` | Concurrent approve + cancellation-finaliser race — tool runs AT MOST once; second attempt 410 |

### End-to-end tests (Playwright, qa-engineer agent)

| File | Tests |
|---|---|
| `apps/portal/e2e/employees/marketplace.spec.ts` | Browse marketplace; **in v1 the catalog is empty** → assert "coming soon" empty-state renders with link to docs; assert filter chips still work on the empty state |
| `apps/portal/e2e/employees/rent-flow-dev-agent.spec.ts` | Using the internal dev-only catalog entry (gated by `ai_employee_dev_agent` flag), rent agent with model picker (default GPT-4o-mini), redirect to Paddle (mocked), return success, see in "My Employees" |
| `apps/portal/e2e/employees/model-switch.spec.ts` | Open rental settings → switch model from GPT-4o-mini to Claude Sonnet → see updated per_run_credit_ceiling → trigger run → run history shows new model_id |
| `apps/portal/e2e/employees/cancellation.spec.ts` | Cancel rental → banner shows "cancelling, grace period ends «»" → attempt to trigger new run → blocked with RENTAL_NOT_ACTIVE → approve a pending approval during grace → succeeds once |
| `apps/portal/e2e/employees/disclosure-template.spec.ts` | Open workspace settings → edit disclosure template → save → reload → persists; attempt to save empty → validation error |
| `apps/portal/e2e/employees/sop-author.spec.ts` | Create SOP, edit produces version 2, byte-counter respects 20KB |
| `apps/portal/e2e/employees/approval-inbox.spec.ts` | Trigger run (mocked dev agent surfaces approval) → approval shows in advisor drawer → approve → run completes → audit timeline updated |
| `apps/portal/e2e/employees/spend-cap-ui.spec.ts` | Set caps, trigger run that exceeds → see SPEND_CAP_EXCEEDED toast + rental status `auto_paused` |
| `apps/portal/e2e/employees/cross-tenant.spec.ts` | Workspace A creates rental; Workspace B sees empty marketplace state, cannot deep-link to A's rentalId |

### Eval infrastructure tests (EDD platform)

This umbrella spec only tests **the eval infrastructure**, not specific agent quality (that lives in child specs 41–46).

| File | Tests |
|---|---|
| `tests/evals/test_eval_runner.py` | Nightly Cloud Run Job loads a fake golden dataset, runs it through a stub graph, computes pass-rate, writes report row |
| `tests/evals/test_regression_pause.py` | Synthetic regression: rating drops > 15% vs baseline → rental auto-paused via `ai.employee.auto_paused` event |

## Test Data

- `tests/fixtures/catalog_seed.json` — 3 fake catalog entries (low/medium/high blast-radius)
- `tests/fixtures/adversarial_sops.json` — 50 SOP prompt-injection attempts
- `tests/fixtures/golden_eval_sample.json` — minimal dataset for eval infrastructure tests
- No real LLM calls in unit/integration; LiteLLM router stubbed via `ai-service` REST mock

## CI Gate

- `pytest -x --cov=app --cov-fail-under=90` (unit + integration)
- `pytest tests/security -x` (adversarial)
- `playwright test apps/portal/e2e/employees/` (E2E, run on PR + nightly)
- `mypy app/` clean
- `ruff check app/` clean
- migration round-trip test: alembic upgrade head + downgrade -1 + upgrade head succeeds against empty DB

## What is OUT of scope for this spec's tests
- Per-catalog-agent quality (golden datasets per agent live in child specs 41–46)
- Real Google Ads / Meta Ads API integration tests (live in integration-service / Spec 15 child specs)
- Long-running multi-day soak tests (post-launch validation, not pre-merge)


---

# Phase 2 — Authoring Platform TESTS (merged from Spec 47 on 2026-05-18)

## Phase 2 Coverage Targets

| File / module | Floor |
|---|---|
| `services/ai-employee-service/app/admin/services/*.py` | ≥ 90% line + branch |
| `services/ai-employee-service/app/admin/api/*.py` | ≥ 85% |
| Frontend `apps/admin/app/**` | ≥ 70% |
| Spec 32 `internal_billing_accounts` extension | ≥ 90% |

## Phase 2 Test Pyramid

### Unit tests

| File | Tests |
|---|---|
| `tests/unit/admin/test_version_service.py` | Create draft from latest published; reject malformed version_label; reject version_label not strictly greater; reject draft referencing unpublished tool (TOOL_NOT_AVAILABLE); allowed_model_ids subset of active ai_models; capability check vs tools |
| `tests/unit/admin/test_publish_two_person_rule.py` | Two-person rule blocks publish when author == publisher for minor/major; allows for patch with self_published_reason; rejects patch same-person without reason; reviewer with different user_id may publish |
| `tests/unit/admin/test_breaking_change_auto_detect.py` | Removed tool → forces is_breaking_change=true; narrowed allowed_model_ids → forces breaking; raised min_plan → forces breaking; raised monthly_rental_price → forces breaking; system_prompt char-diff > 5% on patch label → rejects label |
| `tests/unit/admin/test_patch_label_anti_abuse.py` | Author labels `1.0.1` after replacing system_prompt entirely → publish rejected `INVALID_PATCH_LABEL` |
| `tests/unit/admin/test_rbac.py` | author cannot publish (403 INSUFFICIENT_ROLE missing=reviewer); reviewer cannot assign roles; publisher can do all; failed checks return 403 with no existence info |
| `tests/unit/admin/test_eval_service.py` | Eval dry-run schedules Cloud Task; charges internal_billing_account; persists results; computes pass_rate; surfaces baseline from previous published version |
| `tests/unit/admin/test_audit_diff.py` | Diff JSON captures every modified field; system_prompt diff uses unified-diff format; SOP additions/removals captured |
| `tests/unit/admin/test_published_version_immutable.py` | PATCH on published returns 409 VERSION_IMMUTABLE; DELETE on published returns 409; Postgres trigger raises on direct UPDATE |
| `tests/unit/admin/test_state_machine.py` | All allowed transitions succeed; every disallowed transition returns 409 INVALID_TRANSITION |
| `tests/unit/admin/test_tool_registry_validation.py` | Draft referencing archived tool fails; draft referencing tool not in registry fails 404 |

### Integration tests

| File | Tests |
|---|---|
| `tests/integration/admin/test_full_authoring_flow.py` | Author creates agent → creates draft v1.0.0 → runs eval → submits for review → reviewer publishes → catalog.current_published_version_id updated → outbox event emitted |
| `tests/integration/admin/test_auto_upgrade_minor.py` | Rental on v1.0.0 with policy=minor_and_patch (default per Q2); v1.1.0 publishes (non-breaking, no price change) → rental auto-upgrades; pinned_version_id updated; events emitted; in-flight run keeps old version snapshot |
| `tests/integration/admin/test_auto_upgrade_blocked_breaking.py` | Rental on v1.0.0, policy=all; v2.0.0 publishes with is_breaking_change=true → NO auto-upgrade; Novu notification enqueued |
| `tests/integration/admin/test_auto_upgrade_blocked_price.py` | New version monthly_rental_price increased → auto-upgrade suppressed regardless of policy; Novu notification with 14d pre-notice; non-upgrading rental retains grandfathered Paddle price (per Q4) |
| `tests/integration/admin/test_grandfathered_price.py` | Rental A on v1 at $10; v2 publishes at $15; rental B rents at v2 ($15); rental A does NOT auto-upgrade; assert rental A's next Paddle invoice still $10, rental B's $15 |
| `tests/integration/admin/test_manual_upgrade.py` | Owner POSTs PATCH /rentals/{id}/version with target → upgrade happens; breaking-change target requires acknowledgement; Paddle price updated next cycle |
| `tests/integration/admin/test_rollback_within_30d.py` | Upgrade T0 → run at T+5d uses new version → rollback at T+10d succeeds → next run uses old version; Paddle price reverts; in-flight run at rollback time keeps its snapshotted version |
| `tests/integration/admin/test_rollback_after_30d.py` | Rollback at T+31d returns 410 ROLLBACK_WINDOW_EXPIRED |
| `tests/integration/admin/test_run_pins_version.py` | Rental on v1; run dispatched; v1.1 publishes mid-run; run completes on v1 (graph trace shows snapshotted prompt) |
| `tests/integration/admin/test_deprecation_force_upgrade.py` | v1 deprecated T0; v1.1 published; rental on v1 still active; T+90d sweeper force-upgrades to v1.1 |
| `tests/integration/admin/test_deprecation_pauses_when_no_safe_target.py` | v1 deprecated; v2 (breaking) is only newer; T+90d sweeper pauses rental with pause_reason='version_lifecycle_expired'; Novu notification |
| `tests/integration/admin/test_eval_required_for_publish.py` | Publish without successful eval in last 24h → 422 EVAL_RUN_REQUIRED |
| `tests/integration/admin/test_eval_regression_blocks_publish.py` | New version pass_rate < baseline − 15% → publish 422 EVAL_REGRESSION unless override reason supplied |
| `tests/integration/admin/test_audit_completeness.py` | After full authoring flow, every state transition has a matching events row; reconciliation job returns 0 mismatches |
| `tests/integration/admin/test_migration_backfill.py` | Run migration against a DB pre-seeded with Phase 1 catalog rows + rentals + runs; assert: catalog rows now have current_published_version_id; agent_versions has 1.0.0 published rows; rentals.pinned_version_id populated; runs.agent_version_id populated |

### Adversarial tests

| File | Tests |
|---|---|
| `tests/security/admin/test_jwt_claim_forgery.py` | Forged `is_internal_staff=true` JWT (different signing key) → 401; valid signature with claim but no internal_staff_roles row → 403 |
| `tests/security/admin/test_ip_allowlist.py` | Valid staff JWT from non-VPN source IP → 403 |
| `tests/security/admin/test_self_role_grant_alert.py` | Publisher grants role to themselves → succeeds + emits `staff_role.assigned` with `granted_by_user_id == user_id` → alert fires |
| `tests/security/admin/test_two_person_bypass.py` | Author tries to publish own minor version → 403 TWO_PERSON_RULE_VIOLATION |
| `tests/security/admin/test_audit_immutability.py` | Direct SQL UPDATE/DELETE on events row → raises Postgres exception |
| `tests/security/admin/test_published_version_db_mutation.py` | Direct SQL UPDATE on published agent_versions → trigger raises |
| `tests/security/admin/test_cross_workspace_version_diff.py` | Workspace A queries Workspace B's rental version diff → 404 |
| `tests/security/admin/test_eval_reconciliation.py` | Synthesize publish without eval; nightly reconciliation job flags mismatch + alerts |
| `tests/security/admin/test_rate_limit_publish.py` | 11 publish actions by same staff in 24h → 11th returns 429 |
| `tests/security/admin/test_admin_origin_isolation.py` | Portal session cookie (no `is_internal_staff=true` claim) cannot be replayed against admin origin → 401; admin app response headers assert `frame-ancestors 'none'`, `X-Frame-Options: DENY`, strict CSP |

### E2E tests (Playwright, qa-engineer agent)

| File | Tests |
|---|---|
| `apps/admin/e2e/agents-list.spec.ts` | Staff user with `author` role views /admin/agents; non-staff user on admin origin redirected to /unauthorized |
| `apps/admin/e2e/create-agent-and-publish.spec.ts` | Staff A creates draft → eval runs (mocked succeed) → submits for review → Staff B (publisher) approves & publishes → catalog shows new published version |
| `apps/admin/e2e/two-person-rule.spec.ts` | Same staff tries to publish own draft → blocked with toast "Two-person rule required" |
| `apps/admin/e2e/version-diff.spec.ts` | Staff opens diff page → sees unified diff of system prompt, tool list, caps, price |
| `apps/admin/e2e/eval-dry-run.spec.ts` | Staff triggers eval → progress bar updates → results page shows per-example pass/fail + comparison vs baseline |
| `apps/admin/e2e/deprecate.spec.ts` | Publisher deprecates v1 → confirms 90d timeline → success toast |
| `apps/admin/e2e/mfa-required.spec.ts` | Staff login without MFA verification → blocked at admin gate |
| `apps/portal/e2e/employees/upgrade-prompt.spec.ts` | Workspace owner receives in-app notification about v2 available → clicks "view changes" → diff view → clicks upgrade → success |
| `apps/portal/e2e/employees/breaking-change-acknowledge.spec.ts` | Upgrade to breaking-change version requires checkbox + summary acknowledgement before submit enabled |
| `apps/portal/e2e/employees/rollback.spec.ts` | Owner upgrades → 5 days later rollback button visible → rollback succeeds; 31 days later rollback button disabled |

### EDD tests (eval infrastructure for authoring)

| File | Tests |
|---|---|
| `tests/evals/admin/test_eval_runner_authoring.py` | Eval dry-run loads fixture dataset, runs via ai-service stub, computes pass_rate, persists to agent_version_eval_runs |
| `tests/evals/admin/test_baseline_lookup.py` | Baseline pass_rate sourced from previous published version's last successful eval |

## Phase 2 Test Data

- `tests/fixtures/admin/agents_seed.json` — 3 fake agent definitions (single-version, multi-version, deprecated)
- `tests/fixtures/admin/eval_dataset_sample.json` — 10-example dataset for eval infra tests
- `tests/fixtures/admin/staff_users.json` — 3 staff (author-only, reviewer, publisher)
- `tests/fixtures/admin/breaking_change_diffs.json` — corpus of 20 diffs labelled with expected `is_breaking_change` for auto-detector tests

## Phase 2 CI Gate

- `pytest -x --cov=app/admin --cov-fail-under=90` (unit + integration)
- `pytest tests/security/admin -x` (adversarial)
- `playwright test apps/admin/e2e/` (E2E, PR + nightly) — runs against deployed `admin.revlooper.com` preview
- `playwright test apps/portal/e2e/employees/` (Phase 1 + Phase 2 workspace-owner upgrade flows)
- `mypy app/admin/` clean
- `ruff check app/admin/` clean
- `apps/admin && pnpm typecheck && pnpm lint` clean
- Migration round-trip: alembic upgrade + downgrade + upgrade with Phase 1 pre-seeded data, assert backfill correctness

## Phase 2 — Out of scope for tests
- Per-agent quality (per-agent golden datasets in child specs 41–46)
- Workspace-owner-authored-agent flows (deferred — Q3)
- White-label / agency-tier flows (deferred)
- Real Novu delivery (stubbed)
- Multi-region admin app deploy (single-region in v1)
