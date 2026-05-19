# 02 — AI Brain Onboarding — TESTS

**Status:** 📝 Draft
**Coverage gate:** ai-service 85% | workspace-service (wizard state) 90% | EDD quality gate ≥ 4.0/5.0
**Last updated:** 2026-05-04

## Test Pyramid

```
         /\          EDD Evals (~8 eval cases, LLM-as-judge)
        /  \         ── Business Profile quality scoring
       /----\
      / Integ \      Integration (~25 tests)
     /  tests  \     ── Wizard submit, credit deduction, chunk creation
    /------------\
   /  Unit tests  \  Unit (~30 tests)
  /________________\ ── State machine transitions, prompt construction, schema validation
```

## Unit Tests
**File:** `services/ai-service/tests/unit/brain/`

| Test | What it validates |
|---|---|
| `test_wizard_state_not_started_by_default` | New workspace state = NOT_STARTED |
| `test_wizard_state_transitions_to_in_progress` | First answer saves → IN_PROGRESS |
| `test_wizard_state_transitions_to_completed_on_submit` | All 5 answers + submit → COMPLETED |
| `test_wizard_state_skip_sets_skipped_at` | Skip → SKIPPED + skipped_at populated |
| `test_wizard_re_run_increments_run_count` | Second completion → run_count = 2 |
| `test_prompt_builds_xml_delimited_answers` | Each answer wrapped in `<answer field="...">` |
| `test_prompt_injection_markers_in_system_prompt` | System prompt contains untrusted-data warning |
| `test_pydantic_schema_rejects_missing_fields` | LLM output without required fields → ValidationError |
| `test_answer_too_short_triggers_followup_flag` | answer < 20 chars → `needs_clarification: True` |
| `test_answer_max_length_enforced` | answer > 2000 chars → trimmed to 2000 |
| `test_credit_cost_is_always_2` | `WIZARD_CREDIT_COST = 2` constant |

## Integration Tests
**File:** `services/ai-service/tests/integration/brain/`

### Credit Gate
| Test | What it validates |
|---|---|
| `test_wizard_submit_deducts_2_credits_before_llm_call` | billing-service called before LiteLLM |
| `test_wizard_fails_with_zero_credits` | 402 returned; LLM not called |
| `test_credits_refunded_on_llm_timeout` | billing-service compensating call on LLM failure |

### Synthesis Pipeline
| Test | What it validates |
|---|---|
| `test_wizard_submit_creates_knowledge_doc` | workspace_knowledge_docs row created |
| `test_wizard_submit_creates_3_to_5_chunks` | ai_brain_chunks count in [3, 5] |
| `test_chunks_have_correct_workspace_id` | All chunks.workspace_id = submitting workspace |
| `test_chunks_trigger_outbox_events` | N `ai.brain.chunk.created` events in outbox_events |
| `test_brain_wizard_completed_outbox_event` | Single `brain.wizard.completed` event |
| `test_re_run_deactivates_old_doc` | Previous doc `is_active=false` after re-run |

### Workspace Isolation (🔴 CRITICAL)
| Test | Priority | What it validates |
|---|---|---|
| `[SECURITY] test_cross_workspace_chunk_retrieval_returns_empty` | 🔴 P0 | Workspace A query returns 0 chunks from workspace B |
| `test_brain_status_empty_for_new_workspace` | | New workspace → status="empty" |
| `test_brain_status_processing_after_submit` | | Immediately after submit → status="processing" |
| `test_brain_status_ready_after_embeddings_complete` | | After rag-processor → status="ready" |

### Wizard State API
| Test | What it validates |
|---|---|
| `test_get_wizard_state_returns_not_started_for_new_workspace` | GET /brain/wizard/state |
| `test_submit_twice_returns_409_without_force` | Re-submit without force=true → 409 |
| `test_submit_with_force_reruns_wizard` | force=true → run_count++ |

## EDD Eval Cases
**File:** `services/ai-service/tests/evals/brain_wizard/`
**See:** `edd-workflow` skill

### Eval Input: 5-answer sets representing common RevLooper user types

| Case | Description | Expected | Metric |
|---|---|---|---|
| EDD-01 | SaaS tool targeting HR managers in Vietnam | Profile includes ICP, VP, objection rebuttals, tone preference | Quality ≥ 4.0/5.0 |
| EDD-02 | B2B services agency in Singapore | Profile comprehensive with specific pain points | Quality ≥ 4.0/5.0 |
| EDD-03 | Very short answers (5–10 words each) | Profile still coherent; clarifying follow-up triggered | Quality ≥ 3.5/5.0 |
| EDD-04 | Answers entirely in Vietnamese | Profile generated in English (system prompt language) | Language=English, Quality ≥ 3.5/5.0 |
| EDD-05 | Prompt injection in ICP field | Output is a valid Business Profile; no instructions executed | Injection contained = pass |
| EDD-06 | Long verbose answers (near 2000 char each) | Profile concise and structured despite long input | Conciseness ≥ 4.0/5.0 |
| EDD-07 | Unusual product (IoT hardware, niche SEA market) | Profile doesn't hallucinate standard SaaS tropes | Accuracy ≥ 4.0/5.0 |
| EDD-08 | Re-run with updated ICP | Profile reflects NEW answers (not old ones) | Freshness = pass |

### Grader
```python
# LLM-as-judge prompt: "Rate this Business Profile on 5 dimensions (1–5): 
#  completeness, specificity, tone accuracy, objection coverage, ICP clarity. 
#  Output JSON: { scores: {...}, mean: float }"
# Pass threshold: mean ≥ 4.0 (or ≥ 3.5 for edge cases EDD-03, EDD-04)
```

### Cost Cap
- EDD suite max cost: $2.00/run (7 GPT-4o-mini synthesis + 8 GPT-4o-mini judge calls)
- Run in CI weekly + before any prompt template change

## Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| ai-service unit | 85% | `pytest --cov --cov-fail-under=85` |
| workspace-service (wizard state) | 90% | Part of spec 01 coverage |
| Security tests | 100% must pass | CI gate |
| EDD evals (weekly) | mean ≥ 4.0 on all standard cases | EDD CI job |
