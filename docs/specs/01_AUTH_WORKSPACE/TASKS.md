# 01 — Auth & Workspace — TASKS

**Status:** 📝 Draft
**Task count:** 12 (≤15 cap)
**Pattern:** Red → Green → Refactor (TDD). Mark test file before implementation file.
**Last updated:** 2026-05-04

## Tasks

### T-01 · Alembic migration — workspaces, workspace_members, invitations
**Files:**
- `alembic/versions/2026_05_05_001_create_workspaces_members_invitations.py`

**Stub:**
```python
def upgrade():
    op.create_table("workspaces", ...)
    op.create_table("workspace_members", ...)
    op.create_table("invitations", ...)
    # indexes, RLS policies via execute()

def downgrade():
    op.drop_table("invitations")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
```
**Done when:** `alembic upgrade head` + `alembic downgrade -1` both succeed with no errors.

---

### T-02 · Workspace service layer (CRUD + slug generation)
**RED first:** `tests/unit/test_workspace_service.py` — write all unit tests from TESTS.md first, confirm they fail.

**Files:**
- `services/workspace-service/tests/unit/test_workspace_service.py`
- `services/workspace-service/app/services/workspace_service.py`
- `services/workspace-service/app/models/workspace.py`

**Stub:**
```python
class WorkspaceService:
    async def create_workspace(self, owner_id: UUID, name: str, ...) -> Workspace: ...
    async def get_workspace(self, workspace_id: UUID) -> Workspace: ...
    async def update_workspace(self, workspace_id: UUID, **kwargs) -> Workspace: ...
    async def soft_delete_workspace(self, workspace_id: UUID) -> None: ...
    def _generate_slug(self, name: str) -> str: ...
```
**Done when:** All unit tests green; `_generate_slug("Acme Corp") == "acme-corp"`.

---

### T-03 · RBAC dependencies (get_workspace_id, require_role)
**RED first:** `tests/unit/test_auth_dependencies.py` — test role ordering, require_role blocks/passes.

**Files:**
- `services/workspace-service/tests/unit/test_auth_dependencies.py`
- `services/workspace-service/app/dependencies/auth.py`

**Stub:**
```python
ROLE_ORDER = ["viewer", "member", "admin", "owner"]

def get_workspace_id(x_workspace_id: str = Header(...)) -> UUID: ...
def get_current_user(x_user_id: str = Header(...)) -> UUID: ...
def require_role(min_role: str) -> Callable: ...
```
**Done when:** `require_role("admin")` with `X-User-Role: member` raises 403; with `X-User-Role: admin` passes.

---

### T-04 · api-gateway JWT validation middleware
**RED first:** `tests/integration/test_jwt_middleware.py` — missing/expired/malformed JWT cases.

**Files:**
- `services/api-gateway/tests/integration/test_jwt_middleware.py`
- `services/api-gateway/app/middleware/jwt_auth.py`

**Stub:**
```python
class SupabaseJWTMiddleware(BaseHTTPMiddleware):
    """
    1. Fetch JWKS from Supabase (cached 15 min, stale fallback)
    2. Verify RS256 signature
    3. Check exp claim
    4. Extract workspace_id, user_id, role
    5. Inject X-Workspace-ID, X-User-ID, X-User-Role headers
    """
    async def dispatch(self, request: Request, call_next): ...
```
**Done when:** Missing JWT → 401; valid JWT → headers injected; expired JWT → 401.

---

### T-05 · Workspace isolation integration test (CRITICAL)
**RED first:** This test MUST be written and confirmed FAILING before T-04 is implemented.

**Files:**
- `services/api-gateway/tests/integration/test_workspace_isolation.py`

**Key test:**
```python
async def test_cross_workspace_access_returns_403():
    """Workspace A token must not access workspace B data."""
    token_a = make_jwt(workspace_id=workspace_a_id)
    response = await client.get(
        f"/v1/workspaces/{workspace_b_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert response.status_code == 403
```
**Done when:** Test GREEN. This test is never disabled. Any regression = P0 incident.

---

### T-06 · Invite flow service + endpoints
**RED first:** `tests/integration/test_invite_flow.py` — create invite, accept, expire, revoke.

**Files:**
- `services/workspace-service/tests/integration/test_invite_flow.py`
- `services/workspace-service/app/services/invite_service.py`
- `services/workspace-service/app/api/v1/invitations.py`

**Stub:**
```python
class InviteService:
    async def create_invitation(self, workspace_id, email, role, invited_by) -> Invitation: ...
    async def accept_invitation(self, token: str, user_id: UUID) -> WorkspaceMember: ...
    async def revoke_invitation(self, invitation_id: UUID) -> None: ...
    def _generate_token(self) -> str:
        return secrets.token_urlsafe(32)
```
**Done when:** Invite → accept → workspace_member row created + `workspace.member.joined` outbox event.

---

### T-07 · Member management endpoints (list, patch role, remove)
**Files:**
- `services/workspace-service/app/api/v1/members.py`
- `services/workspace-service/tests/integration/test_member_management.py`

**Done when:** Admin cannot set owner role (403); owner can; cannot remove last owner (409).

---

### T-08 · Outbox events (workspace.created, member.invited, etc.)
**Files:**
- `services/workspace-service/app/services/outbox_service.py`
- `services/workspace-service/tests/unit/test_outbox_events.py`

**Done when:** All 4 event types written to `outbox_events` atomically with their domain writes.

---

### T-09 · Frontend — sign-in / sign-up pages + OAuth callbacks
**Files:**
- `frontend/app/(auth)/sign-in/page.tsx`
- `frontend/app/(auth)/sign-up/page.tsx`
- `frontend/app/auth/callback/route.ts`
- `frontend/lib/auth/supabase-client.ts`

**Done when:** Email signup + Google OAuth round-trip works in staging; JWT stored in httpOnly cookie.

---

### T-10 · Frontend — workspace settings + member management pages
**Files:**
- `frontend/app/(dashboard)/settings/workspace/page.tsx`
- `frontend/app/(dashboard)/settings/members/page.tsx`
- `frontend/components/settings/InviteMemberDialog.tsx`

**Done when:** Owner can update workspace name; invite dialog sends invite email; member list shows roles.

---

### T-11 · E2E tests (Playwright — all 10 scenarios)
**Files:**
- `frontend/tests/e2e/auth/signup.spec.ts`
- `frontend/tests/e2e/auth/oauth.spec.ts`
- `frontend/tests/e2e/auth/invite.spec.ts`

**Done when:** All 10 E2E scenarios from TESTS.md green in CI.

---

### T-12 · Ops handoff — monitoring alerts + runbook verification
**Files:**
- `infra/monitoring/auth-workspace-alerts.yaml`
- `docs/specs/01_AUTH_WORKSPACE/RESULT.md` (fill in actual metrics after staging smoke)

**Done when:** All 5 alert policies created in Cloud Monitoring; runbook tested against staging incident simulation.

## Completion Checklist
- [ ] `alembic upgrade head` + `downgrade -1` clean
- [ ] Backend coverage ≥ 90% (`pytest --cov --cov-fail-under=90`)
- [ ] All `[SECURITY]` tagged tests pass
- [ ] `test_cross_workspace_access_returns_403` NEVER skipped
- [ ] Frontend coverage ≥ 80% (`vitest --coverage`)
- [ ] All 10 E2E scenarios green
- [ ] Monitoring alerts live in staging
- [ ] RESULT.md updated with first staging metric readings
