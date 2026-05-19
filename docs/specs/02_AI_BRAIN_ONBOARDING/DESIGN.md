# 02 — AI Brain Onboarding — DESIGN

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2026-05-04

## Architecture

**Owning services:** `ai-service` (synthesis + chunking) + `workspace-service` (wizard state)

```
[Frontend wizard modal]
  │ POST /v1/brain/wizard
  ▼
[api-gateway] ──OIDC──►
[ai-service]
  ├── Validate credits (billing-service)
  ├── Deduct 2 credits
  ├── Build synthesis prompt with 5 wizard answers
  ├── LiteLLM call (GPT-4o-mini — cheap + fast)
  ├── Parse → BusinessProfileDocument schema
  ├── Write workspace_knowledge_docs row
  ├── Write ai_brain_chunks rows (3–5 chunks)
  ├── Write outbox event: ai.brain.chunk.created (×N)
  └── Write outbox event: brain.wizard.completed

[rag-processor — Cloud Function 2nd gen]
  └── Consumes ai.brain.chunk.created
      → text-embedding-3-small (1536-dim)
      → upsert pgvector
```

**Wizard state** lives in `workspace-service` (it owns workspace context). AI synthesis lives in `ai-service`.

## Data Model

### In `workspace-service` schema
```sql
CREATE TABLE onboarding_wizard_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL UNIQUE,          -- one per workspace
  status          TEXT NOT NULL DEFAULT 'not_started',  -- 'not_started'|'in_progress'|'completed'|'skipped'
  answers         JSONB NOT NULL DEFAULT '{}',   -- { q1: "...", q2: "...", ... }
  completed_at    TIMESTAMPTZ,
  skipped_at      TIMESTAMPTZ,
  run_count       INTEGER NOT NULL DEFAULT 0,    -- re-runs increment
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### In `ai-service` schema
```sql
CREATE TABLE workspace_knowledge_docs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  doc_type        TEXT NOT NULL DEFAULT 'business_profile',  -- 'business_profile'|'manual'|'url'
  source          TEXT NOT NULL DEFAULT 'wizard',            -- 'wizard'|'upload'|'reflection'
  version         INTEGER NOT NULL DEFAULT 1,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_brain_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  doc_id          UUID NOT NULL REFERENCES workspace_knowledge_docs(id),
  chunk_text      TEXT NOT NULL,
  embedding       vector(1536),                  -- pgvector
  source          TEXT NOT NULL DEFAULT 'wizard',
  source_proposal_id UUID,                       -- spec 28 reflection proposals
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brain_chunks_workspace ON ai_brain_chunks(workspace_id);
CREATE INDEX idx_brain_chunks_embedding ON ai_brain_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Migration
`alembic/versions/2026_05_05_002_add_ai_brain_onboarding_tables.py`

## API Contract

### `POST /v1/brain/wizard`
Submit completed wizard. Returns immediately with `doc_id`; embedding is async.
```python
class WizardSubmitRequest(BaseModel):
    answers: dict[str, str]  # keys: company, icp, value_prop, objections, tone
    # Each value max 2000 chars

class WizardSubmitResponse(BaseModel):
    doc_id: UUID
    chunks_created: int
    embedding_status: Literal["queued"]
    credits_used: int  # always 2
```

### `GET /v1/brain/status`
Readiness indicator for dashboard badge.
```python
class BrainStatusResponse(BaseModel):
    status: Literal["ready", "processing", "empty"]
    chunk_count: int
    last_updated: datetime | None
```

### `GET /v1/brain/wizard/state`
Fetch current wizard progress (for resume/re-run).

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `WIZARD_ALREADY_COMPLETED` | 409 | Re-run path must use force=true |
| `INSUFFICIENT_CREDITS` | 402 | Show upgrade CTA |
| `WIZARD_ANSWER_TOO_SHORT` | 422 | Trigger clarifying follow-up |

## Wizard State Machine

```
NOT_STARTED
  │ user opens dashboard
  ▼
IN_PROGRESS (wizard modal open)
  │ user completes all 5 questions + submits
  ▼
COMPLETED ── re-run from settings ──► IN_PROGRESS (run_count++)
  │ user clicks skip
  ▼
SKIPPED
  └─ reminder banner shown until COMPLETED
```

## Synthesis Prompt Design

Prompt template versioned as `BRAIN_WIZARD_SYNTHESIS_V1` in `services/ai-service/app/prompts/brain_wizard.py`.

**System:** "You are a B2B sales intelligence engine. Generate a structured Business Profile from the answers below. Output valid JSON matching the BusinessProfileDocument schema."

**Input structure:** Each answer is labeled and wrapped in `<answer label="company">...</answer>` tags to prevent prompt injection bleeding across fields.

**Output schema:** validated by Pydantic before any DB write.

## Event / Outbox Design

| Event | Producer | Subscribers | Payload |
|---|---|---|---|
| `brain.wizard.completed` | ai-service | analytics-service, notification-service (welcome sequence trigger) | `{ workspace_id, doc_id, run_count }` |
| `ai.brain.chunk.created` | ai-service (N events) | rag-processor (embed + index) | `{ workspace_id, chunk_id, source: 'wizard' }` |

## Scale Design

| Concern | Plan |
|---|---|
| LLM latency | GPT-4o-mini ~1–2s; acceptable for one-time wizard |
| pgvector index | ivfflat with lists=100; rebuild quarterly or at 100k chunks/workspace |
| Concurrent wizards | Stateless — no locking needed; `onboarding_wizard_state` unique on workspace_id |
| Embedding queue | rag-processor is Cloud Function — concurrency=100; no queue backlog for wizard scale |

## CPO ↔ CTO Debate Summary

**Round 1 (gap: 3):**
- CPO 8: "wizard must complete in <3 min; streaming response would be ideal UX"
- CTO 5: "streaming from LiteLLM through FastAPI to browser adds complexity; pgvector embed is async anyway so streaming the synthesis text adds no value"

**Round 2 (converged, both 8):**
- Both 8: standard request/response for synthesis; async embed with in-UI "Processing..." → "Ready" status poll. Streaming deferred to v2.

**Final: 8/10.** Why not 9: clarifying follow-up UX (when to trigger, how many rounds) needs UX validation. Propose 1-round cap; revisit with user testing.
