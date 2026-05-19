# Spec 26 — Migration & Backfill: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T26-01: Backfill Job Cross-Workspace Contamination
- **Threat:** Backfill modifies rows from wrong workspace
- **Controls:** All backfill queries include `workspace_id` filter; no cross-workspace batch updates
- **Residual Risk:** Low

### T26-02: Migration Lock Causes Outage
- **Threat:** ALTER TABLE takes lock, blocking production traffic
- **Controls:** Only additive DDL in expand phase; drop only after backfill in separate deploy
- **Residual Risk:** Low
