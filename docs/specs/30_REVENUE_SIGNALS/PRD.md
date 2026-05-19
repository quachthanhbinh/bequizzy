# 30 — Revenue Signals — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2025-05-05

## Problem Statement

The CRM Kanban (spec 12) shows deal cards, but gives no summary of financial health. A user with 20 deals across 5 stages has no way to see: "What is my total pipeline worth? What's my win rate? Am I trending up or down?"

Today, RevLooper users export to Google Sheets to do this. That's a retention risk — the spreadsheet becomes the source of truth instead of RevLooper.

### Evidence
- "I still use Sheets for my pipeline forecast even though I use RevLooper for outreach" — recurring theme in early user interviews
- The AI Advisor pipeline-drop notification (PRD §9.3) has no data to drive it without this spec
- Spec 09 explicitly covers only outreach metrics (opens/clicks/replies) — no deal value or revenue aggregation

### Who has this problem
Pro and Business plan users with active CRM pipelines; agency users tracking client deal health.

## Goals
1. Users can see current pipeline value, win rate, and projected revenue without leaving RevLooper
2. Revenue-by-campaign attribution links outreach effort to pipeline value
3. Historical chart enables week-over-week trend visibility (pipeline drop signal for AI Advisor)

## Non-Goals
- ❌ Multi-currency with live FX rates (user sets workspace currency; all values stored + displayed in that currency)
- ❌ Forecasting with probability weights per stage (simple pipeline × win rate in Phase 2; probability per stage is Phase 3)
- ❌ Revenue from post-sale upsell tracking (Phase 3)

## Acceptance Criteria
- [ ] Revenue widget on CRM dashboard: total open pipeline value (sum of all non-Won/Lost deal values)
- [ ] Win rate: `Won deals / (Won + Lost deals)` in last 90 days, shown as percentage
- [ ] Projected revenue: `pipeline value × win rate`, shown as range (±20%)
- [ ] Revenue by campaign table: each campaign row shows pipeline value attributed to its leads
- [ ] Historical pipeline chart: line chart of total pipeline value by week (last 13 weeks / 90 days)
- [ ] Pipeline drop detection: if pipeline value drops > 20% week-over-week, `pipeline_dropped` event published to Pub/Sub (consumed by AI Advisor)
- [ ] All values respect workspace currency setting
- [ ] Charts load ≤ 2s for workspaces with ≤ 10k deals

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| CRM dashboard weekly active users | ≥ 40% of Pro+ users who have ≥ 1 deal | `crm_dashboard_viewed` |
| Revenue widget engagement | ≥ 60% of dashboard visits scroll to widget | `revenue_widget_viewed` |
| Pipeline drop notification CTR | ≥ 30% | `pipeline_dropped → ai_advisor_notification_clicked` |

## In-Scope Deliverables
- `pipeline_snapshots` table (daily snapshot of pipeline value per workspace)
- Revenue aggregation job in `analytics-aggregator` (Cloud Run Job, daily)
- `GET /analytics/revenue` endpoint (analytics-service)
- Revenue widget + historical chart UI components
- `pipeline_dropped` Pub/Sub event

## Out of Scope (deferred)
- Stage-weighted probability forecasting
- Multi-currency FX conversion
- Revenue goal-setting (target vs actual)

## Dependencies

| Dep | What we need from it |
|---|---|
| 12_CRM_CUSTOMERS_POSTSALE | `deals` table: `value`, `stage`, `campaign_id`, `workspace_id` |
| 09_ANALYTICS_AB_TESTING | Event taxonomy and analytics-aggregator pattern |
| 31_AI_ADVISOR | Consumes `pipeline_dropped` for proactive notification |

## Test Checklist
- [ ] Pipeline value calculation sums only open deals (not Won/Lost)
- [ ] Win rate handles zero closed deals gracefully (no division by zero)
- [ ] Projected revenue rounds correctly
- [ ] Pipeline drop event fires only when drop > 20%
- [ ] Revenue by campaign correctly attributes deals via `campaign_id`
