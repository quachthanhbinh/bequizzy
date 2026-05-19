# Spec 36 — Content-Driven Inbound Engine — Design

**Status:** 📝 Draft
**Confidence:** CPO 9/10 | CTO 7/10 | Converged ✅
**Last updated:** 2026-05-08

---

## 1. System Architecture

```
[Facebook Graph API — Webhook]
        │ POST /webhooks/facebook  (comment.created events)
        │ X-Hub-Signature-256 header
        ▼
[webhook-handler — Cloud Function 2nd gen]
  ├── Verify HMAC-SHA256 signature (hmac.compare_digest, constant-time)
  ├── Reject non-comment events (return 200 immediately — do NOT 4xx)
  ├── Reject events for pages not registered in Redis (page_resolver cache miss → drop)
  └── Publish to Pub/Sub: topic "facebook.comment.received"
        │
        ▼
[Pub/Sub: facebook.comment.received]
        │
        ▼
[comment-processor — Cloud Function 2nd gen, Pub/Sub-triggered]
  ├── 1. Resolve page_id → {workspace_id, access_token} via Redis cache
  │      Cache key: page_resolver:{page_id}  TTL: 1h
  │      Cache miss: call integration-service GET /internal/integrations/resolve
  ├── 2. Fetch post_config from Redis cache
  │      Cache key: post_config:{workspace_id}:{post_id}  TTL: 5min
  │      Cache miss: call campaign-service GET /internal/social-posts/{post_id}/config
  │      (returns: {keyword_rules, dm_template, status, campaign_id, sequence_id})
  ├── 3. If post.status != "active" → return (no-op)
  ├── 4. Filter comment edit events: changes[*].value.verb == "edited" → return (no-op)
  ├── 5. Idempotency lock: Redis SETNX cooldown:{workspace_id}:{post_id}:{commenter_id}
  │      key = 1, nx=True, ex=86400 (24h). If not acquired → return (already processed)
  ├── 6. Match keywords against comment_text (normalized + unidecode)
  │      If no match → return (no-op); release lock if acquired via GETDEL
  ├── 7. Check suppression: call lead-service GET /internal/leads/find-by-social-id
  │      ?platform=facebook&external_id={commenter_id}&workspace_id={workspace_id}
  │      If lead found AND status == "unsubscribed" → dm_suppressed=true
  ├── 8. Deduct credit if not suppressed: billing-service POST /internal/credits/deduct
  │      {workspace_id, amount: 1, reason: "social_dm_send", ref: commenter_id}
  │      If insufficient credits → dm_error="credits_exhausted"
  ├── 9. Dispatch DM (if not suppressed and credits OK):
  │      POST /{comment_id}/private_replies  (Facebook Private Replies API)
  │      message = SandboxedEnvironment().render(dm_template, {name, post_caption})
  │      Record dm_sent=true/false, dm_error if failed
  └── 10. Call campaign-service POST /internal/comment-captures
           (records capture, fires outbox event comment.captured atomically)
        │
        ▼
[campaign-service — Cloud Run]
  POST /internal/comment-captures writes:
    INSERT comment_captures (workspace_id, post_id, comment_id, commenter_id,
      commenter_name, comment_text, matched_keyword, dm_sent, dm_sent_at, dm_error,
      raw_payload, captured_at) ON CONFLICT (workspace_id, post_id, commenter_id) DO NOTHING
  Atomically writes outbox_events:
    {type: "comment.captured", payload: {workspace_id, comment_capture_id,
      post_id, commenter_id, commenter_name, comment_text, matched_keyword,
      campaign_id, sequence_id}}
        │
        ▼ (via outbox-publisher → Pub/Sub topic: comment.captured)
[lead-service — subscribes to comment.captured]
  ├── Create or merge lead:
  │     SELECT * FROM leads WHERE workspace_id=? AND external_id=? AND platform='facebook'
  │     If exists: UPDATE (merge commenter_name if lead.first_name is null)
  │     If new: INSERT INTO leads (workspace_id, external_id, platform, first_name, last_name,
  │               source='social_comment', source_url, status='new')
  ├── For VN/TH/SG workspaces: INSERT INTO consent_log atomically (same DB transaction):
  │     (lead_id, workspace_id, source='social_comment', method='auto_dm_footer',
  │      commenter_id, captured_at)
  └── Writes outbox event lead.created:
        {workspace_id, lead_id, source: 'social_comment',
         comment_capture_id: <from event payload> (nullable)}
        │
        ▼ (via outbox-publisher → Pub/Sub topic: lead.created)
[campaign-service — subscribes to lead.created where source='social_comment']
  ├── UPDATE comment_captures SET lead_id = ? WHERE id = comment_capture_id
  └── If sequence_id configured on social_post: enroll lead in sequence
        (POST /internal/sequences/{sequence_id}/enroll, lead_id, workspace_id)
```

---

## 2. Data Model

### 2.1 New Tables in `campaign-service` schema

```sql
-- Social posts registered by workspace operators
CREATE TABLE social_posts (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID    NOT NULL,
  campaign_id       UUID,              -- soft FK; null = standalone
  platform          TEXT    NOT NULL DEFAULT 'facebook',  -- 'facebook' only for MVP
  external_post_id  TEXT    NOT NULL,  -- Facebook post ID (numeric string)
  post_url          TEXT    NOT NULL,  -- original URL pasted by user
  caption           TEXT,              -- fetched from Graph API (first 280 chars)
  dm_template       TEXT    NOT NULL,  -- Jinja2 template (SandboxedEnvironment enforced)
  status            TEXT    NOT NULL DEFAULT 'active', -- 'active'|'paused'|'archived'
  sequence_id       UUID,              -- soft FK → campaign-service sequences; null = no auto-enroll
  created_by        UUID    NOT NULL,  -- soft FK → users
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, external_post_id)
);

CREATE INDEX idx_social_posts_workspace ON social_posts(workspace_id, status);

-- Keyword trigger rules per post
CREATE TABLE comment_keyword_rules (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID    NOT NULL,
  post_id       UUID    NOT NULL,  -- soft FK → social_posts
  keywords      TEXT[]  NOT NULL,  -- array of lowercase NFC-normalized keywords
  match_mode    TEXT    NOT NULL DEFAULT 'any',  -- 'any'|'all'|'exact' (MVP: 'any' only)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_keyword_rules_post ON comment_keyword_rules(post_id) WHERE is_active = true;
CREATE INDEX idx_keyword_rules_workspace ON comment_keyword_rules(workspace_id);

-- Comment captures — one row per commenter per post
CREATE TABLE comment_captures (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID    NOT NULL,
  post_id         UUID    NOT NULL,  -- soft FK → social_posts
  comment_id      TEXT    NOT NULL,  -- Facebook comment ID (for Private Replies API + audit)
  commenter_id    TEXT    NOT NULL,  -- Facebook User ID (global, not PSID)
  commenter_name  TEXT    NOT NULL,
  comment_text    TEXT    NOT NULL,
  matched_keyword TEXT    NOT NULL,
  lead_id         UUID,              -- soft FK → leads (backfilled after lead.created event)
  dm_sent         BOOLEAN NOT NULL DEFAULT false,
  dm_sent_at      TIMESTAMPTZ,
  dm_error        TEXT,              -- null | "credits_exhausted" | "suppressed" | "api_error: {msg}"
  raw_payload     JSONB   NOT NULL,  -- original Facebook webhook event (archived)
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, post_id, commenter_id)  -- prevents duplicate capture per commenter per post
);

CREATE INDEX idx_comment_captures_post ON comment_captures(post_id, captured_at DESC);
CREATE INDEX idx_comment_captures_workspace ON comment_captures(workspace_id, captured_at DESC);
CREATE INDEX idx_comment_captures_lead ON comment_captures(lead_id) WHERE lead_id IS NOT NULL;
```

### 2.2 Schema Change to `lead-service` (existing `consent_log`)

No schema change needed — existing `consent_log` table already supports `source TEXT`. New `source` value: `social_comment`.

### 2.3 Existing Table Change (Alembic migration required)

`comment_captures` schema above is the final version (includes `comment_id TEXT NOT NULL`). The previously documented schema in DATABASE_SCHEMA.md §4b did not include `comment_id` — this spec supersedes it.

---

## 3. Event Schema (Pub/Sub)

### 3.1 `facebook.comment.received` (webhook-handler → comment-processor)
```json
{
  "page_id": "123456789",
  "post_id": "123456789_987654321",
  "comment_id": "987654321_111222333",
  "commenter_id": "444555666",
  "commenter_name": "Nguyễn Văn A",
  "comment_text": "cho mình hỏi thông tin tour",
  "comment_verb": "add",
  "raw_payload": { "...": "full webhook event" },
  "received_at": "2026-05-08T10:00:00Z"
}
```

### 3.2 `comment.captured` (campaign-service → lead-service)
```json
{
  "workspace_id": "uuid",
  "comment_capture_id": "uuid",
  "post_id": "uuid",
  "commenter_id": "444555666",
  "commenter_name": "Nguyễn Văn A",
  "comment_text": "cho mình hỏi thông tin tour",
  "matched_keyword": "thông tin",
  "campaign_id": "uuid-or-null",
  "sequence_id": "uuid-or-null",
  "post_url": "https://facebook.com/...",
  "platform": "facebook"
}
```

### 3.3 `lead.created` (lead-service → campaign-service)
```json
{
  "workspace_id": "uuid",
  "lead_id": "uuid",
  "source": "social_comment",
  "comment_capture_id": "uuid-or-null",
  "created_at": "2026-05-08T10:00:01Z"
}
```
*`comment_capture_id` is nullable — it is null for non-social lead creation origins.*

### 3.4 `post.config.updated` (campaign-service → Redis cache invalidation)
```json
{
  "workspace_id": "uuid",
  "post_id": "uuid"
}
```
*Emitted on any update to social_posts or comment_keyword_rules for a post. Comment-processor subscriber deletes `post_config:{workspace_id}:{post_id}` from Redis.*

### 3.5 `integration.disconnected` (integration-service → Redis cache invalidation)
```json
{
  "workspace_id": "uuid",
  "channel": "facebook",
  "external_id": "page_id"
}
```
*Comment-processor subscriber deletes `page_resolver:{page_id}` from Redis.*

---

## 4. Internal API Contracts

### 4.1 `integration-service` (new endpoint — internal only)
```
GET /internal/integrations/resolve
  ?channel=facebook
  &external_id={page_id}

Auth: OIDC service account token (X-Goog-IAP-JWT-Assertion)
Not exposed via api-gateway.

Response 200:
{
  "workspace_id": "uuid",
  "access_token": "encrypted_token_decrypted_for_internal_use"
}

Response 404:
{
  "error": "integration_not_found"
}
```
*Returns decrypted access token only to internal callers. OIDC enforcement is mandatory.*

### 4.2 `campaign-service` (new endpoints — internal)
```
GET /internal/social-posts/{post_id}/config
  Headers: X-Workspace-ID: {workspace_id}
  
Response 200:
{
  "post_id": "uuid",
  "status": "active",
  "dm_template": "Chào {{name}}! ...",
  "caption": "Tour Đà Lạt 3N2Đ...",
  "sequence_id": "uuid-or-null",
  "campaign_id": "uuid-or-null",
  "keyword_rules": [
    { "id": "uuid", "keywords": ["thông tin", "bao gia"], "match_mode": "any" }
  ]
}

POST /internal/comment-captures
  Headers: X-Workspace-ID: {workspace_id}
  Body: {post_id, comment_id, commenter_id, commenter_name, comment_text,
         matched_keyword, dm_sent, dm_sent_at, dm_error, raw_payload}

Response 201: { "comment_capture_id": "uuid" }
Response 409: (UNIQUE violation — already captured, safe to ignore)
```

### 4.3 `lead-service` (new endpoint — internal)
```
GET /internal/leads/find-by-social-id
  ?platform=facebook
  &external_id={commenter_id}
  Headers: X-Workspace-ID: {workspace_id}
  
Response 200: { "lead_id": "uuid", "status": "unsubscribed|new|..." }
Response 404: (no lead found — not suppressed)
```

---

## 5. Keyword Matching Algorithm

```python
import unicodedata
from unidecode import unidecode

def normalize_text(text: str) -> str:
    """NFC normalize and casefold — preserves Vietnamese characters."""
    return unicodedata.normalize('NFC', text).casefold()

def normalize_ascii(text: str) -> str:
    """Unidecode transliteration — for commenters who type without diacritics."""
    return unidecode(text).lower()

def matches_keywords(comment_text: str, keywords: list[str], match_mode: str = 'any') -> tuple[bool, str | None]:
    """
    Returns (matched: bool, matched_keyword: str | None).
    Checks both NFC-normalized and unidecode forms for maximum recall.
    """
    comment_nfc = normalize_text(comment_text)
    comment_ascii = normalize_ascii(comment_text)
    
    matched = []
    for keyword in keywords:
        kw_nfc = normalize_text(keyword)
        kw_ascii = normalize_ascii(keyword)
        # Match if keyword appears in either normalized form
        if kw_nfc in comment_nfc or kw_ascii in comment_ascii:
            matched.append(keyword)
    
    if match_mode == 'any':
        if matched:
            return True, matched[0]
    elif match_mode == 'all':
        if len(matched) == len(keywords):
            return True, ', '.join(matched)
    
    return False, None
```

---

## 6. DM Dispatch

### API Used: Facebook Private Replies API
```
POST https://graph.facebook.com/v19.0/{comment_id}/private_replies
  ?access_token={page_access_token}
  Body: { "message": "rendered_template_string" }
```

**Why Private Replies and not Messenger Send API:**
- Private Replies API was designed specifically for automated responses to post comments
- It uses the comment_id directly — no PSID resolution round-trip required
- It is NOT subject to Meta's 24-hour standard messaging window for the initial reply
- It satisfies Meta's business policy for "responding to customer inquiries"

**Scope boundary:** The initial private DM sent via Private Replies API is in scope. Subsequent messages in the Messenger thread (follow-up sequences) enter the standard Messenger channel and are subject to the 24-hour window. Follow-up Messenger sequences are **out of scope for Spec 36**.

### DM Template Rendering
```python
from jinja2.sandbox import SandboxedEnvironment

def render_dm_template(template_str: str, commenter_name: str, post_caption: str) -> str:
    env = SandboxedEnvironment(autoescape=True)
    template = env.from_string(template_str)
    # Context is an explicit allowlist — nothing else is passed
    context = {
        "name": commenter_name,
        "post_caption": post_caption[:100] if post_caption else ""
    }
    return template.render(context)
```

**SEA opt-out footer (VN/TH/SG workspaces only — appended server-side, not editable):**
```
Trả lời STOP để hủy nhận tin.
```

---

## 7. Redis Cache Design

| Key Pattern | Value | TTL | Invalidation |
|---|---|---|---|
| `page_resolver:{page_id}` | `{workspace_id: "uuid"}` (JSON) | 1 hour | `integration.disconnected` event |
| `post_config:{workspace_id}:{post_id}` | `{status, dm_template, caption, sequence_id, keyword_rules}` (JSON) | 5 minutes | `post.config.updated` event |
| `cooldown:{workspace_id}:{post_id}:{commenter_id}` | `1` | 24 hours | Expires naturally |

**Critical implementation note:** The cooldown key MUST be set (SETNX) BEFORE the DB write and BEFORE the credit deduction. This prevents race conditions where two simultaneous Pub/Sub deliveries of the same event both proceed.

---

## 8. Service Boundary Summary

| Service | Owns | Does NOT own |
|---|---|---|
| `webhook-handler` (CF) | HMAC verification, event routing | Lead creation, keyword matching |
| `comment-processor` (CF) | Keyword matching, DM dispatch, credit deduction, suppression check | DB writes (all done via campaign-service) |
| `campaign-service` | social_posts, comment_keyword_rules, comment_captures | leads, consent_log |
| `lead-service` | leads, consent_log | comment_captures |
| `integration-service` | Facebook OAuth tokens, page registrations | Comment processing |
| `billing-service` | Credit deduction | All above |

---

## 9. Debate Summary

**CPO Round 1:** Score 9/10. Validated the pain point (SEA content-to-revenue gap), confirmed Facebook-only MVP is correct, identified Meta App Review as primary GTM risk, recommended "any" keyword matching only for MVP.

**CTO Round 1:** Score 4/10. Found 4 architectural blockers: missing page resolver endpoint, outbox pattern violation (dual-service direct calls), undefined consent_log timing, undefined suppression mechanism for non-email channel. Also flagged: Redis cache requirement for scale, Jinja2 SSTI risk, missing comment_id column.

**Round 2 Resolutions:**
- Blockers 1-2: Resolved via integration-service internal endpoint + outbox-only event chain ✅
- Blocker 3: Resolved by moving consent_log write into lead-service `comment.captured` handler (same transaction as lead INSERT) — avoids FK timing race ✅
- Blocker 4: Accepted as MVP limitation — suppress via `leads.status = unsubscribed` with formal spec note ✅
- Scale: Redis post_config cache added ✅
- SSTI: SandboxedEnvironment + explicit allowlist ✅
- comment_id: Added to schema ✅
- Correlation: comment_capture_id added to event payloads ✅

**CTO Round 2:** Score 7/10. Converged. Two remaining tracked items (CONCERN-C event correlation, suppression scope limitation) are spec-documented, not blockers.
