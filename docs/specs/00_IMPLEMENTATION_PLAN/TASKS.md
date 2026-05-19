# 00 — Implementation Plan — TASKS

**Status:** ✅ Approved (governance checklist, not feature TDD)

> Unlike feature specs, this TASKS file lists **cross-spec checkpoints**. Per-feature tasks live in each individual spec.

---

## Wave 1 Checkpoints — Foundation & Data

- [ ] **W1-1** Repo + monorepo scaffold (services/ + frontend/) merged
- [ ] **W1-2** Docker Compose local stack (Supabase local + Redis + all services boot) green
- [ ] **W1-3** CI pipeline live: lint + type-check + test + Alembic roundtrip
- [ ] **W1-4** [`spec 01`](../01_AUTH_WORKSPACE/README.md) Auth + Workspace at DoD
- [ ] **W1-5** [`spec 03`](../03_LEAD_MANAGEMENT_ENRICHMENT/README.md) Lead Management at DoD
- [ ] **W1-6** [`spec 02`](../02_AI_BRAIN_ONBOARDING/README.md) AI Brain Onboarding at DoD
- [ ] **W1-7** Track F gates: 16 reliability baseline, 17 auth threat model, 18 logging, 22 API versioning, 23 feature flags
- [ ] **W1-8** Wave 1 exit gate tests pass (see [TESTS.md](TESTS.md))
- [ ] **W1-9** Wave 1 retro held + RESULT.md updated

## Wave 2 Checkpoints — Campaign Core

- [ ] **W2-1** [`spec 05`](../05_AI_CAMPAIGN_BUILDER/README.md) AI Campaign Builder at DoD
- [ ] **W2-2** [`spec 06`](../06_SEQUENCE_BUILDER_AND_EXECUTION/README.md) Sequence Builder & Execution at DoD
- [ ] **W2-3** [`spec 07`](../07_EMAIL_OUTREACH_DELIVERABILITY/README.md) Email Outreach & Deliverability at DoD
- [ ] **W2-4** [`spec 08`](../08_MEETING_BOOKING/README.md) Meeting Booking at DoD
- [ ] **W2-5** Track F gates: 19 test strategy, 20 data retention, 25 credit accounting, 26 migration runbook
- [ ] **W2-6** Wave 2 exit gate tests pass
- [ ] **W2-7** Wave 2 retro + RESULT.md

## Wave 3 Checkpoints — Inbound Engine & Multichannel

- [ ] **W3-1** [`spec 04`](../04_INBOUND_ANCHORS_CAMPAIGN_FORMS/README.md) Inbound Anchors at DoD
- [ ] **W3-2** [`spec 09`](../09_ANALYTICS_AB_TESTING/README.md) Analytics & A/B Testing at DoD
- [ ] **W3-3** [`spec 10`](../10_MULTICHANNEL_OUTREACH/README.md) Multichannel Outreach at DoD
- [ ] **W3-4** [`spec 11`](../11_UNIFIED_INBOX_AI_REPLY/README.md) Unified Inbox & AI Reply at DoD
- [ ] **W3-5** [`spec 36`](../36_CONTENT_DRIVEN_INBOUND/README.md) Content-Driven Inbound Engine at DoD (behind feature flag; Meta App Review submitted)
- [ ] **W3-6** Track F gates: 21 analytics taxonomy, 24 incident runbook, 27 a11y audit
- [ ] **W3-7** Wave 3 exit gate tests pass
- [ ] **W3-8** Wave 3 retro + RESULT.md

## Wave 4 Checkpoints — Revenue Management

- [ ] **W4-1** [`spec 12`](../12_CRM_CUSTOMERS_POSTSALE/README.md) CRM, Customers & Post-sale at DoD
- [ ] **W4-2** [`spec 13`](../13_WORKFLOW_AUTOMATION_REVENUE_SIGNALS/README.md) Workflow Automation at DoD
- [ ] **W4-3** [`spec 14`](../14_AGENCY_WORKSPACE_MANAGEMENT/README.md) Agency Workspace Management at DoD
- [ ] **W4-4** Wave 4 exit gate tests pass
- [ ] **W4-5** Wave 4 retro + RESULT.md

## Wave 5 Checkpoints — Scale & Governance

- [ ] **W5-1** [`spec 15`](../15_INTEGRATIONS_COMPLIANCE_LOCALIZATION/README.md) Integrations, Compliance & Localization at DoD
- [ ] **W5-2** [`spec 28`](../28_AI_BRAIN_REFLECTION/README.md) AI Brain Reflection through Phase 2 (design partners)
- [ ] **W5-3** SEA compliance checklist 100% (spec 15 + 20)
- [ ] **W5-4** Wave 5 exit gate tests pass
- [ ] **W5-5** Wave 5 retro + RESULT.md
- [ ] **W5-6** Quarterly roadmap ↔ plan reconciliation

## Continuous Track F Checkpoints (across all waves)

- [ ] **F-1** [`spec 16`](../16_PLATFORM_RELIABILITY/README.md) at DoD by end of Wave 2
- [ ] **F-2** [`spec 17`](../17_SECURITY_THREAT_MODEL/README.md) at DoD by end of Wave 1
- [ ] **F-3** [`spec 18`](../18_OBSERVABILITY_SLO/README.md) at DoD by end of Wave 1
- [ ] **F-4** [`spec 19`](../19_QA_TEST_STRATEGY/README.md) at DoD by end of Wave 2
- [ ] **F-5** [`spec 20`](../20_DATA_GOVERNANCE_RETENTION/README.md) at DoD by end of Wave 2
- [ ] **F-6** [`spec 21`](../21_ANALYTICS_EVENT_TAXONOMY/README.md) at DoD by end of Wave 3
- [ ] **F-7** [`spec 22`](../22_API_VERSIONING_CONTRACTS/README.md) at DoD by end of Wave 1
- [ ] **F-8** [`spec 23`](../23_FEATURE_FLAGS_ROLLOUT/README.md) at DoD by end of Wave 1
- [ ] **F-9** [`spec 24`](../24_INCIDENT_RESPONSE_ONCALL/README.md) at DoD by end of Wave 3
- [ ] **F-10** [`spec 25`](../25_FINOPS_COST_CONTROL/README.md) at DoD by end of Wave 2
- [ ] **F-11** [`spec 26`](../26_MIGRATION_BACKFILL/README.md) at DoD by end of Wave 2
- [ ] **F-12** [`spec 27`](../27_ACCESSIBILITY_UX_QUALITY/README.md) at DoD by end of Wave 3

## Done Definition for THIS spec
- All wave checkpoints completed (process never "finishes" but each wave does)
- RESULT.md updated weekly throughout
