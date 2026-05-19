# Spec 20 — Data Governance & Retention: SECURITY

**Overall Risk: 🔴 HIGH**

## Threat Model

### T20-01: Erasure Request for Another Workspace's Lead (CRITICAL)
- **Threat:** Workspace A requests erasure of workspace B's lead
- **Controls:** `lead_id` ownership validated: `WHERE workspace_id = :workspace_id AND id = :lead_id`; 404 if not owned
- **Residual Risk:** Low

### T20-02: Consent Log Bypass
- **Threat:** Code path sends to VN/TH/SG contact without checking consent_log
- **Controls:** Consent check is a hard gate in outreach-service (see Spec 10); UNIQUE constraint prevents duplicate consent
- **Residual Risk:** Low

### T20-03: Erasure Data Leak in Audit Log
- **Threat:** gdpr_erasure_requests log contains PII (name, email)
- **Controls:** Only lead_id stored; no PII in erasure request record
- **Residual Risk:** Low

### T20-04: Retention Job Over-Delete
- **Threat:** Retention job deletes records that are under a hold (e.g., active litigation)
- **Controls:** Legal hold flag `holds_deletion` on lead record; retention job skips records with flag set
- **Residual Risk:** Low
