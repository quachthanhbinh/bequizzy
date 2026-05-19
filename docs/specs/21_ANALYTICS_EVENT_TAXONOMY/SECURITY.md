# Spec 21 — Analytics Event Taxonomy: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T21-01: Cross-Workspace Event Leakage
- **Threat:** Event from workspace A visible in workspace B's analytics
- **Controls:** `workspace_id` required on every event; BigQuery RLS (row-level) per workspace
- **Residual Risk:** Low

### T21-02: PII in Event Properties
- **Threat:** Lead email captured in `properties` → stored in BigQuery permanently
- **Controls:** Schema linting step: `email`, `phone` fields blocked from `properties`
- **Residual Risk:** Low
