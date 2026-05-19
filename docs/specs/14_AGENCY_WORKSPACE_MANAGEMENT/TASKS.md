# Spec 14 — Agency Workspace Management: TASKS

## TDD Task List

### Task 1 — Migration: agency_accounts, managed_workspaces, agency_audit_log
**RED first:** Model import fails.
**File:** `alembic/versions/0014_agency.py`
**Done when:** Upgrade + downgrade succeed.

### Task 2 — Impersonation Block for Unmanaged Workspace
**RED first:** Test U14-01 fails.
**File:** `services/workspace-service/app/services/agency_service.py`
**Done when:** U14-01 passes; 403 for unmanaged.

### Task 3 — Impersonation JWT Issuance
**RED first:** Test U14-02 fails.
**Done when:** JWT scoped to target_workspace, 1h TTL.

### Task 4 — Workspace Provisioning API
**RED first:** Test I14-01 fails.
**File:** `services/workspace-service/app/routers/agency.py`
**Done when:** I14-01 passes.

### Task 5 — Impersonation Audit Logging
**RED first:** Test I14-02 fails.
**Done when:** I14-02 passes; all impersonation events logged.

### Task 6 — Client Isolation Test
**RED first:** Test I14-03 fails.
**Done when:** I14-03 passes.

### Task 7 — Frontend Agency Dashboard
**RED first:** Vitest test fails.
**Done when:** Managed workspace list, aggregate metrics, impersonate button.

## Completion Checklist
- [ ] Impersonation blocked for unmanaged workspaces
- [ ] Impersonation audit 100% logged
- [ ] Client data isolation verified
- [ ] `mypy app/` passes; coverage ≥ 80%
