# Spec 12 — CRM, Customers & Post-sale: SECURITY

**Overall Risk: 🟡 MEDIUM**

## Threat Model

### T12-01: Cross-Workspace Deal Access (CRITICAL)
- **Threat:** Workspace A reads or modifies deals belonging to workspace B
- **Controls:** All deal/customer queries include `WHERE workspace_id = :workspace_id`; workspace_id set from JWT by api-gateway; never user-supplied
- **Residual Risk:** Low

### T12-02: Invalid Stage Transition Abuse
- **Threat:** User calls PATCH with invalid stage (Won → Lost in one call)
- **Controls:** Service layer validates transition using VALID_TRANSITIONS map; returns 422 for invalid transitions
- **Residual Risk:** Low

### T12-03: Deal Value Injection
- **Threat:** Excessively large deal value inserted (storage/display issues)
- **Controls:** Pydantic validator: `value` max 1,000,000,000 (1B), min 0
- **Residual Risk:** Low

### T12-04: Deal Activity Log Tampering
- **Threat:** User tries to edit or delete activity log entries
- **Controls:** No `UPDATE` or `DELETE` ORM operations on `deal_activities`; router exposes append-only POST; no edit endpoint
- **Residual Risk:** Low

## Security Controls Summary
| Control | Implementation |
|---|---|
| Cross-workspace isolation | workspace_id in all queries |
| Stage transition validation | Service layer VALID_TRANSITIONS map |
| Value cap | Pydantic max constraint |
| Append-only activities | No UPDATE/DELETE in ORM |
