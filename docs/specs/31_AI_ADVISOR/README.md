# 31 — AI Advisor

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (cross-feature data access, prompt injection risk)
**Priority:** P1
**Parallel Track:** B (AI / Intelligence)
**Depends on:** 01, 02 (AI Brain), 09 (Analytics), 11 (Inbox), 12 (CRM), 29 (Lead Scoring), 30 (Revenue Signals)
**Blocks:** none (additive capability)
**Owning service:** ai-service (advisor logic), notification-service (proactive alerts)

## One-line summary
Always-on AI sales coach: a floating chat panel on every dashboard page that sends proactive notifications when something needs attention, and answers natural language questions about the user's campaigns, leads, and pipeline.

## Why it matters
- The most common RevLooper user complaint is "I don't know what to focus on" — AI Advisor is the direct answer
- Proactive notifications (hot lead, pipeline drop, stalling deals) drive same-day action where RevLooper creates the most value
- Differentiator vs 11x.ai (fully automated, no human guidance loop) and HubSpot AI (generic, not context-aware)
- Context-aware because it reads workspace RAG — the AI Brain makes every recommendation specific to the user's business

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | User stories, acceptance criteria, trigger conditions, NLQ examples |
| [DESIGN.md](DESIGN.md) | Architecture, prompt design, tool use, DB schema, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Prompt injection, data access scope, PII in chat |
| [TESTS.md](TESTS.md) | Unit / integration / EDD quality tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, feature flags, phase breakdown |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Pointers
- Related specs: 02 (AI Brain context), 28 (Reflection Loop — Advisor surfaces reflection proposals), 29 (hot lead signal), 30 (pipeline drop signal)
- Skills: `spec-driven-development`, `tdd-workflow`, `edd-workflow` (for prompt quality)
- Distinct from spec 28 (Reflection Loop): Reflection closes the AI learning loop; Advisor surfaces recommendations and answers questions
