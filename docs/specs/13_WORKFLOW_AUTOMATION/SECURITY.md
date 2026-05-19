# Spec 13 — Workflow Automation: SECURITY

**Overall Risk: 🟡 MEDIUM**

## Threat Model

### T13-01: Cross-Workspace Rule Execution (CRITICAL)
- **Threat:** Rule from workspace A executes on leads/deals from workspace B
- **Controls:** All rule queries and action dispatch include `workspace_id`; workspace_id set from JWT
- **Residual Risk:** Low

### T13-02: Circular Automation Loop
- **Threat:** Rule A triggers rule B which triggers rule A → infinite loop
- **Controls:** Actions carry `triggered_by_automation=True`; rules do not evaluate automated events; action limit 10/rule
- **Residual Risk:** Low

### T13-03: Action Injection via JSONB
- **Threat:** Malicious user crafts action JSONB to call unexpected service endpoints
- **Controls:** Actions are validated against an allowlist enum at rule creation time; JSONB is deserialized to typed `Action` Pydantic models
- **Residual Risk:** Low

### T13-04: Execution History PII
- **Threat:** Execution history contains personal data (lead names, email bodies)
- **Controls:** Execution payloads store only IDs (lead_id, deal_id), not raw PII; 30-day retention
- **Residual Risk:** Low
