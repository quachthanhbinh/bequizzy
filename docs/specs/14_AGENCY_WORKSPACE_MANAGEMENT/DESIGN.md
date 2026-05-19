# Spec 14 — Agency Workspace Management: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Agency admins need zero friction to onboard clients. Provisioning must be one click. Impersonation is required for support. The killer feature: aggregate dashboard showing which client workspaces are performing best. Confidence: 7.

**CTO:** `agency_accounts` → `managed_workspaces` (1:N). Impersonation uses short-TTL JWT with `sub = agency_admin_id`, `workspace_id = target_id`, `impersonated_by = agency_admin_id`. All impersonation events go to an audit log. Client isolation is unchanged — JWT workspace_id is the only gate; agency admin JWT never leaks client workspace_id to other clients. Confidence: 7.

**Gap: 0. Both ≥ 7. Converge.**

**Final Confidence: 7 / 10.** Why not higher: White-label domain routing requires Cloudflare custom domain setup per client — complex at P2. Deferred.

---

## Data Model

### Table: `agency_accounts`
```sql
CREATE TABLE agency_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL UNIQUE,  -- the agency's own workspace
  name          TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'agency',
  max_managed   INTEGER NOT NULL DEFAULT 50,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `managed_workspaces`
```sql
CREATE TABLE managed_workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES agency_accounts(id),
  workspace_id  UUID NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit   JSONB,  -- {"credits_per_month": 1000, "leads_limit": 5000}
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_managed_workspaces_agency ON managed_workspaces (agency_id);
```

### Table: `agency_audit_log`
```sql
CREATE TABLE agency_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL,
  actor_id       UUID NOT NULL,
  action         TEXT NOT NULL,  -- impersonation_start|impersonation_end|workspace_created
  target_workspace_id UUID,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Impersonation Flow
```
Agency admin POST /agency/impersonate {workspace_id}
    → workspace-service validates: workspace_id is managed by agency
    → Issue JWT: {sub: admin_id, workspace_id: target_id, impersonated_by: admin_id, exp: +1h}
    → Write agency_audit_log: impersonation_start
    → Admin uses short-TTL JWT for target workspace actions
    → On expiry or explicit POST /agency/end-impersonate: log impersonation_end
```
