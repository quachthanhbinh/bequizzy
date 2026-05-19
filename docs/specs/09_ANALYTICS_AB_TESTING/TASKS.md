# Spec 09 — Analytics & A/B Testing: TASKS

## TDD Task List

### Task 1 — Migration: campaign_metrics_snapshots, sequence_step_metrics, ab_test_results
**RED first:** Import models → fails because tables don't exist.
**File:** `alembic/versions/0009_analytics.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — SQLAlchemy Models
**RED first:** Test `CampaignMetricsSnapshot(campaign_id=None)` raises.
**File:** `services/analytics-service/app/models/metrics.py`
**Done when:** Models import; constraints verified.

### Task 3 — Metrics Rate Computation
**RED first:** Test U09-01 fails because `compute_rates()` missing.
**File:** `services/analytics-service/app/services/analytics_service.py`
**Done when:** Tests U09-01, U09-04 pass.

### Task 4 — A/B Statistical Significance
**RED first:** Test U09-02 fails because `compute_ab_significance()` missing.
**File:** `services/analytics-aggregator/app/ab_testing.py`
**Done when:** Tests U09-02, U09-03 pass; validated against scipy reference.

### Task 5 — Aggregator Job
**RED first:** Test I09-01 fails because aggregator doesn't produce snapshot.
**File:** `services/analytics-aggregator/app/aggregator.py`
**Done when:** Test I09-01 passes; UPSERT idempotent (run twice = same result).

### Task 6 — Analytics API Endpoints
**RED first:** Test I09-02 fails because endpoint missing.
**File:** `services/analytics-service/app/routers/analytics.py`
**Done when:** Tests I09-02, I09-03 pass.

### Task 7 — Frontend Dashboard + Charts
**RED first:** Vitest test for `WorkspaceDashboard` fails because component missing.
**Files:** `frontend/components/analytics/WorkspaceDashboard.tsx`, `CampaignMetricsChart.tsx`
**Done when:** Component tests pass; dashboard loads with real data.

## Completion Checklist
- [ ] Aggregation job: idempotent UPSERT verified
- [ ] A/B significance validated against scipy reference
- [ ] Cross-workspace isolation test passes
- [ ] Dashboard load p95 < 500ms (pre-aggregated data)
- [ ] `mypy app/` passes; `npx tsc --noEmit` passes
