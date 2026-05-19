# 39 — AI Brain Knowledge Harvester

**Status:** 🔍 In Review (awaiting user approval)
**Confidence:** 8/10 (CPO 8 / CTO 8 — converged Round 2, 2026-05-18)
**Security flag:** 🔴 HIGH (user-pasted confidential business knowledge + LLM prompt injection surface + hard-delete-of-embeddings requirement)
**Priority:** P1
**Parallel Track:** B (AI)
**Depends on:** 02 (AI Brain Onboarding — reuses chunk/embed pipeline), 31/38 (Advisor session pattern — mirrored), 32 (Billing & Credits)
**Blocks:** none (additive capability)
**Owning service:** `ai-service` (sessions, synthesis, ingestion, hard-delete)

## One-line summary
A comprehensive knowledge capture suite — guided Socratic chat interview, topic-specific templates, quick brain dump, and automated gap detection — that converts a workspace owner's tacit expertise into structured Markdown documents ingested into the workspace's AI Brain.

## Why it matters
- **Spec 02 (5-question wizard)** covers cold-start activation but cannot capture nuanced, ongoing expertise (objection handling, ICP nuances per industry, edge-case playbooks). The Harvester closes that gap.
- **Multi-method, no owner left behind:** chat suits owners who think by talking; templates suit those with blank-page anxiety; quick dump suits those who already know what to write; reflection ensures no topic is ever silently missed.
- **Differentiation:** 11x.ai / Regie / Lavender / Clay all ship static prompts or form-based onboarding. A multi-method knowledge harvester that *builds* your brain through conversation, guided templates, bulk dumps, and proactive gap detection is genuinely new in the AI-SDR category.
- **Retention moat:** each committed Harvester doc compounds the workspace's AI Brain, increasing per-workspace switching cost and feeding the Reflection Loop (Spec 28).
- **No knowledge left behind:** the Reflection scan proactively surfaces what the AI Brain is missing — the system asks owners what to add, not the other way around.

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | Architecture, state machine, data model, SSE contract, debate summary |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | 📝 Pending approval — rollout plan |
| [TASKS.md](TASKS.md) | 📝 Pending approval — task-by-task TDD plan |
| [TESTS.md](TESTS.md) | Unit / integration / E2E / EDD eval strategy |
| [SECURITY.md](SECURITY.md) | Prompt injection, workspace isolation, embedding purge, consent_log |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: [02_AI_BRAIN_ONBOARDING/](../02_AI_BRAIN_ONBOARDING/), [28_AI_BRAIN_REFLECTION/](../28_AI_BRAIN_REFLECTION/), [31_AI_ADVISOR/](../31_AI_ADVISOR/), [38_ADVISOR_SESSION_MANAGEMENT/](../38_ADVISOR_SESSION_MANAGEMENT/)
- Skills used: `spec-driven-development`, `edd-workflow`, `tdd-workflow`, `verification-loop`
