# 28 — AI Brain Reflection Loop

**Status:** 📝 Draft (awaiting approval)
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM
**Priority:** P1
**Parallel Track:** B (AI)
**Depends on:** 02 (AI Brain Onboarding), 07 (Email Outreach), 11 (Unified Inbox & AI Reply)
**Blocks:** none (additive capability)
**Owning service:** ai-service

## One-line summary
After each campaign batch (or weekly cron), the AI reflects on what worked / what didn't and proposes new AI Brain chunks for the workspace owner to review and accept — closing the learning loop.

## Why it matters
- Today's AI Brain is human-fed and decays. Reply-rate variance across workspaces is 4× — but the system never notices.
- Strong differentiator vs 11x.ai / Regie / Lavender (all ship static prompts).
- Compounds workspace value over time → retention moat.

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API contract, event/outbox design, debate summary |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan (4 phases), feature flags, monitoring, risks |
| [TASKS.md](TASKS.md) | Task-by-task TDD plan |
| [TESTS.md](TESTS.md) | Unit / integration / E2E / EDD coverage targets and adversarial cases |
| [SECURITY.md](SECURITY.md) | Threat model, OWASP walkthrough, PII stripping, cross-workspace leakage prevention |
| [RESULT.md](RESULT.md) | (Empty until shipped) actual metrics, accept rate, post-mortem |

## Pointers
- Original synthesized spec: `docs/specs/2026-05-04-ai-brain-reflection-loop.md` (kept for history; superseded by this folder)
- Related: [02_AI_BRAIN_ONBOARDING/](../02_AI_BRAIN_ONBOARDING/), [11_UNIFIED_INBOX_AI_REPLY/](../11_UNIFIED_INBOX_AI_REPLY/)
- Skills used: `spec-driven-development`, `edd-workflow`
