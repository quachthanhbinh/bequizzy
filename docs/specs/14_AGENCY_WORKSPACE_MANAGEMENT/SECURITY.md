# Spec 14 — Agency Workspace Management: SECURITY

**Overall Risk: 🟡 MEDIUM**

## Threat Model

### T14-01: Agency Admin Accessing Unmanaged Workspace (CRITICAL)
- **Threat:** Agency admin issues impersonation request for a workspace they don't manage
- **Controls:** Before issuing impersonation JWT: `SELECT 1 FROM managed_workspaces WHERE agency_id=:agency_id AND workspace_id=:target_id AND is_active=TRUE`; 403 if not found
- **Residual Risk:** Low

### T14-02: Impersonation Token Theft
- **Threat:** Short-TTL JWT for impersonation is stolen
- **Controls:** 1-hour TTL; single-use by default; bound to IP (optional); all actions under impersonation logged
- **Residual Risk:** Low

### T14-03: Client Workspace Data Leak to Sibling Client
- **Threat:** Agency admin query leaks client A data to client B
- **Controls:** Standard workspace_id scoping unchanged — impersonation JWT is scoped to ONE target workspace; no cross-workspace query possible
- **Residual Risk:** Low

### T14-04: Usage Limit Bypass
- **Threat:** Managed workspace exceeds credits_per_month limit
- **Controls:** billing-service checks usage limit from `managed_workspaces.usage_limit` before credit deduction
- **Residual Risk:** Low

## Audit Requirements
- All impersonation start/end events: logged to `agency_audit_log`, retained 1 year
- Workspace provisioning events: logged
