# Spec 09 — Analytics & A/B Testing: PRD

## Problem Statement

Founders send campaigns blindly without knowing what's working. They need clear campaign-level and step-level funnel metrics, and the ability to test subject lines and email bodies against each other with statistical confidence.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-09-01 | Founder | I want to see open/click/reply/bounce rates per campaign | P0 |
| US-09-02 | Founder | I want to see per-step metrics in a sequence funnel view | P1 |
| US-09-03 | Founder | I want to A/B test subject lines with automatic winner detection | P1 |
| US-09-04 | Founder | I want to see statistical significance for A/B test results | P1 |
| US-09-05 | Founder | I want a workspace dashboard showing overall outreach performance | P1 |
| US-09-06 | Admin | I want to export campaign metrics as CSV | P2 |
| US-09-07 | Founder | I want meeting booked rate per campaign | P1 |
| US-09-08 | Founder | I want to compare performance across campaigns | P2 |

## Acceptance Criteria

### AC-09-01: Campaign Metrics
- GIVEN a campaign has been active for any time period
- WHEN the metrics endpoint is called with date range
- THEN return: `{emails_sent, opens, clicks, replies, bounces, meetings_booked, open_rate, click_rate, reply_rate, bounce_rate, meeting_rate}`
- AND all rates are computed as `count / emails_sent` (0 if emails_sent = 0)
- AND data is pre-aggregated by `analytics-aggregator` job (not computed on query)

### AC-09-02: Sequence Step Funnel
- GIVEN a sequence with N steps
- WHEN funnel metrics are requested
- THEN return per-step: `{step_id, step_type, step_name, sent, completed, skipped, failed, conversion_rate_to_next}`

### AC-09-03: A/B Test Configuration
- GIVEN a sequence step has `step_type = ab_split`
- WHEN the user configures the A/B test
- THEN they set: variant A label, variant B label, split percentage (1–99), winning metric (open_rate|reply_rate|click_rate)
- AND enrollment routing is 50/50 by default (configurable)

### AC-09-04: Statistical Significance
- GIVEN an A/B test has ≥ 100 impressions per variant
- WHEN significance is computed
- THEN chi-squared test is used; p-value < 0.05 = statistically significant
- AND the UI shows "Significant ✓ (95% confidence)" or "Not enough data"

### AC-09-05: Workspace Dashboard
- GIVEN the workspace has any campaign activity
- WHEN the dashboard is loaded
- THEN show: total emails sent (30d), overall open rate (30d), overall reply rate (30d), meetings booked (30d), top 5 performing campaigns by reply_rate

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Metrics freshness | Max 1 hour lag (aggregation job) |
| Dashboard load time | p95 < 500ms (pre-aggregated) |
| CSV export | ≤ 30s for any date range |
| Scale | 100 workspaces × 1M emails/month aggregated |

## Success Metrics

| Metric | Target |
|---|---|
| Dashboard load p95 | < 500ms |
| Aggregation job completion | < 30min for full workspace |
| A/B test significance accuracy | Validated against scipy chi2 reference |
