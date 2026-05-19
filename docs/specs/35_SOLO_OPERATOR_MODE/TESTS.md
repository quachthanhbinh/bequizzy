# 35 — Solo Operator Mode — TESTS

**Status:** 📝 Draft
**Last updated:** 2026-05-05

## Coverage Gates

- `campaign-service`: ≥ 85% on `execution_mode` service layer + `step_approval_queue` routes
- `sequence-worker`: ≥ 85% on dispatch fork logic + circuit breaker + cache invalidation handler
- `ai-service`: ≥ 80% on `brief_assembler.py`
- Frontend: ≥ 80% on `ExecutionModeSelector` + `DailyOpsBriefPanel` + `ApprovalQueueTable`

---

## Unit Tests

### campaign-service — execution mode

- [ ] `test_execution_mode_defaults_to_autopilot_on_campaign_create`
- [ ] `test_execution_mode_change_requires_owner_or_admin_role` (member role → AppError 403)
- [ ] `test_execution_mode_change_blocked_when_campaign_active` (status='active' → AppError 409)
- [ ] `test_execution_mode_change_allowed_when_campaign_paused`
- [ ] `test_execution_mode_change_writes_to_audit_log`
- [ ] `test_execution_mode_change_emits_outbox_event_execution_mode_changed`

### campaign-service — step_approval_queue

- [ ] `test_approval_queue_idempotency_key_prevents_duplicate_queue_row` (same campaign_lead_id + step_position → unique constraint violation)
- [ ] `test_approval_queue_insert_snapshots_preview_at_queue_time`
- [ ] `test_approval_queue_sets_content_changed_flag_when_step_edited_after_queue`
- [ ] `test_bulk_approve_atomic_dispatching_status_prevents_double_dispatch` (concurrent approvals → only one succeeds)
- [ ] `test_bulk_approve_chunks_in_batches_of_500`
- [ ] `test_bulk_approve_stops_when_daily_send_limit_reached`
- [ ] `test_bulk_approve_cross_workspace_step_ids_ignored` (0 rows affected, no error)
- [ ] `test_reject_step_skips_to_next_sequence_step`
- [ ] `test_expiry_job_sets_expired_status_and_resets_next_step_at`

### sequence-worker — dispatch fork

- [ ] `test_autopilot_mode_dispatches_via_outreach_service`
- [ ] `test_review_mode_inserts_approval_queue_row_not_dispatch`
- [ ] `test_manual_mode_inserts_approval_queue_row_not_dispatch`
- [ ] `test_execution_mode_read_from_redis_cache_on_cache_hit`
- [ ] `test_execution_mode_fetched_from_db_on_cache_miss_then_cached`
- [ ] `test_execution_mode_cache_invalidated_on_mode_changed_pubsub_event`

### sequence-worker — bounce circuit breaker

- [ ] `test_bounce_circuit_breaker_increments_redis_counter_per_campaign_per_hour`
- [ ] `test_bounce_circuit_breaker_fires_when_threshold_exceeded_with_minimum_sample` (requires ≥ 20 sends)
- [ ] `test_bounce_circuit_breaker_does_not_fire_below_minimum_sample_size` (1 bounce in 5 sends = 20% but < 20 sample → no pause)
- [ ] `test_bounce_circuit_breaker_calls_campaign_service_auto_pause`
- [ ] `test_bounce_circuit_breaker_emits_campaign_auto_paused_event`

### ai-service — brief_assembler

- [ ] `test_brief_assembler_calls_all_5_internal_services_in_parallel`
- [ ] `test_brief_assembler_returns_null_for_stalled_deals_when_crm_unavailable`
- [ ] `test_brief_assembler_sets_redis_cache_key_with_workspace_id_and_user_id`
- [ ] `test_brief_cache_key_format_includes_workspace_id` (security invariant)
- [ ] `test_brief_assembly_makes_zero_llm_calls` (structured data, no GPT cost)
- [ ] `test_brief_assembler_handles_partial_service_failure_gracefully` (one service 500 → section null, not 500 from brief endpoint)

---

## Integration Tests

### autopilot suppression invariant

- [ ] Autopilot dispatches step → `outreach-service` checks `suppression_list` → suppressed lead NOT sent
- [ ] Lead added to suppression list WHILE in Review queue → approval dispatch → NOT sent (suppression checked at dispatch, not queue time)
- [ ] Suppressed lead in Autopilot → `outreach-service` returns `{ dispatched: false, reason: 'suppressed' }` → no credit deducted

### execution mode lifecycle

- [ ] Campaign created → `execution_mode = 'autopilot'` in DB
- [ ] Member role `PATCH execution_mode` → 403 (enforced at API layer, not just frontend)
- [ ] Owner pauses campaign → changes to 'review' → resumes → sequence-worker next execution sees 'review' mode (cache invalidated via event)
- [ ] Owner tries to change mode on `active` campaign → 409

### review mode end-to-end

- [ ] Step scheduled → `execution_mode = 'review'` → step_approval_queue row created, `status='pending'`
- [ ] In-app notification fires: "steps ready for review"
- [ ] `POST /approve` with 1 step_id → Cloud Task enqueued → `outreach-service` dispatches → `status='dispatched'`
- [ ] `POST /approve` twice for same step_id → second returns 409 (atomic dispatching gate)
- [ ] Bulk approve 600 rows → two batches of 500 and 100; progress correct; Redis counter respected

### bounce circuit breaker end-to-end

- [ ] Autopilot campaign: inject 25 sends + 2 bounces in 1 hour → circuit breaker fires → `campaign.status = 'paused'` + `campaign.auto_paused` event emitted
- [ ] circuit breaker does NOT fire with 1 bounce in 10 sends (< 20 sample minimum)
- [ ] Auto-paused campaign → Brief Card 4 shows campaign name + "resume" action

### daily ops brief

- [ ] Cloud Scheduler triggers brief generation → brief stored in `advisor_notifications` → Redis cache key set with workspace_id + user_id
- [ ] `GET /advisor/daily-brief` for workspace A returns workspace A's data only
- [ ] `GET /advisor/daily-brief` for workspace B returns workspace B's data (not A's) — cross-workspace isolation
- [ ] Brief returned from cache on second request (no re-computation)
- [ ] Brief event-invalidated when `campaign.auto_paused` fires → Card 4 updated within 30 seconds
- [ ] Brief generated lazily on first request if Cloud Scheduler hasn't fired yet

---

## E2E Tests

### Execution mode selector (frontend)

- [ ] Campaign wizard: Launch step shows 3-option execution mode selector (Autopilot / Review / Manual)
- [ ] Free plan user: Autopilot and Review options are disabled with "Pro required" tooltip
- [ ] Switching active campaign to Autopilot → confirmation dialog shown → campaign must be paused first → modal with "Pause and Switch" CTA
- [ ] Mode badge visible on Campaign List page
- [ ] Member role: execution mode selector is read-only in Campaign Settings

### Daily Ops Brief panel (frontend)

- [ ] First dashboard load of the day → Brief panel opens automatically
- [ ] Brief shows correct counts for: replies, hot leads, steps due, credits warning
- [ ] "Open Inbox" action navigates to Inbox with overnight filter
- [ ] "Approve batch" button on Card 3 (Review mode only) opens approval queue with pre-selected rows
- [ ] Free plan: Cards 1–3 shown with blurred content + "Upgrade to Pro" CTA
- [ ] "Dismiss" closes Brief; refreshing page does NOT re-open Brief until next day
- [ ] Empty state (no active campaigns): shows "Launch your first campaign" CTA

### Approval queue UI (frontend, Phase 2)

- [ ] Approval queue accessible from Campaign Detail → "Review Queue" tab
- [ ] Preview shows: lead email, subject, body snippet, scheduled time, expiry countdown
- [ ] "content changed" badge shown when step was edited after queue
- [ ] Bulk "Approve All" shows progress bar ("Approving 450 of 1,200…")
- [ ] Rejected step → next step in sequence for that lead is scheduled

---

## Security Tests (Critical Invariants)

- [ ] `test_autopilot_does_not_bypass_suppression` — suppressed lead's Autopilot step is skipped, no message row created
- [ ] `test_approval_queue_workspace_isolation` — step_ids from workspace B submitted in workspace A request → 0 rows approved, no data leakage in response
- [ ] `test_brief_cache_key_isolation` — workspace A brief cannot be retrieved with workspace B credentials
- [ ] `test_member_cannot_change_execution_mode` — 403 from service layer
- [ ] `test_daily_send_limit_enforced_in_autopilot` — Redis counter at plan limit → no further dispatches regardless of mode
- [ ] `test_daily_send_limit_enforced_in_bulk_approve` — bulk approve stops at daily limit
