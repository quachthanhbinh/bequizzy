# Spec 22 — API Versioning & Contracts: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T22-01: Version Confusion Attack
- **Threat:** Client bypasses auth by calling an unversioned endpoint
- **Controls:** All auth middleware applied at app level (before router); no unversioned endpoints in prod
- **Residual Risk:** Low

### T22-02: Spec Exposure
- **Threat:** `/openapi.json` reveals internal field names, IDs, patterns
- **Controls:** OpenAPI served only in non-prod environments; prod uses Redoc with no `Try it out`
- **Residual Risk:** Low
