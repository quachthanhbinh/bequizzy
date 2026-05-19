# 00 — Implementation Plan — TESTS

**Status:** ✅ Approved
**Coverage targets:** N/A for the plan itself; cross-cutting CI gates apply to every spec

> Tests below are **wave exit gates** — integration-level checks that gate progression to the next wave. Per-spec test coverage lives in each spec's TESTS.md.

## Cross-cutting CI gates (apply to every PR in every wave)

| Gate | Implemented in | Failure = block PR |
|---|---|---|
| Linting (ruff for py, eslint for ts) | `.github/workflows/lint.yml` | Yes |
| Type checking (mypy strict, tsc strict) | `.github/workflows/types.yml` | Yes |
| Unit + integration tests | `.github/workflows/test.yml` | Yes |
| Coverage ≥ 90% on new code | codecov diff check | Yes |
| Alembic migration roundtrip | `.github/workflows/migrations.yml` | Yes |
| Workspace-scope grep rule (no raw queries without `workspace_id`) | `.github/workflows/security-lint.yml` | Yes |
| No direct LLM SDK imports outside ai-service | `.github/workflows/security-lint.yml` | Yes |
| No hardcoded secrets (gitleaks) | `.github/workflows/security-lint.yml` | Yes |
| axe-core a11y on changed frontend pages | `.github/workflows/a11y.yml` | Yes for spec 27+ |

## Wave 1 Exit Gate

- [ ] **E2E smoke** — sign up via Google OAuth → create workspace → invite teammate → import 100 leads → see them in list
- [ ] **Cross-tenant isolation** — automated test: user from workspace A cannot read/write any workspace B record (covers leads, users, settings)
- [ ] **OAuth providers** — email + Google + Facebook all green in staging
- [ ] **Lead enrichment** — Hunter.io + Apollo.io waterfall returns expected fields on a known fixture
- [ ] **Free plan limits** — 100-lead cap enforced server-side
- [ ] **Cross-cutting** — gates 1–10 from `IMPLEMENTATION.md § Cross-Cutting Enforcement` all on
- [ ] **Track F** — specs 16 (basic SLO dashboards), 17 (auth threat model), 18 (logs queryable in BQ), 22 (versioning policy), 23 (flag service) at DoD

## Wave 2 Exit Gate

- [ ] **AI campaign generation** — chat input "outreach to SaaS founders in SG" produces a 4-step sequence with valid JSON schema
- [ ] **Sequence worker scale** — synthetic load test: 100k steps/hour for 1 hour without backlog or duplicate sends
- [ ] **Email send** — Gmail + Outlook OAuth send → delivered to test inbox; bounce handled correctly
- [ ] **Suppression** — bounced address auto-added to suppression; subsequent sends to it blocked
- [ ] **Warm-up** — Mailreach toggled, status reflects in dashboard
- [ ] **Credits** — AI op deducts credits; insufficient credits returns `INSUFFICIENT_CREDITS` error
- [ ] **Booking** — public booking page renders, slot picker works, confirmation emails sent
- [ ] **Track F** — 19, 20, 25, 26 at DoD

## Wave 3 Exit Gate

- [ ] **Inbound forms** — embed form on test page → submit → lead appears in list with attribution
- [ ] **FB Lead Ads / Google Ads** — sandbox webhook → lead ingested
- [ ] **Multichannel send** — sequence with email + LinkedIn step (extension queue) + Facebook DM step → all dispatched
- [ ] **Unified inbox** — replies from email + FB + (Zalo if enabled) appear in single inbox view
- [ ] **AI Reply** — generates 3 suggestions in <5s; one-click send works
- [ ] **A/B test engine** — variant assignment 50/50 within ±5% over 200 sends; winner detection fires at thresholds
- [ ] **Track F** — 21, 24, 27 at DoD; full a11y audit pass

## Wave 4 Exit Gate

- [ ] **CRM Kanban** — drag-drop deal across stages; activity timeline updates
- [ ] **Won → customer** — deal closed-won prompts close date + value → customer record auto-created with timeline
- [ ] **Workflow automation** — trigger "lead replied" → action "move stage" fires within 30s
- [ ] **Revenue signals** — pipeline value + projected revenue render correctly on fixture data
- [ ] **Zapier triggers/actions** — sandbox Zap fires on `meeting_booked`

## Wave 5 Exit Gate

- [ ] **Agency workspace** — agency owner can manage 5 child workspaces with separate billing
- [ ] **SEA compliance** — consent_log enforced on first outreach action for VN/TH/SG workspaces; PDPA + GDPR data export endpoint live
- [ ] **AI Brain Reflection** — design partners completed Phase 2 with ≥30% accept rate (or fallback plan documented)
- [ ] **Quarterly reconciliation** — ROADMAP.md ↔ specs index drift = 0

## Cross-Wave Reliability Gate (continuous)

- [ ] All Cloud Run services p95 latency < 500ms under nominal load
- [ ] Error rate < 1% per service per day
- [ ] Outbox forwarder lag < 30s p99
- [ ] No Sev1/Sev2 incidents during wave (or post-mortem in RESULT.md)

## Done Definition for THIS test plan
- Every wave gate documented above is automated where possible (manual sign-off otherwise)
- CI gates listed are all live by end of Wave 1
- Failures block wave progression — no exceptions without Eng Lead + PM written waiver
