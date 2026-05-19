# 00 — Implementation Plan — DESIGN

**Status:** ✅ Approved
**Confidence:** 9/10
**Last updated:** 2026-05-04

## Wave Model

The system ships in 5 waves over ~20 weeks for Phase 1–2 of the product roadmap. Track F (Platform Operations) runs continuously from Wave 1 with checkpoint gates at each wave boundary.

```
Wave 1  Wave 2  Wave 3  Wave 4  Wave 5
 (1-4)  (5-8)  (9-12) (13-16) (17-20)        ← week ranges
  │       │      │      │      │
  ├── 01  ├── 05 ├── 04 ├── 09 ├── 14
  ├── 02  ├── 06 ├── 10 ├── 12 ├── 15
  └── 03  ├── 07 ├── 11 ├── 13
          └── 08
                                             ← Track F continuous
  ├── 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27 ──>
                                             ← Phase 2+
                                       └── 28 (AI Brain Reflection)
```

## Parallel Tracks

| Track | Focus | Specs |
|---|---|---|
| **A — Core Platform** | Auth, leads, sequence engine, deliverability | 01, 03, 06, 07 |
| **B — AI** | AI Brain, generation, reply, reflection | 02, 05, 11, 28 |
| **C — Inbound Growth** | Forms, booking, multichannel | 04, 08, 10 |
| **D — Revenue Ops** | Analytics, CRM, automation, agency | 09, 12, 13, 14 |
| **E — Cross-cutting** | Integrations, compliance, localization | 15 |
| **F — Platform Operations** | Reliability, security, observability, governance | 16–27 (continuous) |

## Dependency Graph

```
01 (Auth/Workspace) ──────────► all backend specs
   │
   ├──► 02 (AI Brain Onboarding) ──► 05 (AI Campaign Builder) ──► 11 ──► 28
   │
   ├──► 03 (Lead Management) ──► 04 (Forms) ──► 10 (Multichannel)
   │                          ├─► 06 (Sequence) ──► 07 (Email Outreach)
   │                          └─► 12 (CRM)             │
   │                                  ▲                ▼
   │                                  └─ 13 ──► 09 (Analytics) ──► 11 (Inbox)
   │                                                                 │
   └──► 14 (Agency) (needs 01 RBAC + most product surfaces)           │
                                                                      ▼
                                                                     08 (Booking)

15 (Integrations/Compliance) — runs in parallel from W1, gates each wave on SEA legal items
16–27 (Platform) — continuous; checkpoint gate at every wave boundary
```

## Parallelization Matrix (rules of engagement)

| Spec | May start when | Hard blockers |
|---|---|---|
| 01 | Day 1 | none |
| 02 | After 01 workspace model exists | 01 (workspace_id) |
| 03 | After 01 | 01 |
| 04 | After 03 lead source contracts | 03 |
| 05 | After 02 + 03 | 02, 03 |
| 06 | After 03 + step contract from 05 | 03, 05 |
| 07 | After 06 events schema | 06 |
| 08 | After 01 user/calendar model | 01 |
| 09 | After 06+07 events stable | 06, 07 |
| 10 | After 04 lead source contracts (parallel-safe) | 03, 06 |
| 11 | After 07 messaging contract | 06, 07 |
| 12 | After 03+09 (lead → deal model) | 03, 09 |
| 13 | After 06, 07, 09, 11 | 09 |
| 14 | After 01 RBAC + Wave 4 surfaces | 01, 09, 12 |
| 15 | Continuous from W1 | none |
| 16–27 | Continuous from W1 | individual deps in each spec |
| 28 | After 02, 07, 11 (Phase 2+) | 02, 07, 11 |

## Cross-Cutting Requirements (apply to every spec)

Each spec must satisfy these before its DoD:

1. **Workspace scope** — every DB query has `workspace_id`; covered by tests (spec 17)
2. **Outbox pattern** — every domain event written atomically with business data (spec 16)
3. **Credits** — any AI op deducts credits BEFORE the LLM call (spec 25)
4. **Suppression** — any outbound op checks suppression list (spec 07)
5. **Observability** — structured JSON logs + metrics + traces (spec 18)
6. **Security** — security-auditor review with no BLOCKER findings (spec 17)
7. **Test coverage** — 90% on new code (spec 19)
8. **Accessibility** — axe-core passes; mobile 375px verified (spec 27)
9. **Migration discipline** — Alembic roundtrip succeeds (spec 26)
10. **Feature flag** — risky/incomplete features behind a flag (spec 23)

## Wave Definitions

### Wave 1 — Foundation & Data (Weeks 1–4)
**Specs:** 01, 02 (parallel after 01 workspace), 03
**Track F gates this wave:** 16 (basic reliability), 17 (auth threat model), 18 (basic logging), 22 (API versioning baseline), 23 (feature flag service)
**Exit gate (see TESTS.md):**
- Auth (email + Google + Facebook OAuth) live
- Multi-tenant workspace isolation enforced + tested cross-tenant attempt blocked
- Lead CRUD/import/enrichment baseline working
- Cross-cutting requirement #1, #5, #7 in place

### Wave 2 — Campaign Core (Weeks 5–8)
**Specs:** 05, 06, 07, 08 (parallel)
**Track F gates this wave:** 19 (test strategy live), 20 (data retention policy), 25 (credit accounting), 26 (migration runbook)
**Exit gate:**
- AI campaign generation → sequence step contract stable
- Sequence execution worker handles 100k steps/hour without backlog
- Email send + warm-up + bounce handling deliverability baseline
- All cross-cutting requirements in place except 27

### Wave 3 — Inbound Engine & Multichannel (Weeks 9–13)
**Specs:** 04, 09 (parallel), 10, 11, **36** (parallel)
**Track F gates this wave:** 21 (analytics taxonomy stable), 24 (incident response runbook), 27 (accessibility audit pass)
**Exit gate:**
- Campaign forms module live with embed + provider sync
- Inbound anchors (FB/Google) operational; Zalo/TikTok behind flag
- Unified inbox + AI Reply working across all enabled channels
- **Content-Driven Inbound Engine (Spec 36) live behind feature flag** — Facebook comment capture + auto-DM + lead creation operational; Meta App Review submitted
- All cross-cutting requirements in place

**Spec 36 dependency note:** Spec 36 (Track C) depends on Spec 01 + Spec 03. It is parallel-safe with Spec 04 (both touch campaign-service but different tables; no shared endpoints). Integration-service must expose `GET /internal/integrations/resolve` before comment-processor can be deployed.

### Wave 4 — Revenue Management (Weeks 13–16)
**Specs:** 12, 13, 14 (parallel)
**Exit gate:**
- CRM Kanban + customer lifecycle E2E
- Workflow automation + revenue signals operational
- A/B testing reporting stable

### Wave 5 — Scale & Governance (Weeks 17–20)
**Specs:** 14 (complete), 15 (consolidated), 28 (start)
**Exit gate:**
- Agency workspace management GA
- Integration hardening complete
- SEA privacy compliance checklist 100% complete (spec 15 + 20)

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provider API readiness (Zalo/TikTok) | High | Medium | Provider adapters behind flags; ship enabled providers first |
| LinkedIn channel policy risk | Medium | High | Hard rate limits + per-channel guardrails (spec 10) |
| Data quality from enrichment | Medium | Medium | Confidence scoring + manual override (spec 03) |
| SEA compliance delay | Medium | High | consent_log mandatory before any outreach activation (spec 15) |
| pgvector scale before AI Brain optimization | Low | High | spec 02 + 28 enforce per-workspace chunk caps |
| Single eng-lead bottleneck on cross-spec contracts | High | High | Bi-weekly contract sync; ADR for every shared schema |

## Confidence Scoring

This is a process spec, not a system design — debate produced:
- **Round 1:** PM 9 / Eng Lead 7 (concern: solo-team capacity at 5 waves)
- **Round 2:** Both at 9 after agreeing Track F runs continuous (not a separate wave)

**Final: 9/10.** Why not 10: real-world capacity may force a 6th wave; will be reflected in RESULT.md.
