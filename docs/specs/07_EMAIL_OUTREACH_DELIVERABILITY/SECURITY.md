# Spec 07 — Email Outreach & Deliverability: SECURITY

**Overall Risk: 🔴 HIGH**

Email sending carries legal obligations (CAN-SPAM, GDPR, Vietnam Circular 14/2019). Suppression bypass or bounce mishandling creates legal liability and destroys sender reputation.

---

## Threat Model

### T07-01: Suppression Check Bypass (CRITICAL)
- **Threat:** Email sent to suppressed/unsubscribed address (same as T06-01 but at the email-send layer)
- **Impact:** CRITICAL — legal violation
- **Controls:**
  - `send_email()` in outreach-service checks suppression list synchronously BEFORE routing to ESP adapter
  - Suppression check is a hard gate — raises `SuppressedError` if suppressed
  - Integration test: suppressed lead cannot receive email from outreach-service (T07-SEC-01)
- **Residual Risk:** Low

### T07-02: ESP Credential Exposure
- **Threat:** SendGrid API key or OAuth token leaked from DB or logs
- **Impact:** HIGH — attacker can send unlimited emails impersonating the workspace
- **Controls:**
  - Credentials stored ONLY in GCP Secret Manager (referenced by `mailboxes.secret_ref`)
  - `secret_ref` is the Secret Manager path — never the credential value
  - Credential never logged — structured logging excludes all fields matching `*_key|*_token|*_secret`
  - Rotation supported: update Secret Manager version → restart service (no DB change needed)
- **Residual Risk:** Low

### T07-03: Webhook Spoofing (Bounce/Complaint Injection)
- **Threat:** Attacker sends fake bounce/complaint webhooks to suppress legitimate leads
- **Impact:** HIGH — competitor could suppress all leads in a workspace
- **Controls:**
  - SendGrid webhooks: validate signed request using public key (Ed25519 signature)
  - Postmark webhooks: validate `X-Postmark-Signature` HMAC
  - SES: validate SNS notification via AWS SNS signature
  - Unsigned webhooks are rejected with 403
- **Residual Risk:** Low

### T07-04: Open/Click Tracking Privacy
- **Threat:** Tracking pixel violates GDPR/PDPA if recipient hasn't consented
- **Impact:** Medium — privacy violation; potential regulatory fine
- **Controls:**
  - Tracking enabled only if workspace has consent configuration for recipient jurisdiction
  - Vietnam/Thailand/Singapore: require explicit opt-in for tracking (consent_log check)
  - Open tracking respects Apple MPP — don't mark as "opened" if user-agent is Apple Mail proxy
- **Residual Risk:** Low (with consent enforcement)

### T07-05: Warmup Schedule Bypass
- **Threat:** User finds an API to override warmup limits and blast full volume from a new mailbox
- **Impact:** Medium — domain reputation damage
- **Controls:**
  - `daily_send_limit` is enforced at the DB level: atomic Redis counter checked before each send
  - Warmup limit is the minimum of `warmup_daily_limit` and `user_daily_send_limit`
  - API does not expose a "skip warmup" endpoint; warmup can only be disabled by admin
- **Residual Risk:** Low

### T07-06: Cross-Workspace Email Data Leak
- **Threat:** Workspace A accesses email_sends or email_events belonging to workspace B
- **Impact:** CRITICAL — sensitive outreach data exposed
- **Controls:**
  - All queries include `WHERE workspace_id = :workspace_id`
  - `workspace_id` injected from JWT by api-gateway — never user-supplied
- **Residual Risk:** Low

---

## Security Controls Summary

| Control | Implementation |
|---|---|
| Suppression-first | Synchronous check before every ESP call |
| Credential storage | GCP Secret Manager only (never DB) |
| Webhook auth | HMAC/Ed25519 per ESP, reject unsigned |
| Tracking consent | Consent log check for VN/TH/SG |
| Daily send cap | Redis atomic counter (shared with Spec 06) |
| workspace_id scoping | All queries scoped |
| No credential logging | Structured log exclusion pattern |
