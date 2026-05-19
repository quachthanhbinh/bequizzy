# Spec 18 — Observability & SLO: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T18-01: Log Data PII Leakage
- **Threat:** Log messages include email addresses, phone numbers, or email bodies
- **Controls:** Log only IDs (workspace_id, lead_id, trace_id); never log request bodies; slow query logs show query shape only (parameterized, no values)
- **Residual Risk:** Low

### T18-02: Trace Data Exposure
- **Threat:** Cloud Trace contains span attributes with PII
- **Controls:** Span attributes limited to: service name, operation name, status code, duration; no user data in spans
- **Residual Risk:** Low
