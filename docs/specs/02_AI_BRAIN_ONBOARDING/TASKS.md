# 02 — AI Brain Onboarding — TASKS

**Status:** 📝 Draft
**Task count:** 10
**Pattern:** Red → Green → Refactor (TDD). EDD evals run after T-05.
**Last updated:** 2026-05-04

## Tasks

### T-01 · Alembic migrations — onboarding_wizard_state + ai_brain tables
**Files:**
- `alembic/versions/2026_05_05_002_add_ai_brain_onboarding_tables.py`

**Stub:** Creates `onboarding_wizard_state` (workspace-service schema) + `workspace_knowledge_docs` + `ai_brain_chunks` (ai-service schema) + pgvector index.

**Done when:** `upgrade head` + `downgrade -1` clean.

---

### T-02 · Wizard state service (CRUD, state machine, skip)
**RED first:** `tests/unit/test_wizard_state.py`

**Files:**
- `services/workspace-service/tests/unit/test_wizard_state.py`
- `services/workspace-service/app/services/brain_wizard_state_service.py`
- `services/workspace-service/app/api/v1/brain_wizard.py`

**Stub:**
```python
class BrainWizardStateService:
    async def get_state(self, workspace_id: UUID) -> WizardState: ...
    async def save_answers(self, workspace_id: UUID, answers: dict) -> WizardState: ...
    async def skip(self, workspace_id: UUID) -> WizardState: ...
    async def mark_completed(self, workspace_id: UUID) -> WizardState: ...
```
**Done when:** State transitions all pass; skip sets `skipped_at`; re-run increments `run_count`.

---

### T-03 · BusinessProfileDocument Pydantic schema + output validation
**RED first:** `tests/unit/test_business_profile_schema.py`

**Files:**
- `services/ai-service/tests/unit/brain/test_business_profile_schema.py`
- `services/ai-service/app/schemas/brain/business_profile.py`

**Stub:**
```python
class BusinessProfileDocument(BaseModel):
    title: str
    icp_summary: str
    value_proposition: str
    pain_points: list[str]
    objection_handlers: list[str]
    tone_preference: str
    tags: list[str]
```
**Done when:** Missing required field raises `ValidationError`; all fields present validates.

---

### T-04 · LLM synthesis pipeline (prompt builder + LiteLLM call)
**RED first:** `tests/unit/test_synthesis_pipeline.py`

**Files:**
- `services/ai-service/tests/unit/brain/test_synthesis_pipeline.py`
- `services/ai-service/app/services/brain/wizard_synthesis_service.py`
- `services/ai-service/app/prompts/brain_wizard.py`

**Stub:**
```python
BRAIN_WIZARD_SYNTHESIS_V1 = """..."""  # versioned prompt constant

class WizardSynthesisService:
    async def synthesize(self, answers: dict[str, str]) -> BusinessProfileDocument:
        """
        1. Build XML-delimited prompt
        2. Call billing-service.deduct_credits(2) BEFORE LiteLLM
        3. Call LiteLLM
        4. Parse + validate with Pydantic
        5. On failure: refund credits
        """
```
**Done when:** Prompt uses XML delimiters; billing called before LLM; output validates against schema.

---

### T-05 · Wizard submit endpoint + chunk creation + outbox
**RED first:** `tests/integration/test_wizard_submit.py`

**Files:**
- `services/ai-service/tests/integration/brain/test_wizard_submit.py`
- `services/ai-service/app/api/v1/brain/wizard.py`
- `services/ai-service/app/services/brain/chunk_factory.py`

**Key tests:** credits deducted before LLM; 3–5 chunks created; outbox events written.

**Done when:** POST /v1/brain/wizard creates doc + chunks + 2 outbox event types.

---

### T-06 · EDD eval suite baseline run
**Files:**
- `services/ai-service/tests/evals/brain_wizard/eval_cases.py`
- `services/ai-service/tests/evals/brain_wizard/run_evals.py`

**Eval cases:** 8 cases from TESTS.md; LLM-as-judge grader.

**Done when:** All 8 cases run; cases EDD-01, 02, 05, 06, 07, 08 score ≥ 4.0; EDD-03, 04 ≥ 3.5.

---

### T-07 · Cross-workspace isolation test (CRITICAL)
**Files:**
- `services/ai-service/tests/integration/brain/test_workspace_isolation.py`

**Key test:** Workspace A token cannot retrieve workspace B chunks via any API or direct pgvector query.

**Done when:** `test_cross_workspace_chunk_retrieval_returns_empty` GREEN.

---

### T-08 · rag-processor integration (embed + pgvector upsert)
**Files:**
- `services/rag-processor/app/handlers/brain_chunk_handler.py`
- `services/rag-processor/tests/test_brain_chunk_handler.py`

**Done when:** `ai.brain.chunk.created` event consumed → embedding written to `ai_brain_chunks.embedding`; brain status API returns "ready".

---

### T-09 · Frontend — wizard modal + reminder banner + settings re-run
**Files:**
- `frontend/components/brain/WizardModal.tsx`
- `frontend/components/brain/BrainReadinessBadge.tsx`
- `frontend/components/brain/ReminderBanner.tsx`
- `frontend/app/(dashboard)/settings/brain/page.tsx`

**Done when:** Wizard opens on first login; submit shows credit confirmation; reminder banner dismisses on completion; settings page shows re-run button.

---

### T-10 · Monitoring alerts + RESULT.md baseline
**Files:**
- `infra/monitoring/ai-brain-onboarding-alerts.yaml`
- `docs/specs/02_AI_BRAIN_ONBOARDING/RESULT.md`

**Done when:** Wizard completion rate metric + LLM latency alert created; RESULT.md has first staging run data.

## Completion Checklist
- [ ] Migrations clean (upgrade + downgrade)
- [ ] ai-service coverage ≥ 85%
- [ ] `[SECURITY]` cross-workspace chunk test GREEN
- [ ] EDD eval suite: all 8 cases pass thresholds
- [ ] Credits deducted BEFORE LLM (integration test proves it)
- [ ] rag-processor produces embeddings in < 60s p95
- [ ] Frontend reminder banner shown when wizard skipped
