# Spec 38 — AI Advisor Session Management — IMPLEMENTATION

**Status:** 📝 In Review
**Confidence:** 8/10

---

## Rollout Plan

### Phase 0: Pre-Ship Verification
- [ ] Confirm `ai-service` Cloud Run environments (staging + prod) have `DATABASE_URL` configured with a connection string compatible with `AsyncPostgresSaver` (`postgresql+psycopg://` scheme, not `asyncpg`)
- [ ] Confirm LangGraph `langgraph-checkpoint-postgres` package is in `requirements.txt` and installed (required for `AsyncPostgresSaver`)
- [ ] Run Alembic migration on staging; verify `ai_advisor_sessions` schema + index created correctly

### Phase 1: Backend-only (feature-flagged via `ADVISOR_SESSIONS_UI_ENABLED` env var)
- Alembic migration
- Remove `LANGGRAPH_CHECKPOINTER_ENABLED` flag
- New session CRUD API endpoints
- `finalize_node` JSONB write + title generation
- All unit + integration tests passing

### Phase 2: Frontend + Backend together
- `AdvisorSessionSidebar` component
- Session switcher page layout
- New hooks
- E2E tests passing

### Phase 3: Full rollout
- Remove `ADVISOR_SESSIONS_UI_ENABLED` flag
- Monitor metrics (see below)

---

## Feature Flags

| Flag | Type | Default | Remove after |
|---|---|---|---|
| `LANGGRAPH_CHECKPOINTER_ENABLED` (existing) | Python settings | `False` | Remove field; always-on | After Phase 1 ships to staging and passes load test |
| `ADVISOR_SESSIONS_UI_ENABLED` | Env var (frontend + backend router) | `false` in staging | Phase 3 rollout |

---

## Migration Sequence

1. **Create and apply Alembic migration** (zero-downtime — ADD COLUMN with defaults):
   ```
   alembic/versions/YYYY_002_add_session_mgmt_fields_to_ai_advisor_sessions.py
   ```
   Operations:
   - `ADD COLUMN title TEXT`
   - `ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`
   - `ADD COLUMN message_count INTEGER NOT NULL DEFAULT 0`
   - `CREATE INDEX idx_advisor_sessions_user_recent ON ai_advisor_sessions(workspace_id, user_id, updated_at DESC) WHERE status = 'active'`

2. **Backfill `message_count`** (optional — can defer to background job):
   ```sql
   UPDATE ai_advisor_sessions
      SET message_count = jsonb_array_length(messages)
    WHERE message_count = 0 AND jsonb_array_length(messages) > 0;
   ```
   This is safe to run live (idempotent, low cardinality at MVP).

3. **Deploy new ai-service** (removes feature flag, adds session endpoints, modifies finalize_node)

4. **Deploy new portal** (session sidebar, new hooks)

---

## File Map

### Backend — `services/ai-service/`

| File | Change |
|---|---|
| `app/core/config.py` | Remove `LANGGRAPH_CHECKPOINTER_ENABLED` field |
| `app/advisor/checkpointer.py` | Remove flag check; always initialise `AsyncPostgresSaver` |
| `app/advisor/advisor_chat.py` | Remove flag check in `_get_graph()`; always use checkpointed graph |
| `app/advisor/nodes/finalize.py` | Add JSONB write + asyncio.create_task() title trigger |
| `app/models/advisor.py` | Add `title`, `status`, `message_count` columns to `AdvisorChatSession` |
| `app/services/advisor_session_service.py` | **NEW** — all session business logic |
| `app/services/title_generator.py` | **NEW** — `generate_session_title()` async function |
| `app/api/v1/advisor_sessions.py` | **NEW** — session CRUD router |
| `app/api/v1/advisor.py` | Modify: auto-create session if `session_id` is null |
| `app/main.py` | Register new `advisor_sessions` router |
| `alembic/versions/YYYY_002_...py` | **NEW** — migration |
| `tests/unit/advisor/test_finalize_node.py` | **NEW** |
| `tests/unit/advisor/test_title_generator.py` | **NEW** |
| `tests/unit/advisor/test_session_service.py` | **NEW** |
| `tests/integration/test_advisor_sessions_api.py` | **NEW** |

### Frontend — `apps/portal/`

| File | Change |
|---|---|
| `lib/api/advisor.ts` | Add session CRUD API functions |
| `hooks/useAdvisorSessions.ts` | **NEW** — all session hooks |
| `components/advisor/AdvisorSessionSidebar.tsx` | **NEW** |
| `app/(dashboard)/advisor/page.tsx` | Refactor: two-column layout, session switcher logic |

---

## Part B — File Map

### Backend — `services/ai-service/` (Part B additions)

| File | Change |
|---|---|
| `app/models/brain.py` | Add `embedding_status TEXT DEFAULT 'ready'` column to `WorkspaceKnowledgeDoc` |
| `app/api/v1/brain.py` | Add `GET /documents/{id}`, `PATCH /documents/{id}`, `POST /documents/{id}/reindex`; fix 100KB limit on existing `POST /documents` |
| `app/services/brain/reembed_service.py` | **NEW** — `reembed_document(doc_id, workspace_id)` BackgroundTask function + `startup_recover_stale_indexing()` |
| `app/main.py` | Call `startup_recover_stale_indexing()` in lifespan handler |
| `alembic/versions/YYYY_003_add_embedding_status_to_workspace_knowledge_docs.py` | **NEW** — `ADD COLUMN embedding_status TEXT NOT NULL DEFAULT 'ready'` + partial index |
| `tests/unit/brain/test_brain_endpoints.py` | **NEW** — unit tests for 3 new endpoints + 100KB fix |
| `tests/unit/brain/test_reembed_service.py` | **NEW** — all reembed + recovery paths |
| `tests/integration/test_brain_document_management_api.py` | **NEW** — integration tests |

### Frontend — `apps/portal/` (Part B additions)

| File | Change |
|---|---|
| `lib/api/brain.ts` | Add `getDocument`, `updateDocument`, `reindexDocument`, `fetchWizardState`, `saveWizardAnswers`; add `KnowledgeDocDetail` type; add `embedding_status` to `KnowledgeDoc` |
| `hooks/useBrain.ts` | Add `useDocument`, `useUpdateDocument`, `useReindexDocument`, `useWizardState`, `useSaveWizardAnswers` |
| `components/brain/DocumentDetailDrawer.tsx` | **NEW** — right-side drawer with view/edit/download/retry |
| `components/brain/WizardModal.tsx` | Add `mode` and `initialAnswers` props; review mode with two CTAs |
| `app/(dashboard)/ai-brain/page.tsx` | Add "Review Answers" button + doc row "View" action opening DocumentDetailDrawer |
| `e2e/ai-brain-content.spec.ts` | **NEW** — Part B Playwright E2E tests |

### Services affected (complete list)

| Service | Part | Reason |
|---|---|---|
| `ai-service` | A + B | Session CRUD endpoints (A) + document management endpoints + reembed service (B) |
| `workspace-service` | B1 (read-only) | Existing wizard endpoints used by frontend — no code changes |
| `apps/portal` | A + B | Advisor sidebar (A) + DocumentDetailDrawer + WizardModal review mode (B) |

---

## Migration Sequence (complete, Parts A + B)

Migrations are independent and can be applied in any order:
1. `YYYY_002_add_session_mgmt_fields_to_ai_advisor_sessions.py` (Part A)
2. `YYYY_003_add_embedding_status_to_workspace_knowledge_docs.py` (Part B) — ADD COLUMN with DEFAULT; zero-downtime

---

## Monitoring Metrics

Deploy these metrics to Cloud Monitoring / Signoz:

### Part A — Advisor Sessions
| Metric | Alert Threshold |
|---|---|
| `advisor_session_write_failed_total` | > 0 per minute (P1 alert) |
| `advisor_title_generation_skipped_total{reason="error"}` | > 10/hour |
| `advisor_session_limit_archived_total` | > 100/hour (indicates capacity planning needed) |
| `advisor_session_list_p99_latency_ms` | > 200ms |
| `advisor_checkpointer_init_failed_total` | > 0 per hour |

### Part B — AI Brain Content Management
| Metric | Alert Threshold |
|---|---|
| `brain_doc_reembed_triggered_total` | Counter; no alert |
| `brain_doc_reembed_success_total` | Counter; no alert |
| `brain_doc_reembed_failed_total` | > 5/hour → WARN alert |
| `brain_wizard_review_opened_total` | Counter; no alert |
| `brain_wizard_resynthesized_total` | Counter; no alert |

---

## Risks

### Part A — Advisor Sessions

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| `AsyncPostgresSaver.setup()` fails on first deploy (DB unreachable) | Low | Medium | Existing fallback in `_get_graph()` degrades to no-checkpointer graph; alert fires; session history from JSONB still works |
| JSONB write in `finalize_node` adds latency to chat turns | Low | Low | Delta-only append; P99 < 5ms for single JSONB row update |
| Title generation `asyncio.create_task()` leaks on ASGI shutdown | Low | Low | Task is short-lived (< 2s); Cloud Run graceful shutdown waits for in-flight requests; acceptable |
| LangGraph schema change in checkpoint tables breaks deserialization | Low | Medium | Pin `langgraph-checkpoint-postgres` version; test upgrade in staging before production |
| 100-session limit causes unexpected archival for power users | Medium | Low | Log `advisor_session_limit_archived` event; surface in session sidebar as toast notification |

### Part B — AI Brain Content Management

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| BackgroundTask `reembed_document` fails silently (no visibility) | Medium | Medium | `brain_doc_reembed_failed_total` metric + `embedding_status='failed'` badge in UI; Retry button available |
| Startup recovery resets legitimately-in-progress embeddings on hot restart | Low | Low | Only affects restarts; user sees 'failed' badge and clicks Retry; tolerable at MVP scale |
| 100KB limit rejects legitimate large documents | Low | Medium | User sees clear 400 error; suggested workaround: split document into sections |
| wizard_synthesis docs overwritten by user — loss of wizard-generated content | Low | Medium | Info banner shown in drawer; future spec can add version history if needed |

---

## On-Call Runbook Pointer

If `advisor_session_write_failed_total` fires:
1. Check `finalize_node` logs for `workspace_id` and `session_id` fields
2. Verify DB connection pool health in Cloud Run logs
3. Run `SELECT COUNT(*) FROM ai_advisor_sessions WHERE updated_at < NOW() - INTERVAL '10 minutes'` to check if updates have stalled
4. User impact: session history is temporarily not persisted; chat functionality still works (checkpointer handles in-session state)
5. Escalate to DBA if DB connectivity issue confirmed
