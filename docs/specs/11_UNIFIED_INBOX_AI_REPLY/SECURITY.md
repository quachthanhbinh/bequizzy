# Spec 11 — Unified Inbox & AI Reply: SECURITY

**Overall Risk: 🟡 MEDIUM**

## Threat Model

### T11-01: Prompt Injection via Reply Body (HIGH)
- **Threat:** Malicious lead crafts email body to exfiltrate Brain data or hijack AI draft
- **Controls:** XML delimiter isolation around email body before LLM call; forced JSON output schema; body length capped at 5,000 chars
- **Residual Risk:** Low

### T11-02: Cross-Workspace Thread Access (CRITICAL)
- **Threat:** Workspace A user reads inbox_thread belonging to workspace B
- **Controls:** All thread/message queries include `WHERE workspace_id = :workspace_id`; workspace_id set from JWT by api-gateway
- **Residual Risk:** Low

### T11-03: Credit Bypass on AI Draft
- **Threat:** User calls draft endpoint without triggering credit deduction
- **Controls:** Credit reserve via billing-service called BEFORE LLM; error if reserve fails = 402 response
- **Residual Risk:** Low

### T11-04: PII in Reply Bodies (PDPA Scope)
- **Threat:** Reply bodies contain personal data stored indefinitely
- **Controls:** Retention policy applied per Spec 20 (emails: 3mo); GDPR erasure endpoint deletes thread/messages for given lead
- **Residual Risk:** Low

## Security Controls Summary
| Control | Implementation |
|---|---|
| Prompt injection isolation | XML delimiter + JSON output constraint |
| Cross-workspace isolation | workspace_id in all queries (mandatory) |
| Credit reserve before LLM | billing-service BEFORE LLM call, always |
| PII retention | 3-month retention per Spec 20 |
