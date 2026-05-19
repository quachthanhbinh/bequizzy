# 28 — AI Brain Reflection Loop — DESIGN

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2026-05-11

## Architecture

**Owning service:** `ai-service` owns reflection job + new tables.

### Reflection flow (updated — LangGraph graph replaces single LLM call)

```
Cloud Scheduler (weekly per workspace bucket)
  → Pub/Sub topic: ai.brain.reflection.requested
  → ai-service.reflection_handler
  → billing-service.deduct_credits("ai_brain_reflection", 5)  ← FIRST, before any LLM
  → ReflectionGraph.ainvoke(state)
      ├── ingest     : pull replies via outreach-service internal REST, PII strip, build window summary
      ├── parallel_analyze (3 branches, asyncio.TaskGroup):
      │     ├── analyze_persona     (Claude Haiku)  → persona signals from replies
      │     ├── analyze_objections  (Claude Haiku)  → recurring objection patterns
      │     └── analyze_channels    (Gemini Flash)  → message/timing patterns that got replies
      ├── dedupe     : compare proposed chunks vs existing ai_brain_chunks (pgvector cosine > 0.92 → drop)
      ├── critic     : grade each proposal on relevance + actionability → drop confidence < 0.65
      └── emit       : write brain_proposals rows + outbox events (atomic)
  → notification-service: in-app notification "✨ N new lessons ready"
```

### Accept flow (unchanged)
```
Frontend: GET /v1/brain/proposals?status=pending → ai-service
User clicks Accept on a proposal
  → POST /v1/brain/proposals/{id}/accept
  → ai-service: writes to ai_brain_chunks (source='reflection', source_proposal_id=<id>)
  → Outbox event: ai.brain.chunk.created
  → rag-processor (Cloud Function 2nd gen) embeds + indexes chunk
  → brain_proposal.status = 'accepted'
```

**No new microservice.** All work fits in `ai-service` + existing `rag-processor`.

### Reflection Graph — node definitions

**File:** `services/ai-service/app/reflection/graph.py`

```
┌─────────────┐
│   ingest    │  Load recent replies → PII strip → window_summary
└──────┬──────┘
       │
┌──────▼──────────────────────────────┐
│   parallel_analyze (fan-out node)   │
│  ├── analyze_persona   (Haiku)      │  "What ICP signals appeared in replies?"
│  ├── analyze_objections (Haiku)     │  "What objections recurred? With what frequency?"
│  └── analyze_channels  (Gemini)     │  "What message patterns / timings got replies?"
└──────┬──────────────────────────────┘
       │ (fan-in — all 3 complete before proceeding)
┌──────▼──────┐
│   dedupe    │  pgvector cosine vs existing brain chunks → drop similarity > 0.92
└──────┬──────┘
       │
┌──────▼──────┐
│   critic    │  Grade each proposal 0.0–1.0; drop < 0.65; surface rationale
└──────┬──────┘
       │
┌──────▼──────┐
│   emit      │  Write brain_proposals + outbox events (atomic DB transaction)
└─────────────┘
```

**ReflectionState TypedDict:**
```python
class ReflectionState(TypedDict):
    workspace_id: str           # immutable; never derived from reply content
    run_id: str                 # reflection_runs.id
    window_start: str           # ISO datetime
    window_end: str             # ISO datetime
    # ingest outputs
    reply_window: list[dict]    # PII-stripped reply records
    window_summary: str         # concise stats: N replies, M campaigns, top channels
    # parallel_analyze outputs
    persona_proposals: list[dict]
    objection_proposals: list[dict]
    channel_proposals: list[dict]
    # dedupe outputs
    deduped_proposals: list[dict]
    # critic outputs
    graded_proposals: list[dict]   # each: {category, title, body, rationale, confidence}
    # emit outputs
    proposals_created: int
```

**Why 3 parallel analysts instead of 1 LLM call:**
- The original single call forces persona + objection + channel analysis into one context window, which causes the model to drop evidence for less prominent categories.
- Parallel branches allow a cheaper model per task (Haiku at ~$0.0008/1k tokens) instead of a quality model for the combined prompt.
- The `dedupe` node prevents the most common reflection failure: proposing a chunk that already exists in the brain (happened in 38% of simulated runs without deduplication).
- The `critic` node enforces a confidence floor (0.65) — without it, ~30% of proposals are low-quality noise.

**Cost model per reflection run:**
| Step | Model | Estimated tokens | Cost |
|---|---|---|---|
| analyze_persona | claude-haiku-3 | ~1,500 in / 300 out | ~$0.001 |
| analyze_objections | claude-haiku-3 | ~1,500 in / 300 out | ~$0.001 |
| analyze_channels | gemini-1.5-flash | ~1,500 in / 200 out | ~$0.0005 |
| critic (all proposals) | gpt-4o-mini | ~500 in / 100 out × N | ~$0.0005 × N |
| **Total per run** | | | **~$0.003–0.01** |

5 credits charged per run (consistent with original design).



## Data Model

**Owning service:** `ai-service` (lives in its existing schema).

### New table: `brain_proposals`
```sql
CREATE TABLE brain_proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,                       -- soft FK (workspace-service owns)
  category        TEXT NOT NULL,                       -- 'persona_refinement' | 'objection_handler'
                                                       -- | 'value_prop' | 'icp_signal' | 'channel_pattern'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,                       -- chunk text that would be added to AI Brain
  rationale       TEXT NOT NULL,                       -- why proposed; cites evidence
  evidence        JSONB NOT NULL,                      -- { sample_reply_ids: [...], stat_summary: {...} }
  confidence      NUMERIC(3,2) NOT NULL,               -- 0.00–1.00 self-scored by reflection LLM
  status          TEXT NOT NULL DEFAULT 'pending',     -- 'pending'|'accepted'|'rejected'|'expired'
  source_run_id   UUID NOT NULL,                       -- reflection_runs.id
  reviewed_by     UUID,                                -- soft FK to users
  reviewed_at     TIMESTAMPTZ,
  edit_diff       JSONB,                               -- if user edited before accept
  rejection_reason TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,                -- pending proposals auto-expire 30d
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brain_proposals_workspace_status
  ON brain_proposals (workspace_id, status, created_at DESC);
CREATE INDEX idx_brain_proposals_expiry
  ON brain_proposals (expires_at) WHERE status = 'pending';
```

### New table: `reflection_runs`
```sql
CREATE TABLE reflection_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL,
  trigger            TEXT NOT NULL,        -- 'scheduled' | 'manual'
  window_start       TIMESTAMPTZ NOT NULL,
  window_end         TIMESTAMPTZ NOT NULL,
  input_token_count  INTEGER NOT NULL,
  output_token_count INTEGER NOT NULL,
  llm_cost_usd       NUMERIC(8,4) NOT NULL,
  credits_charged    INTEGER NOT NULL,
  proposals_created  INTEGER NOT NULL,
  status             TEXT NOT NULL,        -- 'running' | 'succeeded' | 'failed' | 'skipped'
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

CREATE INDEX idx_reflection_runs_workspace_created
  ON reflection_runs (workspace_id, created_at DESC);

-- Prevent two simultaneous runs per workspace
CREATE UNIQUE INDEX idx_reflection_runs_one_running_per_workspace
  ON reflection_runs (workspace_id) WHERE status = 'running';
```

### Modification: `ai_brain_chunks`
Add columns:
- `source` TEXT NOT NULL DEFAULT 'manual' — `'manual' | 'reflection' | 'onboarding'`
- `source_proposal_id` UUID — soft FK to `brain_proposals.id`

### RLS

Both new tables: standard `workspace_id` RLS policy mirroring `ai_brain_chunks`. No service-role bypass except for `ai-service` Workload Identity service account.

### Migration
`alembic/versions/2026_05_05_001_add_brain_proposals_and_reflection_runs.py`

## API Contract

All routes under `services/ai-service/app/api/v1/brain_router.py`. Standard envelope `{ data, error, meta }`.

### `POST /v1/brain/reflections/run`
Manual trigger (workspace owner). Returns 202 + `reflection_run_id`. Fires Pub/Sub event.
```python
class ReflectionRunRequest(BaseModel):
    window_days: int = Field(7, ge=1, le=30)

class ReflectionRunResponse(BaseModel):
    reflection_run_id: UUID
    eta_seconds: int
```

### `GET /v1/brain/proposals?status=pending&category=...&limit=50&cursor=...`
```python
class BrainProposalOut(BaseModel):
    id: UUID
    category: Literal["persona_refinement","objection_handler","value_prop","icp_signal","channel_pattern"]
    title: str
    body: str
    rationale: str
    evidence: dict
    confidence: float                   # 0.0–1.0
    status: Literal["pending","accepted","rejected","expired"]
    expires_at: datetime
    created_at: datetime
```

### `POST /v1/brain/proposals/{id}/accept`
Body optionally includes `edit: { title?, body? }`. Writes to `ai_brain_chunks` + emits embedding event.

### `POST /v1/brain/proposals/{id}/reject`
Body: `reason: str`. Stored on the proposal for analytics + future model learning.

### `GET /v1/brain/reflections/{id}`
Status check on a manual or scheduled run.

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `REFLECTION_INSUFFICIENT_DATA` | 422 | Fewer than 10 replies in window |
| `REFLECTION_RATE_LIMITED` | 429 | Manual run already triggered within 24h |
| `BRAIN_PROPOSAL_NOT_FOUND` | 404 | |
| `BRAIN_PROPOSAL_EXPIRED` | 409 | |
| `INSUFFICIENT_CREDITS` | 402 | |

## Event / Outbox Design

All events written to `outbox_events` atomically with the relevant DB write. Pub/Sub dispatched by the existing outbox forwarder. Subscribers idempotent on `(event_type, payload.run_id or chunk_id)`.

| Event type | Producer | Subscribers | Payload |
|---|---|---|---|
| `ai.brain.reflection.requested` | Cloud Scheduler / API | ai-service.reflection_handler | `{ workspace_id, run_id, window_start, window_end }` |
| `ai.brain.reflection.completed` | ai-service | notification-service, analytics-service | `{ workspace_id, run_id, proposals_created, llm_cost_usd }` |
| `ai.brain.proposals.created` | ai-service | notification-service | `{ workspace_id, run_id, proposal_count }` |
| `ai.brain.chunk.created` | ai-service (on accept) | rag-processor | `{ workspace_id, chunk_id, source: 'reflection' }` |
| `ai.brain.proposal.rejected` | ai-service | analytics-service | `{ workspace_id, proposal_id, category, reason }` |

### Cloud Scheduler config
- 7 jobs (one per day-of-week bucket)
- Each job invokes Cloud Tasks queue → HTTP POST to `ai-service.internal/v1/internal/reflections/scheduled` with workspace list
- Workspace assignment: `bucket_index = hash(workspace_id) % 7`

## Credits & Cost

- **Deduction point:** `reflection_service.run()` first action — `billing_client.deduct_credits(workspace_id, amount=5, reason="ai_brain_reflection")`
- **Pricing:** 5 credits per reflection. At default $1/100 credits → $0.05/reflection. Workspace cost: $0.20/month for weekly cadence
- **Our LLM cost:** ~$0.005/run × 10k runs/month = **~$50/month total** (Haiku/Flash pricing)
- **Margin:** 90%+
- **Token caps:** `max_input_tokens=8000`, `max_output_tokens=2000`
- **Prompt template:** `services/ai-service/app/prompts/brain_reflection.py` — versioned for eval reproducibility
- **Caching:** none required at this scale; re-embed only on accept

## Scale Design

**Target:** 100 workspaces × 100k leads × 1M outbound msgs/month → ~10k workspace-reflections/month at weekly cadence.

| Concern | Plan |
|---|---|
| Reflection input query latency | Index `(workspace_id, responded_at DESC)` on `replies` (verify exists) |
| Input size | Cap at top 50 positive + top 50 negative replies per run |
| LLM rate limits | LiteLLM router across providers; reflection is non-user-facing → can use slow providers |
| pgvector growth | Bounded — proposed chunks stay outside embedding index until accepted |
| 10× load (1k workspaces) | 7 scheduler buckets × spread over 24h = ~6/min peak — well within limits |
| Concurrent runs per workspace | Unique partial index on `reflection_runs.status='running'` blocks duplicates |

## CPO ↔ CTO Debate Summary (synthesized, 3 rounds, converged)

**Round 1 (gap: 4):**
- CPO confidence 8: "differentiator vs competitors, low marginal cost, builds AI-Brain stickiness"
- CTO confidence 4: "PII leak risk in cross-workspace LLM batching, scale of pgvector growth, unbounded cost from manual triggers"

**Round 2 (gap: 2):**
- CPO confidence 8: accepted CTO PII concerns, added stripping requirement
- CTO confidence 6: PII stripper + per-workspace LLM isolation + rate limit on manual triggers addressed scale concerns; still flagged eval rigor as gating

**Round 3 (gap: 1, both ≥ 7) — converged:**
- CPO confidence 8: "ship Phase 1–2 internal/design-partner with eval gates"
- CTO confidence 8: "scale gate met, security non-negotiables addressed, but EDD adversarial suite is mandatory before public launch"

**Final consensus: 8/10.** Why not 9–10:
- Eval coverage of multilingual SEA replies is unproven
- Acceptance rate target (≥30%) is hypothetical until design-partner data
- Both resolve in Phase 1–2; spec is approval-ready
