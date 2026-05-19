# Spec 06 — Sequence Builder & Execution: PRD

## Problem Statement

Outreach without structure fails. Founders need a visual way to build multi-step sequences (email → wait → follow-up → LinkedIn → meeting ask) and have them execute automatically at the right time, with hard rules around unsubscribes and suppression.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-06-01 | Founder | I want to build a sequence by dragging step blocks into order | P0 |
| US-06-02 | Founder | I want step types: email, wait (fixed/relative), condition branch, A/B split, LinkedIn connect, SMS | P0 |
| US-06-03 | Founder | I want to enroll leads from a list into a sequence with one click | P0 |
| US-06-04 | Founder | I want an unsubscribed lead to stop receiving steps immediately | P0 (CRITICAL) |
| US-06-05 | Founder | I want to pause/resume an individual enrollment | P1 |
| US-06-06 | Founder | I want to see each enrollment's current step and status | P1 |
| US-06-07 | Founder | I want condition branches to route leads based on opens/replies/tags | P1 |
| US-06-08 | Founder | I want A/B split steps to divide enrollments evenly between variants | P1 |
| US-06-09 | Admin | I want all step executions logged for audit | P1 |
| US-06-10 | Founder | I want to set a daily send cap per sequence | P2 |

## Acceptance Criteria

### AC-06-01: Sequence Builder
- GIVEN a user creates a sequence within a campaign
- WHEN they add steps via the UI
- THEN steps are saved with `position` order, `step_type`, and `config` JSONB
- AND reordering updates all `position` values atomically

### AC-06-02: Enrollment
- GIVEN a lead belongs to the workspace
- WHEN enrolled in a sequence
- THEN a `sequence_enrollments` row is created with `status = active`, `current_step = 1`
- AND a lead cannot be enrolled in the same sequence twice if already `active` (idempotent)
- AND the first step is scheduled immediately via Cloud Tasks

### AC-06-03: Suppression Check (CRITICAL)
- GIVEN any step is about to execute
- WHEN the execution engine processes the step
- THEN `outreach-service` suppression list is checked FIRST
- AND if the lead is suppressed, the enrollment status is set to `unsubscribed` and NO step is executed
- AND this check CANNOT be bypassed — it is the first operation in every step handler

### AC-06-04: Unsubscribe Propagation
- GIVEN a lead unsubscribes (via email link or manual API call)
- WHEN the unsubscribe event is processed
- THEN ALL active enrollments for that lead across ALL sequences are set to `unsubscribed`
- AND the lead is added to the workspace suppression list
- AND no further steps are executed within 1 second of unsubscribe

### AC-06-05: Wait Step Scheduling
- GIVEN a `wait` step with `duration = 2 days`
- WHEN the previous step completes
- THEN a Cloud Tasks task is scheduled for `now + 2 days` to execute the next step
- AND the enrollment's `next_step_at` is updated

### AC-06-06: Condition Branch
- GIVEN a `condition` step with branch rule `IF email_opened THEN step_A ELSE step_B`
- WHEN the condition is evaluated
- THEN the enrollment is routed to the matching branch based on lead activity data
- AND the chosen branch's first step is scheduled immediately

### AC-06-07: Daily Send Cap
- GIVEN a sequence has `daily_send_cap = 50`
- WHEN the execution engine processes email steps
- THEN at most 50 email steps are dispatched per calendar day per sequence
- AND excess enrollments are queued and processed next day

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Enrollment creation latency | p95 < 500ms |
| Step execution latency | p95 < 2s from scheduled time |
| Suppression check | Synchronous, < 50ms |
| Unsubscribe propagation | < 1s for all enrollments |
| Scale | 1M active enrollments across all workspaces |
| Worker SLA | 99.9% step execution success rate |

## Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Sequence enrollment success rate | ≥ 99.5% |
| Suppression bypass incidents | 0 |
| Unsubscribe propagation time p99 | < 1s |
| Step execution on-time rate | ≥ 99% (within 5min of scheduled) |
| Daily send cap adherence | 100% |
