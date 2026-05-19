# 39 — AI Brain Knowledge Harvester — DESIGN

**Status:** 🔍 In Review
**Confidence:** 8/10
**Last updated:** 2026-05-18

## Architecture

**Owning service:** `ai-service` — owns sessions, synthesis, ingestion, hard-delete.
**Touches:** `billing-service` (HTTP — credit deduction, same pattern as Spec 02), `workspace-service` (read-only `workspaces.region` check via cached lookup), `notification-service` (optional via outbox subscriber).

```
                ┌───────────────────────────────────────────────┐
                │            apps/portal (Next.js)             │
                │  /ai-brain (existing)  +  /ai-brain/harvester │
                │  • Topic-start modal                          │
                │  • Chat UI (SSE consumer)                     │
                │  • Draft preview + commit/iterate/delete     │
                │  • Drafts tab on AI Brain page                │
                └───────────────────┬───────────────────────────┘
                                    │ JWT
                          ┌─────────▼──────────┐
                          │    api-gateway     │
                          └─────────┬──────────┘
                       OIDC + X-Workspace-ID
                                    │
              ┌─────────────────────▼─────────────────────────┐
              │                ai-service                     │
              │  ┌─────────────────────────────────────────┐  │
              │  │ /v1/brain/harvester/* router            │  │
              │  └────────────┬────────────────────────────┘  │
              │               │                               │
              │  ┌────────────▼─────────────┐                 │
              │  │ harvester_session_service │ ← state machine │
              │  │   (create/get/list/      │   credits caps  │
              │  │    delete/transitions)   │   consent gate  │
              │  └────────────┬─────────────┘                 │
              │               │                               │
              │  ┌────────────▼─────────────┐                 │
              │  │ harvester_chat_service   │                 │
              │  │  SINGLE PURPOSE:         │                 │
              │  │  extract knowledge only  │                 │
              │  │  — never answer, advise  │                 │
              │  │  — redirect if asked     │                 │
              │  │  • probe_turn (SSE)      │  → LiteLLM      │
              │  │  • synthesize (SSE)      │   FAST/QUALITY  │
              │  │  • rewrite (re-synth)    │                 │
              │  └────────────┬─────────────┘                 │
              │               │                               │
              │  ┌────────────▼──────────────────┐            │
              │  │ commit path                   │            │
              │  │  → WorkspaceKnowledgeDoc      │            │
              │  │  → chunk_and_embed_document() │ (reused)   │
              │  │  → AIOutboxEvent              │ (reused)   │
              │  └───────────────────────────────┘            │
              └────────────────┬───────────────┬──────────────┘
                               │               │
              ┌────────────────▼────────┐   ┌──▼──────────────────┐
              │ billing-service         │   │ outbox publisher    │
              │ /internal/credits/      │   │ → Pub/Sub topics    │
              │   deduct                │   │   ai.brain.*        │
              └─────────────────────────┘   │   harvester.session.│
                                            └─────────────────────┘
```

**Bounded-context justification:** Knowledge docs + chunks + embeddings + outbox already live in `ai-service`. Sessions logically belong with their synthesis output. No SQLAlchemy model imported from another service. `workspaces.region` lookup goes through `workspace_client.get_region(workspace_id)` (HTTP, Memorystore-cached for 60s) — not a direct DB read.

**Additional v1 services (knowledge capture expansion):**
- `harvester_template_service.py` — reads `ai_harvester_topic_templates`, injects `seed_questions` + `system_prompt_fragment` into probe system prompts. No external calls.
- `harvester_reflection_service.py` — reads committed `workspace_knowledge_docs` titles/summaries via existing `brain.py` query helpers, calls LiteLLM fast model (gpt-4o-mini), returns gap suggestion list, writes `harvester.reflection.completed` outbox event.

## Probe System Prompt — Single Purpose Mandate

Every call to `harvester_chat_service.probe_turn()` uses a system prompt that begins with the following non-negotiable preamble (language-localised via a separate translate step if needed):

```
You are a Business Knowledge Analyst conducting a structured interview.
Your ONLY job is to extract knowledge from the person you are interviewing and record it accurately.

HARD RULES — never break these:
1. You NEVER answer questions. If the user asks you a question (e.g. "What should my ICP look like?",
   "What's a good pricing strategy?"), you must:
   a. Acknowledge briefly: "I'm here to capture YOUR knowledge, not share mine."
   b. Redirect: "Let me ask you: [related probing question]."
   You must NOT answer, suggest, advise, or generate any content the user did not provide.
2. You ask EXACTLY 1–2 follow-up questions per turn, never more.
3. You stay on the declared topic: "{topic}". Do not stray.
4. You never invent, assume, or extrapolate facts the user has not stated.
5. You do not summarise or synthesise during the interview — that happens at Synthesize time.

Your only outputs are: probing questions to extract more knowledge, or brief acknowledgements + a redirect.
```

The template `system_prompt_fragment` (if present) is appended AFTER this preamble to add topic-specific question guidance. It may NOT override the hard rules above.

## Data Model

**Owning service:** `ai-service`

### New table — `ai_harvester_sessions`
```sql
CREATE TABLE ai_harvester_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL,
  user_id             UUID NOT NULL,
  topic               TEXT NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 80),
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','draft','committed','deleted')),
  messages            JSONB NOT NULL DEFAULT '[]'::jsonb,
  draft_markdown      TEXT,
  draft_version       INTEGER NOT NULL DEFAULT 0,
  draft_history       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{version, markdown, ts}]
  committed_doc_id    UUID,                                  -- soft FK → workspace_knowledge_docs.id
  turn_count          INTEGER NOT NULL DEFAULT 0,
  synthesis_count     INTEGER NOT NULL DEFAULT 0,
  mode                TEXT NOT NULL DEFAULT 'chat'
                        CHECK (mode IN ('chat','dump')),
  template_id         UUID,                                  -- soft FK → ai_harvester_topic_templates.id
  language_hint       TEXT,                                  -- detected from first user turn
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at        TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_harvester_sessions_user_recent
  ON ai_harvester_sessions (workspace_id, user_id, updated_at DESC)
  WHERE status IN ('active','draft');

CREATE INDEX idx_harvester_sessions_cleanup
  ON ai_harvester_sessions (status, updated_at)
  WHERE status IN ('active','draft');
```

#### `messages` JSONB element schema
```json
{
  "role": "user" | "assistant" | "system",
  "content": "string",
  "turn_id": "client-uuid",          // user-provided for idempotency; null for system/assistant
  "credits_charged": 0,               // always 0 — harvester is always free
  "ts": "2026-05-18T10:00:00Z"
}
```

#### JSONB append pattern (mirrors Spec 38)
```sql
UPDATE ai_harvester_sessions
   SET messages      = messages || $delta::jsonb,
       turn_count    = turn_count + 1,
       updated_at    = NOW()
 WHERE id            = $session_id
   AND workspace_id  = $workspace_id::uuid;
```
Atomicity: append + outbox event written in the same SQLAlchemy `AsyncSession.begin()` block.

### New table — `consent_log`
```sql
CREATE TABLE consent_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  user_id       UUID NOT NULL,
  consent_type  TEXT NOT NULL,            -- 'ai_data_processing'
  source        TEXT NOT NULL,            -- 'harvester' (others later)
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_consent_log_active
  ON consent_log (workspace_id, user_id, consent_type)
  WHERE revoked_at IS NULL;

### New table — `ai_harvester_topic_templates`
```sql
CREATE TABLE ai_harvester_topic_templates (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID,                -- NULL = system-wide; non-NULL = workspace-custom (v2)
  name                     TEXT NOT NULL,
  description              TEXT,
  topic_slug               TEXT NOT NULL,
  tags                     TEXT[] NOT NULL DEFAULT '{}',
  seed_questions           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{order: int, question: str}]
  system_prompt_fragment   TEXT,               -- injected into AI probe prompt when template selected
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_templates_slug_global
  ON ai_harvester_topic_templates (topic_slug)
  WHERE workspace_id IS NULL;

CREATE INDEX idx_templates_active_sorted
  ON ai_harvester_topic_templates (sort_order, name)
  WHERE is_active = TRUE;
```

**V1 system templates — seeded by `services/ai-service/scripts/seed_harvester_templates.py`:**

| sort_order | topic_slug | name |
|---|---|---|
| 1 | `icp` | Ideal Customer Profile (ICP) |
| 2 | `objections` | Objection Handling Playbook |
| 3 | `pricing` | Pricing & Packaging |
| 4 | `brand_voice` | Brand Voice & Tone |
| 5 | `competitive` | Competitive Positioning |
| 6 | `sales_playbook` | Sales Playbook & Process |
| 7 | `product_usps` | Product USPs & Differentiators |
| 8 | `onboarding` | Customer Onboarding Process |
```

### RLS (mirrors Spec 38)
```sql
ALTER TABLE ai_harvester_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY harvester_sessions_owner_only ON ai_harvester_sessions
  AS RESTRICTIVE
  USING (
    workspace_id = current_setting('app.workspace_id', TRUE)::uuid
    AND user_id  = current_setting('app.user_id', TRUE)::uuid
  );

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_log_workspace_isolation ON consent_log
  AS RESTRICTIVE
  USING (workspace_id = current_setting('app.workspace_id', TRUE)::uuid);
```

### Migrations
- `services/ai-service/alembic/versions/YYYY_MM_DD_NNN_add_ai_harvester_sessions.py`
- `services/ai-service/alembic/versions/YYYY_MM_DD_NNN_add_consent_log.py`

`OWNED_TABLES` in `services/ai-service/alembic/env.py` extended to:
```python
OWNED_TABLES = {
    "workspace_knowledge_docs", "ai_brain_chunks", "ai_outbox_events",
    "advisor_notifications", "ai_advisor_sessions",
    "ai_harvester_sessions", "consent_log",
}
```

## State Machine

```
                ┌────────────┐
   start ────▶  │   active   │ ◀──────────────────┐
                └─────┬──────┘                    │
                      │ "synthesize"              │ "continue chatting"
                      ▼                           │
                ┌────────────┐                    │
                │   draft    │ ────────────────── ┤
                └─────┬──────┘  "re-synthesize"   │
                      │         (version++)       │
        "commit"      │            ┌──────────────┘
                      ▼
                ┌────────────┐
                │ committed  │
                └─────┬──────┘
                      │ "delete from AI Brain"
                      ▼
                ┌────────────┐
                │  deleted   │   (terminal — row hard-deleted)
                └────────────┘

   any non-deleted state ──"delete"──▶ deleted
```

Implemented in `harvester_session_service.py:transition(session, action)`. Invalid action → `AppError("INVALID_STATE_TRANSITION", ..., 422)` with `{current_state, attempted_action, allowed_actions}` in error payload.

**`mode='dump'` shortcut:** Dump sessions skip all `turn` calls. The `dump` action directly replaces `synthesize`:
```
   active (mode='dump') ──“dump”──► draft  → commit → committed
                                               ↓ delete  → deleted
```
- `POST /turn` on a dump session → `422 MODE_MISMATCH`
- `POST /dump` on a chat session → `422 MODE_MISMATCH`

## API Contract

All routes under `services/ai-service/app/api/v1/harvester.py`. Standard envelope `{ data, error, meta }`. Auth: JWT → `get_workspace_id()` + `get_current_user()` dependencies (existing).

### `POST /v1/brain/harvester/sessions`
Create a new session. Required: `topic`. Auto-detects language from topic; seeds welcome turn (no credit charge for the seed).

```python
class CreateSessionRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=80)
    language_hint: str | None = None   # ISO 639-1, optional; auto-detected if omitted

class HarvesterSessionResponse(BaseModel):
    id: uuid.UUID
    topic: str
    status: Literal["active","draft","committed","deleted"]
    turn_count: int
    synthesis_count: int
    draft_version: int
    messages: list[dict]         # always returned; capped at last 50 in list endpoint
    draft_markdown: str | None
    committed_doc_id: uuid.UUID | None
    created_at: str
    updated_at: str
```

### `GET /v1/brain/harvester/sessions?status=active,draft&limit=20&cursor=...`
List sessions for the authenticated user. Cursor pagination on `updated_at` (matches Spec 38).

### `GET /v1/brain/harvester/sessions/{id}`
Full session with messages + current draft.

### `GET /v1/brain/harvester/sessions/{id}/draft?version=N`
Fetch a specific historical draft version (from `draft_history`).

### `POST /v1/brain/harvester/sessions/{id}/turn` — **SSE**
The hot path. Streams the AI's probing reply.

**Request:**
```json
{
  "turn_id": "client-uuid",       // idempotency key
  "message": "string (1..4000 chars)"
}
```

**Response: `text/event-stream`**
```
event: meta
data: {"credits_charged": 0, "model": "gpt-4o-mini"}  // harvester is always free

event: delta
data: {"text": "That's interesting. What "}

event: delta
data: {"text": "happens when X goes wrong?"}

event: done
data: {"turn_id": "client-uuid", "assistant_message_index": 7, "credits_spent_total": 0}
```

On error:
```
event: error
data: {"code": "SESSION_TURN_CAP" | "CONSENT_REQUIRED" | ..., "message": "..."}
```
HTTP status remains 200 once streaming has begun; errors are propagated as `event: error` then the stream closes. Before streaming starts (pre-flight validation failure: invalid state, turn cap, rate limit), normal HTTP error codes apply. `INSUFFICIENT_CREDITS` is never returned — harvester is always free.

**Idempotency:** server checks last 10 messages for `turn_id`; if found, replays the existing assistant message (as a single `delta` then `done`) without charging credits.

### `POST /v1/brain/harvester/sessions/{id}/synthesize` — **SSE**
Triggers synthesis. Pre-conditions: status `active`, `synthesis_count < 3`. No credit pre-check — harvester is always free.

Same SSE event types; the `delta` events stream the markdown document. On `done`, the session status is `draft`, `draft_version` incremented, `draft_markdown` populated, `draft_history` appended.

### `POST /v1/brain/harvester/sessions/{id}/commit`
Promote `draft` → `committed`. Synchronous (chunk/embed are in-process and fast for ≤100KB docs).

**Response:**
```python
class CommitResponse(BaseModel):
    session_id: uuid.UUID
    committed_doc_id: uuid.UUID
    chunks_created: int
```

### `POST /v1/brain/harvester/sessions/{id}/resume`
Transition `draft` → `active` (user wants to keep chatting). Idempotent.

### `DELETE /v1/brain/harvester/sessions/{id}`
Hard-delete. If `committed_doc_id` is set, deletes the `workspace_knowledge_docs` row first (CASCADE purges `ai_brain_chunks`), then deletes the session row. Both in one transaction with an outbox event.

**Response:** `204 No Content`.

### `POST /v1/internal/harvester/cleanup` (cron-only, OIDC restricted)
Hard-deletes idle drafts older than 30 days. Called by Cloud Scheduler.

### `GET /v1/brain/harvester/templates`
Returns all active system templates ordered by `sort_order`. No credit charge.

```python
class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    topic_slug: str
    tags: list[str]
    seed_questions: list[dict]   # [{order: int, question: str}]
```

### `POST /v1/brain/harvester/sessions/{id}/dump` — **SSE**
Dump-mode-only endpoint. Submits raw content (up to 10,000 chars); AI synthesises immediately and streams result to `draft`.

**Request:**
```json
{
  "content": "string (1..10000 chars)"
}
```

Pre-conditions: `mode='dump'`, status `active`, `synthesis_count < 3`. No credit pre-check — harvester is always free.

On `done`: session enters `draft`, `draft_version` incremented, `draft_markdown` set, `draft_history` appended. Identical SSE event format (`meta` / `delta` / `done` / `error`) to `/synthesize`.

### `POST /v1/brain/harvester/reflect`
On-demand AI Brain gap analysis for the authenticated workspace.

**Request:** empty body.

**Response:**
```python
class ReflectResponse(BaseModel):
    suggestions: list[ReflectSuggestion]
    reason: str | None   # 'NO_BRAIN_CONTENT' when workspace has zero committed docs

class ReflectSuggestion(BaseModel):
    topic: str
    reasoning: str
    priority: Literal["high", "medium", "low"]
    related_doc_titles: list[str]
```

Credits: **always free** — no credits charged regardless of scan result.

### `POST /v1/internal/harvester/reflect-all` (cron-only, OIDC restricted)
Iterates every workspace with `ai_brain_harvester_enabled=true` and ≥ 1 committed harvester doc; calls `reflect` for each; emits `harvester.reflection.completed` outbox event per workspace for notification-service to send in-app notification.

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `SESSION_NOT_FOUND` | 403 | Not found OR not owned by user (no enumeration) |
| `INVALID_STATE_TRANSITION` | 422 | Action not allowed in current state |
| `SESSION_TURN_CAP` | 422 | 30 turns hit |
| `SESSION_SYNTHESIS_CAP` | 422 | 3 syntheses hit |
| `RATE_LIMITED` | 429 | 20 sessions/day/workspace |
| ~~`INSUFFICIENT_CREDITS`~~ | ~~402~~ | *(never returned — harvester is always free)* |
| `CONSENT_REQUIRED` | 412 | SEA workspace, no `consent_log` row |
| `TOPIC_TOO_LONG` | 422 | Topic > 80 chars |
| `MESSAGE_TOO_LONG` | 422 | Message > 4000 chars |
| `TEMPLATE_NOT_FOUND` | 422 | Unknown or inactive `template_id` supplied |
| `MODE_MISMATCH` | 422 | `/turn` called on dump session, or `/dump` called on chat session |
| `DUMP_CONTENT_TOO_LONG` | 422 | Dump content > 10,000 chars |

## Event / Outbox Design

All events written atomically with their business write into `ai_outbox_events`.

| Event type | Producer | Subscribers | Payload |
|---|---|---|---|
| `harvester.session.created` | ai-service | analytics-service | `{ workspace_id, session_id, user_id, topic, mode, template_id }` |
| `harvester.session.committed` | ai-service | analytics-service, notification-service (optional) | `{ workspace_id, session_id, doc_id, chunk_count, synthesis_count }` |
| `harvester.session.deleted` | ai-service | analytics-service (audit) | `{ workspace_id, session_id, was_committed, committed_doc_id, deletion_source }` |
| `ai.brain.chunk.created` | ai-service (×N) | reflection-loop (Spec 28) | `{ workspace_id, chunk_id, source: 'harvester' }` (reused — must add `source: 'harvester'` enum value) |
| `harvester.reflection.completed` | ai-service | notification-service, analytics-service | `{ workspace_id, suggestion_count, top_topics: str[], triggered_by: 'cron'|'manual' }` |

## Credits & Cost

**All harvester operations are always free** — see PRD §Credits & billing.

- **LLM reporting:** `billing-service` is still called with `amount=0` and `reason='harvester_probe'` / `'harvester_synthesis'` / `'harvester_dump'` / `'harvester_reflect'` for analytics and COGS tracking. It never rejects with `402` for harvester operations.
- **Per-session worst-case LLM COGS:** 30 probes × ~$0.0008 (gpt-4o-mini, 3k in / 800 out) + 3 syntheses × ~$0.036 (Claude Sonnet, 16k in / 4k out) ≈ **$0.13/session** at hard cap. This is the investment per owner who fully exhausts a session.
- **Token caps (server-enforced via LiteLLM `max_tokens`):**
  - Probe turn: 8k input / 800 output
  - Synthesis / dump: 16k input / 4k output
  - Reflect: 4k input / 500 output
- **Sliding context window:** last 20 turns OR 12k tokens (whichever lower) sent per probe call. Older turns dropped. Prevents unbounded context cost.
- **Why free?** Knowledge capture is an investment: a richer AI Brain directly increases AI output quality across campaigns, replies, and advisor — multiplying the value of every paid credit used elsewhere. We spend the LLM budget here on extraction, not on answering owner questions.

## Scale Design

**Target:** 100 workspaces × 100k leads × 1M outbound msgs/month from day one.

| Concern | Plan |
|---|---|
| Concurrent SSE streams | Only owners initiate; ~100 max concurrent across all workspaces. Cloud Run min instances 1, max 50, concurrency 80. Comfortable. |
| Session row size | 30 turns × ~2KB avg = 60KB JSONB per row. Even 1000 active sessions = 60MB — trivial. |
| Conversation context per LLM call | Sliding window: last 20 turns (or 12k tokens, whichever lower). Older turns dropped (or summarised into a single `system` note for synthesis only). Prevents unbounded context growth. |
| Embedding write throughput | ≤ 10 chunks per commit; batched into one `litellm.aembedding` call (already the pattern in `ingestion.py`). |
| pgvector size | 100 workspaces × ~20 harvester docs × 10 chunks = 20k vectors. Existing ivfflat index handles 100k+. |
| Daily cron `harvester-draft-cleanup` | DELETE with index on `(status, updated_at)`. At 1000 rows/day worst-case, < 100ms. |
| Outbox backlog | Reuses existing `ai_outbox_events` publisher; no new pressure. |
| 10× load (1000 workspaces) | Bottleneck becomes LLM throughput, not infra. Already paying per-token. |

**No scale-gate violation.** CTO scale-cap NOT applied.

## CPO ↔ CTO Debate Summary

**Round 1 — gap 1.** CPO 7 (open: Drafts clutter UX, diff-view), CTO 6 (open: SSE net-new, consent_log table absence, hard-delete-of-embeddings verification).

**Round 2 — converged.** CPO 8: accepts Drafts tab + 30-day idle cron, defers diff-view to v2, scopes consent contract into this spec. CTO 8: confirms `ON DELETE CASCADE` on `ai_brain_chunks.doc_id` already covers embedding purge, accepts adding minimal `consent_log` table here, downgrades SSE risk (sse-starlette is known-quantity).

**Final consensus: 8/10.** Why not 9–10: residual LLM-quality unknowns (rewrite-don't-append behaviour) measured only by EDD baseline + first SSE smoke test on Cloud Run.
