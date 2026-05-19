# 02 — AI Brain Onboarding

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (LLM input — prompt injection risk)
**Priority:** P0
**Parallel Track:** B (AI)
**Depends on:** 01 (workspace model)
**Blocks:** 05 (campaign quality), 11 (reply quality), 28 (reflection loop)
**Owning service:** ai-service (synthesis) + workspace-service (wizard state)

## One-line summary
A 5-question onboarding wizard that synthesizes the user's business context into a "Business Profile" RAG document, giving the AI sales rep workspace-specific knowledge from day one.

## Why it matters
- Cold-start problem: without workspace context the AI generates generic, low-converting copy
- Onboarding wizard converts signup activation to AI-ready in <5 minutes
- Seeds the AI Brain that spec 28 (Reflection Loop) continuously improves

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria |
| [DESIGN.md](DESIGN.md) | Wizard state machine, synthesis pipeline, AI Brain schema |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, EDD gates |
| [TASKS.md](TASKS.md) | Task-by-task TDD plan |
| [TESTS.md](TESTS.md) | Unit / integration / EDD eval strategy |
| [SECURITY.md](SECURITY.md) | Prompt injection, workspace isolation in RAG |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related: [28_AI_BRAIN_REFLECTION/](../28_AI_BRAIN_REFLECTION/), [05_AI_CAMPAIGN_BUILDER/](../05_AI_CAMPAIGN_BUILDER/)
- Skills: `spec-driven-development`, `edd-workflow`, `tdd-workflow`
