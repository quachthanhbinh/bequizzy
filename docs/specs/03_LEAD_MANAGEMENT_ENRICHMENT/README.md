# 03 — Lead Management & Enrichment

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🟡 MEDIUM (PII + file upload + third-party API credentials)
**Priority:** P0
**Parallel Track:** A (Core Platform)
**Depends on:** 01
**Blocks:** 04, 06, 07, 09, 12
**Owning service:** lead-service

## One-line summary
The CRM foundation: lead CRUD, CSV import with dedup, contact enrichment via Hunter.io (email verify) and Apollo.io (company/title data), and the full lead lifecycle from capture to sequence enrollment.

## Why it matters
- Every outreach spec (06, 07, 10, 11) operates on leads from this service
- Bad data quality → high bounce rates → domain blacklisting — most expensive failure mode
- Enrichment waterfall distinguishes RevLooper from basic email tools

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria |
| [DESIGN.md](DESIGN.md) | Lead schema, enrichment waterfall, CSV pipeline, API contract |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, enrichment provider integration |
| [TASKS.md](TASKS.md) | Task-by-task TDD plan |
| [TESTS.md](TESTS.md) | CSV edge cases, dedup, enrichment, PII handling |
| [SECURITY.md](SECURITY.md) | PII, file upload security, third-party credentials |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related: [04_INBOUND_ANCHORS/](../04_INBOUND_ANCHORS_CAMPAIGN_FORMS/), [07_EMAIL_OUTREACH/](../07_EMAIL_OUTREACH_DELIVERABILITY/)
- Skills: `spec-driven-development`, `tdd-workflow`
