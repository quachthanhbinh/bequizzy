# 37 — LangGraph AI Orchestration — TASKS

**Status:** 📝 Draft
**Plan generated via:** `writing-plans` skill
**Execution:** `tdd-agent` task-by-task

Each task follows strict TDD: RED (write failing test) → Verify-RED → GREEN (implement) → Verify-GREEN → Commit. See [TESTS.md](TESTS.md) for the full test strategy.

> 10 tasks total. Tasks 1–8 are unit/wire tasks; Task 9 is the integration task; Task 10 is the EDD eval task.

---

## Task 1 — Install LangGraph and define AdvisorState

**Goal:** Add `langgraph` to `pyproject.toml` and create the `AdvisorState` TypedDict with all required fields.

**Files:**
- Modify: `services/ai-service/pyproject.toml`
- Create: `services/ai-service/app/advisor/__init__.py` (empty)
- Create: `services/ai-service/app/advisor/graph_state.py`
- Create: `services/ai-service/tests/unit/advisor/__init__.py` (empty)
- Create: `services/ai-service/tests/unit/advisor/test_graph_state.py`

**Steps:**
- [ ] Write failing test: `test_graph_state.py` — assert `AdvisorState` TypedDict has all required keys (`workspace_id`, `user_id`, `session_id`, `message`, `query_class`, `model_fast`, `model_quality`, `tools_requested`, `credits_deducted`, `rag_results`, `session_history`, `tool_results`, `tool_errors`, `tool_call_iterations`, `draft_response`, `critique_passed`, `critique_feedback`, `critique_iterations`, `final_response`, `sources`, `action`)
- [ ] Verify RED: `pytest tests/unit/advisor/test_graph_state.py` — ImportError expected
- [ ] Add `langgraph>=0.2,<0.4` to `pyproject.toml` dependencies; `pip install -e ".[dev]"`
- [ ] Create `graph_state.py` with `AdvisorState(TypedDict)` as defined in DESIGN.md §2
- [ ] Verify GREEN: test imports and checks all keys
- [ ] Commit: `feat(ai-service): add AdvisorState TypedDict and LangGraph dependency`

**Acceptance:** `AdvisorState` importable; all 21 keys present with correct type annotations; `mypy` passes with `strict = true`.

---

## Task 2 — Feature flag config field

**Goal:** Add `LANGGRAPH_ADVISOR_ENABLED: bool = False` to Settings and verify it reads from env var.

**Files:**
- Modify: `services/ai-service/app/core/config.py`
- Create: `services/ai-service/tests/unit/test_config_langgraph.py`

**Steps:**
- [ ] Write failing test: assert `Settings(LANGGRAPH_ADVISOR_ENABLED=True).LANGGRAPH_ADVISOR_ENABLED is True` and `Settings().LANGGRAPH_ADVISOR_ENABLED is False`
- [ ] Verify RED
- [ ] Add `LANGGRAPH_ADVISOR_ENABLED: bool = False` to `Settings(BaseSettings)`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): add LANGGRAPH_ADVISOR_ENABLED config field`

**Acceptance:** Default is `False`; reads `LANGGRAPH_ADVISOR_ENABLED=true` env var as `True`; `mypy` passes.

---

## Task 3 — `classify` node

**Goal:** Implement the classify node: deduct credits, call LiteLLM, return query_class + tools_requested.

**Files:**
- Create: `services/ai-service/app/advisor/nodes/__init__.py` (empty)
- Create: `services/ai-service/app/advisor/nodes/classify.py`
- Create: `services/ai-service/tests/unit/advisor/test_classify.py`

**Steps:**
- [ ] Write failing tests:
  - `test_classify_rag_only`: mock LiteLLM returning `{"query_class": "rag_only"}`; assert `tools_requested == []` and `credits_deducted == 1`
  - `test_classify_complex`: mock LiteLLM returning `{"query_class": "complex"}`; assert `tools_requested` contains `get_pipeline_summary` and `get_lead_scores`
  - `test_classify_billing_failure`: mock billing_client raising exception; assert `AppError("INSUFFICIENT_CREDITS", ...)` is raised and LiteLLM is NOT called
  - `test_classify_calls_billing_before_llm`: use call-order mock to verify billing deduction happens first
- [ ] Verify RED: all 4 tests fail (ImportError / not implemented)
- [ ] Implement `classify.py`: billing deduct → LiteLLM classify prompt → parse JSON → populate state fields
- [ ] Implement structlog per-node logging wrapper (DESIGN.md §7 pattern)
- [ ] Verify GREEN: all 4 tests pass
- [ ] Commit: `feat(ai-service): implement advisor classify node`

**Acceptance:** Billing always called first; LiteLLM called with fast model; returns correct `query_class` and `tools_requested`; raises `AppError` on billing failure without calling LLM.

---

## Task 4 — `retrieve` node

**Goal:** Implement the retrieve node: parallel pgvector RAG search + session history load.

**Files:**
- Create: `services/ai-service/app/advisor/nodes/retrieve.py`
- Create: `services/ai-service/tests/unit/advisor/test_retrieve.py`

**Steps:**
- [ ] Write failing tests:
  - `test_retrieve_returns_rag_and_history`: mock `search_workspace_rag` returning 3 chunks and `load_session_history` returning 5 turns; assert state has both
  - `test_retrieve_workspace_id_passed_to_rag`: assert pgvector query includes `workspace_id` from state (not user input)
  - `test_retrieve_rag_failure_graceful`: mock pgvector raising exception; assert `rag_results == []` (not a 500 error)
  - `test_retrieve_history_capped_at_10_turns`: mock session with 15 stored turns; assert `session_history` has exactly 10
- [ ] Verify RED
- [ ] Implement `retrieve.py` with `asyncio.TaskGroup` parallelism
- [ ] Implement `search_workspace_rag` (pgvector call, always scoped to `workspace_id`)
- [ ] Implement `load_session_history` (JSONB read from `advisor_chat_sessions`, scoped to `workspace_id AND session_id`)
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): implement advisor retrieve node`

**Acceptance:** Both tasks run concurrently (TaskGroup); `workspace_id` sourced from state, never user input; RAG failure degrades to `[]` with warning log.

---

## Task 5 — `tool_call` node

**Goal:** Implement the tool_call node: dispatch selected tools in parallel with 3s timeout; handle errors gracefully.

**Files:**
- Create: `services/ai-service/app/advisor/nodes/tool_call.py`
- Create: `services/ai-service/tests/unit/advisor/test_tool_call.py`

**Steps:**
- [ ] Write failing tests:
  - `test_tool_call_executes_requested_tools`: mock `dispatch_tool` for `get_campaign_stats`; assert `tool_results["get_campaign_stats"]` is populated
  - `test_tool_call_parallel`: mock 2 tools with 100ms artificial delay each; assert total elapsed < 300ms (parallel execution)
  - `test_tool_call_error_stored_not_raised`: mock one tool raising exception; assert `tool_errors` has entry, `tool_results` has other tools' results
  - `test_tool_call_max_iterations_guard`: set `tool_call_iterations=3`; assert node returns immediately without calling any tool
  - `test_tool_call_workspace_id_always_in_dispatch`: spy on `dispatch_tool`; assert all calls include `workspace_id` from state
  - `test_tool_call_timeout_respected`: mock tool that sleeps 5s; assert `tool_errors` contains timeout message after <4s
- [ ] Verify RED
- [ ] Implement `tool_call.py` with TaskGroup, per-tool timeout, error isolation
- [ ] Implement `dispatch_tool()` with OIDC client (mock in tests)
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): implement advisor tool_call node`

**Acceptance:** Tools run in parallel; `workspace_id` always injected from state; errors stored in `tool_errors` without raising; max-iterations guard prevents infinite loops; 3s timeout per tool.

---

## Task 6 — `synthesize` node

**Goal:** Implement the synthesize node: build prompt with tool results and RAG, call LiteLLM, return response.

**Files:**
- Create: `services/ai-service/app/advisor/nodes/synthesize.py`
- Create: `services/ai-service/tests/unit/advisor/test_synthesize.py`

**Steps:**
- [ ] Write failing tests:
  - `test_synthesize_uses_fast_model_for_rag_only`: set `query_class="rag_only"`; mock LiteLLM; assert model arg is `model_fast`
  - `test_synthesize_uses_quality_model_for_complex`: set `query_class="complex"`; assert model arg is `model_quality`
  - `test_synthesize_user_message_wrapped_in_xml`: capture prompt; assert user `message` is wrapped in `<user_message>...</user_message>`
  - `test_synthesize_includes_tool_errors_in_prompt`: set `tool_errors = {"get_pipeline_summary": "timeout"}`; assert prompt includes the error text
  - `test_synthesize_respects_critique_feedback`: set `critique_feedback = "Response cited incorrect reply rate"` and `critique_iterations=1`; assert prompt includes `<critique_feedback>` section
  - `test_synthesize_populates_sources`: mock LiteLLM returning response citing "campaign_stats: 18%"; assert `sources` list contains `"campaign_stats"`
- [ ] Verify RED
- [ ] Implement `synthesize.py`: prompt builder + LiteLLM call + source extraction + action mapping
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): implement advisor synthesize node`

**Acceptance:** User content always XML-tagged; fast/quality model correctly selected by `query_class`; tool errors included in prompt with disclaimer language; critique feedback inserted when present; sources list populated.

---

## Task 7 — `critique` node

**Goal:** Implement the critique node: call fast LLM to fact-check response against retrieved data; conditional loop or pass.

**Files:**
- Create: `services/ai-service/app/advisor/nodes/critique.py`
- Create: `services/ai-service/tests/unit/advisor/test_critique.py`

**Steps:**
- [ ] Write failing tests:
  - `test_critique_pass`: mock LiteLLM returning `{"pass": true}`; assert `critique_passed=True` and `final_response == draft_response`
  - `test_critique_fail`: mock LiteLLM returning `{"pass": false, "feedback": "Cited 18% but data shows 12%"}`; assert `critique_passed=False` and `critique_feedback` populated
  - `test_critique_max_iterations_graceful`: set `critique_iterations=2`; assert node does NOT call LiteLLM and sets `critique_passed=True` (graceful degradation)
  - `test_critique_always_uses_fast_model`: assert LiteLLM called with `model_fast` regardless of `query_class`
  - `test_critique_json_parse_failure_is_graceful`: mock LiteLLM returning non-JSON; assert `critique_passed=True` (fail open — don't block response)
- [ ] Verify RED
- [ ] Implement `critique.py`
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): implement advisor critique node`

**Acceptance:** Always uses fast model; max-iterations guard prevents infinite loop; JSON parse failure is graceful (passes); feedback correctly populated for synthesize retry.

---

## Task 8 — Graph wiring

**Goal:** Wire all 5 nodes into a compiled LangGraph, including conditional edges and entry/end points.

**Files:**
- Create: `services/ai-service/app/advisor/graph.py`
- Create: `services/ai-service/tests/unit/test_graph_wiring.py`

**Steps:**
- [ ] Write failing tests:
  - `test_graph_compiles`: `build_advisor_graph()` returns a `CompiledGraph` without raising
  - `test_graph_rag_only_skips_tool_call`: mock nodes; set `query_class="rag_only"` in classify output; assert `tool_call` node is never called
  - `test_graph_complex_calls_tool_call`: set `query_class="complex"`; assert `tool_call` node is called
  - `test_graph_critique_pass_ends_graph`: mock critique returning `critique_passed=True`; assert graph terminates (no synthesize re-invocation)
  - `test_graph_critique_fail_loops_to_synthesize`: mock critique returning `critique_passed=False` on first call, `True` on second; assert synthesize called twice
  - `test_graph_critique_max_retries_ends_graph`: mock critique always returning `critique_passed=False`; assert graph terminates after 2 critique loops
- [ ] Verify RED
- [ ] Implement `graph.py` with `StateGraph`, all `add_node`, `add_edge`, `add_conditional_edges` calls
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): wire advisor LangGraph`

**Acceptance:** `ADVISOR_GRAPH` singleton compiles without error; conditional routing verified by tests; max-retry guards verified; `rag_only` path skips tool_call.

---

## Task 9 — Integrate with `/advisor/chat` endpoint

**Goal:** Modify `advisor_chat.py` to route through `ADVISOR_GRAPH.ainvoke()` when feature flag is enabled; legacy path unchanged.

**Files:**
- Modify: `services/ai-service/app/advisor/advisor_chat.py`
- Create: `services/ai-service/tests/integration/test_advisor_chat_graph.py`

**Steps:**
- [ ] Write failing integration tests:
  - `test_endpoint_uses_graph_when_flag_enabled`: mock all LiteLLM calls and tool dispatches; call `POST /advisor/chat` with `LANGGRAPH_ADVISOR_ENABLED=True`; assert response matches `AdvisorChatResponse` schema
  - `test_endpoint_uses_legacy_loop_when_flag_disabled`: set flag to `False`; assert legacy function called (not graph)
  - `test_endpoint_persists_session_after_graph`: assert `advisor_chat_sessions` JSONB updated with new turn including `graph_node_trace` field
  - `test_endpoint_credits_deducted_before_response`: spy on billing client; assert deduction call precedes LLM calls
  - `test_endpoint_insufficient_credits_returns_402`: mock billing raising `AppError("INSUFFICIENT_CREDITS")`; assert HTTP 402 response; no LLM calls made
- [ ] Verify RED
- [ ] Implement `advisor_chat.py` amendment: feature flag branch, initial state builder, `ADVISOR_GRAPH.ainvoke()` call, session persistence, response mapping
- [ ] Verify GREEN
- [ ] Commit: `feat(ai-service): integrate LangGraph into /advisor/chat endpoint`

**Acceptance:** Feature flag correctly routes; session persisted after graph run; credits deducted before graph; HTTP 402 on insufficient credits; response schema unchanged from Spec 31.

---

## Task 10 — EDD eval suite (quality gate)

**Goal:** Write the eval test suite that verifies AI Advisor response quality meets the ≥ 90% target on compound queries.

**Files:**
- Create: `services/ai-service/tests/evals/test_advisor_quality.py`
- Create: `services/ai-service/tests/evals/fixtures/advisor_eval_cases.json`

**Steps:**
- [ ] Write 20 eval cases in `advisor_eval_cases.json`:
  - 5 `rag_only` queries (brand voice, product info) — expected: relevant RAG content in response
  - 5 `simple` queries (campaign stats, hot lead count) — expected: correct stat cited
  - 7 `complex` queries (compound: today's focus, revenue forecast, compare campaigns) — expected: multiple data sources cited
  - 3 `draft` queries (draft follow-up for hot leads, draft batch email) — expected: email draft present in response
- [ ] Implement `test_advisor_quality.py`:
  - For each case: run graph with mock tool data matching case's `context` fixture
  - Grade with LLM-as-judge prompt (Claude 3.5 Sonnet): "Does this response correctly address the query using the provided data? Answer pass/fail with reasoning."
  - Assert overall pass rate ≥ 90% (18/20 cases)
- [ ] Verify RED: eval fails (graph not implemented yet) — then run after Task 9 to verify GREEN
- [ ] Run eval: `pytest tests/evals/ -v --no-header`
- [ ] Commit: `test(ai-service): add advisor LangGraph EDD eval suite`

**Acceptance:** ≥ 18/20 eval cases pass LLM-as-judge grading; eval runs in < 120s total; eval results printed with per-case breakdown.

---

## Commit Sequence Summary

```
feat(ai-service): add AdvisorState TypedDict and LangGraph dependency      # Task 1
feat(ai-service): add LANGGRAPH_ADVISOR_ENABLED config field               # Task 2
feat(ai-service): implement advisor classify node                          # Task 3
feat(ai-service): implement advisor retrieve node                          # Task 4
feat(ai-service): implement advisor tool_call node                         # Task 5
feat(ai-service): implement advisor synthesize node                        # Task 6
feat(ai-service): implement advisor critique node                          # Task 7
feat(ai-service): wire advisor LangGraph                                   # Task 8
feat(ai-service): integrate LangGraph into /advisor/chat endpoint          # Task 9
test(ai-service): add advisor LangGraph EDD eval suite                     # Task 10
```
