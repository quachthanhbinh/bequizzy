# Webhook HMAC Validation — Design Spec

**Date:** 2026-05-18  
**Status:** Approved  
**Priority:** 🔴 Security Blocker  
**Scope:** Group 2 — Outreach & Sales (webhook-handler service only)

---

## Problem Statement

The webhook-handler service currently accepts POST requests from Resend and Twilio without signature verification. This allows unauthenticated attackers to inject arbitrary bounce, delivery, and SMS status events, which could:
- Trigger false suppression list additions (blocking legitimate recipients)
- Corrupt analytics and delivery metrics
- Bypass rate limiting by injecting fake "delivered" events

**Current state:** All three webhook handlers (Resend, Twilio, Calendly) parse payloads but never validate authenticity.

**Audit reference:** `docs/audit/IMPLEMENTATION_AUDIT.md` line 363 (Group 2f, blocker #1)

---

## Architecture

The webhook-handler service has a simple flow:
1. `main.py` receives POST at `/webhook/{provider}`
2. Routes to provider-specific handler (Resend, Twilio, Calendly)
3. Handler normalizes events into canonical dict
4. Returns `{"ok": true, "event_type": "..."}`

We'll add signature verification as the **first step inside each handler**, before any parsing or normalization. The main route stays thin—it only reads the raw request body and headers, then passes both to the handler.

Each handler validates its provider's signature scheme, raises `401 Unauthorized` on failure, then proceeds with existing normalization logic. This keeps verification logic co-located with provider-specific parsing rules.

**Why handler-level, not route-level?**
- Resend uses Svix webhook signatures (specific canonical string format)
- Twilio uses HMAC-SHA256 with URL-encoded form data
- Each provider has different signature construction rules
- Centralizing in the route would accumulate provider-specific branching

---

## Components

### 1. Route Handler ([services/webhook-handler/app/main.py](services/webhook-handler/app/main.py))

**Current signature:**
```python
async def handle_webhook(provider: str, request: Request) -> dict:
    body: dict[str, Any] = await request.json()
    # dispatch to handler with dict
```

**New signature:**
```python
async def handle_webhook(provider: str, request: Request) -> dict:
    raw_body: bytes = await request.body()
    headers: dict = dict(request.headers)
    # dispatch to handler with (raw_body, headers)
```

**Changes:**
- Read `await request.body()` instead of `await request.json()` to preserve raw bytes for signature verification
- Extract `request.headers` as dict
- Pass both `raw_body` and `headers` to each handler
- Update handler calls: `handle_resend(raw_body, headers)` instead of `handle_resend(body)`

---

### 2. Resend Handler ([services/webhook-handler/app/handlers/resend.py](services/webhook-handler/app/handlers/resend.py))

**New function signature:**
```python
def handle_resend(body: bytes, headers: dict[str, str]) -> dict[str, Any]:
```

**Implementation steps:**
1. Add `verify_resend_signature(body: bytes, headers: dict)` function at top of file
2. Use `svix` library to validate `Svix-Signature`, `Svix-Id`, `Svix-Timestamp` headers
3. Raise `HTTPException(401, detail="Invalid Resend signature")` on failure
4. Parse `json.loads(body)` after verification passes
5. Proceed with existing normalization logic

**Svix verification:**
```python
from svix.webhooks import Webhook, WebhookVerificationError

def verify_resend_signature(body: bytes, headers: dict) -> None:
    secret = os.environ["RESEND_WEBHOOK_SECRET"]
    wh = Webhook(secret)
    try:
        wh.verify(body, headers)
    except WebhookVerificationError:
        raise HTTPException(401, detail="Invalid Resend signature")
```

**Environment variable required:** `RESEND_WEBHOOK_SECRET` (Svix signing secret from Resend webhook settings)

---

### 3. Twilio Handler ([services/webhook-handler/app/handlers/twilio.py](services/webhook-handler/app/handlers/twilio.py))

**New function signature:**
```python
def handle_twilio(body: bytes, headers: dict[str, str]) -> dict[str, Any]:
```

**Implementation steps:**
1. Add `verify_twilio_signature(body: bytes, headers: dict, url: str)` function
2. Reconstruct canonical string: `url + sorted(form_params)`
3. Compute HMAC-SHA256 with `TWILIO_AUTH_TOKEN`
4. Compare with `X-Twilio-Signature` header using constant-time comparison
5. Raise `HTTPException(401, detail="Invalid Twilio signature")` on mismatch
6. Parse form-encoded body after verification passes
7. Proceed with existing normalization logic

**HMAC verification:**
```python
import hmac
import hashlib
from urllib.parse import parse_qs

def verify_twilio_signature(body: bytes, headers: dict, url: str) -> None:
    provided_sig = headers.get("X-Twilio-Signature", "")
    if not provided_sig:
        raise HTTPException(401, detail="Missing X-Twilio-Signature header")
    
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    params = parse_qs(body.decode("utf-8"))
    canonical = url + "".join(f"{k}{v[0]}" for k, v in sorted(params.items()))
    
    computed = hmac.new(
        auth_token.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(computed, provided_sig):
        raise HTTPException(401, detail="Invalid Twilio signature")
```

**Environment variable required:** `TWILIO_AUTH_TOKEN` (Twilio account auth token, not SID)

**Note:** Twilio requires the full request URL for signature verification. We'll need to reconstruct it from `request.url` in the route handler and pass it to the Twilio handler.

---

### 4. Calendly Handler (No Changes)

Calendly webhooks will be addressed in a future iteration. For now, Calendly events remain unverified (low risk—booking events are less sensitive than suppression/bounce events).

---

## Data Flow

**Current flow:**
1. POST `/webhook/resend` arrives
2. `main.py` reads `await request.json()` → dict
3. Handler receives dict, normalizes to canonical event
4. Returns `{"ok": true, "event_type": "..."}`

**New flow:**
1. POST `/webhook/resend` arrives
2. `main.py` reads `await request.body()` → bytes, extracts `request.headers` → dict
3. Handler receives `(body: bytes, headers: dict)`
4. Handler verifies signature using raw body + headers → raises 401 on failure
5. Handler parses `json.loads(body)` → dict
6. Handler normalizes to canonical event
7. Returns `{"ok": true, "event_type": "..."}`

**Key change:** Signature check happens **before** JSON parsing, so malformed or malicious payloads are rejected before we spend cycles deserializing them.

---

## Error Handling

### Signature Verification Failures

All signature verification failures raise `HTTPException(401, detail="Invalid signature")` immediately, before any event processing.

**Resend verification failures:**
- Missing `Svix-Signature`, `Svix-Id`, or `Svix-Timestamp` headers → 401
- Signature mismatch (computed vs provided) → 401
- Timestamp outside tolerance window (±5 minutes) → 401

**Twilio verification failures:**
- Missing `X-Twilio-Signature` header → 401
- HMAC mismatch → 401

### Logging

All 401 responses will be logged with:
- Provider name
- Sanitized error message (no raw signatures or secrets)
- Request timestamp
- Source IP (if available from headers)

**Example log:**
```json
{
  "level": "warning",
  "service": "webhook-handler",
  "provider": "resend",
  "error": "Invalid signature",
  "timestamp": "2026-05-18T14:32:01Z",
  "source_ip": "192.0.2.1"
}
```

### Existing Error Paths

The existing 400 error path for unrecognized event types stays unchanged—signature validation happens first, then event type validation.

**Error precedence:**
1. 401 — Invalid signature (new)
2. 400 — Unrecognized event type (existing)
3. 500 — Internal server error (existing)

---

## Testing

### Test Files

**[services/webhook-handler/tests/test_resend.py](services/webhook-handler/tests/test_resend.py)** — add test cases:
- ✅ Valid signature with correct timestamp → 200
- ❌ Missing `Svix-Signature` header → 401
- ❌ Invalid signature (wrong secret) → 401
- ❌ Expired timestamp (>5 min old) → 401
- ❌ Valid signature but unrecognized event type → 400 (existing validation still applies)

**[services/webhook-handler/tests/test_twilio.py](services/webhook-handler/tests/test_twilio.py)** — add test cases:
- ✅ Valid HMAC signature → 200
- ❌ Missing `X-Twilio-Signature` header → 401
- ❌ Invalid HMAC (wrong auth token) → 401
- ❌ Valid signature but unrecognized status → 400

### Test Utilities

**Resend:** Use `svix` library's test utilities for signature generation:
```python
from svix.webhooks import Webhook

def generate_resend_signature(body: bytes, secret: str) -> dict[str, str]:
    wh = Webhook(secret)
    return wh.sign("msg_id", body)
```

**Twilio:** Compute HMAC-SHA256 manually in tests:
```python
import hmac
import hashlib

def generate_twilio_signature(url: str, params: dict, auth_token: str) -> str:
    canonical = url + "".join(f"{k}{v}" for k, v in sorted(params.items()))
    return hmac.new(
        auth_token.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
```

### Test Environment Variables

All tests will use mock secrets:
- `RESEND_WEBHOOK_SECRET=test_resend_secret`
- `TWILIO_AUTH_TOKEN=test_twilio_token`

---

## Security Considerations

### Secret Management

Both `RESEND_WEBHOOK_SECRET` and `TWILIO_AUTH_TOKEN` will be stored in GCP Secret Manager and injected as environment variables at runtime.

**Fail-closed behavior:** The service will fail to start if either secret is missing (raise exception during startup validation).

**Secret rotation:** Secrets can be rotated in GCP Secret Manager without code changes. The service will pick up new secrets on next deployment.

**Logging:** Secrets will never be logged or included in error responses. All signature verification errors return generic "Invalid signature" messages.

---

### Timing Attack Resistance

**Resend:** The `svix` library uses constant-time comparison internally for signature validation.

**Twilio:** We use `hmac.compare_digest()` for constant-time comparison, preventing timing-based attacks that could leak signature validity through response time measurements.

---

### Replay Attack Prevention

**Resend:** Svix signatures include a timestamp that's validated within a ±5 minute window. This prevents replay of old valid webhooks.

**Twilio:** Twilio signatures don't include timestamps. Webhook events are idempotent (we'll add deduplication in a future iteration when we wire downstream persistence).

---

### Rate Limiting

The existing API Gateway rate limiting applies to webhook endpoints, preventing brute-force signature guessing attempts.

**Current rate limit:** 100 requests/minute per IP (configured in api-gateway)

---

## Deployment & Configuration

### Environment Variables Required

- `RESEND_WEBHOOK_SECRET` — Svix signing secret from Resend webhook settings
- `TWILIO_AUTH_TOKEN` — Twilio account auth token (not the account SID)

### GCP Secret Manager Setup

**Staging:**
```bash
echo -n "whsec_..." | gcloud secrets create webhook-handler-resend-secret \
  --data-file=- --project=revlooper-staging

echo -n "..." | gcloud secrets create webhook-handler-twilio-token \
  --data-file=- --project=revlooper-staging
```

**Production:**
```bash
echo -n "whsec_..." | gcloud secrets create webhook-handler-resend-secret \
  --data-file=- --project=revlooper-prod

echo -n "..." | gcloud secrets create webhook-handler-twilio-token \
  --data-file=- --project=revlooper-prod
```

### Dependencies to Add

Add to `services/webhook-handler/requirements.txt`:
```
svix==1.24.0
```

### Cloud Function Deployment Config

Update `services/webhook-handler/cloudbuild.yaml` to mount secrets:
```yaml
env:
  - name: RESEND_WEBHOOK_SECRET
    valueFrom:
      secretKeyRef:
        name: webhook-handler-resend-secret
        version: latest
  - name: TWILIO_AUTH_TOKEN
    valueFrom:
      secretKeyRef:
        name: webhook-handler-twilio-token
        version: latest
```

### Rollout Plan

1. Add secrets to GCP Secret Manager in staging
2. Deploy updated webhook-handler to staging
3. Test with Resend/Twilio webhook test events (use provider dashboards to send test webhooks)
4. Monitor 401 error rates for 24 hours
5. Repeat for production
6. Monitor 401 error rates for 24 hours—spike indicates misconfigured secrets

### Rollback Plan

If signature verification causes issues:
1. Revert to previous deployment (no signature verification)
2. Investigate secret configuration
3. Re-deploy after fixing secrets

**No data loss risk:** Signature verification is purely additive—no database changes, no downstream service changes.

---

## Integration with Downstream Services

### Current State

The webhook-handler service currently operates as a **normalization-only layer**:
1. Receives webhook POST from provider (Resend, Twilio, Calendly)
2. Validates signature (after this implementation)
3. Normalizes provider-specific payload into canonical dict
4. Returns `{"ok": true, "event_type": "...", "details": {...}}` to provider
5. **Does NOT forward events to any downstream service**

**Audit reference:** `docs/audit/IMPLEMENTATION_AUDIT.md` line 1036 — "Normalized events never forwarded — handlers return a dict; nothing calls outreach-service, booking-service, or any downstream"

---

### HMAC Validation is Independent of Event Forwarding

This implementation adds signature verification **before** normalization. The verification layer is completely independent of downstream forwarding:

```
┌─────────────────────────────────────────────────────────────┐
│  POST /webhook/resend                                       │
│    ↓                                                        │
│  1. Read raw body + headers                                 │
│    ↓                                                        │
│  2. Verify signature (NEW — this spec)                      │
│    ↓ (401 on failure)                                       │
│  3. Parse JSON                                              │
│    ↓                                                        │
│  4. Normalize to canonical dict (EXISTING)                  │
│    ↓                                                        │
│  5. Return dict to provider (EXISTING)                      │
│    ↓                                                        │
│  6. [FUTURE] Forward to downstream services                 │
│     - Resend bounce/complaint → outreach-service            │
│     - Calendly booking → booking-service                    │
│     - Write to outbox table for retry                       │
└─────────────────────────────────────────────────────────────┘
```

**Key point:** Steps 1-5 are self-contained. Step 6 (downstream forwarding) can be added later without touching the HMAC validation code.

---

### Preserved Event Structure

The normalized event dict structure is preserved for future forwarding work:

**Resend events:**
```python
{
    "provider": "resend",
    "event_type": "bounced" | "delivered" | "opened" | "clicked" | "spam_complaint",
    "message_id": str,
    "to": str,
    "subject": str,
    "timestamp": str,
    "raw": dict,
}
```

**Twilio events:**
```python
{
    "provider": "twilio",
    "event_type": "sms_delivered" | "sms_failed" | "sms_undelivered" | ...,
    "message_sid": str,
    "to": str,
    "from_": str,
    "raw": dict,
}
```

**Calendly events:**
```python
{
    "provider": "calendly",
    "event_type": "meeting_booked" | "meeting_cancelled",
    "invitee_email": str,
    "invitee_name": str,
    "start_time": str,
    "end_time": str,
    "cancel_reason": str | None,
    "raw": dict,
}
```

These structures are unchanged by HMAC validation and remain ready for downstream forwarding.

---

### Separate Outreach-Service Webhook Endpoint

**Important:** There is a **separate** webhook endpoint in `services/outreach-service/app/api/v1/webhooks.py` at `/email-events/webhook/{provider}` that handles SendGrid and Postmark events.

**Key differences:**
- **webhook-handler** (this spec): Resend + Twilio + Calendly, no downstream forwarding yet
- **outreach-service**: SendGrid + Postmark, DOES forward to downstream (auto-suppression, outbox events)

These are two independent webhook ingestion paths. The outreach-service endpoint already implements downstream forwarding (idempotent event insertion, auto-suppression on bounce/complaint, outbox event emission). The webhook-handler service will eventually implement similar forwarding logic, but that work is deferred.

---

### Future Downstream Integration Work (Deferred)

When downstream forwarding is implemented in webhook-handler (separate implementation slice), the following integrations will be added:

**Resend bounce/complaint events:**
- Call `outreach-service POST /v1/suppression` with `{"email": "...", "reason": "bounce" | "complaint"}`
- Idempotent suppression list addition
- Triggers `lead.suppressed` outbox event in outreach-service

**Calendly booking events:**
- Call `booking-service POST /v1/bookings` with `{"cal_booking_id": "...", "attendee_email": "...", "attendee_name": "...", "meeting_type_id": "..."}`
- Idempotent booking creation (ON CONFLICT cal_booking_id DO NOTHING)
- Triggers `booking.created` outbox event in booking-service

**Outbox table for retry:**
- Add `webhook_events` table in webhook-handler service
- Write normalized event to outbox atomically with HTTP dispatch
- Retry failed dispatches with exponential backoff
- Mark events as `delivered` after successful downstream response

**Audit reference:** `docs/audit/IMPLEMENTATION_AUDIT.md` line 1045 — "Implement event dispatch: Resend bounce/complaint → outreach-service POST /v1/suppression; Calendly booking → booking-service POST /v1/bookings"

---

### Why Defer Downstream Forwarding?

1. **Security first:** HMAC validation is a security blocker; downstream forwarding is a functional gap
2. **Independent concerns:** Signature verification and event forwarding are orthogonal—no coupling
3. **Smaller implementation slice:** HMAC validation is 2-4 hours; downstream forwarding is 1-2 days
4. **No data loss:** Providers retry failed webhooks; missing forwarding is recoverable, missing HMAC is not

---

## Out of Scope

The following are explicitly **not** included in this implementation:

1. **Calendly signature verification** — Calendly uses a different signature scheme; will be addressed in a future iteration
2. **Downstream event persistence** — Handlers currently return normalized dicts but don't write to DB or call downstream services; that's a separate feature
3. **Event deduplication** — Twilio events can be replayed; deduplication will be added when we wire downstream persistence
4. **Webhook retry logic** — If a webhook fails verification, we return 401 and the provider retries; no custom retry logic needed

---

## Success Criteria

✅ All Resend webhooks are verified using Svix signatures before processing  
✅ All Twilio webhooks are verified using HMAC-SHA256 before processing  
✅ Invalid signatures return 401 with no event processing  
✅ Valid signatures proceed to existing normalization logic unchanged  
✅ All tests pass with 100% coverage of signature verification paths  
✅ No 401 errors in staging after 24 hours (indicates correct secret configuration)  
✅ Service fails to start if secrets are missing (fail-closed behavior)

---

## Implementation Checklist

- [ ] Update `main.py` to read raw body + headers and pass to handlers
- [ ] Add `verify_resend_signature()` to `resend.py`
- [ ] Add `verify_twilio_signature()` to `twilio.py`
- [ ] Update handler signatures to accept `(body: bytes, headers: dict)`
- [ ] Add `svix` to `requirements.txt`
- [ ] Add test cases for valid/invalid signatures in both test files
- [ ] Add secrets to GCP Secret Manager (staging + prod)
- [ ] Update Cloud Function deployment config to mount secrets
- [ ] Deploy to staging and test with provider webhook test events
- [ ] Monitor 401 error rates for 24 hours
- [ ] Deploy to production
- [ ] Monitor 401 error rates for 24 hours
