# 37 — LangGraph AI Orchestration (AI Advisor Amendment)

**Status:** 📝 Draft
**Confidence:** 8/10 (CPO 8 / CTO 8, converged in 2 rounds — user approval required before implementation)
**Security flag:** 🔴 HIGH (user input flows into LLM; workspace isolation in graph state; credits bypass risk)
**Priority:** P1
**Parallel Track:** B (AI / Intelligence features)
**Depends on:** 31 (AI Advisor — amends its DESIGN.md), 32 (Billing & Credits), 02 (AI Brain / RAG)
**Blocks:** 31 full implementation (advisor_chat.py must use the graph defined here)
**Owning service:** `ai-service`

## One-line summary

Replace the ad-hoc LiteLLM function-calling while-loop in AI Advisor chat (Spec 31) with a structured LangGraph stateful graph that adds query classification, parallel tool execution, a quality-critique gate, and per-node structured logging — while keeping LangChain document loaders and CrewAI explicitly out of scope.

## Why it matters

- The current Spec 31 plan terminates the LLM loop when LiteLLM stops requesting tools, not when the answer is *good* — users asking compound questions ("What should I focus on today to hit $10K?") may receive confident but incomplete responses with no observable trace to debug.
- No routing intelligence: every query — including trivial RAG lookups — pays the full loop cost (~5 tool round-trips).
- LangGraph's directed named-node graph provides an observable execution trace (structured JSON logs per node), conditional routing (simple/complex/draft paths), and a critique gate — improving answer quality and debuggability without adding external tracing vendors.
- Applied **only to AI Advisor chat**. Spec 05 (Campaign Builder) and Spec 11 (Reply Drafting) remain on their existing single-shot LiteLLM pattern; neither benefits from graph state.

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | LangGraph state graph definition, node specs, async integration, dependency decisions |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, feature flag, migration from ad-hoc loop, monitoring, risks |
| [TASKS.md](TASKS.md) | 10-task TDD plan (RED-first) |
| [TESTS.md](TESTS.md) | Coverage targets, unit tests per node, integration scenarios, eval cases |
| [SECURITY.md](SECURITY.md) | Prompt injection, workspace isolation in graph state, credits gate placement |
| [RESULT.md](RESULT.md) | (Empty until shipped) actual metrics + post-mortem |

## Debate Summary

2-round CPO ↔ CTO debate. Converged at CPO 8 / CTO 8 after resolving:

| Tension | Resolution |
|---|---|
| Scope | LangGraph for Advisor only; Spec 05 and 11 deferred |
| LangChain document loaders | Rejected — rag-processor owns ingestion |
| CrewAI | Rejected — wrong paradigm for supervised chat |
| Async compatibility | Confirmed via `ainvoke()` |
| Performance vs 5s target | Estimated 3–4.5s total — within target |
| Credits placement | `classify` node, before first LLM call |
| Observability | structlog per-node JSON logging; no LangSmith |
| New dependencies | One: `langgraph>=0.2,<0.4` |

## Spec Folder Links

| Spec | Link | Relationship |
|---|---|---|
| 31 AI Advisor | [docs/specs/31_AI_ADVISOR/](../31_AI_ADVISOR/) | Amended by this spec — DESIGN.md section 3 superseded |
| 05 AI Campaign Builder | [docs/specs/05_AI_CAMPAIGN_BUILDER/](../05_AI_CAMPAIGN_BUILDER/) | Evaluated — LangGraph deferred, no change |
| 11 Unified Inbox & AI Reply | [docs/specs/11_UNIFIED_INBOX_AI_REPLY/](../11_UNIFIED_INBOX_AI_REPLY/) | Evaluated — LangGraph deferred, no change |
| 02 AI Brain Onboarding | [docs/specs/02_AI_BRAIN_ONBOARDING/](../02_AI_BRAIN_ONBOARDING/) | RAG retrieval consumed by `retrieve` node |
| 32 Billing & Credits | [docs/specs/32_BILLING_CREDITS_SERVICE/](../32_BILLING_CREDITS_SERVICE/) | Credits deducted in `classify` node |

## Pointers

- Related specs: 31, 32, 02, 05, 11
- Skills used: `spec-driven-development`, `tdd-workflow`, `verification-loop`
- Runbook (post-ship): `docs/runbooks/langgraph-advisor.md`
