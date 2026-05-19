# 30 — Revenue Signals — TASKS

**Status:** 📝 Draft
**Last updated:** 2025-05-05

> RED-first: every task starts with a failing test.

## Task List

### Task 1 — Alembic migration: pipeline_snapshots + campaign_revenue_snapshots
- **Test:** `test_pipeline_snapshots_table_exists`
- **RED:** tables don't exist
- **GREEN:** migration creates both tables with indexes

### Task 2 — Aggregation: pipeline value calculation
- **Files:** `analytics-aggregator/app/jobs/revenue_aggregation.py`
- **Test:** `test_pipeline_value_excludes_won_and_lost_deals`
- **RED:** function not implemented
- **GREEN:** correctly sums only open deal values

### Task 3 — Aggregation: win rate + projected revenue
- **Tests:** `test_win_rate_calculation_correct`, `test_win_rate_zero_when_no_closed_deals`
- **RED:** no win rate logic
- **GREEN:** win rate = Won / (Won + Lost), projected = pipeline × win_rate × [0.8, 1.2]

### Task 4 — Aggregation: campaign attribution
- **Test:** `test_campaign_attribution_aggregates_by_campaign_id`
- **RED:** no campaign grouping
- **GREEN:** `campaign_revenue_snapshots` rows written per campaign

### Task 5 — Aggregation: pipeline drop detection + event
- **Tests:** `test_pipeline_drop_event_fires_at_20pct`, `test_no_drop_event_below_threshold`
- **RED:** no drop detection
- **GREEN:** `pipeline_dropped` event published when drop > 20%

### Task 6 — Aggregation: snapshot upsert (idempotent)
- **Test:** `test_snapshot_upsert_on_duplicate_date`
- **RED:** duplicate date raises error
- **GREEN:** upsert with `ON CONFLICT DO UPDATE`

### Task 7 — GET /analytics/revenue endpoint
- **Files:** `analytics-service/app/routers/revenue.py`
- **Test:** `test_revenue_endpoint_returns_correct_structure`
- **RED:** endpoint not implemented
- **GREEN:** returns pipeline_value, win_rate, projected_revenue, history, by_campaign

### Task 8 — Revenue endpoint: workspace scope guard
- **Test:** `test_revenue_endpoint_requires_workspace_id`
- **RED:** no workspace guard
- **GREEN:** missing `X-Workspace-ID` returns 400

### Task 9 — Frontend: RevenueWidget component
- **Test:** Vitest `renders_pipeline_value_and_win_rate`
- **RED:** component not created
- **GREEN:** displays values from mock API response

### Task 10 — Frontend: PipelineHistoryChart (Recharts)
- **Test:** `renders_13_week_line_chart`
- **RED:** no chart component
- **GREEN:** line chart renders with correct week labels

### Task 11 — Frontend: RevenueByCampaignTable
- **Test:** `renders_campaign_rows_sorted_by_pipeline_value`
- **RED:** no table component
- **GREEN:** table renders and sorts correctly

### Task 12 — Frontend: Wire into CRM dashboard
- **Test:** integration test — CRM page shows RevenueWidget
- **RED:** widget not on CRM page
- **GREEN:** widget visible below Kanban

### Task 13 — Verify-RED + coverage check
- Run full suite; coverage ≥ 80% on aggregation and router modules
- Confirm `pipeline_dropped` E2E: run aggregation job → check ai-service receives event
