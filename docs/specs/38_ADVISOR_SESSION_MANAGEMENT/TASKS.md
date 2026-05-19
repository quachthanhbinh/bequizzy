# Spec 38 — AI Advisor Session Management — TASKS

**Status:** 📝 In Review
**Confidence:** 8/10

---

All tasks follow strict **RED → Verify-RED → GREEN → Verify-GREEN → Commit** TDD cycle per the `tdd-workflow` skill.

Total: 15 tasks. Estimated sprint: 2–3 days backend, 1–2 days frontend.

---

## Task 1 — Alembic Migration: Add session management columns

**Type:** Database
**Files:**
- `alembic/versions/YYYY_002_add_session_mgmt_fields_to_ai_advisor_sessions.py` (NEW)
- `services/ai-service/app/models/advisor.py` (MODIFY)

**Stub:**
```python
# alembic migration
def upgrade():
    op.add_column("ai_advisor_sessions", sa.Column("title", sa.Text, nullable=True))
    op.add_column("ai_advisor_sessions", sa.Column("status", sa.Text, nullable=False, server_default="active"))
    op.add_column("ai_advisor_sessions", sa.Column("message_count", sa.Integer, nullable=False, server_default="0"))
    op.create_index(
        "idx_advisor_sessions_user_recent",
        "ai_advisor_sessions",
        ["workspace_id", "user_id", "updated_at"],
        postgresql_where=sa.text("status = 'active'"),
    )

def downgrade():
    op.drop_index("idx_advisor_sessions_user_recent")
    op.drop_column("ai_advisor_sessions", "message_count")
    op.drop_column("ai_advisor_sessions", "status")
    op.drop_column("ai_advisor_sessions", "title")
```

**Test:** Run `alembic upgrade head` and `alembic downgrade -1` — both must succeed with no errors.

---

## Task 2 — ORM model update: `AdvisorChatSession`

**Type:** Backend unit
**Files:**
- `services/ai-service/app/models/advisor.py` (MODIFY)

**RED test:** `test_advisor_chat_session_has_title_status_message_count`
```python
def test_model_has_new_fields():
    session = AdvisorChatSession(
        workspace_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="My session",
        status="active",
        message_count=0,
    )
    assert session.title == "My session"
    assert session.status == "active"
    assert session.message_count == 0
```

**GREEN:** Add `title`, `status`, `message_count` mapped columns to `AdvisorChatSession`.

---

## Task 3 — Remove `LANGGRAPH_CHECKPOINTER_ENABLED` flag; checkpointer always-on

**Type:** Backend refactor
**Files:**
- `services/ai-service/app/core/config.py` (MODIFY)
- `services/ai-service/app/advisor/checkpointer.py` (MODIFY)
- `services/ai-service/app/advisor/advisor_chat.py` (MODIFY)

**RED test:** `test_checkpointer_initialises_without_feature_flag`
```python
async def test_checkpointer_initialises_without_feature_flag(monkeypatch):
    # Remove the flag from Settings
    assert not hasattr(settings, "LANGGRAPH_CHECKPOINTER_ENABLED")
    # get_checkpointer() should attempt to initialise AsyncPostgresSaver
    cp = await get_checkpointer()
    # In test environment with no DB, should return None gracefully
    # (not raise AttributeError because the flag doesn't exist)
    assert cp is None or hasattr(cp, "setup")
```

**GREEN:** Remove `LANGGRAPH_CHECKPOINTER_ENABLED` from `Settings`; update `get_checkpointer()` to always attempt initialisation; update `_get_graph()` to always use checkpointed graph.

---

## Task 4 — `advisor_session_service.py`: create + list sessions

**Type:** Backend unit
**Files:**
- `services/ai-service/app/services/advisor_session_service.py` (NEW)
- `services/ai-service/tests/unit/advisor/test_session_service.py` (NEW)

**RED tests:**
```python
async def test_create_session_returns_session_with_id(mock_db_session):
    session = await create_advisor_session(
        workspace_id=uuid.uuid4(), user_id=uuid.uuid4(), db=mock_db_session
    )
    assert session.id is not None
    assert session.status == "active"
    assert session.message_count == 0

async def test_list_sessions_scoped_to_user(mock_db_session, two_users_same_workspace):
    user_a, user_b, workspace_id = two_users_same_workspace
    await create_advisor_session(workspace_id=workspace_id, user_id=user_a, db=mock_db_session)
    sessions = await list_advisor_sessions(workspace_id=workspace_id, user_id=user_b, db=mock_db_session)
    assert len(sessions) == 0

async def test_create_session_archives_oldest_at_limit(mock_db_session):
    user_id = uuid.uuid4()
    ws_id = uuid.uuid4()
    # create 100 sessions
    for _ in range(100):
        await create_advisor_session(workspace_id=ws_id, user_id=user_id, db=mock_db_session)
    result = await create_advisor_session(workspace_id=ws_id, user_id=user_id, db=mock_db_session)
    assert result["session_archived"] == True
    assert result["archived_session_id"] is not None
```

**GREEN:** Implement `create_advisor_session`, `list_advisor_sessions` with 100-session limit enforcement.

---

## Task 5 — `advisor_session_service.py`: get + update + delete sessions

**Type:** Backend unit
**Files:**
- `services/ai-service/app/services/advisor_session_service.py` (MODIFY)
- `services/ai-service/tests/unit/advisor/test_session_service.py` (MODIFY)

**RED tests:**
```python
async def test_get_session_returns_403_for_wrong_user(mock_db_session):
    session = await create_advisor_session(workspace_id=ws_id, user_id=user_a, db=mock_db_session)
    with pytest.raises(AppError) as exc:
        await get_advisor_session(session_id=session.id, workspace_id=ws_id, user_id=user_b, db=mock_db_session)
    assert exc.value.status_code == 403

async def test_archive_session_soft_deletes(mock_db_session):
    session = await create_advisor_session(workspace_id=ws_id, user_id=user_id, db=mock_db_session)
    await archive_advisor_session(session_id=session.id, workspace_id=ws_id, user_id=user_id, db=mock_db_session)
    # Row still exists
    row = await db.get(AdvisorChatSession, session.id)
    assert row is not None
    assert row.status == "archived"

async def test_rename_session_updates_title(mock_db_session):
    session = await create_advisor_session(workspace_id=ws_id, user_id=user_id, db=mock_db_session)
    await rename_advisor_session(session_id=session.id, workspace_id=ws_id, user_id=user_id, title="New Title", db=mock_db_session)
    row = await db.get(AdvisorChatSession, session.id)
    assert row.title == "New Title"
```

**GREEN:** Implement `get_advisor_session`, `archive_advisor_session`, `rename_advisor_session`.

---

## Task 6 — Session CRUD API router

**Type:** Backend unit
**Files:**
- `services/ai-service/app/api/v1/advisor_sessions.py` (NEW)
- `services/ai-service/app/main.py` (MODIFY — register router)
- `services/ai-service/tests/unit/advisor/test_session_api.py` (NEW)

**RED tests:** (use `httpx.AsyncClient` with FastAPI `TestClient`)
```python
async def test_post_sessions_returns_201(client, auth_headers):
    response = await client.post("/v1/advisor/sessions", headers=auth_headers)
    assert response.status_code == 201
    assert "id" in response.json()["data"]

async def test_get_sessions_returns_only_own(client, auth_headers_user_a, auth_headers_user_b):
    await client.post("/v1/advisor/sessions", headers=auth_headers_user_a)
    response = await client.get("/v1/advisor/sessions", headers=auth_headers_user_b)
    assert len(response.json()["data"]["sessions"]) == 0

async def test_get_session_idor_returns_403(client, auth_headers_user_a, auth_headers_user_b, session_user_a):
    response = await client.get(f"/v1/advisor/sessions/{session_user_a.id}", headers=auth_headers_user_b)
    assert response.status_code == 403
```

**GREEN:** Implement router with all 5 endpoints; register in `main.py`.

---

## Task 7 — Modify `advisor_chat.py`: auto-create session if null

**Type:** Backend unit
**Files:**
- `services/ai-service/app/advisor/advisor_chat.py` (MODIFY)
- `services/ai-service/tests/unit/advisor/test_advisor_chat.py` (MODIFY)

**RED test:**
```python
async def test_chat_with_no_session_id_creates_new_session(mock_session_service):
    response = await run_advisor_chat(
        message="test", session_id=None, workspace_id=str(uuid.uuid4()), user_id=str(uuid.uuid4())
    )
    mock_session_service.create_advisor_session.assert_called_once()
    assert response.session_id is not None
```

**GREEN:** In `run_advisor_chat()`, if `session_id is None`, call `create_advisor_session()` and use the new session's ID.

---

## Task 8 — `title_generator.py`: credits-first title generation

**Type:** Backend unit
**Files:**
- `services/ai-service/app/services/title_generator.py` (NEW)
- `services/ai-service/tests/unit/advisor/test_title_generator.py` (NEW)

**RED tests:**
```python
async def test_title_generation_deducts_credits_before_llm(mock_billing, mock_litellm):
    call_order = []
    mock_billing.deduct_credits.side_effect = lambda *a, **kw: call_order.append("billing")
    mock_litellm.acompletion.side_effect = lambda *a, **kw: call_order.append("llm")
    await generate_session_title(session_id=uuid.uuid4(), workspace_id=uuid.uuid4(), first_message="test")
    assert call_order[0] == "billing"

async def test_title_generation_skips_llm_on_zero_credits(mock_billing, mock_litellm):
    mock_billing.deduct_credits.side_effect = AppError("INSUFFICIENT_CREDITS", "", 402)
    await generate_session_title(session_id=uuid.uuid4(), workspace_id=uuid.uuid4(), first_message="test")
    mock_litellm.acompletion.assert_not_called()

async def test_title_generation_sanitises_html_and_truncates(mock_billing, mock_litellm):
    mock_litellm.acompletion.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content="<b>Very very very very very very very very very very long title</b>"))])
    title = await generate_session_title(...)
    assert "<b>" not in title
    assert len(title) <= 100
```

**GREEN:** Implement `generate_session_title()` with credits-first guard, LiteLLM call, sanitisation, truncation, fallback.

---

## Task 9 — Modify `finalize_node.py`: JSONB write + title trigger

**Type:** Backend unit (critical — 100% coverage)
**Files:**
- `services/ai-service/app/advisor/nodes/finalize.py` (MODIFY)
- `services/ai-service/tests/unit/advisor/test_finalize_node.py` (MODIFY)

**RED tests:**
```python
async def test_finalize_writes_messages_to_jsonb(mock_db_session):
    state = make_state(message="hi", final_response="hello", message_count=4)
    await finalize_node(state)
    mock_db_session.execute.assert_called_once()
    sql_call = str(mock_db_session.execute.call_args)
    assert "messages = messages ||" in sql_call

async def test_finalize_gracefully_handles_db_failure(mock_db_session, caplog):
    mock_db_session.execute.side_effect = Exception("DB timeout")
    state = make_state(message="hi", final_response="hello")
    result = await finalize_node(state)  # must NOT raise
    assert "advisor_session_write_failed" in caplog.text

async def test_finalize_triggers_title_on_first_turn(mock_create_task, mock_db_session):
    state = make_state(message="hi", final_response="hello", message_count=0, title=None)
    await finalize_node(state)
    mock_create_task.assert_called_once()

async def test_finalize_no_title_trigger_on_subsequent_turns(mock_create_task, mock_db_session):
    state = make_state(message="hi", final_response="hello", message_count=4)
    await finalize_node(state)
    mock_create_task.assert_not_called()
```

**GREEN:** Modify `finalize_node` to execute delta-only JSONB UPDATE + conditional `asyncio.create_task()` for title.

---

## Task 10 — Integration test: full chat → persist → resume

**Type:** Backend integration
**Files:**
- `services/ai-service/tests/integration/test_advisor_sessions_api.py` (NEW)

**Tests** (require real DB — run against local Supabase):
```
test_chat_persists_to_session_messages
test_session_resumption_includes_prior_context (check message_count increments)
test_100_session_limit_auto_archives_oldest
test_idor_session_returns_403
test_delete_is_soft_only
```

---

## Task 11 — Frontend: `lib/api/advisor.ts` session API functions

**Type:** Frontend unit
**Files:**
- `apps/portal/lib/api/advisor.ts` (MODIFY)
- `apps/portal/hooks/useAdvisorSessions.ts` (NEW)

Add typed API functions: `listAdvisorSessions`, `createAdvisorSession`, `getAdvisorSession`, `updateAdvisorSession`, `deleteAdvisorSession`.

Add TanStack Query hooks wrapping each function.

**RED:** Vitest tests asserting correct URLs, headers, and response shapes.

---

## Task 12 — Frontend: `AdvisorSessionSidebar` component

**Type:** Frontend unit
**Files:**
- `apps/portal/components/advisor/AdvisorSessionSidebar.tsx` (NEW)
- (test file per Vitest)

Build the sidebar with session list, "New Chat" button, loading skeleton, empty state, context menu (rename / archive). Mobile: collapses to drawer.

**RED:** Vitest + @testing-library/react tests per TESTS.md §Unit Tests Frontend.

---

## Task 13 — Frontend: refactor `AdvisorPage` to two-column layout + session switcher

**Type:** Frontend unit
**Files:**
- `apps/portal/app/(dashboard)/advisor/page.tsx` (MODIFY)

Integrate `AdvisorSessionSidebar`. On session click: call `getAdvisorSession(id)`, populate `messages` state, set `sessionId`. On "New Chat": call `createAdvisorSession()`, reset messages.

**RED:** Vitest tests for session switching and message loading.

---

## Task 14 — E2E: Playwright session management tests

**Type:** E2E
**Files:**
- `apps/portal/e2e/advisor-sessions.spec.ts` (NEW)

Tests per TESTS.md §E2E:
- session_persists_after_reload
- multi_session_create_and_switch
- rename_session
- archive_session
- auto_title_appears (with up to 10s wait)

---

## Task 15 — Verification loop (Part A)

**Type:** Verification
**Checklist:**
- [ ] All unit tests pass (`pytest services/ai-service/`)
- [ ] All integration tests pass against local Supabase
- [ ] E2E Playwright tests pass against local dev server
- [ ] `npx tsc --noEmit` in `apps/portal/` passes with no errors
- [ ] `mypy services/ai-service/app/` passes
- [ ] Alembic `upgrade head` + `downgrade -1` + `upgrade head` completes cleanly
- [ ] `LANGGRAPH_CHECKPOINTER_ENABLED` no longer exists in `Settings` or any config file
- [ ] All session endpoints verified against SECURITY.md penetration checklist (IDOR tests)
- [ ] Structured log events emitted: `advisor_session_created`, `advisor_session_write_failed`
- [ ] No `any` types introduced in TypeScript
- [ ] Mobile (375px) viewport: sidebar collapses correctly, chat still usable

---

## Part B — AI Brain Content Management Tasks

_Total: 8 tasks. Estimated sprint: 1–2 days backend, 1–2 days frontend._

---

## Task B1 — Alembic migration: `embedding_status` column

**Type:** Database
**Files:**
- `alembic/versions/YYYY_003_add_embedding_status_to_workspace_knowledge_docs.py` (NEW)
- `services/ai-service/app/models/brain.py` (MODIFY)

**Stub:**
```python
def upgrade():
    op.add_column(
        "workspace_knowledge_docs",
        sa.Column("embedding_status", sa.Text, nullable=False, server_default="ready"),
    )
    op.create_index(
        "idx_workspace_knowledge_docs_embedding_status",
        "workspace_knowledge_docs",
        ["workspace_id", "embedding_status"],
        postgresql_where=sa.text("embedding_status != 'ready'"),
    )

def downgrade():
    op.drop_index("idx_workspace_knowledge_docs_embedding_status")
    op.drop_column("workspace_knowledge_docs", "embedding_status")
```

**Model update:**
```python
class WorkspaceKnowledgeDoc(Base):
    # existing columns ...
    embedding_status: Mapped[str] = mapped_column(Text, default="ready", server_default="ready")
```

**Test:** `alembic upgrade head` → `alembic downgrade -1` → `alembic upgrade head` — all succeed.

---

## Task B2 — Backend: 3 new brain endpoints + fix POST 100KB gap

**Type:** Backend unit
**Files:**
- `services/ai-service/app/api/v1/brain.py` (MODIFY)
- `services/ai-service/tests/unit/brain/test_brain_endpoints.py` (NEW or MODIFY)

**RED tests:**
```python
async def test_get_document_returns_content(client, auth_headers, seeded_doc):
    response = await client.get(f"/v1/brain/documents/{seeded_doc.id}", headers=auth_headers)
    assert response.status_code == 200
    assert "content" in response.json()["data"]
    assert "embedding_status" in response.json()["data"]

async def test_get_document_403_wrong_workspace(client, auth_headers_ws_b, doc_ws_a):
    response = await client.get(f"/v1/brain/documents/{doc_ws_a.id}", headers=auth_headers_ws_b)
    assert response.status_code == 403

async def test_patch_document_version_bump_on_content_change(client, auth_headers, seeded_doc):
    response = await client.patch(
        f"/v1/brain/documents/{seeded_doc.id}",
        json={"content": "new content"},
        headers=auth_headers,
    )
    assert response.json()["data"]["version"] == seeded_doc.version + 1
    assert response.json()["data"]["embedding_status"] == "pending"

async def test_patch_document_100kb_limit(client, auth_headers, seeded_doc):
    response = await client.patch(
        f"/v1/brain/documents/{seeded_doc.id}",
        json={"content": "x" * 200_000},
        headers=auth_headers,
    )
    assert response.status_code == 400

async def test_reindex_returns_202(client, auth_headers, seeded_doc):
    response = await client.post(f"/v1/brain/documents/{seeded_doc.id}/reindex", headers=auth_headers)
    assert response.status_code == 202

async def test_reindex_409_when_already_indexing(client, auth_headers, indexing_doc):
    response = await client.post(f"/v1/brain/documents/{indexing_doc.id}/reindex", headers=auth_headers)
    assert response.status_code == 409

async def test_existing_post_documents_enforces_100kb(client, auth_headers):
    response = await client.post(
        "/v1/brain/documents",
        json={"title": "test", "content": "x" * 200_000, "doc_type": "product"},
        headers=auth_headers,
    )
    assert response.status_code == 400
```

**GREEN:** Add 3 new endpoints; fix 100KB limit on existing `POST /v1/brain/documents`; trigger `BackgroundTasks.add_task(reembed_document, ...)` from PATCH handler when content changes.

---

## Task B3 — `reembed_service.py` + startup recovery

**Type:** Backend unit
**Files:**
- `services/ai-service/app/services/brain/reembed_service.py` (NEW)
- `services/ai-service/app/main.py` (MODIFY — call startup recovery in lifespan)
- `services/ai-service/tests/unit/brain/test_reembed_service.py` (NEW)

**RED tests:**
```python
async def test_reembed_sets_indexing_then_ready(mock_db, mock_embed):
    await reembed_document(doc_id=test_doc_id, workspace_id=test_ws_id)
    statuses = [call.args[-1] for call in mock_db.set_status.call_args_list]
    assert statuses == ["indexing", "ready"]

async def test_reembed_sets_failed_on_exception(mock_db, mock_embed):
    mock_embed.side_effect = Exception("embedding failed")
    await reembed_document(doc_id=test_doc_id, workspace_id=test_ws_id)
    last_status = mock_db.set_status.call_args_list[-1].args[-1]
    assert last_status == "failed"

async def test_reembed_deletes_old_chunks_before_embed(mock_db, mock_embed):
    await reembed_document(doc_id=test_doc_id, workspace_id=test_ws_id)
    # DELETE FROM ai_brain_chunks called before chunk_and_embed_document
    assert mock_db.delete_chunks.called
    assert mock_db.delete_chunks.call_args.kwargs["doc_id"] == test_doc_id

async def test_startup_recovery_resets_indexing_to_failed(mock_db):
    # Seed 2 docs in 'indexing' state
    await startup_recover_stale_indexing(db=mock_db)
    mock_db.execute.assert_called_once()
    sql = str(mock_db.execute.call_args)
    assert "failed" in sql
    assert "indexing" in sql

async def test_startup_recovery_does_not_touch_ready_docs(mock_db):
    await startup_recover_stale_indexing(db=mock_db)
    # UPDATE must filter: WHERE embedding_status = 'indexing' only
    sql = str(mock_db.execute.call_args)
    assert "WHERE" in sql
```

**GREEN:** Implement `reembed_document()` and `startup_recover_stale_indexing()`. Call recovery in `app/main.py` lifespan.

---

## Task B4 — Integration tests: document management API

**Type:** Backend integration
**Files:**
- `services/ai-service/tests/integration/test_brain_document_management_api.py` (NEW)

**Tests** (require real DB — run against local Supabase):
```
test_get_document_happy_path
test_get_document_idor_403
test_patch_triggers_reembed_background_task
test_patch_version_increments_on_content_change
test_patch_100kb_rejection
test_reindex_transitions_failed_to_ready
test_reindex_409_conflict_on_indexing
```

---

## Task B5 — Frontend: extend `lib/api/brain.ts` + `hooks/useBrain.ts`

**Type:** Frontend unit
**Files:**
- `apps/portal/lib/api/brain.ts` (MODIFY)
- `apps/portal/hooks/useBrain.ts` (MODIFY)

**Add to `brain.ts`:**
```typescript
export interface KnowledgeDocDetail {
  id: string; workspace_id: string; doc_type: string; title: string;
  content: string; is_active: boolean; version: number;
  embedding_status: 'ready' | 'pending' | 'indexing' | 'failed';
  created_by: string | null; created_at: string; updated_at: string;
  chunk_count: number;
}
// Add embedding_status to existing KnowledgeDoc (list response)
export interface KnowledgeDoc { /* existing */ embedding_status: string; }

export async function getDocument(id: string): Promise<KnowledgeDocDetail>
export async function updateDocument(id: string, payload: UpdateDocumentInput): Promise<KnowledgeDocDetail>
export async function reindexDocument(id: string): Promise<void>
export async function fetchWizardState(): Promise<WizardState>
export async function saveWizardAnswers(answers: Record<string, string>): Promise<void>
```

**Add to `useBrain.ts`:**
```typescript
export function useDocument(id: string)
export function useUpdateDocument()
export function useReindexDocument()
export function useWizardState()
export function useSaveWizardAnswers()
```

**RED:** Vitest tests asserting correct endpoint URLs and cache invalidation behavior.

---

## Task B6 — Frontend: `DocumentDetailDrawer` component

**Type:** Frontend unit
**Files:**
- `apps/portal/components/brain/DocumentDetailDrawer.tsx` (NEW)

Build the full drawer component per DESIGN.md §B2. Include read/edit modes, load from file, download, retry, status badge, info banner, polling while indexing.

**RED:** Vitest + @testing-library/react tests per TESTS.md §Part B Frontend:
- `renders_document_title_and_content`
- `shows_version_badge`
- `shows_embedding_status_badge` (all 4 states)
- `shows_retry_button_only_when_failed`
- `shows_info_banner_for_wizard_synthesis_doc_type`
- `enters_edit_mode_on_edit_button_click`
- `calls_update_document_on_save`
- `polls_for_embedding_status_while_indexing`
- `load_from_file_populates_content`
- `download_creates_blob_with_correct_filename`
- `calls_reindex_on_retry_button_click`

---

## Task B7 — Frontend: `WizardModal` review mode + "Review Answers" button

**Type:** Frontend unit
**Files:**
- `apps/portal/components/brain/WizardModal.tsx` (MODIFY)
- `apps/portal/app/(dashboard)/ai-brain/page.tsx` (MODIFY)

Add `mode?: 'create' | 'review'` and `initialAnswers?: Record<string, string>` props to `WizardModal`. In review mode: start at step 1, pre-fill answers, show two CTAs.

Add "Review Answers" button to `ai-brain/page.tsx` visible when `wizardState.status === 'completed'`.

**RED:** Vitest tests per TESTS.md §Part B Frontend:
- `review_mode_prefills_all_answers`
- `review_mode_skips_welcome_step`
- `review_mode_shows_save_changes_cta`
- `save_changes_calls_patch_not_submit`
- `save_regenerate_shows_credit_confirmation`
- `save_regenerate_calls_patch_then_submit_on_confirm`
- `create_mode_unchanged`
- `shows_review_answers_button_when_wizard_completed`
- `hides_review_answers_button_when_wizard_not_completed`

---

## Task B8 — E2E + final verification (Part B)

**Type:** E2E + Verification
**Files:**
- `apps/portal/e2e/ai-brain-content.spec.ts` (NEW)

**E2E tests per TESTS.md §Part B:**
- `brain_document_view_full_content`
- `brain_document_download_triggers_file`
- `brain_document_edit_inline_and_save`
- `brain_document_reupload_file`
- `brain_document_embedding_status_transitions`
- `brain_wizard_review_and_save_changes`
- `brain_wizard_review_and_regenerate`

**Final Part B verification checklist:**
- [ ] All Part B unit tests pass
- [ ] All Part B integration tests pass against local Supabase
- [ ] All Part B E2E tests pass
- [ ] Alembic migration 003 `upgrade head` + `downgrade -1` clean
- [ ] `embedding_status` field present in list response (existing list endpoint)
- [ ] 100KB limit enforced on both `POST /brain/documents` and `PATCH /brain/documents/{id}`
- [ ] Startup recovery runs without error; `embedding_status = 'indexing'` rows reset to `'failed'`
- [ ] IDOR tests pass: wrong-workspace GET/PATCH → 403
- [ ] No `any` types in new TypeScript code
- [ ] Mobile (375px): `DocumentDetailDrawer` renders correctly as sheet overlay
- [ ] `wizard_synthesis` info banner visible in drawer for auto-generated docs
- [ ] Part B penetration checklist from SECURITY.md completed
