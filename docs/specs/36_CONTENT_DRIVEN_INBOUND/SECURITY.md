# Spec 36 — Content-Driven Inbound Engine — Security

**Status:** 📝 Draft
**Security Level:** 🔴 HIGH
**Last updated:** 2026-05-08

---

## 1. Threat Model Overview

Spec 36 introduces 3 new attack surfaces:

1. **Public webhook endpoint** — receives unauthenticated POST requests from the internet
2. **User-supplied DM template** — rendered server-side (SSTI risk)
3. **Personal data from public comments** — commenter names, Facebook User IDs, comment text (PII under PDPD/PDPA)

Additionally, 4 architecture non-negotiables apply:
- workspace_id isolation on every DB query
- Suppression check before every DM dispatch
- Consent log for VN/TH/SG workspaces
- Credits deducted before AI/outbound operations

---

## 2. Security Controls

### 2.1 S1 — A07 Webhook Authentication (HIGH)

**Risk:** Without verification, any attacker can send fake comment events to trigger fraudulent captures, exhaust workspace credits, and flood lead databases.

**Control:** Facebook sends `X-Hub-Signature-256: sha256={hex_digest}` with every webhook call. The `webhook-handler` must:

```python
import hmac, hashlib

def verify_facebook_signature(payload_body: bytes, signature_header: str, app_secret: str) -> bool:
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    # MUST use compare_digest — constant-time comparison prevents timing attacks
    return hmac.compare_digest(expected, signature_header)
```

- `app_secret` loaded from GCP Secret Manager — never hardcoded
- Reject with HTTP 403 if signature missing or invalid
- HTTP 200 returned immediately after ACK for all valid events (even those we don't process) — prevents Facebook retry storms
- Verification happens BEFORE any event processing or Pub/Sub publish

**Test required:** See TESTS.md §T1.

### 2.2 S2 — A03 Server-Side Template Injection (HIGH)

**Risk:** `social_posts.dm_template` is user-supplied and rendered server-side. With Jinja2's default `Environment`, a malicious user can execute: `{{ ''.__class__.__mro__[1].__subclasses__() }}` or `{{ config }}` to achieve RCE or leak internal data.

**Control (mandatory — code review BLOCKER):**

```python
# CORRECT ✅
from jinja2.sandbox import SandboxedEnvironment

def render_dm_template(template_str: str, commenter_name: str, post_caption: str) -> str:
    env = SandboxedEnvironment(autoescape=True)
    template = env.from_string(template_str)
    # EXPLICIT ALLOWLIST — nothing else passes
    return template.render({
        "name": commenter_name,
        "post_caption": post_caption[:100] if post_caption else ""
    })

# FORBIDDEN ❌
from jinja2 import Environment  # insecure default
```

- Template context is an explicit allowlist: only `{name, post_caption}`
- Passing `workspace_id`, `access_token`, or any internal fields to the template context is forbidden
- Even with `SandboxedEnvironment`, the context dict must not expose secrets

**Test required:** See TESTS.md §T2.

**Frontend validation:** Template editor must reject templates containing `__`, `import`, `config`, `request`, `os`, `sys` as a client-side heuristic. This is not a security boundary — the server-side sandbox is the real control. The client-side validation is UX only.

### 2.3 S3 — A01 IDOR / Cross-Tenant Data Leak (HIGH)

**Risk 1 — Page resolver cache poisoning:** If Redis keys for `page_resolver:{page_id}` are not isolated, one workspace could steal another workspace's comment events.

**Control:** Redis key includes `page_id` only (no workspace_id in the key, because `page_id` → `workspace_id` is the resolution itself). However:
- TTL must be short enough that page disconnection is respected (max 1 hour)
- Cache invalidation on `integration.disconnected` event is mandatory
- The resolved `workspace_id` is used for all downstream workspace_id scoping

**Risk 2 — Missing workspace_id on comment_captures queries:** An API endpoint that returns captures without `WHERE workspace_id = ?` leaks cross-tenant data.

**Control:** All `campaign-service` queries on `social_posts`, `comment_keyword_rules`, `comment_captures` MUST include `workspace_id`. Pattern:
```python
# REQUIRED on every query
result = await session.execute(
    select(CommentCapture)
    .where(CommentCapture.workspace_id == workspace_id)  # mandatory
    .where(CommentCapture.post_id == post_id)
    .order_by(CommentCapture.captured_at.desc())
)
```

**RLS backup:** Row-Level Security policies must be applied to all three tables (social_posts, comment_keyword_rules, comment_captures) consistent with the workspace_id RLS pattern from Spec 01.

### 2.4 S4 — Suppression Check (HIGH)

**Architecture Non-Negotiable:** Every DM dispatch must check suppression before sending.

**MVP Scope Limitation:** The `suppression_list` table is email-keyed (`UNIQUE(workspace_id, email)`). There is no per-channel social suppression mechanism. For MVP, suppression for Facebook DMs is implemented as:

```
Before DM dispatch:
  GET /internal/leads/find-by-social-id?platform=facebook&external_id={commenter_id}
  If lead found AND lead.status == "unsubscribed":
    → Skip DM, set dm_error = "suppressed"
    → Still record the capture (commenter_id, comment_text) for audit purposes
```

**Known limitation (formally documented):** This check only suppresses commenters who:
1. Have previously been identified as RevLooper leads in this workspace
2. Have been marked `unsubscribed` by any method

First-time commenters who have never been leads will NOT be suppressed even if they are on an email suppression list, because there is no cross-channel lookup by Facebook user ID in the suppression_list table.

**Phase 2 roadmap:** Extend `suppression_list` table with `platform TEXT`, `social_user_id TEXT`, `UNIQUE(workspace_id, platform, social_user_id)`. Add opt-out processing when a commenter replies "STOP" to the DM.

**Until Phase 2:** This limitation must be surfaced in the product UI: "DM suppression is based on lead status. Commenters new to your workspace will always receive the initial DM."

### 2.5 S5 — SEA Data Privacy / Consent (HIGH)

**Scope:** VN, TH, SG workspaces (Vietnam PDPD, Thailand PDPA, Singapore PDPA).

When a commenter's name and Facebook User ID are stored in `comment_captures`, this constitutes processing of personal data. A consent record is required.

**Control — consent_log write (atomic with lead creation):**

```python
# In lead-service comment.captured handler
async with session.begin():
    lead = Lead(
        workspace_id=workspace_id,
        external_id=commenter_id,
        platform='facebook',
        first_name=first_name,
        last_name=last_name,
        source='social_comment',
        source_url=post_url,
        status='new'
    )
    session.add(lead)
    await session.flush()  # get lead.id
    
    # Consent log — only for VN/TH/SG workspaces
    if workspace_country in ('VN', 'TH', 'SG'):
        consent = ConsentLog(
            lead_id=lead.id,
            workspace_id=workspace_id,
            source='social_comment',
            method='auto_dm_footer',  # opt-out instruction in DM
            external_id=commenter_id,
            captured_at=captured_at
        )
        session.add(consent)
    # Both written atomically — no race condition possible
```

**DM opt-out footer (mandatory for VN/TH/SG — server-side appended, not user-editable):**
```
Trả lời STOP để hủy nhận tin.
```
Appended by `comment-processor` after template rendering, before API dispatch. Not part of the user's template string.

**STOP processing (MVP limitation):** Processing of incoming STOP replies to DMs is out of scope for Spec 36. The opt-out footer is included for legal compliance, but the unsubscribe action must currently be done manually by the workspace owner in RevLooper. Phase 2 should add STOP reply processing via the Messenger webhook.

### 2.6 S6 — A08 Credits Integrity (MEDIUM)

**Risk:** DM sent before credit deduction → unlimited free sends.

**Control:** Credit deduction MUST occur before DM dispatch. Order enforced in `comment-processor`:

```python
# Step 8 — BEFORE step 9 (DM dispatch)
credit_result = await billing_client.deduct_credits(
    workspace_id=workspace_id,
    amount=1,
    reason="social_dm_send",
    ref=commenter_id
)
if not credit_result.success:
    dm_error = "credits_exhausted"
    # Record capture with dm_sent=False, dm_error, skip step 9
    return
# Only if deduction successful: proceed to DM dispatch
```

If DM dispatch fails after credit deduction: credit is already consumed (consistent with email send behavior in existing outreach-service). Log the failure for potential manual refund handling by support.

### 2.7 S7 — A06 Sensitive Data Exposure (MEDIUM)

**Facebook Access Token handling:**
- Stored encrypted in `integrations.access_token_enc` by `integration-service`
- Decrypted only by `integration-service` internal endpoint
- Never returned to frontend, never logged, never included in Pub/Sub event payloads
- `comment-processor` receives the decrypted token from integration-service only for the duration of the DM dispatch call; it is not cached or stored

**Facebook User ID in Redis cooldown keys:**
- Key format: `cooldown:{workspace_id}:{post_id}:{commenter_id}`
- `commenter_id` is a public Facebook User ID (not a secret), but should still be hashed in Redis key to avoid key scanning: `cooldown:{workspace_id}:{post_id}:{sha256(commenter_id)[:16]}`

### 2.8 S8 — A09 Logging (MEDIUM)

**Never log:**
- Facebook access tokens
- Full `raw_payload` content beyond comment_id and post_id in application logs (store raw_payload in DB only, not in structured logs)
- Commenter names in INFO-level logs (only in DEBUG, which is disabled in production)

**Always include in structured logs:**
- `workspace_id`, `post_id`, `comment_capture_id`, `dm_sent`, `dm_error`, `trace_id`
- `commenter_id` is acceptable in logs (public Facebook User ID)

---

## 3. Meta App Review Requirements

The following Graph API permissions require Meta Business App Review before production launch:

| Permission | Reason | Review risk |
|---|---|---|
| `pages_read_engagement` | Read public comments on managed pages | Medium — must demonstrate legitimate use |
| `pages_messaging` | Send private replies via Private Replies API | High — Meta scrutinizes messaging permissions |
| `pages_show_list` | List pages the user manages (for page selector UI) | Low |

**App Review submission must be started at the same time as implementation begins.** Estimated review timeline: 4–8 weeks. A rejected review delays the entire feature launch.

Submission requires:
- A screen recording demonstrating the use case (comment → DM flow)
- Business verification for the Facebook App
- Privacy policy URL listing Facebook data processing
- A test user who can demonstrate the flow end-to-end

---

## 4. Security Checklist (pre-ship)

- [ ] HMAC verification with `hmac.compare_digest` (constant-time) — tested with invalid signature
- [ ] `SandboxedEnvironment` used for ALL template rendering — no `jinja2.Environment` (default)
- [ ] Template context allowlist verified: only `{name, post_caption}`
- [ ] workspace_id included in all DB queries for social_posts, comment_keyword_rules, comment_captures
- [ ] RLS policies applied to all 3 new tables
- [ ] Suppression check called before every DM dispatch
- [ ] Credit deduction called BEFORE DM dispatch
- [ ] consent_log write verified in lead-service for VN/TH/SG workspaces
- [ ] Facebook access token never appears in logs or Pub/Sub payloads
- [ ] Opt-out footer appended server-side for VN/TH/SG DMs
- [ ] OIDC auth required on all /internal/* endpoints (not exposed via api-gateway)
- [ ] Comment edit events (`verb == "edited"`) filtered and ignored without error
