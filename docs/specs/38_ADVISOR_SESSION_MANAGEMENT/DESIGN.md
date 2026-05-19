# Spec 38 — AI Advisor Session Management — DESIGN

**Status:** ✅ Approved
**Confidence:** 10/10 (CPO 9 / CTO 9 — all 3 parts, resolved 2026-05-14 after targeted confidence debate)
**Services affected:** `ai-service` (backend), `apps/portal` (frontend)
**Security flag:** 🟡 MEDIUM

---

## 1. Architecture Overview

### Core Principle: Two Concerns, Two Tools

The debate converged on a **constrained hybrid** approach that separates two distinct concerns:

| Concern | Tool | Rationale |
|---|---|---|
| **In-session LangGraph graph state** (tool calls, routing decisions, critique cycles) | `AsyncPostgresSaver` checkpointer (LangGraph-native) | Required for correct multi-turn graph execution; stores serialised Python objects not suited for user-facing queries |
| **Durable portable message history** (user+AI turns only) | `ai_advisor_sessions.messages` JSONB (our table, our control) | User-readable; survives LangGraph version upgrades; queryable without deserialising graph state; matches existing `retrieve_node` cold-start path |

This is NOT Option C (dual-write for redundancy). The two mechanisms store different things and serve different read patterns.

### Data Flow Diagram

```
POST /v1/advisor/chat
          │
          ▼
   advisor_chat.py
          │ ← auto-create session if session_id is null (write to ai_advisor_sessions)
          │
          ▼
   LangGraph graph.ainvoke(state, config={thread_id: "ws_id/session_id"})
          │
   ┌──────▼──────────────────────────────┐
   │ classify → retrieve → tool_call      │
   │          → synthesize → critique     │
   └──────┬──────────────────────────────┘
          │
          ▼
   finalize_node (MODIFIED)
     1. Append user+AI messages to LangGraph session_history (existing)
     2. UPDATE ai_advisor_sessions SET
            messages = messages || new_messages::jsonb,
            message_count = message_count + 2,
            updated_at = NOW()
        WHERE id = session_id AND workspace_id = workspace_id  ← workspace scope enforced
     3. If title IS NULL AND message_count == 0 (first turn):
            task = asyncio.create_task(generate_session_title(session_id, workspace_id, first_message))
            app.state.title_tasks.add(task)                  # task registry for lifecycle drain
            task.add_done_callback(app.state.title_tasks.discard)
          ↑ fire-and-forget; does NOT block HTTP response
          │ Task is registered so the lifespan shutdown drains it (prevents credit-without-title leak)
          │
          └─ generate_session_title():
               a. billing_service.deduct_credits(workspace_id, amount=1, operation="advisor_title")
               b. If deduction fails → UPDATE title = "Chat on {date}", return
               c. LiteLLM (gpt-4o-mini): "Summarise this message as a 6-word chat title: {message}"
               d. UPDATE ai_advisor_sessions SET title = generated_title WHERE id = session_id
          │
   LangGraph AsyncPostgresSaver saves checkpoint (always-on)
          │
          ▼
   HTTP response: { session_id, response, sources, action }
```

### Session CRUD Flow

```
GET  /v1/advisor/sessions
  → SELECT id, title, status, message_count, created_at, updated_at
    FROM ai_advisor_sessions
    WHERE workspace_id = $ws AND user_id = $uid AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 20 OFFSET $cursor

POST /v1/advisor/sessions
  → Check active session count for (workspace_id, user_id)
  → If count >= 100: archive oldest (status = 'archived', log warning)
  → INSERT INTO ai_advisor_sessions (workspace_id, user_id, status, messages, message_count)
  → Return {id, title: null, status: 'active', message_count: 0, created_at}

GET  /v1/advisor/sessions/{id}
  → SELECT * FROM ai_advisor_sessions WHERE id = $id AND workspace_id = $ws AND user_id = $uid
  → 403 if not found (prevents enumeration; treats missing and unauthorized as identical)

PATCH /v1/advisor/sessions/{id}
  → Update title (rename) or status (archive)
  → 403 if session.user_id != requesting user_id

DELETE /v1/advisor/sessions/{id}
  → UPDATE status = 'archived' (soft-delete; never hard-delete)
  → 403 if session.user_id != requesting user_id
```

---

## 2. Database Changes

**Owning service:** `ai-service`

### Current schema (`ai_advisor_sessions`)
```sql
id           UUID PK
workspace_id UUID NOT NULL
user_id      UUID NOT NULL
messages     JSONB NOT NULL DEFAULT '[]'
context      JSONB
created_at   TIMESTAMPTZ NOT NULL
updated_at   TIMESTAMPTZ
```

### New columns (migration)
```sql
ALTER TABLE ai_advisor_sessions
  ADD COLUMN title         TEXT,                          -- auto-generated or user-set; null until first title run
  ADD COLUMN status        TEXT NOT NULL DEFAULT 'active', -- active | archived
  ADD COLUMN message_count INTEGER NOT NULL DEFAULT 0;    -- increment on each turn; avoids jsonb_array_length() in list query
```

### New index
```sql
CREATE INDEX idx_advisor_sessions_user_recent
  ON ai_advisor_sessions(workspace_id, user_id, updated_at DESC)
  WHERE status = 'active';
```

### JSONB append pattern
Use delta-only append — do NOT read the full JSONB in Python and write it back:
```sql
UPDATE ai_advisor_sessions
   SET messages      = messages || $new_messages::jsonb,
       message_count = message_count + 2,
       updated_at    = NOW()
 WHERE id = $session_id
   AND workspace_id  = $workspace_id::uuid   -- workspace scope: defence in depth
```
Where `$new_messages` is a 2-element JSON array `[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]`.

### `messages` JSONB element schema
```json
{
  "role": "user" | "assistant",
  "content": "string",
  "sources": ["string"],          // assistant only; omit for user
  "action": { ... } | null,       // assistant only; omit for user
  "ts": "2026-05-14T10:00:00Z"    // ISO8601 UTC timestamp
}
```

### RLS Policy
```sql
-- ai-service sets app.workspace_id and app.user_id via SET LOCAL before queries
CREATE POLICY advisor_sessions_owner_only ON ai_advisor_sessions
  AS RESTRICTIVE
  USING (
    workspace_id = current_setting('app.workspace_id', TRUE)::uuid
    AND user_id  = current_setting('app.user_id', TRUE)::uuid
  );
```
Note: `TRUE` as second arg to `current_setting()` returns NULL instead of raising an error when the variable is not set (e.g. from admin tooling). The query will return no rows, which is safe.

### Alembic migration filename
`add_session_mgmt_fields_to_ai_advisor_sessions`
File path: `alembic/versions/YYYY_002_add_session_mgmt_fields_to_ai_advisor_sessions.py`

---

## 3. API Contract

All endpoints live under `ai-service` router at `/v1/advisor/sessions`. They are proxied via `api-gateway` (which sets `X-Workspace-ID` header). Auth: JWT from Supabase Auth. `user_id` extracted via `get_current_user()` FastAPI dependency.

### Response envelope
All responses use the standard `{ data, error, meta }` envelope already used in other ai-service endpoints.

### `GET /v1/advisor/sessions`
List active sessions for the authenticated user.

**Query params:**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | `active \| archived` | `active` | Filter by status |
| `limit` | int | `20` | Max 50 |
| `cursor` | string | null | `updated_at` pagination cursor (ISO8601) |

**Response `200`:**
```json
{
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "title": "B2B Lead Generation in Vietnam",
        "status": "active",
        "message_count": 12,
        "created_at": "2026-05-10T09:00:00Z",
        "updated_at": "2026-05-14T10:30:00Z"
      }
    ],
    "next_cursor": "2026-05-09T08:00:00Z",
    "total": 5
  },
  "error": null,
  "meta": {}
}
```

### `POST /v1/advisor/sessions`
Create a new session.

**Request body:** `{}` (no body required — workspace and user come from headers/JWT)

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "title": null,
    "status": "active",
    "message_count": 0,
    "created_at": "2026-05-14T10:30:00Z",
    "updated_at": "2026-05-14T10:30:00Z",
    "session_archived": false
  },
  "error": null,
  "meta": {}
}
```
If 100-session limit was hit, `session_archived: true` and `archived_session_id: "uuid"` and `archived_session_title: "string"` are included so the frontend can show an actionable toast.

**Frontend toast text (A3):** *"Oldest session '[title]' was archived to make room. [Undo]"* — Undo calls `PATCH .../sessions/{archived_session_id}` with `{status: 'active'}`. If the Undo fails with `SESSION_LIMIT_REACHED`, show: *"Cannot undo — you now have 100 active sessions. Archive another session first."*

### `GET /v1/advisor/sessions/{session_id}`
Retrieve a single session with full message history.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "title": "B2B Lead Generation in Vietnam",
    "status": "active",
    "message_count": 12,
    "messages": [
      { "role": "user", "content": "...", "ts": "..." },
      { "role": "assistant", "content": "...", "sources": [...], "action": null, "ts": "..." }
    ],
    "created_at": "...",
    "updated_at": "..."
  },
  "error": null,
  "meta": {}
}
```
Returns `403` (not `404`) if session not found OR if session belongs to a different user — prevents enumeration.

### `PATCH /v1/advisor/sessions/{session_id}`
Update `title` or `status`.

**Request body:**
```json
{
  "title": "My New Title",       // optional
  "status": "archived" | "active" // optional; "active" = unarchive (guarded by count check)
}
```

**Response `200`:** Updated session object (same shape as GET, without `messages`).

**Errors:**
- `403` if not the session owner
- `422 SESSION_LIMIT_REACHED` if `status: 'active'` requested but active count already ≥ 100
- `AppError(code="SESSION_NOT_FOUND", status_code=403)`

**Unarchive guard (A3):** When `status: 'active'` is set, the service layer checks the caller's current active session count before allowing re-activation:
```python
if payload.status == "active":
    active_count = await count_active_sessions(db, workspace_id, user_id)
    if active_count >= 100:
        raise AppError("SESSION_LIMIT_REACHED", "Cannot unarchive: 100-session limit reached. Archive another session first.", 422)
    session.status = "active"
```

### `DELETE /v1/advisor/sessions/{session_id}`
Soft-delete: sets `status = 'archived'`.

**Response `204` No Content.**

**Errors:**
- `403` if not the session owner

---

## 4. Feature Flag Changes

### Remove `LANGGRAPH_CHECKPOINTER_ENABLED`

The checkpointer is no longer behind a flag. Update `app/core/config.py`:
- Remove `LANGGRAPH_CHECKPOINTER_ENABLED` field
- Update `checkpointer.py` to always initialise `AsyncPostgresSaver` (no flag check)
- Update `advisor_chat.py` to always call the checkpointed graph

**Risk mitigation:** The checkpointer tables (`checkpoints`, `checkpoint_writes`, `checkpoint_blobs`) are created by `cp.setup()` on first startup. If the DB is unreachable, the service still starts but degrades to the no-checkpointer graph. This existing fallback in `advisor_chat.py` (`_get_graph()`) is retained as a startup degradation path, not a runtime flag.

**LangGraph dependency pinning (A2):** Pin `langgraph-checkpoint-postgres` to an exact version in `requirements.txt` with a review gate comment:
```
langgraph-checkpoint-postgres==X.Y.Z  # PIN: checkpoint table DDL; upgrade requires schema migration review + staging smoke test
```
If a future version ships a breaking checkpoint-table migration, the impact is limited to in-flight graph state only — user message history is safely stored in `ai_advisor_sessions.messages` (our table, our schema) and is recovered automatically via the `retrieve_node` cold-start path.

**Shutdown drain for title generation tasks (A1):** Add `app.state.title_tasks: set[asyncio.Task] = set()` in the `lifespan()` startup phase. In the shutdown phase:
```python
# Drain pending title generation tasks (max 5s) to prevent credit-without-title leak
if pending := getattr(app.state, "title_tasks", set()):
    await asyncio.wait(pending, timeout=5.0)
```
Cloud Run default termination grace period is 10s, so the 5s drain fits safely.

---

## 5. Frontend Architecture

### New component: `AdvisorSessionSidebar`
File: `apps/portal/components/advisor/AdvisorSessionSidebar.tsx`

Renders:
- "New Chat" button (calls `POST /v1/advisor/sessions`, then resets message list)
- List of sessions with title (or `"Chat on {date}"` placeholder), relative timestamp, message count
- Active session highlighted
- Hover: show `...` menu with Rename / Archive options
- Collapsed "Archived" section toggle (loads archived sessions on expand)
- Loading skeleton (3 placeholder rows)
- Empty state: "No previous chats" with subtext

### State management
- Session list: `useAdvisorSessions()` hook → `useQuery` backed by `GET /v1/advisor/sessions`
- Active session messages: loaded from `GET /v1/advisor/sessions/{id}` on session click
- Current `sessionId` lifted to `AdvisorPage` state (already exists)
- Optimistic update on rename/archive (no refetch needed)

### New hooks
| Hook | Purpose |
|---|---|
| `useAdvisorSessions()` | Query: GET /v1/advisor/sessions |
| `useAdvisorSession(id)` | Query: GET /v1/advisor/sessions/{id} |
| `useCreateAdvisorSession()` | Mutation: POST /v1/advisor/sessions |
| `useUpdateAdvisorSession()` | Mutation: PATCH /v1/advisor/sessions/{id} |
| `useDeleteAdvisorSession()` | Mutation: DELETE /v1/advisor/sessions/{id} |

### Page layout change
The Advisor page switches from a single-column full-page layout to a **two-column layout**:
- Left: `AdvisorSessionSidebar` (fixed 240px width, scrollable session list)
- Right: existing chat panel (flex-1)

On mobile (< 768px): sidebar collapses to a drawer triggered by a hamburger / session list icon.

### Loading session history
When user clicks a session in the sidebar:
1. Show message skeleton in chat area
2. Call `GET /v1/advisor/sessions/{id}` to load `messages` array
3. Map JSONB message format → `Message[]` state (same type as current `useState<Message[]>`)
4. Set `sessionId` to the clicked session's ID
5. Subsequent chat turns use this `sessionId`

---

## 6. Credits & Cost

| Operation | Credits | Billing code |
|---|---|---|
| Session title generation (1x per session) | 1 | `advisor_title_generation` |
| Session CRUD (list, create, rename, archive, delete) | 0 | N/A |
| Chat turns | (existing, unchanged) | `advisor_chat_query` |

Title generation: 1 credit is negligible. Do NOT surface it in the UI as a separate charge — it's a background quality-of-life feature.

---

## 7. Event / Outbox Design

No domain events are emitted for session CRUD operations (no other service needs to know about advisor session state). No `outbox_events` rows needed.

Exception: if workspace admin usage reporting (session count per user) is added in a future spec, an analytics event could be emitted. Out of scope here.

---

## 8. Part B — AI Brain Content Management Design

### B1 — Wizard Answer Review & Edit

**Architecture decision (B1 debate, round 1, CPO 8/CTO 8 — frontend-only):**

The existing `workspace-service` infrastructure already supports this feature completely:
- `GET /v1/onboarding/wizard` returns `{status, answers: {...}}` — full answers object
- `PATCH /v1/onboarding/wizard/answers` saves updated answers (partial or full merge)
- `POST /v1/brain/wizard/submit` (ai-service) re-synthesises the Business Profile

**No new backend endpoints required.** This is a pure frontend change.

**`WizardModal` prop changes:**
```typescript
interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'review';        // default: 'create'
  initialAnswers?: Record<string, string>;  // pre-fill from existing wizard state
}
```

In `review` mode:
- Skip step 0 (welcome/intro) — start at step 1
- Pre-fill all field `value` props from `initialAnswers`
- Replace single "Submit" CTA with two actions at the bottom of step 4:
  - **"Save Changes"** — `PATCH /v1/onboarding/wizard/answers` (free, no credits)
  - **"Save + Regenerate Profile"** — opens confirmation dialog ("This will use 2 credits"), then `PATCH` → `POST /v1/brain/wizard/submit?rerun=true`

**Credits cost for re-synthesis (B1-3):** The existing `POST /v1/brain/wizard/submit` defaults to `credits_cost=5` (first-run synthesis). For re-runs from the review modal, call with `?rerun=true`. The endpoint must accept a `rerun: bool = False` query param and pass `credits_cost=2` when `rerun=True`. First-run cost (5 credits) is unchanged.

**Idempotency for wizard submit (B1-3):** The frontend generates a UUID when the user clicks "Save + Regenerate" and sends it as `X-Idempotency-Key` header. The `ai-service` stores `wizard_submit:{workspace_id}:{idempotency_key}` in Redis (TTL: 5 min) **before** deducting credits. If the same key is received again within the TTL window, return the cached response without re-running synthesis or deducting credits. The frontend reuses the same UUID on network-error retry; discards it on success or modal close. Button is disabled immediately on click (re-enabled on error with a 3s cooldown) to prevent accidental double-submission in the common case.

**New `useWizardState` hook:**
```typescript
export function useWizardState() {
  return useQuery({
    queryKey: ['wizard-state'],
    queryFn: fetchWizardState,        // GET /v1/onboarding/wizard (via workspace-service)
  });
}
export function useSaveWizardAnswers() { /* PATCH /v1/onboarding/wizard/answers */ }
```

**AI Brain page change:**
- When `wizardState.status === 'completed'`: show **"Review Answers"** button (secondary, next to "Upload Document")
- When `wizardState.status === 'not_started'` / no docs: show existing "Set Up AI Brain" button unchanged
- Clicking "Review Answers" → fetches fresh wizard state → opens `WizardModal mode='review' initialAnswers={wizardState.answers}`

**Merge behavior confirmed (B1-1):** `wizard_state_service.py` `save_answers()` performs a **deep merge by top-level key**: `state.answers = {**state.answers, **answers}`. Keys not present in the payload are preserved. The frontend may therefore send a **partial answers object** (only the modified step keys) — the backend merges it over the existing state. Sending all 4 keys remains safe and is the recommended default for the review flow.

Race condition risk: the `useWizardState` query pre-fetches fresh state before opening the modal. Two concurrent tabs editing the wizard simultaneously is implausible for the solo operator persona. Last-write-wins on per-step keys is acceptable.

**Staleness banner after Save Changes (B1-2):** After a successful `PATCH /v1/onboarding/wizard/answers` (Save Changes without re-synthesis), the frontend sets:
```typescript
localStorage.setItem(`wizard_answers_pending_regen_${workspaceId}`, 'true');
```
On AI Brain page load, if this flag is set and a `wizard_synthesis` doc exists, show a banner:
> *"Wizard answers updated — your Business Profile hasn't been regenerated yet. [Regenerate — 2 credits]"*

Clear the flag on `POST /v1/brain/wizard/submit` success. Key is workspace-scoped to prevent leaking across workspaces for multi-workspace users. Cross-device staleness is an accepted v1 limitation.

---

### B2 — Document View / Download / Edit / Re-upload

**Architecture decision (B2 debate, rounds 1–2, CPO 8/CTO 8):**

3 new endpoints + 1 Alembic migration + BackgroundTasks re-embedding.

#### New `workspace_knowledge_docs` column

```sql
ALTER TABLE workspace_knowledge_docs
  ADD COLUMN embedding_status TEXT NOT NULL DEFAULT 'ready';
-- Values: 'ready' | 'pending' | 'indexing' | 'failed'

CREATE INDEX idx_workspace_knowledge_docs_embedding_status
  ON workspace_knowledge_docs(workspace_id, embedding_status)
  WHERE embedding_status != 'ready';
```

Alembic migration filename: `add_embedding_status_to_workspace_knowledge_docs`
File path: `services/ai-service/alembic/versions/YYYY_002_add_embedding_status_to_workspace_knowledge_docs.py`

#### Startup recovery

On `ai-service` startup (in `lifespan` handler), before accepting requests:
```python
await db.execute(
    update(WorkspaceKnowledgeDoc)
    .where(WorkspaceKnowledgeDoc.embedding_status == 'indexing')
    .values(embedding_status='failed')
)
await db.commit()
```

#### New Pydantic schemas

```python
class KnowledgeDocDetail(BaseModel):
    id: UUID; workspace_id: UUID; doc_type: str; title: str
    content: str           # full text — not in list response
    is_active: bool; version: int; embedding_status: str
    created_by: UUID | None; created_at: datetime; updated_at: datetime
    chunk_count: int       # computed from len(doc.chunks)

class UpdateDocumentRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    doc_type: str | None = None

    @field_validator('content')
    @classmethod
    def validate_content_size(cls, v):
        if v and len(v.encode('utf-8')) > 512_000:  # 500KB limit (raised from 100KB — B2-3)
            raise ValueError('Content exceeds 500KB limit')
        return v
```

Also add `embedding_status` to the **existing** `KnowledgeDocResponse` (list endpoint) — needed for status badges in the UI.

#### New endpoints

| Method | Path | Purpose | Service |
|---|---|---|---|
| `GET` | `/v1/brain/documents/{id}` | Full doc with content field | ai-service |
| `PATCH` | `/v1/brain/documents/{id}` | Update title/content/doc_type, version bump | ai-service |
| `POST` | `/v1/brain/documents/{id}/reindex` | Manual re-embed retry | ai-service |

**`PATCH` service logic:**
```python
async def update_document(db, doc_id, workspace_id, payload):
    doc = await get_document(db, doc_id, workspace_id)  # 404→403 mapping
    if not doc:
        raise AppError("DOC_NOT_FOUND", "Document not found", 403)  # 403 not 404
    if payload.title is not None:
        doc.title = payload.title
    if payload.doc_type is not None:
        doc.doc_type = payload.doc_type
    if payload.content is not None:
        doc.content = payload.content
        doc.version += 1
        doc.embedding_status = 'pending'
    doc.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return doc
    # BackgroundTask for re-embedding triggered in the router (not here)
```

**BackgroundTask `reembed_document`:**
```python
async def reembed_document(doc_id: UUID, workspace_id: UUID):
    async with get_db_context() as db:
        await set_embedding_status(db, doc_id, workspace_id, 'indexing')
        try:
            await db.execute(delete(AIBrainChunk).where(AIBrainChunk.doc_id == doc_id))
            doc = await get_document(db, doc_id, workspace_id)
            await chunk_and_embed_document(db, doc)
            await set_embedding_status(db, doc_id, workspace_id, 'ready')
        except Exception as e:
            await set_embedding_status(db, doc_id, workspace_id, 'failed')
            logger.error("reembed_failed", doc_id=str(doc_id), error=str(e))
```

**Note:** BackgroundTasks (not outbox) — re-embedding is an internal implementation detail of `ai-service`, not a cross-service domain event.

**Phase 2 upgrade path (B2-1):** BackgroundTasks are acceptable for v1 given: (1) ai-service runs minimum 1 instance; (2) startup recovery correctly surfaces failures as `embedding_status='failed'` with a user-visible Retry button. If `brain.doc.reembed_success_rate` drops below 99% in production monitoring, migrate the `reembed_document` task to **GCP Cloud Tasks** (durable, retryable, survives pod restarts). The success-rate SLO in the metrics table is the explicit trigger for this migration.

#### Pre-existing gap fixed simultaneously

`POST /v1/brain/documents` (upload endpoint) currently has no content size limit. Add the same 100KB validation to `DocumentUploadRequest.content`.

#### Frontend — `DocumentDetailDrawer`

New component: `apps/portal/components/brain/DocumentDetailDrawer.tsx`

Right-side sheet/drawer that opens when a document row is clicked.

Layout:
```
┌── Document drawer ──────────────────────────────────┐
│ [Title]  v2  [🔄 Indexing... | ✅ Ready | ❌ Failed] │
│ Type: Product Doc   Chunks: 5                        │
│                                            [Edit] [✕]│
├──────────────────────────────────────────────────────┤
│ [Content textarea — read-only by default]            │
│                                                      │
│ ─────────────────────────────────────────────────── │
│ [📥 Download]  [📎 Load from file]  [🔁 Retry?]     │
│                              [Cancel] [Save Changes] │
└──────────────────────────────────────────────────────┘
```

States:
- **Large doc warning (B2-3):** if `content.length > 200KB`, show an inline info banner in Edit mode: *"Large document (>200KB) — indexing may take up to 15 seconds."*
- **Read mode** (default): textarea `readOnly`, no Save button, Edit button visible
- **Edit mode**: textarea editable, Save button active, Edit button hidden
- **Saving**: Save button shows spinner, textarea disabled
- **Indexing**: status badge `🔄 Indexing…`, polling `GET /v1/brain/documents/{id}` every 3s until status ≠ `indexing`. **Phase 2 (B2-2):** Replace polling with a Supabase Realtime subscription on `workspace_knowledge_docs.embedding_status` when active users exceed 10k.
- **Failed**: status badge `❌ Failed`, Retry button appears
- **wizard_synthesis doc type**: info banner shown: *"Auto-generated from wizard answers. Edit here, or update your wizard answers and regenerate."*

Download (client-side only):
```typescript
function handleDownload(title: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Re-upload (client-side only):
```typescript
// FileReader in change handler; max 500KB; .txt and .md only
// Show inline warning if file size > 200KB
if (file.size > 204_800) setShowLargeDocWarning(true);
reader.readAsText(file);
reader.onload = (e) => setContent(e.target?.result as string);
```

**Implementation note (B2-3):** Verify api-gateway body size limit allows 500KB POST bodies before shipping. Default nginx/Cloudflare Workers limit is ≥1MB — confirm in `services/api-gateway` config.

New API functions (add to `lib/api/brain.ts`):
```typescript
getDocument(id: string): Promise<KnowledgeDocDetail>
updateDocument(id: string, payload: UpdateDocumentInput): Promise<KnowledgeDocDetail>
reindexDocument(id: string): Promise<void>
fetchWizardState(): Promise<WizardState>
saveWizardAnswers(answers: Record<string, string>): Promise<void>
```

New hooks (add to `hooks/useBrain.ts`):
```typescript
useDocument(id: string)          // GET /v1/brain/documents/{id}
useUpdateDocument()               // PATCH
useReindexDocument()              // POST reindex
useWizardState()                  // GET /v1/onboarding/wizard (via workspace-service proxy)
useSaveWizardAnswers()            // PATCH /v1/onboarding/wizard/answers
```

---

## 9. Debate Summary (All Parts)

**Part A (Advisor Session Management)** — Converged Round 2, CPO 9/CTO 9, 2026-05-14 (confidence debate):
- Constrained hybrid: checkpointer for graph state + JSONB for durable message history
- 100-session hard limit, user-scoped, soft-delete only
- asyncio.create_task() for title generation, credits-first
- [A1] Task lifecycle manager in lifespan with 5s shutdown drain prevents credit-without-title leak
- [A2] LangGraph dep pinned with review-gate comment; message history safe via separation of concerns
- [A3] PATCH accepts `status: 'active'` to unarchive (with active_count < 100 guard); auto-archive toast includes session title + Undo CTA

**Part B1 (Wizard Review/Edit)** — Converged Round 1 (B1-1, B1-2) / Round 2 (B1-3), CPO 9/CTO 9, 2026-05-14:
- Frontend-only change; existing workspace-service endpoints cover all flows
- Two CTAs: "Save Changes" (free PATCH) vs "Save + Regenerate" (2 credits via `?rerun=true`)
- run_count increments only on synthesis, not on answer save
- [B1-1] Deep merge confirmed by code; partial sends safe; race condition risk accepted for solo operator persona
- [B1-2] localStorage staleness banner (workspace-scoped) after Save Changes without regeneration
- [B1-3] Fixed credits bug (re-synthesis = 2, not 5); idempotency key in Redis (TTL 5min) before credit deduction; `rerun` query param added

**Part B2 (Doc View/Download/Edit/Re-upload)** — Converged Round 2, CPO 9/CTO 9, 2026-05-14:
- 3 new ai-service endpoints: GET, PATCH, POST reindex
- BackgroundTasks (not outbox) for re-embedding — internal to ai-service
- embedding_status column (1 migration): ready/pending/indexing/failed
- Free re-embedding; client-side Blob download; no version history UI
- Startup recovery resets 'indexing' → 'failed'
- [B2-1] Cloud Tasks documented as Phase 2 upgrade path if reembed_success_rate < 99%
- [B2-2] 3s polling accepted for v1; Supabase Realtime documented as Phase 2 at >10k active users
- [B2-3] Content limit raised to 500KB; UI warning shown above 200KB; api-gateway body limit must be verified pre-ship
