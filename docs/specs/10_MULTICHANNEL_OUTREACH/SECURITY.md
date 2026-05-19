# Spec 10 — Multichannel Outreach: SECURITY

**Overall Risk: 🔴 HIGH**

## Threat Model

### T10-01: Suppression Bypass on Non-Email Channels (CRITICAL)
- **Threat:** LinkedIn or SMS step executes without suppression check
- **Controls:** Suppression check is first operation in all channel step handlers (enforced structurally, same pattern as T06-01)
- **Residual Risk:** Low (code review gate)

### T10-02: PDPA Consent Bypass (CRITICAL)
- **Threat:** SMS sent to Vietnamese number without consent record
- **Controls:** Consent check is a hard gate in outreach-service SMS handler; VN phone detection is server-side; no user-supplied override
- **Residual Risk:** Low

### T10-03: LinkedIn Account Credential Exposure
- **Threat:** LinkedIn session cookies stored in DB or logs
- **Controls:** Session credentials stored in GCP Secret Manager; never in DB or logs
- **Residual Risk:** Low

### T10-04: SMS Spoofing via Provider Webhook Forgery
- **Threat:** Fake delivery status webhooks injected
- **Controls:** Twilio: validate `X-Twilio-Signature` HMAC; ESMS.vn: validate shared secret header
- **Residual Risk:** Low

### T10-05: LinkedIn Rate Limit Abuse
- **Threat:** Bug causes >25 connect requests/day per account, triggering LinkedIn ban
- **Controls:** Redis atomic counter, hard cap at 25/day; counter checked before extension task is queued
- **Residual Risk:** Low

## Security Controls Summary
| Control | Implementation |
|---|---|
| Suppression-first on all channels | Structural requirement in all channel handlers |
| PDPA consent gate | Hard gate for VN phone numbers |
| Credentials in Secret Manager | LinkedIn session, Twilio auth token, ESMS API key |
| Webhook signature validation | Per-provider HMAC |
| LinkedIn rate limit | Redis daily counter per account |
