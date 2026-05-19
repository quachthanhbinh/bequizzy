# 29 — AI Lead Scoring — TASKS

**Status:** 📝 Draft
**Last updated:** 2025-05-05

> RED-first: every task starts with a failing test. Write the test, confirm it fails for the right reason, THEN write implementation.

## Task List

### Task 1 — Alembic migration: score columns on leads
- **Files:** `alembic/versions/NNNN_add_lead_score_columns.py`
- **Test:** `tests/test_migrations.py::test_lead_has_score_column` (schema inspection)
- **RED:** test fails — column doesn't exist
- **GREEN:** run migration, column exists with default 50 / 'Warm'

### Task 2 — Alembic migration: lead_score_signals table
- **Files:** `alembic/versions/NNNN_add_lead_score_signals.py`
- **Test:** `tests/test_migrations.py::test_lead_score_signals_table_exists`
- **RED:** table doesn't exist
- **GREEN:** migration creates table with correct columns and index

### Task 3 — Score calculator: basic signal weights
- **Files:** `app/scoring/weights.py`, `app/scoring/calculator.py`
- **Test:** `tests/scoring/test_calculator.py::test_open_event_increases_score`
- **RED:** `calculate_score` not implemented
- **GREEN:** returns correct score delta

### Task 4 — Score calculator: caps, floors, label assignment
- **Files:** `app/scoring/calculator.py`
- **Tests:** `test_score_clamps_at_100`, `test_score_label_hot`, `test_score_label_cold`
- **RED:** no clamping or label logic
- **GREEN:** all boundary tests pass

### Task 5 — Score calculator: decay function
- **Files:** `app/scoring/calculator.py`
- **Tests:** `test_decay_reduces_score`, `test_decay_does_not_go_below_floor`
- **RED:** no decay function
- **GREEN:** decay = max(score - 2, 10) per day

### Task 6 — SQLAlchemy model: LeadScoreSignal
- **Files:** `app/models/lead_score_signal.py`
- **Test:** `tests/test_models.py::test_lead_score_signal_insert`
- **RED:** model not defined
- **GREEN:** insert + query round-trip succeeds

### Task 7 — Pub/Sub subscriber: score_updater
- **Files:** `app/subscribers/score_updater.py`
- **Test:** `tests/scoring/test_score_updater.py::test_email_opened_updates_score`
- **RED:** handler not wired to calculator
- **GREEN:** handler updates `leads.score` in DB

### Task 8 — Pub/Sub subscriber: hot transition event
- **Files:** `app/subscribers/score_updater.py`
- **Tests:** `test_hot_transition_publishes_event`, `test_no_event_on_non_hot_transition`
- **RED:** no event published on Hot transition
- **GREEN:** `lead_scored_hot` published only when label changes to Hot

### Task 9 — Pub/Sub subscriber: workspace_id guard
- **Files:** `app/subscribers/score_updater.py`
- **Test:** `test_wrong_workspace_id_rejected`
- **RED:** no workspace validation
- **GREEN:** mismatched workspace_id nacks the message

### Task 10 — GET /leads/{id}/score endpoint
- **Files:** `app/routers/leads.py`, `app/schemas/lead_score.py`
- **Test:** `tests/routers/test_leads.py::test_get_lead_score_returns_breakdown`
- **RED:** endpoint not implemented
- **GREEN:** returns score + last 5 signals; 402 if Free plan

### Task 11 — scoring-worker: decay batch job
- **Files:** `services/scoring-worker/app/jobs/decay.py`
- **Test:** `tests/test_decay.py::test_decay_job_reduces_stale_leads`
- **RED:** job not implemented
- **GREEN:** batch UPDATE reduces scores for leads with no events in 24h

### Task 12 — Frontend: ScoreBadge component
- **Files:** `frontend/components/leads/ScoreBadge.tsx`
- **Test:** Vitest — `ScoreBadge.test.tsx::renders_hot_badge_red`
- **RED:** component not created
- **GREEN:** Hot = red, Warm = yellow, Cold = grey badge

### Task 13 — Frontend: ScoreBreakdown popover (Pro gate)
- **Files:** `frontend/components/leads/ScoreBreakdown.tsx`
- **Test:** `ScoreBreakdown.test.tsx::shows_upgrade_prompt_for_free_plan`
- **RED:** no plan gate
- **GREEN:** Free plan shows upgrade CTA; Pro shows signal list

### Task 14 — Frontend: ScoreBadge wired into LeadTable + KanbanCard
- **Files:** `frontend/components/leads/LeadTable.tsx`, `frontend/components/crm/KanbanCard.tsx`
- **Test:** integration test — table renders badge from lead data
- **RED:** badge not shown
- **GREEN:** badge visible in table and Kanban

### Task 15 — Verify-RED gate + coverage check
- Run full test suite; confirm coverage ≥ 85% on `scoring/` module
- Confirm `lead_scored_hot` E2E: simulate reply → check workflow trigger fires
