# Spec 24 — Incident Response & On-Call: SECURITY

**Overall Risk: 🟡 MEDIUM**

## Threat Model

### T24-01: PagerDuty Webhook Spoofing
- **Threat:** Attacker sends fake alert to PagerDuty integration URL
- **Controls:** PagerDuty webhook URL kept in GCP Secret Manager; inbound signature verified
- **Residual Risk:** Low

### T24-02: Runbook Exposure
- **Threat:** Runbooks reveal internal architecture details (IP ranges, service names)
- **Controls:** Runbooks are internal-only (repo access required); no customer-facing URLs in runbooks
- **Residual Risk:** Low
