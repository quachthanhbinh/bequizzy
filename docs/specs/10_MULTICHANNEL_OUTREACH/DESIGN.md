# Spec 10 — Multichannel Outreach: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** LinkedIn and SMS must feel native in the sequence builder — same drag-drop canvas as email steps. For LinkedIn: browser extension bridge is the pragmatic approach (no official API for cold outreach). For VN users: ESMS.vn is table-stakes (Twilio VN numbers are expensive and unreliable). PDPA consent gating must be seamless — workspace owners pre-collect consent, RevLooper just checks it. Confidence: 6.

**CTO:** Browser extension bridge adds architectural complexity — the extension acts as a local proxy; outreach-service sends instructions to the extension, which executes against LinkedIn DOM. This is fragile (LinkedIn DOM changes) but it's the only viable approach short of a partnership. For SMS: `channel_sends` table reuses the same pattern as `email_sends`. LinkedIn rate limit enforcement: Redis counter per `{linkedin_account_id, date}`, hard limit 25/day. Confidence: 6 — LinkedIn fragility concerns me.

**Gap: 0. Both = 6. Converge but document fragility risk.**

### Round 2

**CPO + CTO joint:** Accept LinkedIn fragility as a known risk. Document in RESULT.md when shipped. For consent: `consent_log` table (Spec 20) is the source of truth — outreach-service reads it synchronously before sending. PDPA check is a hard gate (same as suppression). Confidence: 7.

**Final Confidence: 7 / 10.** Why not higher: LinkedIn browser extension dependency is brittle. Any LinkedIn DOM change or ToS update breaks the channel.

---

## Data Model

### Table: `channel_sends`
```sql
CREATE TABLE channel_sends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  lead_id       UUID NOT NULL,
  enrollment_id UUID,
  step_id       UUID,
  channel       TEXT NOT NULL,  -- linkedin_connect|linkedin_message|sms
  status        TEXT NOT NULL DEFAULT 'queued',  -- queued/sent/delivered/failed/skipped
  provider      TEXT,           -- twilio|esms_vn|linkedin_extension
  provider_msg_id TEXT,
  skipped_reason TEXT,          -- no_consent|suppressed|rate_limit
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_channel_sends_workspace ON channel_sends (workspace_id);
CREATE INDEX idx_channel_sends_lead ON channel_sends (workspace_id, lead_id);
```

### Extension Bridge Protocol
```
sequence-worker → outreach-service POST /channels/linkedin/connect
    → outreach-service stores task in Redis queue: linkedin_tasks:{account_id}
    → Browser extension polls queue (long-poll / SSE)
    → Extension executes LinkedIn action
    → Extension POST /channels/linkedin/result {task_id, success, error}
    → outreach-service updates channel_sends.status
```

### SMS Router
```python
def get_sms_provider(phone: str) -> str:
    if phone.startswith("+84"):
        return "esms_vn"
    return "twilio"
```
