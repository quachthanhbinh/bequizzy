# Spec 14 — Agency Workspace Management: TESTS

## Test Strategy

| Layer | Coverage Gate | Framework |
|---|---|---|
| Unit (workspace-service) | ≥ 80% | pytest |
| Integration | Provisioning + impersonation + audit | pytest + testcontainers |

---

## Unit Tests

### U14-01: Impersonation Blocked for Unmanaged Workspace
```python
async def test_impersonation_blocked_unmanaged(agency_service, db):
    with pytest.raises(ForbiddenError):
        await agency_service.impersonate(
            agency_id=A, target_workspace_id=UNMANAGED_W)
```

### U14-02: Impersonation JWT Scoped to Target Workspace
```python
async def test_impersonation_jwt_scope(agency_service, db):
    token = await agency_service.impersonate(agency_id=A, target_workspace_id=MANAGED_W)
    claims = decode_jwt(token)
    assert claims["workspace_id"] == str(MANAGED_W)
    assert claims["impersonated_by"] == str(A)
    # Expires within 1 hour
    assert claims["exp"] <= time.time() + 3601
```

---

## Integration Tests

### I14-01: Provision Workspace — Linked to Agency
```python
async def test_provision_workspace(client, db, agency_account):
    resp = await client.post("/agency/workspaces",
        json={"name": "Client A"},
        headers={"X-Workspace-ID": str(agency_account.workspace_id)})
    assert resp.status_code == 201
    managed = await get_managed_workspace(db, resp.json()["workspace_id"])
    assert managed.agency_id == agency_account.id
```

### I14-02: Impersonation Audit Logged
```python
async def test_impersonation_audit_logged(client, db, agency_account, managed_workspace):
    await client.post("/agency/impersonate",
        json={"workspace_id": str(managed_workspace.workspace_id)})
    log = await get_audit_logs(db, agency_account.id)
    assert any(l.action == "impersonation_start" for l in log)
```

### I14-03: Client Cannot See Sibling Workspace Data
```python
async def test_client_isolation(client, managed_ws_a, managed_ws_b):
    resp = await client.get("/leads",
        headers={"X-Workspace-ID": str(managed_ws_b.workspace_id)})
    assert all(l["workspace_id"] == str(managed_ws_b.workspace_id)
               for l in resp.json()["data"])
```

---

## Coverage Gates
| Gate | Threshold |
|---|---|
| Unit coverage | ≥ 80% |
| Impersonation blocked for unmanaged workspace | MUST PASS |
| Impersonation audit 100% logged | MUST PASS |
