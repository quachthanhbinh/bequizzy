# 30 — Revenue Signals — TESTS

**Status:** 📝 Draft
**Coverage gate:** ≥ 80% on aggregation and API modules
**Last updated:** 2025-05-05

## Unit Tests

### Aggregation logic (analytics-aggregator)
- [ ] `test_pipeline_value_excludes_won_and_lost_deals`
- [ ] `test_win_rate_calculation_correct`
- [ ] `test_win_rate_zero_when_no_closed_deals` (no division by zero)
- [ ] `test_projected_revenue_range_correct` (±20%)
- [ ] `test_campaign_attribution_aggregates_by_campaign_id`
- [ ] `test_pipeline_drop_event_fires_at_20pct_threshold`
- [ ] `test_pipeline_drop_event_does_not_fire_below_threshold`
- [ ] `test_snapshot_upsert_on_duplicate_date` (UNIQUE constraint handled)

## Integration Tests
- [ ] Aggregation job reads from crm-service and writes correct snapshot
- [ ] `GET /analytics/revenue` returns correct values from `pipeline_snapshots`
- [ ] Historical `history` array has correct weekly buckets
- [ ] `pipeline_dropped` Pub/Sub message delivered with correct payload

## E2E Tests (Playwright)
- [ ] Revenue widget visible on CRM dashboard
- [ ] Projected revenue range shows correctly
- [ ] Historical chart renders last 13 weeks
- [ ] Revenue by campaign table shows campaign names

## Edge Cases
- [ ] Workspace with zero deals: widget shows $0 and "No pipeline data yet" state
- [ ] All deals in Won/Lost: open pipeline = $0, win rate shown correctly
- [ ] Deal with null value: treated as $0 in aggregation (not crash)
