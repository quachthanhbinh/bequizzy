# 37 — LangGraph AI Orchestration — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2026-05-10

## Problem Statement

The AI Advisor chat feature (Spec 31) is designed around a plain LiteLLM function-calling while-loop: call LLM → if tool requested, execute it, append result, call LLM again → repeat up to 5 times → return last response. This pattern has four production-grade deficiencies:

1. **No routing intelligence.** A query like "What's in my brand voice guide?" (pure RAG lookup, no tool needed) goes through the same full loop as "What should I focus on today to hit $10K this month?" (requires pipeline, lead scores, and RAG in parallel). The first query pays unnecessary latency; the second query may not call all the tools it needs because the LLM is not guided.

2. **No quality gate.** The loop exits when the LLM stops requesting tools — not when the response is correct or complete. There is no mechanism to detect hallucinated statistics, incomplete answers, or responses that contradict the retrieved tool data.

3. **No observable execution trace.** When the Advisor gives a wrong answer, the only debug artifact is a flat JSONB `messages` array. There is no record of which tools were called, in what order, how long each step took, or at which step the reasoning went wrong.

4. **No structured error handling per step.** If `get_pipeline_summary` times out, the entire loop fails with an unstructured exception. There is no way to degrade gracefully (return partial data with a disclaimer) or retry only the failed tool.

LangGraph replaces this loop with a directed, named-node graph that addresses all four deficiencies. The result is an AI Advisor that:
- Routes simple queries to a fast path (RAG-only, no tool calls)
- Fetches tool data in parallel where possible
- Applies a quality critique before returning the response to the user
- Emits a structured log line per node (node name, duration, model, tokens) to Cloud Logging

### Scope Decisions (locked in debate)

| Decision | Verdict | Rationale |
|---|---|---|
| LangGraph for AI Advisor chat (Spec 31) | ✅ ADOPT | Multi-step reasoning with quality gate — clear fit |
| LangGraph for Campaign Builder (Spec 05) | ⏳ DEFER | Single-shot structured generation — no graph state needed |
| LangGraph for Reply Drafting (Spec 11) | ⏳ DEFER | Stateless single-shot with RAG context — no graph benefit |
| LangChain document loaders | ❌ REJECT | rag-processor owns ingestion pipeline; adds 80MB+ dep |
| CrewAI | ❌ REJECT | Autonomous multi-agent paradigm — wrong for supervised chat |
| LangSmith tracing | ❌ REJECT | External vendor in hot path; structlog to Cloud Logging is sufficient |

## Goals

1. **G1 — Quality:** The AI Advisor provides complete, accurate responses for compound queries (requiring 2+ data sources) in ≥ 90% of eval cases (up from estimated ~70% with the plain loop).
2. **G2 — Latency:** End-to-end advisor chat response remains ≤ 5 seconds for 95th percentile requests.
3. **G3 — Observability:** Every chat request produces structured per-node logs (`workspace_id`, `session_id`, `node`, `duration_ms`, `model`, `tokens`) queryable in Cloud Logging.
4. **G4 — Debuggability:** On-call engineers can reconstruct the full graph execution path for any session from logs alone — no LangSmith or external tool required.
5. **G5 — Rollback safety:** Feature flag `langgraph_advisor_enabled` allows instant rollback to the existing LiteLLM loop without a code deploy.
6. **G6 — Credits compliance:** Credits are deducted via `billing-service` before the first LLM call in the graph — no regression on the architecture non-negotiable.

## Non-Goals

- ❌ Applying LangGraph to Campaign Builder (Spec 05) or Reply Drafting (Spec 11) in this spec
- ❌ LangChain document loaders or any other LangChain package
- ❌ CrewAI, AutoGen, or any multi-agent framework
- ❌ Persistent graph state in Redis or any distributed store (graph state is in-memory per request; session turns are stored in `advisor_chat_sessions` JSONB as before)
- ❌ LangSmith or any external tracing vendor
- ❌ Streaming responses (SSE / WebSocket) — out of scope for this spec; `ainvoke` returns the complete graph result
- ❌ Changing the `advisor_chat_sessions` DB schema — the JSONB messages array format is unchanged
- ❌ Changing the `/advisor/chat` API contract — request/response shape is unchanged from Spec 31

## Acceptance Criteria

### Functional

- [ ] `POST /advisor/chat` returns a response indistinguishable from the current contract (same JSON shape)
- [ ] Simple queries (RAG-only, e.g. "What's in my brand voice?") are classified as `rag_only` and skip tool_call node — total latency ≤ 2.5s
- [ ] Complex queries (e.g. "What should I focus on today?") invoke `get_pipeline_summary` + `get_lead_scores` and synthesize from both
- [ ] Draft queries (e.g. "Write a follow-up for hot leads") invoke `draft_email` tool and include the draft in the response
- [ ] Critique node fires when `synthesize` node produces a response flagged as low-confidence (explicit check against retrieved data)
- [ ] If `critique` sends response back to `synthesize`, the loop limit is 2 iterations maximum (prevents infinite loops)
- [ ] Credits are deducted in the `classify` node before any downstream LLM call; if deduction fails, the graph returns `AppError("INSUFFICIENT_CREDITS", ...)` before any LLM cost is incurred
- [ ] When feature flag `langgraph_advisor_enabled = false`, the endpoint uses the existing LiteLLM loop (Spec 31 original implementation) — no behaviour change

### Observability

- [ ] Each node emits a `structlog` JSON line: `{"event": "advisor_graph_node", "node": "<name>", "workspace_id": "...", "session_id": "...", "duration_ms": N, "model": "...", "tokens_in": N, "tokens_out": N}`
- [ ] Tool-call node additionally logs: `{"event": "advisor_tool_call", "tool": "<name>", "workspace_id": "...", "duration_ms": N, "status": "ok|error"}`
- [ ] Graph errors (node exception) log: `{"event": "advisor_graph_error", "node": "<name>", "workspace_id": "...", "error_code": "...", "trace_id": "..."}`

### Rollback

- [ ] Setting `LANGGRAPH_ADVISOR_ENABLED=false` in Cloud Run environment variables (without code change) routes all requests to the legacy LiteLLM loop
- [ ] Tests exist for both code paths (graph path and legacy path)

## Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Advisor chat response quality score (EDD eval set, compound queries) | ≥ 90% correct | EDD eval suite: `tests/evals/test_advisor_quality.py` |
| P95 end-to-end chat latency | ≤ 5s | Cloud Monitoring → `/advisor/chat` request duration |
| P95 simple-query (rag_only) latency | ≤ 2.5s | Filter by `query_class=rag_only` in Cloud Logging |
| Per-node log completeness | 100% of requests have all node logs | Cloud Logging alert on missing node event |
| Credits bypass incidents | 0 | billing-service credit transaction audit |
| Rollback time (flag flip to 100% legacy) | ≤ 2 minutes | Cloud Run env var propagation SLO |

## Dependencies

| Dependency | Status |
|---|---|
| Spec 31 (AI Advisor) — advisor_chat_sessions schema, tool definitions | Must exist before implementation |
| Spec 32 (Billing & Credits) — deduct_credits endpoint | Must be deployed and reachable |
| Spec 02 (AI Brain) — search_workspace_rag tool | Must return pgvector results |
| LangGraph 0.2+ | Install in ai-service pyproject.toml as part of Task 1 |
