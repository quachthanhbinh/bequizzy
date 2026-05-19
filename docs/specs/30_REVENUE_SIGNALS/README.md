# 30 — Revenue Signals

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (pipeline value is commercially sensitive)
**Priority:** P1
**Parallel Track:** D (Analytics)
**Depends on:** 12 (CRM — deal data), 09 (Analytics — event bus), 01 (Auth)
**Blocks:** 31 (AI Advisor references pipeline drop signal)
**Owning service:** analytics-service (aggregation), crm-service (deal data source)

## One-line summary
Real-time pipeline value, win rate, projected revenue, and revenue-by-campaign charts — turning the CRM Kanban into a forecasting dashboard.

## Why it matters
- Solo founders and small sales teams make pricing and hiring decisions based on pipeline health — today they do this in a spreadsheet
- Pipeline drop > 20% week-over-week is a key AI Advisor trigger (PRD §9.3/§10.9.3)
- Spec 09 covers outreach analytics (open/click/reply rates) but has no deal value or revenue aggregation

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | Architecture, DB schema, API contract, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model, data sensitivity |
| [TESTS.md](TESTS.md) | Unit / integration / chart rendering tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, aggregation job, feature flags |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: 09 (outreach analytics), 12 (CRM/deals), 31 (AI Advisor consumes pipeline drop signal)
- Skills: `spec-driven-development`, `tdd-workflow`
- Owning service: `analytics-service` (aggregation), `crm-service` (source)
