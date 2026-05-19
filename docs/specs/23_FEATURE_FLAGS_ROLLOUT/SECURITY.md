# Spec 23 — Feature Flags & Rollout: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T23-01: Flag Override Injection
- **Threat:** Client spoofs workspace_id to access beta feature
- **Controls:** workspace_id sourced from auth token only; never from request body for flag evaluation
- **Residual Risk:** Low

### T23-02: Flag Cache Staleness During Kill Switch
- **Threat:** Feature disabled but cached flag still returns enabled for 30s
- **Controls:** Kill switch clears Redis cache immediately (pub/sub invalidation)
- **Residual Risk:** Low
