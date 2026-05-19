# 35 — Solo Operator Mode — SECURITY

**Status:** 📝 Draft
**Last updated:** 2026-05-05
**Security flag:** 🟡 MEDIUM

## Threat Model Summary

| # | Threat | OWASP Category | Severity | Mitigated |
|---|---|---|---|---|
| T-01 | Suppression bypass via Autopilot path | A01 Broken Access Control | 🔴 HIGH | ✅ (outreach-service invariant) |
| T-02 | Execution mode change on live campaign by member role | A01 Broken Access Control | 🟠 MEDIUM | ✅ (RBAC + active-campaign gate) |
| T-03 | Double-dispatch via concurrent approval requests | A08 Software/Data Integrity | 🟠 MEDIUM | ✅ (atomic dispatching UPDATE) |
| T-04 | Cross-workspace approval queue injection | A01 Broken Access Control | 🔴 HIGH | ✅ (workspace_id in WHERE clause) |
| T-05 | Daily Ops Brief serving another workspace's data | A01 Broken Access Control | 🔴 HIGH | ✅ (workspace_id in Redis cache key) |
| T-06 | Runaway Autopilot sends (loop bug, duplicate Cloud Tasks) | A08 Software/Data Integrity | 🟠 MEDIUM | ✅ (Redis counter + idempotency key + circuit breaker) |
| T-07 | Execution mode cache stale after rapid change | A08 Software/Data Integrity | 🟡 LOW | ✅ (5-min TTL + cache invalidation event) |
| T-08 | Copilot expiry leaves leads stuck permanently | A05 Security Misconfiguration | 🟡 LOW | ✅ (expires_at enforced by scheduler job) |

---

## T-01 — Suppression Bypass in Autopilot Path

**Threat:** Autopilot removes the human gate. A developer might add a "fast path" shortcut that skips `outreach-service` and calls the email provider directly, bypassing the suppression check.

**Exploit scenario:** Sequence-worker, under time pressure, is patched to directly call SendGrid/Resend instead of `outreach-service /internal/dispatch`. Suppressed leads receive emails. GDPR/PDPA violation in VN/TH/SG.

**Non-negotiable invariant:**
> ALL sends — in every execution mode (Autopilot, Review, Manual) — MUST route through `outreach-service /internal/dispatch`. The sequence-worker and the approval dispatch path never call email SDKs directly.

**Mitigations:**
1. `outreach-service /internal/dispatch` is the sole code location that reads `suppression_list` and calls the email provider. No other service has credentials to email providers.
2. Architecture documented in DESIGN.md as an explicit invariant — code review rejects any PR that adds LLM or email SDK imports to `sequence-worker`.
3. **Test:** `test_autopilot_dispatch_checks_suppression_in_outreach_service` — integration test verifying that a suppressed lead's step is silently skipped even in Autopilot mode, and `outreach-service /internal/dispatch` returns 200 with `{ dispatched: false, reason: 'suppressed' }`.
4. **Test:** `test_approval_dispatch_checks_suppression_at_dispatch_time_not_queue_time` — a lead is queued in Review mode, then added to suppression list, then the queued step is approved → must not send.

---

## T-02 — Execution Mode Change by Insufficient Role

**Threat:** A workspace `member` user changes a campaign from Manual to Autopilot, causing thousands of sends to fire without the owner's knowledge.

**Exploit scenario:** An account with a shared workspace (Pro plan, 2 users) — the owner has a careful review workflow. A junior member switches their campaign to Autopilot during a test. Leads receive unsolicited emails before the owner notices.

**Mitigations:**
1. `require_role(['owner', 'admin'])` enforced as a FastAPI dependency at the service layer — not just the frontend. A 403 is returned for `member` or `viewer` roles.
2. Campaign must have `status = 'paused'` or `'draft'` to change `execution_mode`. `ACTIVE` campaigns are locked. Returns 409 `CAMPAIGN_ACTIVE_MODE_CHANGE`.
3. Every `execution_mode` change writes to `audit_log` with `{ user_id, old_mode, new_mode, timestamp }`.
4. Frontend confirmation dialog: "Switching to Autopilot will send steps automatically on schedule. Continue?" (UX affordance only — backend is authoritative).
5. **Test:** `test_member_role_cannot_change_execution_mode` (expects 403). `test_execution_mode_change_blocked_on_active_campaign` (expects 409).

---

## T-03 — Double-Dispatch via Concurrent Approval

**Threat:** Two concurrent approval requests for the same step (e.g., operator double-taps "Approve" on mobile, or two team members approve simultaneously) cause the step to be dispatched twice.

**Exploit scenario:** A campaign step sends a "final offer" email. It is dispatched twice to the same lead within milliseconds. The lead receives two copies, marking the operator as spammy.

**Mitigations:**
1. **Atomic status gate:** `UPDATE step_approval_queue SET status = 'dispatching' WHERE id = $1 AND workspace_id = $2 AND status = 'pending'`. If the row is already `'dispatching'`, the UPDATE returns 0 rows affected → service returns 409 `APPROVAL_CONCURRENT_CONFLICT`.
2. **Idempotency key:** `step_approval_queue.idempotency_key = '{campaign_lead_id}:{step_position}'` with UNIQUE constraint. sequence-worker cannot INSERT a second queued row for the same lead+step combination.
3. **Message-level idempotency:** `outreach-service` checks `messages.external_id` uniqueness before sending — an existing record for the same step stops the duplicate dispatch.
4. **Test:** `test_concurrent_approval_requests_only_dispatch_once` — two concurrent POST /approve calls for the same step_id; assert exactly one message sent, second returns 409.

---

## T-04 — Cross-Workspace Approval Queue Injection

**Threat:** An attacker with a valid JWT for Workspace A crafts a POST /approve request with `step_ids` that belong to Workspace B (by guessing UUIDs).

**Exploit scenario:** A RevLooper user enumerates step UUIDs from the API documentation and attempts to approve/reject campaign steps in a competitor's workspace, disrupting their outbound campaign.

**Mitigations:**
1. All `UPDATE` and `SELECT` queries on `step_approval_queue` include `AND workspace_id = $workspace_id` where `$workspace_id` comes from the JWT via `get_workspace_id()` dependency — never from the request body.
2. `api-gateway` injects `X-Workspace-ID` from verified JWT claims. Downstream `campaign-service` reads only from the header.
3. **Test:** `test_approval_queue_rejects_cross_workspace_step_ids` — workspace B's step IDs submitted in workspace A's request → 0 rows affected, no error exposure (returns `{ approved: 0, skipped: N }`).

---

## T-05 — Daily Ops Brief Cross-Workspace Data Leakage

**Threat:** The Daily Ops Brief aggregates data from 5 services. A bug in Redis cache key construction serves Workspace A's brief to Workspace B.

**Exploit scenario:** Redis cache key omits `workspace_id` (e.g., keyed only on `{user_id}:{date}`). A user with the same email in two workspaces (agency plan) receives another workspace's pipeline data.

**Critical mitigations:**
1. Redis cache key MUST be `ops_brief:{workspace_id}:{user_id}:{date}`. Missing any component is a data leakage bug. Enforced via a constants file (`BRIEF_CACHE_KEY_TEMPLATE = "ops_brief:{workspace_id}:{user_id}:{date}"`).
2. All internal service calls from `brief_assembler.py` receive `workspace_id` as a required parameter — no call is made without it.
3. `GET /advisor/daily-brief` reads `workspace_id` from `get_workspace_id()` dependency (JWT header). Brief returned only matches `workspace_id` in the stored `advisor_notifications` row.
4. **Test:** `test_daily_brief_cache_key_includes_workspace_id` — assert the literal Redis key set during brief generation contains the workspace UUID. `test_brief_not_served_across_workspaces` — generate brief for workspace A; request it with workspace B credentials; assert 404.

---

## T-06 — Runaway Autopilot Sends

**Threat:** A Cloud Tasks bug delivers the same task multiple times (at-least-once semantics), or a sequence-worker loop bug re-enqueues the same step repeatedly, causing a lead to receive hundreds of emails.

**Exploit scenario:** Cloud Tasks transient failure + retry causes the same step to execute 50 times. Lead receives 50 identical emails. Spam complaint → SendGrid suspension.

**Defence in depth (all three required):**
1. **Redis daily send counter (existing):** `daily_send:{workspace_id}:{user_id}:{date}` is checked and atomically incremented in `outreach-service` before every send. Once the plan limit is hit (Pro=200, Business=500), sends stop regardless of execution mode.
2. **Idempotency key on step_approval_queue:** `(campaign_lead_id, step_position)` UNIQUE constraint. For Autopilot (which does NOT use the queue), the `messages` table has `UNIQUE(workspace_id, campaign_lead_id, step_id)` — duplicate dispatch at outreach-service is a no-op (returns 200 `{ dispatched: false, reason: 'duplicate' }`).
3. **Bounce circuit breaker (new):** Redis `campaign:bounce_count:{campaign_id}:{hour}` INCR on each bounce event. If `bounce_count / sends_this_hour > 0.05` (configurable) → `POST campaign-service /internal/campaigns/{id}/auto-pause`. Campaign paused + Brief Card 4 alert fires.

**Note on messages table idempotency key:** DESIGN.md must confirm that `outreach-service` enforces `UNIQUE(workspace_id, campaign_lead_id, step_id)` on the `messages` table. If this constraint does not currently exist, it must be added as part of this spec's migrations.

---

## T-07 — Execution Mode Cache Stale

**Threat:** sequence-worker caches `execution_mode` in Redis with TTL 5 min. An operator changes a campaign from Autopilot to Review after pausing and re-activating. For up to 5 minutes, the stale cache causes steps to be dispatched in Autopilot mode.

**Assessment:** Severity is LOW. The 5-minute window is bounded and self-correcting. Mode changes require the campaign to be paused first (AC-03), so active-campaign sequences are not in flight during the change window.

**Mitigation:** On `campaign.execution_mode_changed` Pub/Sub event, sequence-worker calls `Redis.DELETE('campaign:exec_mode:{campaign_id}')` immediately. Cache is re-populated on next step execution. Window = time from outbox event publication to Pub/Sub delivery (typically < 5 seconds).

---

## T-08 — Copilot Expiry Leaves Leads Permanently Stuck

**Threat:** An operator leaves Review mode on, forgets to process the approval queue for days. All queued steps expire. Leads are never followed up. Operator loses pipeline.

**Assessment:** Severity is LOW (operator negligence, not a security issue). Documented as a product risk.

**Mitigation:** `step_approval_queue.expires_at` set at queue time (default: scheduled_at + 48h). A `Cloud Scheduler` job runs daily and calls `campaign-service /internal/approval-queue/expire-stale`:
- Sets `status='expired'` on all rows where `expires_at < NOW() AND status = 'pending'`
- Resets `campaign_leads.next_step_at` to allow the sequence to continue to the next step (optional, configurable in campaign settings: `copilot_on_expiry = 'skip_step' | 'pause_lead'`)

---

## CSRF Assessment

The frontend uses JWT Bearer tokens in `Authorization` headers — not session cookies. Standard browser-based CSRF attacks require cookies and do not apply to Bearer-token SPAs. No CSRF tokens required. ✅

---

## OWASP Top 10 Walkthrough

| OWASP | Assessment |
|---|---|
| A01 Broken Access Control | `require_role()` for mode changes; `workspace_id` in all queries and Redis keys; approval queue injection prevented (T-02, T-04) |
| A02 Crypto Failures | No new cryptographic operations. R2 URLs for content assets (existing). |
| A03 Injection | No user-controlled SQL. All queries use parameterised SQLAlchemy. Step preview snippet is display-only (not executed). |
| A04 Insecure Design | Suppression invariant in outreach-service (T-01); idempotency key prevents double-dispatch (T-03) |
| A05 Security Misconfiguration | Circuit breaker threshold configurable in `campaigns.settings` (not hardcoded). Default 5% is conservative. |
| A06 Vulnerable Components | No new third-party libraries. Existing httpx / SQLAlchemy. |
| A07 Auth Failures | JWT Bearer from Supabase; `get_workspace_id()` from JWT header (not request body). |
| A08 Software/Data Integrity | Atomic dispatching UPDATE; message idempotency key; outbox → Pub/Sub for all events |
| A09 Logging/Monitoring | Mode changes in audit_log; auto-pause events in outbox; brief generation logged |
| A10 SSRF | No new external HTTP calls from user input. All internal service calls are to hard-coded internal Cloud Run URLs. |

---

## Residual Risks (Accepted)

| Risk | Acceptance Rationale |
|---|---|
| 5-minute stale execution_mode window | Bounded, self-correcting; mode changes require campaign pause first; cache invalidation event further reduces window to < 5 seconds typically |
| Operator ignores Review queue → leads expire | Product/UX risk, not security. Brief Card 3 + expiry notification provide adequate safeguards |
| Bounce circuit breaker false-positives on small batches | A campaign sending 10 emails with 1 bounce = 10% → false pause. Threshold should apply only when `sends_this_hour >= 20` (minimum sample). Document in DESIGN.md implementation note. |
