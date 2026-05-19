# Spec 11 — Unified Inbox & AI Reply: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Inbox must feel like a real email client — threads, read/unread, archive. Intent badge on each thread. One-click "Use AI Draft" button. The most critical feature: sequence auto-pauses when a reply comes in — this prevents embarrassing follow-ups to leads who already replied. Confidence: 7.

**CTO:** email-inbound Cloud Function → `email.inbound` Pub/Sub → customer-service creates thread. Intent classification is an async ai-service call triggered by `inbox.message_created` event. Draft generation uses the same credit reserve model from Spec 05. For real-time: Supabase Realtime on `inbox_threads` table for thread status changes. Confidence: 7.

**Gap: 0. Both ≥ 7.**

### Round 2

**CPO:** EDD tests for intent classification are essential — we need ≥ 90% accuracy on the 5 classes, especially OOO detection (avoid sequence disruption from autoresponders). Confidence: 8.

**CTO:** Agree on EDD. Intent classification prompt: XML-delimited body (to prevent injection), forced JSON output `{"intent": "...", "confidence": 0.0}`, temperature 0. Confidence: 8.

**Final Confidence: 8 / 10.** Why not 10: Intent classification accuracy on edge cases (ambiguous replies, mixed intent) requires ongoing eval iteration.

---

## Data Model

### Table: `inbox_threads`
```sql
CREATE TABLE inbox_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  lead_id       UUID NOT NULL,
  subject       TEXT,
  channel       TEXT NOT NULL DEFAULT 'email',
  status        TEXT NOT NULL DEFAULT 'open',  -- open|snoozed|archived
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inbox_threads_workspace ON inbox_threads (workspace_id, last_message_at DESC);
```

### Table: `inbox_messages`
```sql
CREATE TABLE inbox_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  thread_id     UUID NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  direction     TEXT NOT NULL,   -- inbound|outbound
  body          TEXT NOT NULL,
  body_html     TEXT,
  intent_class  TEXT,            -- interested|not_interested|out_of_office|question|meeting_request
  ai_confidence NUMERIC(4,3),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `ai_reply_drafts`
```sql
CREATE TABLE ai_reply_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  thread_id     UUID NOT NULL,
  draft_body    TEXT NOT NULL,
  credits_used  INTEGER NOT NULL DEFAULT 1,
  is_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Intent Classification Prompt
```
<system>
Classify this email reply into exactly one intent class.
Output JSON: {"intent": "<class>", "confidence": <0.0-1.0>}
Classes: interested | not_interested | out_of_office | question | meeting_request
</system>
<email>
{{BODY}}
</email>
```
Temperature 0; max_tokens 50.

---

## Event Flow
```
email-inbound CF → email.inbound Pub/Sub
    → customer-service: create/update inbox_thread, append inbox_message
    → Emit inbox.message_created
    → ai-service: classify intent (async)
    → ai-service: emit inbox.intent_classified
    → customer-service: update inbox_message.intent_class
    → Supabase Realtime notifies frontend
    → Emit enrollment.pause event → sequence-worker pauses enrollment
```
