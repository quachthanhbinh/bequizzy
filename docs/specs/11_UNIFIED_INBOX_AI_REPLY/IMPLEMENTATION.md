# Spec 11 — Unified Inbox & AI Reply: IMPLEMENTATION

## Phases
1. **Schema + Ingest**: Alembic migration; `email-inbound` CF handler; Pub/Sub consumer in customer-service; thread/message creation; enrollment pause event
2. **Intent Classification**: ai-service classifier; EDD eval harness; confidence threshold; Supabase Realtime
3. **AI Draft**: credit reserve model in draft endpoint; Brain chunk injection; `ai_reply_drafts`
4. **Frontend**: Inbox list view with intent badges; thread detail; AI draft panel; one-click send

## File Map
```
services/customer-service/
  app/
    models/inbox.py
    routers/inbox.py
    services/inbox_service.py    # thread creation, enrollment pause

services/ai-service/
  app/
    services/intent_classifier.py
    services/reply_drafter.py
    evals/intent_classification/
      golden_dataset.py
      test_intent_eval.py

alembic/versions/0011_inbox.py

frontend/
  app/(dashboard)/inbox/page.tsx
  components/inbox/
    ThreadList.tsx
    ThreadDetail.tsx
    AIReplyDraftPanel.tsx
```

## Integration Points
| Event | From | To |
|---|---|---|
| `email.inbound` Pub/Sub | email-inbound CF | customer-service |
| `inbox.message_created` | customer-service | ai-service |
| `inbox.intent_classified` | ai-service | customer-service |
| `enrollment.pause` | customer-service | sequence-worker |
