# 02 — AI Brain Onboarding — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-04

## Rollout Phases

### Phase 1 — Backend Core (Week 2–3, after spec 01 complete)
**Goal:** Wizard submit → Business Profile doc → chunks → outbox events. Frontend not yet exposed.

**Deliverables:**
1. Alembic migration: `onboarding_wizard_state` (workspace-service), `workspace_knowledge_docs`, `ai_brain_chunks` tables (ai-service)
2. `ai-service`: wizard submit endpoint + synthesis pipeline (LiteLLM call with XML-delimited prompt)
3. `ai-service`: `BusinessProfileDocument` Pydantic schema + output validation
4. Credit deduction integration (billing-service call BEFORE LLM)
5. Chunk creation (3–5 chunks from document sections)
6. Outbox events: `brain.wizard.completed`, `ai.brain.chunk.created`
7. `workspace-service`: wizard state CRUD + skip endpoint
8. `ai-service`: brain status API (`/v1/brain/status`)
9. Unit + integration tests, coverage ≥ 85%; EDD eval suite baseline run

**Exit gate:** Wizard submit creates chunks, credits deducted, outbox events created. EDD mean ≥ 4.0/5.0.

### Phase 2 — RAG Processor Integration (Week 3, parallel)
**Deliverables:**
1. `rag-processor` (Cloud Function): subscribe to `ai.brain.chunk.created` → call text-embedding-3-small → upsert `ai_brain_chunks.embedding`
2. Brain status transitions: pending → processing → ready (polled by frontend)
3. pgvector index warm-up on first chunks
4. Cross-workspace isolation test: `[SECURITY] test_cross_workspace_chunk_retrieval_returns_empty`

### Phase 3 — Frontend Wizard (Week 3–4)
**Deliverables:**
1. Wizard modal component (5 steps + review + submit)
2. Clarifying follow-up UX (triggered on short answers < 20 chars)
3. Credit confirmation step ("This will use 2 credits")
4. Brain readiness indicator (dashboard header badge)
5. Skip flow + reminder banner
6. `/settings/brain` re-run wizard entry point
7. "Processing..." → "Ready" status poll (5s interval, stop on ready)

### Phase 4 — Quality Hardening (Week 4)
**Deliverables:**
1. Full EDD eval suite (8 cases) green + documented in RESULT.md
2. Prompt injection adversarial test passes
3. Re-run versioning verified (old doc deactivated)
4. Cost monitoring alert: wizard LLM costs > $0.10/workspace/day → alert

## Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `ai_brain_wizard_enabled` | true | Main wizard feature gate |
| `ai_brain_clarifying_followup_enabled` | true | Short-answer follow-up UX (can disable if causing friction) |

## Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| Wizard completion rate (7-day rolling) | < 40% | Analytics dashboard |
| LLM synthesis p99 latency | > 5s | LiteLLM metric |
| Embedding processing lag | > 60s p95 | rag-processor metric |
| EDD eval mean quality score | < 3.8 | Weekly CI eval job |
| Credit refund rate (LLM failures) | > 5% | billing-service metric |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM output doesn't match Pydantic schema | Medium | Medium | Retry with higher temperature (up to 3 retries); fallback to structured skeleton |
| Wizard completion rate below 40% | Medium | High | A/B test: 3-question vs 5-question wizard; shorter = better |
| pgvector ivfflat accuracy degrades at scale | Low | Medium | Monitor recall@10; rebuild index quarterly |
| GPT-4o-mini cost spike (many re-runs) | Low | Low | Cap re-runs at 5/day/workspace |

## Runbook

### LLM synthesis failure mid-wizard
1. Credits refund compensating call fires automatically (billing-service)
2. Wizard state stays IN_PROGRESS
3. User shown retry button with message "Synthesis failed — please try again"
4. Alert fires if failure rate > 5%

### RAG chunks not appearing after wizard
1. Check `ai_brain_chunks.embedding IS NULL` — embedding not yet written
2. Check rag-processor Cloud Function logs for `ai.brain.chunk.created` events
3. Manually trigger re-embed by posting `ai.brain.chunk.created` events to Pub/Sub
