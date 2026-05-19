# Spec 15 — Integrations, Compliance & Localization: SECURITY

**Overall Risk: 🔴 HIGH**

## Threat Model

### T15-01: Webhook SSRF (CRITICAL)
- **Threat:** User configures webhook URL pointing to internal GCP service (169.254.x.x, 10.x.x.x)
- **Controls:** Webhook URL validation: block private IP ranges, localhost, link-local; use Cloud Armor or server-side URL denylist
- **Residual Risk:** Low

### T15-02: Webhook Replay Attack
- **Threat:** Attacker replays a valid signed webhook to another endpoint
- **Controls:** Timestamp included in payload; receiver should reject if `|now - ts| > 5 minutes`; HMAC covers timestamp
- **Residual Risk:** Low

### T15-03: HubSpot/Salesforce OAuth Token Exposure
- **Threat:** OAuth refresh tokens stored in DB or logs
- **Controls:** Tokens stored in GCP Secret Manager; only secret_ref in DB
- **Residual Risk:** Low

### T15-04: PDPA Erasure Data Leak
- **Threat:** Erasure endpoint called with another workspace's lead_id
- **Controls:** `lead_id` ownership validated: `WHERE workspace_id = :workspace_id AND id = :lead_id`
- **Residual Risk:** Low

### T15-05: i18n Translation Injection
- **Threat:** User-supplied content rendered in i18n string templates
- **Controls:** User content is always escaped before rendering; translation keys never include raw user data
- **Residual Risk:** Low
