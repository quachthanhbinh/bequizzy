# Spec 25 — FinOps & Cost Control: PRD

## Problem Statement

LLM API costs can spike unexpectedly per workspace. Without per-workspace cost visibility and caps, a single heavy workspace can exhaust budget.

## Acceptance Criteria

### AC-25-01: Per-Call Cost Tracking
- LiteLLM middleware records token counts + cost per call
- Stored in `llm_cost_events` (workspace_id, model, tokens_in, tokens_out, cost_usd)

### AC-25-02: Daily Cost Cap per Workspace
- Default cap: $10/workspace/day
- When cap reached: AI operations return 429 with `DAILY_AI_BUDGET_EXCEEDED`
- Admin can configure custom cap via workspace settings

### AC-25-03: Cloud Billing Alerts
- Alert when monthly GCP spend > $500 (warning), $1000 (critical)
- Alert fires to Slack + PagerDuty P2

### AC-25-04: Cost Dashboard
- Workspace admin sees: daily AI spend, top cost drivers, remaining daily budget
