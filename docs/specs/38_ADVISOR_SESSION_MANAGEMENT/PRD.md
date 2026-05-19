# Spec 38 — AI Feature Enhancements: Advisor Session Management + AI Brain Content Management — PRD

**Status:** ✅ Approved
**Confidence:** 10/10
**Last updated:** 2026-05-14

---

## Problem Statement

### Part A — AI Advisor Sessions

The AI Advisor was launched (Spec 31) with Phase 2 scope: session memory only *within* a single browser session. Spec 31 explicitly deferred "full persistent history" to Phase 3.

**Phase 3 gap today:**
- Conversation messages are stored in React `useState` only — closing the tab wipes everything.
- `ai_advisor_sessions.messages` (JSONB) was designed for persistence but is **never written to** by any current code path. The LangGraph checkpointer (`AsyncPostgresSaver`) exists but is behind a feature flag defaulting to `False`.
- Users have no way to create, switch between, or resume named conversation sessions.

**Who has this problem:** All Pro+ users who use the AI Advisor more than once per week. Solo operators (Spec 35) are the primary segment — they rely on the Advisor as their strategy sounding board and expect continuity.

### Part B — AI Brain Content Management

The AI Brain (Spec 02) launched a wizard that produces a Business Profile document. Two gaps remain:

1. **Wizard answers are write-only.** To correct a typo or update the pitch, users must re-run the entire 4-step wizard from scratch, which costs 2 credits and discards all prior answers. There is no "edit mode." The `workspace-service` already stores wizard answers in `onboarding_wizard_state.answers` (JSONB) and exposes `GET /v1/onboarding/wizard` + `PATCH /v1/onboarding/wizard/answers` — but the frontend never uses these for editing.

2. **Uploaded documents are opaque black boxes.** The document list shows only `title` and `doc_type`. There is no way to view the full text content, download it for offline editing, or replace it with an updated version. The `WorkspaceKnowledgeDoc.content` TEXT column exists but is never exposed to the frontend.

**Who has this problem:** Any workspace that has completed AI Brain setup and wants to iterate on their knowledge base without starting over.

---

## Goals

### Part A
1. Persist every AI Advisor conversation turn durably to the database so it survives browser reloads, tab closes, and device switches.
2. Let users create multiple named sessions and switch between them in a sidebar.
3. Auto-generate descriptive session titles (no user effort required).
4. Let users rename, archive, and delete sessions.

### Part B
5. Let users open a "Review Answers" mode from the AI Brain page that pre-fills their existing wizard answers for editing — without a full re-run.
6. Let users view the full text content of any AI Brain document and download it as a file.
7. Let users edit document content inline or re-upload a modified local file to replace it (bumps version, re-embeds).

---

## Non-Goals

- ❌ Workspace-shared sessions (session content is private to the user who created it)
- ❌ AI Advisor history exports or data downloads (Phase 4 / data governance scope)
- ❌ Workspace admin ability to read session message content
- ❌ Redis caching layer for session data (revisit at Phase 3 analytics scale review)
- ❌ Session search / semantic search across past sessions
- ❌ Session sharing between team members (link-sharing)
- ❌ PDF / binary file upload or parsing (plain text / markdown only for document edits)
- ❌ Diffing or version history UI for documents (show latest version only)
- ❌ Cross-workspace document sharing

---

## Acceptance Criteria

### Part A — Persistent Memory
- [ ] Every user+AI message pair is written to `ai_advisor_sessions.messages` JSONB **within the same request** that produces the AI response
- [ ] A user who closes and re-opens the browser sees their last session with all messages intact
- [ ] A user who continues an existing session gets AI responses that reference prior context
- [ ] If the JSONB write fails, the request still succeeds (graceful degradation), and a structured warning is logged

### Part A — Multi-Session Management
- [ ] Left sidebar in the Advisor page lists all active sessions (most-recently-updated first, max 20 shown by default)
- [ ] "New Chat" button creates a new session
- [ ] Clicking any session in the sidebar loads its message history
- [ ] Session titles are auto-generated from the first user message (appear within 5 seconds of first AI reply)
- [ ] Users can rename a session title inline (click-to-edit)
- [ ] Users can archive (soft-delete) a session via a context menu; archived sessions are hidden from the default list
- [ ] When a user has 100 active sessions and creates a new one, the oldest session is auto-archived and a toast notification informs the user
- [ ] Archived sessions are accessible via a collapsed "Archived" section in the sidebar

### Part A — Credits
- [ ] Title generation deducts 1 credit via `billing-service` BEFORE the LLM call
- [ ] If credit deduction fails (zero balance), title generation is skipped silently; session title falls back to `"Chat on {date}"`
- [ ] No credits charged for session CRUD operations (list, rename, archive, delete)

### Part A — API Security
- [ ] All session API endpoints return 403 if the requesting user is not the session owner
- [ ] Sessions from one workspace are never visible to another workspace
- [ ] `workspace_id` and `user_id` are enforced on every DB query for sessions

### Part B — Wizard Answer Review & Edit
- [ ] A "Review Answers" button appears on the AI Brain page when a Business Profile document exists (source = 'wizard')
- [ ] Clicking it opens the wizard modal pre-filled with all existing answers (loaded from `GET /v1/onboarding/wizard` via workspace-service)
- [ ] Users can modify any field and submit; answers are saved via `PATCH /v1/onboarding/wizard/answers` then re-synthesized via `POST /v1/brain/wizard/submit`
- [ ] Re-synthesis costs 2 credits; credit check shown before user submits ("This will cost 2 AI credits")
- [ ] If insufficient credits: upgrade CTA shown; wizard not re-submitted
- [ ] On successful re-synthesis: old Business Profile doc is soft-replaced (version incremented), document list refreshes
- [ ] "Review Answers" mode is distinguishable from first-run ("Edit Answers" label vs "Set Up AI Brain")

### Part B — Document View / Download / Edit / Re-upload
- [ ] Each document row in the AI Brain list has a "View" button (or click row to open)
- [ ] Clicking opens a `DocumentDetailModal` showing: title, doc type, version, full content text, chunk count
- [ ] A "Download" button triggers a browser download of the document content as `{title}.md`
- [ ] An "Edit" button enters an inline edit mode: textarea pre-filled with current content; title and doc_type are also editable
- [ ] Saving edits calls `PATCH /v1/brain/documents/{id}` — bumps version, deletes old chunks, re-embeds
- [ ] A "Re-upload File" button allows loading a local `.txt` or `.md` file to replace content (same save flow)
- [ ] A version badge (`v2`, `v3`, …) is visible in the modal header after edits
- [ ] While re-embedding is in progress, document shows a `🔄 Indexing…` status badge; badge clears when chunks are ready

---

## In-Scope Deliverables

### Part A — Backend (ai-service)
- Schema migration: add `title`, `status`, `message_count` to `ai_advisor_sessions` + index
- Remove `LANGGRAPH_CHECKPOINTER_ENABLED` feature flag (always-on)
- `finalize_node.py`: write message pair to JSONB on every turn
- New router: `GET/POST /v1/advisor/sessions`, `GET/PATCH/DELETE /v1/advisor/sessions/{id}`
- Async title generation (fire-and-forget `asyncio.create_task()`) with credits-first
- Auto-create session if `session_id` is null in `POST /v1/advisor/chat`

### Part A — Frontend (apps/portal)
- Session sidebar component (collapsible, shows title + relative timestamp)
- Session switcher logic: load messages from `GET /v1/advisor/sessions/{id}` on click
- "New Chat" button → calls `POST /v1/advisor/sessions` then starts fresh
- Inline title edit + archive/delete context menu
- Loading skeleton for session list + message history

### Part B — Backend (ai-service)
- Schema migration: add `embedding_status TEXT NOT NULL DEFAULT 'ready'` to `workspace_knowledge_docs` + partial index
- Startup recovery: reset `embedding_status = 'indexing'` → `'failed'` on app startup
- Fix pre-existing gap: add 100KB content size validation to existing `POST /v1/brain/documents` upload endpoint
- 3 new endpoints: `GET /v1/brain/documents/{id}`, `PATCH /v1/brain/documents/{id}`, `POST /v1/brain/documents/{id}/reindex`
- BackgroundTask: `reembed_document(doc_id, workspace_id)` — deletes old chunks, re-embeds, updates status
- Add `embedding_status` field to existing `GET /v1/brain/documents` list response

### Part B — Frontend (apps/portal)
- `DocumentDetailDrawer` component: full-content view, version badge, embedding status badge
- "Edit" mode inside drawer: editable title/doc_type/content textarea
- "Load from file" button: client-side FileReader → populates textarea (txt/md, ≤100KB)
- "Save" calls `PATCH /v1/brain/documents/{id}`; shows "Indexing…" spinner until status = `ready`
- "Download" button: client-side Blob → `<a download="{title}.md">` (no new backend endpoint)
- "Retry" button on failed docs: calls `POST /v1/brain/documents/{id}/reindex`
- Info banner for `doc_type = 'wizard_synthesis'` docs: "Auto-generated from wizard answers — edit here or update via Review Answers."
- `WizardModal` gains `mode='review'` + `initialAnswers` props (pre-fills existing answers)
- "Review Answers" button on AI Brain page (shown when `wizard_state.status = 'completed'`)
- Two CTAs in review mode: "Save Changes" (free → `PATCH /v1/onboarding/wizard/answers`) and "Save + Regenerate" (2 credits → PATCH then `POST /v1/brain/wizard/submit`)
- `useWizardState` hook: fetches wizard state for pre-fill

---

## Out of Scope
- Changes to the core LangGraph graph nodes (classify, tool_call, synthesize, critique)
- PDF/binary file parsing (plain text and markdown only)
- Version history UI / rollback (version badge only)
- Cross-workspace document sharing
- Changes to notification-service or outbox events (no domain events needed for session CRUD or document edits)

---

## Success Metrics

### Part A
| Metric | Target | Measurement |
|---|---|---|
| Session persistence rate | ≥ 99.5% of chat turns durably written | `advisor_session_write_success / advisor_chat_turns` |
| Session resumption rate | ≥ 30% of Advisor page loads resume a prior session | `session_id_provided / advisor_page_loads` |
| Multi-session adoption | ≥ 2 active sessions per active Pro+ user within 30 days | AVG(active sessions per user) |
| Title generation success rate | ≥ 95% of new sessions auto-titled within 10s | `title_generated / new_sessions` |
| AI Advisor DAU/WAU improvement | +20% within 30 days of ship | `advisor_chat_turns` event volume |

### Part B
| Metric | Target | Measurement |
|---|---|---|
| Wizard re-edit adoption | ≥ 20% of workspaces with completed wizard use Review Answers within 30 days | `brain.wizard.review_opened` event |
| Document edit adoption | ≥ 30% of workspaces use doc edit/view within 30 days of ship | `brain.doc.viewed` event |
| Re-embedding success rate | ≥ 99% of PATCH edits complete with `embedding_status = 'ready'` | `brain.doc.reembed_success / brain.doc.reembed_triggered` |
| Re-synthesis opt-in rate | ≥ 40% of "Save Changes" actions followed by "Save + Regenerate" | `brain.wizard.resynthesized / brain.wizard.answers_saved` |

## Debate Notes

**All parts reached 10/10 confidence:** 2026-05-14 — targeted CPO/CTO confidence debate, all 9 concerns resolved.

**B1 — Merge behavior verified (was open item):**
> `wizard_state_service.save_answers()` performs deep merge (`{**state.answers, **answers}`). Partial sends are safe. Frontend may send only modified step keys. The full-4-key default remains recommended for the review flow.

**B1 — Credits bug fixed:**
> `POST /v1/brain/wizard/submit` existing code uses `credits_cost=5` (first-run). Re-synthesis via review modal must use `?rerun=true`; the endpoint passes `credits_cost=2` when `rerun=True`. PRD "2 credits" is correct for re-runs.

**B1 — Idempotency added:**
> `POST /v1/brain/wizard/submit` now requires `X-Idempotency-Key` header from the frontend. Redis key (TTL 5min) guards against double credit deduction on network retry.

**B2 — Content limit raised to 500KB (was 100KB):**
> 100KB was too restrictive for Vietnamese product manuals (~16,500 words). Raised to 500KB with a UI warning banner above 200KB. api-gateway body limit must be verified pre-ship.

**See DESIGN.md Section 9 (Debate Summary) for full resolution details.**
