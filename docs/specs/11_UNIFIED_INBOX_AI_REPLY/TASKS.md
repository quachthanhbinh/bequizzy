# Spec 11 — Unified Inbox & AI Reply: TASKS

## TDD Task List

### Task 1 — Migration: inbox_threads, inbox_messages, ai_reply_drafts
**RED first:** Import models fails.
**File:** `alembic/versions/0011_inbox.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — SQLAlchemy Models
**RED first:** Model import fails.
**File:** `services/customer-service/app/models/inbox.py`
**Done when:** Models import correctly.

### Task 3 — Inbound Email Handler (thread creation)
**RED first:** Test U11-01 fails.
**File:** `services/customer-service/app/services/inbox_service.py`
**Done when:** U11-01 passes; idempotent (same email twice = same thread).

### Task 4 — Enrollment Pause on Reply
**RED first:** Test U11-03 fails.
**Done when:** U11-03 passes; Pub/Sub event emitted.

### Task 5 — Intent Classifier
**RED first:** Test U11-02 fails.
**File:** `services/ai-service/app/services/intent_classifier.py`
**Done when:** U11-02 passes; confidence < 0.7 leaves field null.

### Task 6 — EDD Golden Dataset
**RED first:** EDD test fails (classifier not implemented).
**File:** `services/ai-service/app/evals/intent_classification/`
**Done when:** Intent accuracy ≥ 90% on golden dataset.

### Task 7 — AI Draft Endpoint (credit reserve model)
**RED first:** Draft request fails with missing endpoint.
**File:** `services/customer-service/app/routers/inbox.py`
**Done when:** Credits reserved before LLM call; draft saved; 402 if insufficient credits.

### Task 8 — Cross-Workspace Integration Test
**RED first:** Test I11-02 fails.
**Done when:** I11-02 passes; 404 returned for foreign workspace.

### Task 9 — Full Reply Flow Integration Test
**RED first:** Test I11-01 fails.
**Done when:** I11-01 passes; thread created + enrollment paused.

### Task 10 — Frontend Inbox Page
**RED first:** Vitest test fails.
**Files:** `frontend/app/(dashboard)/inbox/page.tsx`, `ThreadList.tsx`, `ThreadDetail.tsx`
**Done when:** Inbox renders threads with intent badges; Realtime updates work.

## Completion Checklist
- [ ] EDD intent accuracy ≥ 90%
- [ ] Enrollment paused on any inbound reply
- [ ] Credit reserve before LLM call enforced
- [ ] Cross-workspace isolation test passes
- [ ] `mypy app/` passes; coverage ≥ 80%
