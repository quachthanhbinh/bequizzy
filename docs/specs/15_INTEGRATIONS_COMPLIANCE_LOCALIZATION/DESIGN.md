# Spec 15 — Integrations, Compliance & Localization: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Integrations are a forcing function for enterprise deals. HubSpot first, then Salesforce. Zapier unlocks long tail of automation users. PDPA compliance is a blocker for VN enterprise sales — must have dashboard + erasure endpoint. i18n: VN UI for P1. Confidence: 6.

**CTO:** Webhooks: `integration-service` manages outbound delivery with retry (Cloud Tasks). HMAC secret per webhook endpoint (per-workspace). HubSpot: OAuth credentials in Secret Manager; sync via background job (Cloud Scheduler 5m). Erasure: soft-delete PII in `leads` (null first_name, last_name, email, phone); write to `gdpr_erasure_requests`; 30-day async batch (Cloud Run Job). i18n: next-intl library. Confidence: 6.

**Gap: 0. Both = 6. Converge but flag HubSpot rate limits.**

### Round 2

**CTO:** HubSpot API rate limit: 100 calls/10s per workspace. Use batched upsert endpoint (`/crm/v3/objects/contacts/batch/upsert`) — 100 records per call. Confidence: 7.

**CPO + CTO:** Final scope confirmed. Confidence: 7.

**Final Confidence: 7 / 10.** Why not higher: Salesforce integration is complex (SOQL, object model) — P1 but may slip to Wave 5.

---

## Data Model

### Table: `webhook_endpoints`
```sql
CREATE TABLE webhook_endpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  url           TEXT NOT NULL,
  event_types   TEXT[] NOT NULL,
  secret        TEXT NOT NULL,  -- HMAC secret, stored encrypted
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `webhook_deliveries`
```sql
CREATE TABLE webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  endpoint_id   UUID NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  delivered_at  TIMESTAMPTZ
);
```

### Table: `gdpr_erasure_requests`
```sql
CREATE TABLE gdpr_erasure_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  lead_id       UUID NOT NULL,
  requested_by  UUID,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|completed
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Webhook Signature
```python
import hmac, hashlib
def sign_payload(secret: str, payload: bytes) -> str:
    return hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
```
