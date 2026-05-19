# RevLooper Feature Specs

This folder breaks `docs/PRD.md` into implementation-ready feature specs.

Each numbered spec uses a wrapper folder with the full SDD file set (8 files):
- `README.md` — index, status, confidence, debate summary pointer
- `PRD.md` — product and acceptance requirements
- `DESIGN.md` — architecture, data model, API, events, 3-round CPO↔CTO debate
- `SECURITY.md` — threat model, OWASP walkthrough, mitigations
- `TESTS.md` — unit / integration / E2E / EDD strategy
- `IMPLEMENTATION.md` — rollout plan, file map, phase breakdown
- `TASKS.md` — task-by-task TDD plan (≤15 tasks, RED-first)
- `RESULT.md` — post-ship metrics (empty stub until shipped)

See `_TEMPLATE/` for the canonical layout. All 37 spec folders are at **8/8 files ✅**.

## Status Grid

| # | Spec | Wave | Track | Confidence | Security | Files |
|---|---|---|---|---|---|---|
| `_TEMPLATE` | Reference Template | — | — | — | — | 8/8 ✅ |
| 00 | Implementation Plan | 0 | All | 9/10 | 🟢 LOW | 8/8 ✅ |
| 01 | Auth & Workspace | 1 | A | 9/10 | 🔴 HIGH | 8/8 ✅ |
| 02 | AI Brain Onboarding | 1 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 03 | Lead Management & Enrichment | 1 | A | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 04 | Inbound Anchors & Campaign Forms | 1 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 05 | AI Campaign Builder | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 06 | Sequence Builder & Execution | 2 | A | 9/10 | 🟡 MEDIUM | 8/8 ✅ |
| 07 | Email Outreach & Deliverability | 2 | A | 8/10 | 🔴 HIGH | 8/8 ✅ |
| 08 | Meeting Booking | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 09 | Analytics & A/B Testing | 2 | D | 8/10 | 🟢 LOW | 8/8 ✅ |
| 10 | Multichannel Outreach | 2 | A | 8/10 | 🔴 HIGH | 8/8 ✅ |
| 11 | Unified Inbox & AI Reply | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 12 | CRM & Customers Post-Sale | 2 | C | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 13 | Workflow Automation | 3 | C | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 14 | Agency Workspace Management | 3 | E | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 15 | Integrations & Compliance | 3 | E | 8/10 | 🔴 HIGH | 8/8 ✅ |
| 16 | Platform Reliability | 3 | F | 9/10 | 🔴 HIGH | 8/8 ✅ |
| 17 | Security Threat Model | 3 | F | 9/10 | 🔴 HIGH | 8/8 ✅ |
| 18 | Observability & SLO | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 19 | QA Test Strategy | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 20 | Data Governance & Retention | 3 | F | 8/10 | 🔴 HIGH | 8/8 ✅ |
| 21 | Analytics Event Taxonomy | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 22 | API Versioning & Contracts | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 23 | Feature Flags & Rollout | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 24 | Incident Response & On-Call | 3 | G | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 25 | FinOps & Cost Control | 3 | G | 7/10 | 🟢 LOW | 8/8 ✅ |
| 26 | Migration & Backfill | 3 | F | 8/10 | 🟢 LOW | 8/8 ✅ |
| 27 | Accessibility & UX Quality | 3 | C | 7/10 | 🟢 LOW | 8/8 ✅ |
| 28 | AI Brain Reflection | 3 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 29 | AI Lead Scoring | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 30 | Revenue Signals | 2 | D | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 31 | AI Advisor | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 32 | Billing & Credits Service | 1 | E | 9/10 | 🔴 HIGH | 8/8 ✅ |
| 33 | Freemium Feature Gates | 2 | C | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 34 | Campaign Content Studio | 2 | B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 35 | Solo Operator Mode | 2 | A+B | 8/10 | 🟡 MEDIUM | 8/8 ✅ |
| 36 | Content-Driven Inbound Engine | 2 | C | CPO 9 / CTO 7 | 🔴 HIGH | 8/8 ✅ |
| 37 | LangGraph AI Orchestration (Advisor amendment) | 2 | B | CPO 8 / CTO 8 | 🔴 HIGH | 7/8 📝 |
| 38 | AI Advisor Session Management | 2 | B | CPO 8 / CTO 8 | 🟡 MEDIUM | 8/8 📝 |
| 40 | AI Employee Platform (unified runtime + authoring, 2-phase) | 4 | B+E+F | 7/10 | 🔴 HIGH | 8/8 ✅ Approved |

> Spec number 47 was formerly "AI Employee Authoring Platform" — merged back into Spec 40 as Phase 2 on 2026-05-18 per user direction; spec number 47 is now free for future use.

## Track Legend
| Track | Area |
|---|---|
| A | Core Outreach (leads, sequences, email) |
| B | AI / Intelligence features |
| C | CRM, UX, Frontend |
| D | Analytics |
| E | Partnerships, Integrations, Billing |
| F | Platform (reliability, testing, infra) |
| G | Operations (cost, incident) |

## Security Legend
| Icon | Meaning |
|---|---|
| 🔴 HIGH | Workspace isolation or PII risk; CRITICAL findings present |
| 🟡 MEDIUM | Auth, SSRF, or action injection risks |
| 🟢 LOW | No user-controlled sensitive paths |

## Architecture Non-Negotiables (applies to all specs)
1. Every DB query scoped by `workspace_id`
2. Transactional outbox for all domain events
3. Credits deducted via billing-service BEFORE any AI call
4. Suppression list checked before every outbound message
5. Soft FKs across service boundaries (no cross-service FK constraints)
6. Secrets via GCP Secret Manager only
7. Service-to-service auth via Workload Identity OIDC tokens
8. SEA consent (`consent_log`) before personal data processing (VN/TH/SG)

## How to use
- Build in numeric order by default.
- Use `Parallel Track` labels to run workstreams concurrently.
- Each spec includes dependencies and exit criteria.

## Ordered Specs
- `00_IMPLEMENTATION_PLAN/`
- `01_AUTH_WORKSPACE/`
- `02_AI_BRAIN_ONBOARDING/`
- `03_LEAD_MANAGEMENT_ENRICHMENT/`
- `04_INBOUND_ANCHORS_CAMPAIGN_FORMS/`
- `05_AI_CAMPAIGN_BUILDER/`
- `06_SEQUENCE_BUILDER_AND_EXECUTION/`
- `07_EMAIL_OUTREACH_DELIVERABILITY/`
- `08_MEETING_BOOKING/`
- `09_ANALYTICS_AB_TESTING/`
- `10_MULTICHANNEL_OUTREACH/`
- `11_UNIFIED_INBOX_AI_REPLY/`
- `12_CRM_CUSTOMERS_POSTSALE/`
- `13_WORKFLOW_AUTOMATION_REVENUE_SIGNALS/`
- `14_AGENCY_WORKSPACE_MANAGEMENT/`
- `15_INTEGRATIONS_COMPLIANCE_LOCALIZATION/`
- `16_PLATFORM_RELIABILITY/`
- `17_SECURITY_THREAT_MODEL/`
- `18_OBSERVABILITY_SLO/`
- `19_QA_TEST_STRATEGY/`
- `20_DATA_GOVERNANCE_RETENTION/`
- `21_ANALYTICS_EVENT_TAXONOMY/`
- `22_API_VERSIONING_CONTRACTS/`
- `23_FEATURE_FLAGS_ROLLOUT/`
- `24_INCIDENT_RESPONSE_ONCALL/`
- `25_FINOPS_COST_CONTROL/`
- `26_MIGRATION_BACKFILL/`
- `27_ACCESSIBILITY_UX_QUALITY/`
- `28_AI_BRAIN_REFLECTION/` *(8-file form — first to use new convention)*

## Parallel Tracks (high-level)
- Track A (Core Platform):, 28 01, 03, 06, 07
- Track B (AI): 02, 05, 11
- Track C (Inbound Growth): 04, 08, 10
- Track D (Revenue Ops): 09, 12, 13, 14
- Track E (Cross-cutting): 15
- Track F (Platform Operations): 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27
