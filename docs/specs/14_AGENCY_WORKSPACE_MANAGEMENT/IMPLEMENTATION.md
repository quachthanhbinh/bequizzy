# Spec 14 — Agency Workspace Management: IMPLEMENTATION

## Phases
1. **Schema**: Alembic migration for agency_accounts, managed_workspaces, agency_audit_log
2. **Agency Core**: Workspace provisioning; impersonation JWT issuance; audit logging
3. **Dashboard**: Aggregate metrics API (reuses analytics-service); workspace list
4. **Frontend**: Agency dashboard; workspace provisioning form; impersonation button

## File Map
```
services/workspace-service/
  app/
    models/agency.py
    routers/agency.py
    services/agency_service.py

alembic/versions/0014_agency.py
```

## Integration Points
| From | To | Method |
|---|---|---|
| workspace-service | Supabase Auth | Create new user for provisioned workspace |
| agency dashboard | analytics-service | Pre-aggregated metrics per managed workspace |
