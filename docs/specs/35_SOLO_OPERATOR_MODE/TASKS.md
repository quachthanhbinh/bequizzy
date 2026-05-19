# 35 — Solo Operator Mode — TASKS

**Status:** 📝 Draft
**Plan generated via:** `writing-plans` skill
**Execution:** `tdd-agent` task-by-task

Each task follows TDD: RED → Verify-RED → GREEN → Verify-GREEN → Commit.

> 15 tasks total. Phase 1 = Tasks 1–10 (Autopilot + Brief). Phase 2 = Tasks 11–13 (Review UI). Phase 3 = Tasks 14–15 (Brief enhancements).

---

## Task 1 — DB migration: campaigns.execution_mode

**Files:**
- Create: `alembic/versions/2026_05_05_001_add_execution_mode_to_campaigns.py`
- Modify: `services/campaign-service/app/models/campaign.py`

**Steps:**
- [ ] Write failing test: `tests/models/test_campaign_execution_mode.py` — assert `campaigns` table has `execution_mode` column with `DEFAULT 'autopilot'` and CHECK constraint
- [ ] Verify RED
- [ ] Write Alembic migration; add `execution_mode = Column(Text, nullable=False, default='autopilot')` to SQLAlchemy model
- [ ] Verify GREEN
- [ ] Roundtrip: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head`
- [ ] Commit: `feat(campaign-service): add execution_mode column to campaigns`

**Acceptance:** Column exists; `DEFAULT 'autopilot'`; CHECK constraint rejects values outside `{autopilot, review, manual}`; all existing campaign rows have `execution_mode='autopilot'`.

---

## Task 2 — campaign-service: execution mode update service layer

**Files:**
- Modify: `services/campaign-service/app/services/campaign_service.py`
- Create: `services/campaign-service/tests/services/test_campaign_execution_mode.py`

**Steps:**
- [ ] Write failing tests:
  - `test_execution_mode_change_requires_owner_or_admin` (member role → AppError 403 `EXECUTION_MODE_FORBIDDEN`)
  - `test_execution_mode_change_blocked_on_active_campaign` (status='active' → AppError 409 `CAMPAIGN_ACTIVE_MODE_CHANGE`)
  - `test_execution_mode_change_allowed_when_paused`
  - `test_execution_mode_change_writes_audit_log`
  - `test_execution_mode_change_emits_outbox_event`
- [ ] Verify RED (all 5 fail)
- [ ] Implement: extend `update_campaign()` service function with role check, status gate, audit log write, outbox event `campaign.execution_mode_changed`
- [ ] Verify GREEN
- [ ] Commit: `feat(campaign-service): enforce role + status gate on execution mode change`

**Acceptance:** Five tests passing; existing `update_campaign` tests still pass (no regression).

---

## Task 3 — sequence-worker: execution mode cache + dispatch fork

**Files:**
- Create: `services/sequence-worker/app/executor/mode_cache.py`
- Modify: `services/sequence-worker/app/executor/step_executor.py`
- Create: `services/sequence-worker/tests/test_step_executor_fork.py`
- Create: `services/sequence-worker/tests/test_mode_cache.py`

**Steps:**
- [ ] Write failing tests:
  - `test_autopilot_mode_calls_outreach_service_dispatch`
  - `test_review_mode_inserts_approval_queue_not_dispatch`
  - `test_manual_mode_inserts_approval_queue_not_dispatch`
  - `test_mode_read_from_redis_cache_on_hit`
  - `test_mode_fetched_from_db_on_cache_miss_and_cached`
- [ ] Verify RED
- [ ] Implement `mode_cache.py` (Redis GET/SET/DELETE); extend `step_executor.py` with fork
- [ ] Verify GREEN
- [ ] Commit: `feat(sequence-worker): execution mode dispatch fork + Redis cache`

**Acceptance:** Worker dispatches via `outreach-service` in Autopilot; inserts queue row in Review/Manual. Cache populated on miss with TTL 5 min.

---

## Task 4 — sequence-worker: bounce circuit breaker

**Files:**
- Create: `services/sequence-worker/app/executor/bounce_circuit_breaker.py`
- Create: `services/sequence-worker/tests/test_circuit_breaker.py`

**Steps:**
- [ ] Write failing tests:
  - `test_bounce_counter_increments_in_redis`
  - `test_circuit_breaker_does_not_fire_below_minimum_sample_size` (< 20 sends)
  - `test_circuit_breaker_fires_when_threshold_exceeded_with_adequate_sample`
  - `test_circuit_breaker_calls_campaign_service_auto_pause`
  - `test_circuit_breaker_emits_campaign_auto_paused_event`
- [ ] Verify RED
- [ ] Implement: `check_bounce_rate(campaign_id, workspace_id)` using Redis INCR; threshold default 5% with minimum 20 sample; call `POST /internal/campaigns/{id}/auto-pause` on trigger
- [ ] Verify GREEN
- [ ] Commit: `feat(sequence-worker): bounce rate circuit breaker for autopilot`

**Acceptance:** Circuit breaker fires only with ≥ 20 sends + > threshold bounces. Auto-pause endpoint called. Redis key: `campaign:bounce_count:{campaign_id}:{hour}` TTL 2h.

---

## Task 5 — sequence-worker: cache invalidation on mode change event

**Files:**
- Create: `services/sequence-worker/app/subscribers/campaign_events.py`
- Create: `services/sequence-worker/tests/test_cache_invalidation.py`

**Steps:**
- [ ] Write failing test: `test_execution_mode_changed_event_deletes_redis_cache_key`
- [ ] Verify RED
- [ ] Implement Pub/Sub push handler for `campaign.execution_mode_changed` → `Redis.DELETE(f'campaign:exec_mode:{campaign_id}')`
- [ ] Verify GREEN
- [ ] Commit: `feat(sequence-worker): invalidate execution mode cache on mode changed event`

**Acceptance:** Cache key deleted immediately on event receipt; next step execution re-fetches from DB.

---

## Task 6 — campaign-service: internal auto-pause endpoint

**Files:**
- Modify: `services/campaign-service/app/routers/campaigns.py`
- Create: `services/campaign-service/tests/api/test_auto_pause.py`

**Steps:**
- [ ] Write failing tests:
  - `test_auto_pause_sets_campaign_status_to_paused`
  - `test_auto_pause_emits_campaign_auto_paused_outbox_event`
  - `test_auto_pause_requires_internal_oidc_auth` (no user JWT → 401)
- [ ] Verify RED
- [ ] Implement `POST /internal/campaigns/{id}/auto-pause` (OIDC only, not exposed via api-gateway)
- [ ] Verify GREEN
- [ ] Commit: `feat(campaign-service): internal auto-pause endpoint for circuit breaker`

---

## Task 7 — ai-service: brief_assembler service layer

**Files:**
- Create: `services/ai-service/app/services/brief_assembler.py`
- Create: `services/ai-service/app/services/brief_cache.py`
- Create: `services/ai-service/tests/services/test_brief_assembler.py`

**Steps:**
- [ ] Write failing tests:
  - `test_brief_assembler_calls_5_internal_services_in_parallel`
  - `test_brief_assembly_makes_zero_llm_calls`
  - `test_brief_assembler_returns_null_for_stalled_deals_when_spec30_unavailable`
  - `test_brief_cache_key_includes_workspace_id_and_user_id` (security invariant)
  - `test_brief_assembler_handles_partial_service_failure_gracefully`
- [ ] Verify RED
- [ ] Implement `assemble_brief(workspace_id, user_id)` — async parallel fan-out via httpx; structured payload; no LLM call; Redis cache set
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): daily ops brief assembler (zero LLM, structured only)`

**Acceptance:** Brief assembly < 2 seconds (5 parallel HTTP calls); Redis key format validated; LLM usage = 0.

---

## Task 8 — ai-service: daily brief API endpoints + Cloud Tasks handler

**Files:**
- Create: `services/ai-service/app/routers/daily_brief.py`
- Create: `services/ai-service/tests/api/test_daily_brief.py`

**Steps:**
- [ ] Write failing tests:
  - `test_get_daily_brief_returns_cached_brief_for_workspace`
  - `test_get_daily_brief_generates_lazily_if_no_cache`
  - `test_brief_not_served_to_different_workspace` (workspace B credentials → 404)
  - `test_internal_generate_briefs_enqueues_cloud_task_per_workspace`
  - `test_internal_generate_brief_for_workspace_sets_redis_flag`
- [ ] Verify RED
- [ ] Implement `GET /advisor/daily-brief`, `POST /internal/generate-briefs`, `POST /internal/generate-brief/{workspace_id}/{user_id}`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): daily brief endpoints + Cloud Tasks handler`

---

## Task 9 — Frontend: ExecutionModeSelector component

**Files:**
- Create: `frontend/components/solo-operator/ExecutionModeSelector.tsx`
- Create: `frontend/hooks/useExecutionMode.ts`
- Create: `frontend/components/solo-operator/__tests__/ExecutionModeSelector.test.tsx`

**Steps:**
- [ ] Write failing tests:
  - `renders all 3 modes for Pro+ user`
  - `renders only Manual for Free user (Autopilot + Review disabled with tooltip)`
  - `confirmation dialog shown when switching to Autopilot on paused campaign`
  - `submit calls PATCH /campaigns/{id} with execution_mode`
- [ ] Verify RED
- [ ] Implement: shadcn SegmentedControl (3 options); Pro gate via `useFeatureGate('campaign_execution_modes')`; confirmation dialog on Autopilot switch; `useExecutionMode` mutation hook
- [ ] Verify GREEN
- [ ] Commit: `feat(frontend): ExecutionModeSelector component with plan gating`

---

## Task 10 — Frontend: DailyOpsBriefPanel component

**Files:**
- Create: `frontend/components/solo-operator/DailyOpsBriefPanel.tsx`
- Create: `frontend/components/solo-operator/BriefCard.tsx`
- Create: `frontend/hooks/useDailyBrief.ts`
- Create: `frontend/components/solo-operator/__tests__/DailyOpsBriefPanel.test.tsx`

**Steps:**
- [ ] Write failing tests:
  - `renders 5 cards for Pro user`
  - `renders locked teaser cards for Free user`
  - `dismiss closes panel and does not re-open on same-day reload`
  - `empty state shown when no active campaigns`
  - `credit warning card shown when credits < 20%`
- [ ] Verify RED
- [ ] Implement: dashboard landing state (first load each day via `sessionStorage` flag); `useDailyBrief` TanStack Query hook; 5 cards with counts + previews + 1-click action; Free-plan blurred teaser via `useFeatureGate('daily_ops_brief')`; mobile-responsive at 375px
- [ ] Verify GREEN
- [ ] Commit: `feat(frontend): DailyOpsBriefPanel with 5 core cards + plan gating`

---

## Task 11 — DB migration: step_approval_queue (Phase 2)

**Files:**
- Create: `alembic/versions/2026_05_05_002_create_step_approval_queue.py`
- Create: `services/campaign-service/app/models/step_approval_queue.py`

**Steps:**
- [ ] Write failing test: table + indexes + unique constraint on `idempotency_key` + partial index on `status='pending'`
- [ ] Verify RED
- [ ] Implement migration + SQLAlchemy model
- [ ] Verify GREEN
- [ ] Roundtrip migration test
- [ ] Commit: `feat(campaign-service): create step_approval_queue table`

---

## Task 12 — campaign-service: approval queue service layer (Phase 2)

**Files:**
- Create: `services/campaign-service/app/services/approval_queue_service.py`
- Create: `services/campaign-service/tests/services/test_approval_queue_service.py`

**Steps:**
- [ ] Write failing tests (9 unit tests from TESTS.md approval queue section)
- [ ] Verify RED
- [ ] Implement: `queue_step()`, `approve_steps()` (batch loop of 500 with Redis counter check), `reject_step()`, `expire_stale_rows()`
- [ ] Verify GREEN
- [ ] Commit: `feat(campaign-service): approval queue service (batch approve, reject, expiry)`

**Acceptance:** Bulk approve never issues single UPDATE on > 500 rows. Cross-workspace injection returns 0 affected rows. Idempotency key prevents duplicate queuing.

---

## Task 13 — Frontend: ApprovalQueueTable (Phase 2)

**Files:**
- Create: `frontend/components/solo-operator/ApprovalQueueTable.tsx`
- Create: `frontend/hooks/useApprovalQueue.ts`
- Create: `frontend/components/solo-operator/__tests__/ApprovalQueueTable.test.tsx`

**Steps:**
- [ ] Write failing tests:
  - `renders pending rows with preview subject + body snippet`
  - `"content changed" badge shown when content_changed=true`
  - `bulk select + approve calls PATCH approve with step_ids`
  - `progress indicator visible during large batch`
- [ ] Verify RED
- [ ] Implement: paginated table (page_size=50); `content_changed` badge; bulk select with progress bar; `useApprovalQueue` hook
- [ ] Verify GREEN
- [ ] Commit: `feat(frontend): ApprovalQueueTable with bulk approve + content-changed flag`

---

## Task 14 — Brief: pipeline velocity + stalled deals cards (Phase 3, gated on Spec 30)

**Files:**
- Modify: `services/ai-service/app/services/brief_assembler.py`

**Steps:**
- [ ] Write failing tests: `test_pipeline_velocity_card_populated_when_spec30_data_available` and `test_stalled_deals_card_populated_for_business_plus`
- [ ] Verify RED
- [ ] Add `crm-service GET /internal/deals/stalled` and `pipeline_snapshots` calls to `assemble_brief()` — guarded by `if settings.SPEC30_ENABLED`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): brief pipeline velocity + stalled deals cards (Spec 30 gated)`

---

## Task 15 — E2E integration tests: autopilot suppression invariant + cross-workspace brief isolation

**Files:**
- Create: `tests/integration/test_autopilot_suppression_invariant.py`
- Create: `tests/integration/test_daily_brief_workspace_isolation.py`

**Steps:**
- [ ] Write integration tests covering:
  - Autopilot dispatches → suppressed lead silently skipped, no message row created
  - Lead suppressed while in Review queue → approved → not sent
  - Brief workspace A not retrievable with workspace B JWT
- [ ] Verify RED (tests fail against a real local stack: `docker-compose up -d`)
- [ ] Confirm no code changes needed (these are invariant tests, not new features)
- [ ] Verify GREEN
- [ ] Commit: `test: autopilot suppression invariant + brief cross-workspace isolation`

**Acceptance:** These are the two highest-stakes security invariants for this spec — they must pass in CI before any GA rollout.
