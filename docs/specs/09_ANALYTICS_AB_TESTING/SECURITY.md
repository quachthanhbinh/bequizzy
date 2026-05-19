# Spec 09 — Analytics & A/B Testing: SECURITY

**Overall Risk: 🟢 LOW**

Analytics data is read-only for users; the primary risk is cross-workspace data exposure.

## Threat Model

### T09-01: Cross-Workspace Metrics Exposure
- **Threat:** Workspace A queries campaign metrics for workspace B's campaigns
- **Controls:** All queries include `WHERE workspace_id = :workspace_id` from JWT
- **Residual Risk:** Low

### T09-02: A/B Test Result Manipulation
- **Threat:** User attempts to query A/B results for steps they don't own
- **Controls:** `step_id` ownership validated via join with `sequence_steps.workspace_id`
- **Residual Risk:** Low

### T09-03: CSV Export Data Leak
- **Threat:** CSV export contains data from multiple workspaces
- **Controls:** Export query is always scoped to `workspace_id`; file is generated in memory and streamed (never stored to disk without workspace prefix)
- **Residual Risk:** Low

### T09-04: Aggregator Over-Privilege
- **Threat:** analytics-aggregator service account has write access to all tables
- **Controls:** Service account scoped to analytics tables only; uses dedicated read-only DB user for `email_events` source (read from outreach-service DB is cross-service — mitigated by Pub/Sub event consumption instead)
- **Residual Risk:** Low
