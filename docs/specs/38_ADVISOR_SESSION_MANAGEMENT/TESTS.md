# Spec 38 — AI Advisor Session Management — TESTS

**Status:** 📝 In Review
**Confidence:** 8/10

---

## Coverage Targets

### Part A — Advisor Session Management

| File | Type | Target |
|---|---|---|
| `services/ai-service/app/advisor/nodes/finalize.py` | Unit | 100% — every branch of JSONB write + title trigger |
| `services/ai-service/app/api/v1/advisor_sessions.py` | Unit | 90% |
| `services/ai-service/app/services/advisor_session_service.py` | Unit | 90% |
| `services/ai-service/app/advisor/checkpointer.py` | Unit | 80% |
| `apps/portal/components/advisor/AdvisorSessionSidebar.tsx` | Unit (Vitest) | 80% |
| `apps/portal/hooks/useAdvisorSessions.ts` | Unit (Vitest) | 80% |
| Session CRUD API (integration) | Integration | All happy + all 403 paths |

### Part B — AI Brain Content Management

| File | Type | Target |
|---|---|---|
| `services/ai-service/app/api/v1/brain.py` (new endpoints) | Unit | 90% |
| `services/ai-service/app/services/brain/reembed_service.py` | Unit | 90% |
| `apps/portal/components/brain/DocumentDetailDrawer.tsx` | Unit (Vitest) | 80% |
| `apps/portal/components/brain/WizardModal.tsx` (review mode additions) | Unit (Vitest) | 80% |
| `apps/portal/hooks/useBrain.ts` (new hooks) | Unit (Vitest) | 80% |

---

## Unit Tests — Backend

### `finalize_node.py` (critical path — 100% coverage required)

```
test_finalize_writes_to_jsonb_on_turn
  → mock DB session; assert UPDATE called with correct new_messages payload
  → assert message_count incremented by 2
  → assert updated_at set

test_finalize_triggers_title_generation_on_first_turn
  → session.title IS NULL, message_count == 0
  → assert asyncio.create_task() called with generate_session_title

test_finalize_does_not_trigger_title_generation_on_subsequent_turns
  → session.message_count > 0 OR title IS NOT NULL
  → assert asyncio.create_task() NOT called

test_finalize_gracefully_handles_db_write_failure
  → DB UPDATE raises exception
  → assert no exception propagated (graceful degradation)
  → assert warning logged with workspace_id + session_id

test_finalize_jsonb_delta_only_append
  → assert UPDATE SQL uses "messages = messages || $1::jsonb" pattern
  → NOT "messages = $1" (full overwrite forbidden)
```

### `generate_session_title()` (critical path — credits-first)

```
test_title_generation_deducts_credits_before_llm
  → mock billing_service; assert deduct_credits called BEFORE litellm call

test_title_generation_skips_llm_on_insufficient_credits
  → billing_service raises AppError(INSUFFICIENT_CREDITS)
  → assert litellm NOT called
  → assert session title set to "Chat on {date}"

test_title_generation_truncates_to_100_chars
  → LLM returns 150-char title
  → assert DB title is 100 chars

test_title_generation_sanitises_html
  → LLM returns title with <script> tag
  → assert title stored without HTML tags

test_title_generation_handles_llm_error
  → litellm raises exception
  → assert session title set to "Chat on {date}"
  → assert error logged
```

### `advisor_session_service.py`

```
test_create_session_within_limit
  → active count < 100
  → assert INSERT and return session

test_create_session_at_limit_archives_oldest
  → active count == 100
  → assert oldest session status = 'archived'
  → assert new session created
  → assert response includes session_archived=True, archived_session_id

test_list_sessions_scoped_to_user
  → sessions belonging to different user in same workspace NOT returned
  → confirm workspace_id AND user_id in WHERE clause

test_list_sessions_pagination
  → cursor-based pagination returns correct page
  → next_cursor is updated_at of last item

test_get_session_returns_403_for_wrong_user
  → session_id exists but belongs to different user
  → assert 403 AppError

test_get_session_returns_403_for_wrong_workspace
  → session_id exists in different workspace
  → assert 403 AppError

test_archive_session_soft_deletes
  → DELETE endpoint
  → assert status = 'archived' in DB
  → assert NOT removed from DB (hard-delete guard)

test_rename_session_updates_title
  → PATCH with new title
  → assert title updated

test_patch_status_only_allows_archived
  → PATCH with status = 'active' raises 422
```

### `checkpointer.py`

```
test_checkpointer_initialises_without_feature_flag
  → LANGGRAPH_CHECKPOINTER_ENABLED field no longer needed
  → assert AsyncPostgresSaver initialised on first call

test_checkpointer_gracefully_degrades_on_db_unreachable
  → connection fails during setup()
  → assert returns None (no crash)
  → assert warning logged
```

---

## Unit Tests — Frontend

### `AdvisorSessionSidebar.tsx`

```
renders_session_list_with_titles
  → mock useAdvisorSessions returning 3 sessions
  → assert 3 session items rendered with titles

renders_placeholder_title_for_untitled_session
  → session.title = null, created_at = "2026-05-14"
  → assert "Chat on May 14" rendered

highlights_active_session
  → current sessionId matches session.id
  → assert active styling applied

calls_create_session_on_new_chat_click
  → click "New Chat" button
  → assert useCreateAdvisorSession mutation called

calls_update_session_on_rename
  → click rename in context menu, type new title, confirm
  → assert useUpdateAdvisorSession mutation called with correct title

calls_delete_session_on_archive
  → click archive in context menu
  → assert useDeleteAdvisorSession mutation called

shows_loading_skeleton_while_fetching
  → isLoading = true
  → assert 3 skeleton rows visible

shows_empty_state_when_no_sessions
  → sessions = []
  → assert "No previous chats" message visible

collapses_archived_section_by_default
  → sessions includes archived session
  → archived session NOT visible by default
  → clicking "Archived" toggle shows archived session
```

### `useAdvisorSessions.ts`

```
fetches_sessions_with_correct_headers
  → assert GET /v1/advisor/sessions called with workspace_id + auth headers

invalidates_session_list_after_create
  → useCreateAdvisorSession.mutate() called
  → assert sessions query invalidated

invalidates_session_list_after_archive
  → useDeleteAdvisorSession.mutate() called
  → assert sessions query invalidated

optimistic_rename_update
  → useUpdateAdvisorSession.mutate() called
  → assert title updated in cache immediately (optimistic update)
  → on error: assert title reverted
```

---

## Integration Tests — Backend

File: `services/ai-service/tests/integration/test_advisor_sessions_api.py`

```
test_create_session_returns_session_id
  → real DB, POST /v1/advisor/sessions
  → assert 201, session_id in response

test_chat_persists_to_session
  → POST /v1/advisor/chat with session_id
  → GET /v1/advisor/sessions/{session_id}
  → assert messages contains user+AI turns

test_session_list_scoped_to_user
  → user_A creates session, user_B lists → 0 results
  → user_A lists → 1 result

test_idor_returns_403
  → user_A creates session
  → user_B requests GET /v1/advisor/sessions/{user_A_session_id}
  → assert 403

test_100_session_limit_archives_oldest
  → create 101 sessions for same user
  → assert 100 active, oldest is archived
  → assert last response includes session_archived=True

test_soft_delete_not_hard_delete
  → DELETE /v1/advisor/sessions/{id}
  → assert row still exists in DB with status='archived'

test_chat_resumes_context_from_session
  → turn 1: "My product is an AI SaaS for B2B"
  → turn 2 (same session_id): "What industries should I target?"
  → assert AI response references the product context from turn 1
  → (integration test against real AI model — can be mocked for CI)
```

---

## E2E Tests — Playwright

File: `apps/portal/e2e/advisor-sessions.spec.ts`

```
session_persists_after_reload
  1. Open /advisor, send a message
  2. Wait for AI response
  3. Reload page
  4. Assert session appears in sidebar
  5. Click session → assert message history visible

multi_session_create_and_switch
  1. New Chat → send "session 1 question"
  2. New Chat → send "session 2 question"
  3. Assert 2 sessions in sidebar
  4. Click session 1 → assert session 1 messages shown

rename_session
  1. Hover over session → click "Rename"
  2. Type "My Strategy Session"
  3. Press Enter
  4. Assert sidebar shows new title

archive_session
  1. Hover over session → click "Archive"
  2. Assert session disappears from active list
  3. Expand "Archived" section → assert session appears there

auto_title_appears
  1. New Chat → send "How do I target insurance brokers in Vietnam?"
  2. Wait for AI response
  3. Wait up to 10 seconds
  4. Assert session title in sidebar is NOT "Chat on {date}" (auto-title generated)
```

---

## Critical Paths Requiring 100% Branch Coverage

### Part A
| Path | Why |
|---|---|
| `finalize_node` JSONB write + error handling | Data integrity: message loss is a P0 failure |
| `generate_session_title` credits-first flow | Credits non-negotiable: must deduct before any LLM call |
| Session ownership check in every CRUD endpoint | Access control: IDOR is a MEDIUM security risk |
| 100-session limit auto-archive | Storage safety: prevents unbounded growth |

### Part B
| Path | Why |
|---|---|
| `reembed_document` happy path + exception → failed | Embedding failure silently leaves RAG broken without it |
| PATCH doc ownership check | IDOR: another workspace could modify knowledge docs |
| 100KB content validation (PATCH + POST) | Storage abuse + embedding cost explosion |
| Startup recovery (indexing → failed) | Without it, stuck-indexing docs are permanently broken after restart |

---

## Part B — Unit Tests (Backend)

### `brain.py` — new endpoints

```
test_get_document_returns_full_content
  → GET /v1/brain/documents/{id} with correct workspace
  → assert response contains content field + chunk_count

test_get_document_returns_403_for_wrong_workspace
  → doc belongs to workspace B, request from workspace A
  → assert 403

test_patch_document_bumps_version_when_content_changes
  → PATCH with new content value
  → assert doc.version incremented by 1
  → assert embedding_status = 'pending'

test_patch_document_does_not_bump_version_for_title_only_change
  → PATCH with title only (no content)
  → assert doc.version unchanged
  → assert embedding_status unchanged

test_patch_document_enforces_100kb_limit
  → content = "x" * 102_401
  → assert 400 AppError CONTENT_TOO_LARGE

test_patch_document_returns_403_for_wrong_workspace
  → doc belongs to different workspace
  → assert 403

test_post_reindex_returns_202_accepted
  → doc exists, embedding_status = 'ready'
  → assert 202, background task triggered

test_post_reindex_returns_409_when_already_indexing
  → embedding_status = 'indexing'
  → assert 409 AppError ALREADY_INDEXING

test_existing_post_documents_enforces_100kb_limit
  → POST /v1/brain/documents with content > 100KB
  → assert 400 (pre-existing gap fixed)
```

### `reembed_service.py`

```
test_reembed_document_sets_indexing_before_processing
  → spy on set_embedding_status
  → assert called with 'indexing' first, then 'ready' after success

test_reembed_document_deletes_old_chunks
  → assert DELETE FROM ai_brain_chunks WHERE doc_id = $id called before embed

test_reembed_document_calls_chunk_and_embed
  → assert chunk_and_embed_document called with fresh doc content

test_reembed_document_sets_ready_on_success
  → full happy path
  → assert embedding_status = 'ready' in DB

test_reembed_document_sets_failed_on_exception
  → chunk_and_embed_document raises Exception
  → assert embedding_status = 'failed' in DB
  → assert error logged with doc_id

test_startup_recovery_resets_indexing_to_failed
  → seed DB with 2 docs in embedding_status = 'indexing'
  → call startup_recover_stale_indexing()
  → assert both docs have embedding_status = 'failed'

test_startup_recovery_does_not_touch_ready_docs
  → seed DB with 1 'ready', 1 'failed', 1 'pending'
  → call startup_recover_stale_indexing()
  → assert only 'indexing' docs changed
```

---

## Part B — Unit Tests (Frontend)

### `DocumentDetailDrawer.tsx`

```
renders_document_title_and_content
  → mock useDocument returning doc with title + content
  → assert title, content in drawer

shows_version_badge
  → doc.version = 3
  → assert "v3" badge rendered

shows_embedding_status_badge
  → embedding_status = 'ready' → assert "✅ Ready" badge
  → embedding_status = 'indexing' → assert "🔄 Indexing..." badge
  → embedding_status = 'failed' → assert "❌ Failed" badge

shows_retry_button_only_when_failed
  → embedding_status = 'failed' → assert Retry button visible
  → embedding_status = 'ready' → assert Retry button NOT visible

shows_info_banner_for_wizard_synthesis_doc_type
  → doc.doc_type = 'wizard_synthesis'
  → assert info banner rendered with correct message
  → doc.doc_type = 'product' → assert info banner NOT rendered

enters_edit_mode_on_edit_button_click
  → click Edit
  → assert textarea becomes writable (no readOnly)
  → assert Save button appears

calls_update_document_on_save
  → edit title and content → click Save
  → assert useUpdateDocument mutation called with updated payload

polls_for_embedding_status_while_indexing
  → after save, embedding_status = 'indexing'
  → assert useDocument query refetches every 3 seconds
  → when status = 'ready', assert polling stops

load_from_file_populates_content
  → mock FileReader result = "file contents"
  → click "Load from file", select .md file
  → assert content textarea updated with "file contents"

download_creates_blob_with_correct_filename
  → click Download
  → assert URL.createObjectURL called with Blob
  → assert <a> element has download = "My Doc Title.md"

calls_reindex_on_retry_button_click
  → embedding_status = 'failed', click Retry
  → assert useReindexDocument mutation called
```

### `WizardModal.tsx` — review mode additions

```
review_mode_prefills_all_answers
  → mode='review', initialAnswers={company_info: "Acme", ...}
  → assert step 1 textarea shows "Acme"

review_mode_skips_welcome_step
  → mode='review'
  → assert modal opens at step 1, not step 0

review_mode_shows_save_changes_cta
  → mode='review'
  → assert "Save Changes" button present (no credits)

review_mode_shows_save_regenerate_cta
  → mode='review'
  → assert "Save + Regenerate Profile" button present

save_changes_calls_patch_not_submit
  → mode='review', click "Save Changes"
  → assert PATCH /v1/onboarding/wizard/answers called
  → assert POST /v1/brain/wizard/submit NOT called

save_regenerate_shows_credit_confirmation
  → mode='review', click "Save + Regenerate Profile"
  → assert confirmation dialog appears mentioning "2 credits"

save_regenerate_calls_patch_then_submit_on_confirm
  → confirm dialog → confirm
  → assert PATCH called first, then POST /v1/brain/wizard/submit
  → assert modal closes on success

create_mode_unchanged
  → mode='create' (default)
  → assert original single Submit CTA rendered (no change to existing create flow)
```

### `ai-brain/page.tsx` — review answers button

```
shows_review_answers_button_when_wizard_completed
  → mock useWizardState returning status='completed'
  → assert "Review Answers" button rendered

hides_review_answers_button_when_wizard_not_completed
  → mock useWizardState returning status='not_started'
  → assert "Review Answers" button NOT rendered

review_answers_opens_wizard_in_review_mode
  → click "Review Answers"
  → assert WizardModal opened with mode='review' and initialAnswers populated
```

---

## Part B — Integration Tests (Backend)

File: `services/ai-service/tests/integration/test_brain_document_management_api.py`

```
test_get_document_happy_path
  → create doc, GET /v1/brain/documents/{id}
  → assert content field present

test_get_document_idor
  → workspace A doc, workspace B token
  → assert 403

test_patch_document_triggers_reembed
  → PATCH with new content
  → assert embedding_status = 'pending' immediately
  → wait for background task → assert embedding_status = 'ready'

test_patch_document_version_increment
  → initial version = 1, PATCH content
  → assert version = 2

test_patch_document_100kb_rejection
  → content = "x" * 200_000 bytes
  → assert 400

test_reindex_on_failed_doc
  → set doc embedding_status = 'failed'
  → POST /v1/brain/documents/{id}/reindex
  → assert 202, status transitions to 'ready'

test_reindex_conflict
  → set doc embedding_status = 'indexing'
  → POST /v1/brain/documents/{id}/reindex
  → assert 409
```

---

## Part B — E2E Tests (Playwright)

File: `apps/portal/e2e/ai-brain-content.spec.ts`

```
brain_document_view_full_content
  1. Upload a document
  2. Click the doc row
  3. Assert DocumentDetailDrawer opens with full content visible

brain_document_download_triggers_file
  1. Click doc row → Open drawer
  2. Click "Download"
  3. Assert file download initiated with .md extension

brain_document_edit_inline_and_save
  1. Open drawer → click "Edit"
  2. Modify content
  3. Click "Save Changes"
  4. Assert status badge shows "Indexing..." then "Ready"

brain_document_reupload_file
  1. Open drawer → click "Edit"
  2. Click "Load from file" → upload .txt file
  3. Assert content textarea populated with file contents
  4. Save → assert status transitions to Ready

brain_document_embedding_status_transitions
  1. Edit doc content
  2. Assert badge shows "🔄 Indexing..."
  3. Poll until "✅ Ready"

brain_wizard_review_and_save_changes
  1. Complete AI Brain setup (wizard + upload)
  2. Click "Review Answers" button
  3. Modify one answer
  4. Click "Save Changes"
  5. Assert modal closes, no credits deducted

brain_wizard_review_and_regenerate
  1. Click "Review Answers"
  2. Modify answer
  3. Click "Save + Regenerate Profile"
  4. Assert confirmation dialog with credit amount shown
  5. Confirm → assert modal closes, synthesis triggered
```
