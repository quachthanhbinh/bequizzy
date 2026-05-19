# 29 — AI Lead Scoring

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (score manipulation, PII in scoring features)
**Priority:** P1
**Parallel Track:** B (AI / Intelligence)
**Depends on:** 01 (Auth), 03 (Lead Mgmt), 06 (Sequence Execution), 07 (Email), 09 (Analytics)
**Blocks:** 11 (AI Reply — hot lead prioritisation), 13 (Workflow — hot lead trigger)
**Owning service:** lead-service (score write), ai-service (ML scoring job), scoring-worker (GKE CronJob)

## One-line summary
Automatically classifies every lead as Hot / Warm / Cold using a weighted signal model recalculated on every engagement event — surfacing the best opportunities to act on right now.

## Why it matters
- Without scoring, a 1,000-lead list gives the user no prioritisation — they reply to whoever emailed last, not whoever is most likely to buy
- Hot lead detection drives the highest-value AI Advisor notification (PRD §10.9.3): "{{Lead}} opened 3× — follow up now"
- Competitive gap: Instantly and Lemlist show open/click stats but don't produce an actionable score; 11x.ai scores but only for its own AI SDR

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | Score model, signal weights, DB schema, API contract, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model, score manipulation, PII in features |
| [TESTS.md](TESTS.md) | Unit / integration / scoring accuracy tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, scoring-worker job, feature flags |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: 03 (lead data), 09 (analytics events as scoring signals), 13 (hot-lead workflow trigger), 11 (hot-lead inbox badge), 31 (AI Advisor references score)
- Skills used: `spec-driven-development`, `tdd-workflow`
- Scoring worker: `services/scoring-worker/`
