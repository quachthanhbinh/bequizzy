# 01 — Auth & Workspace — TESTS

**Status:** 📝 Draft
**Coverage gate:** Backend 90% | Frontend 80% | Security tests 100% (no exceptions)
**Last updated:** 2026-05-04

## Test Pyramid

```
         /\          E2E (Playwright, ~15 scenarios)
        /  \         ── OAuth round-trips, invite flow, RBAC smoke
       /----\
      / Integ \      Integration (~40 tests)
     /  tests  \     ── JWT validation, cross-tenant, role enforcement
    /------------\
   /  Unit tests  \  Unit (~60 tests)
  /________________\ ── Invite token generation, role order logic, dedup guards
```

## Unit Tests
**File:** `services/workspace-service/tests/unit/`

| Test | What it validates |
|---|---|
| `test_role_order_owner_above_admin` | ROLE_ORDER list ordering is correct |
| `test_require_role_blocks_insufficient_role` | `require_role("admin")` raises 403 for member |
| `test_require_role_allows_equal_role` | `require_role("member")` passes for member |
| `test_invite_token_is_32_bytes_urlsafe` | `secrets.token_urlsafe(32)` length and charset |
| `test_invite_token_expiry_calculation` | expires_at = now() + 7 days (UTC) |
| `test_workspace_slug_generated_from_name` | "Acme Corp" → "acme-corp" |
| `test_workspace_slug_uniqueness_suffix` | "acme-corp" taken → "acme-corp-2" |
| `test_cannot_remove_last_owner` | Service raises `CANNOT_REMOVE_OWNER` |
| `test_workspace_soft_delete_sets_deleted_at` | `deleted_at` populated, not hard-deleted |
| `test_workspace_delete_blocked_with_active_campaigns` | `WORKSPACE_HAS_ACTIVE_CAMPAIGNS` raised |

## Integration Tests
**File:** `services/workspace-service/tests/integration/`

### JWT Validation
| Test | What it validates |
|---|---|
| `test_missing_jwt_returns_401` | No Authorization header → 401 |
| `test_expired_jwt_returns_401` | Token with past `exp` → 401 |
| `test_valid_jwt_passes_gateway` | Valid token → 200 (mocked Supabase JWKS) |
| `test_malformed_jwt_returns_401` | Random string in header → 401 |
| `test_jwt_with_wrong_issuer_returns_401` | Wrong `iss` claim → 401 |

### Workspace Isolation (🔴 CRITICAL — all must pass)
| Test | Priority | What it validates |
|---|---|---|
| `[SECURITY] test_cross_workspace_access_returns_403` | 🔴 P0 | Workspace A token + workspace B ID → 403 |
| `[SECURITY] test_workspace_id_from_header_not_body` | 🔴 P0 | Request body `workspace_id` is ignored |
| `test_rls_blocks_direct_db_select_wrong_workspace` | 🔴 P0 | RLS enforced at DB level |

### Member & Invite Flow
| Test | What it validates |
|---|---|
| `test_invite_creates_invitation_row` | POST invite → row in invitations table |
| `test_invite_sends_notification_event` | Outbox event `workspace.member.invited` created |
| `test_accept_invite_creates_membership` | Accept → workspace_member row with correct role |
| `test_accept_expired_invite_returns_410` | 7-day-old token → 410 |
| `test_accept_already_accepted_invite_returns_409` | Second accept → 409 |
| `test_revoke_invite_prevents_acceptance` | Revoke → subsequent accept → 410 |
| `test_member_join_outbox_event_created` | `workspace.member.joined` in outbox on accept |

### RBAC Enforcement
| Test | What it validates |
|---|---|
| `[SECURITY] test_member_cannot_change_own_role` | PATCH role with member token → 403 |
| `[SECURITY] test_admin_cannot_set_owner_role` | Admin sets role=owner → 403 |
| `test_owner_can_set_admin_role` | Owner sets member→admin → 200 |
| `test_viewer_cannot_create_campaign` | POST /campaigns with viewer → 403 (via api-gateway) |

### Workspace CRUD
| Test | What it validates |
|---|---|
| `test_create_workspace_on_first_signup` | New user → workspace created, owner membership created |
| `test_workspace_created_event_in_outbox` | `workspace.created` in outbox_events |
| `test_patch_workspace_name` | PATCH name → updated, `updated_at` refreshed |
| `test_patch_workspace_slug_unique` | Duplicate slug → 409 |

## E2E Tests
**File:** `frontend/tests/e2e/auth/`
**Tool:** Playwright

| Scenario | Steps |
|---|---|
| Email signup → workspace created | Sign up with email → verify email → login → dashboard with workspace |
| Google OAuth login | Click "Continue with Google" → OAuth round-trip → dashboard |
| ~~Microsoft OAuth login~~ | Removed — Microsoft OAuth not supported |
| Facebook OAuth login | Click "Continue with Facebook" → OAuth round-trip → dashboard |
| Invite flow | Owner invites email → invited user accepts → member appears in workspace |
| Expired invite link | Open 7-day-old invite link → "Link expired" page |
| Password reset | Request reset → click email link → set new password → login |
| RBAC — viewer cannot create | Login as viewer → try create campaign → forbidden state shown |
| Workspace settings update | Owner updates name → changes reflected on dashboard |
| Remove member | Admin removes member → member no longer appears in list |

## Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| workspace-service unit + integration | 90% line | `pytest --cov --cov-fail-under=90` in CI |
| Security tests (`[SECURITY]` tagged) | 100% must pass | CI gate — any failure blocks merge |
| Frontend (Vitest, components + hooks) | 80% | `vitest --coverage` in CI |
| E2E (Playwright) | All 10 scenarios green | CI playwright job |

## Test Fixtures / Helpers

```python
# conftest.py helpers
make_workspace(name, plan="free")        # Creates workspace + owner user
make_member(workspace_id, role)          # Adds member to workspace
make_invitation(workspace_id, email)     # Creates pending invite
make_expired_invitation(workspace_id)    # Creates invite with past expires_at
mock_supabase_jwks()                     # Intercepts JWKS endpoint for unit/integ tests
```

## Out of Scope
- Supabase Auth internal unit tests (trusted third-party)
- Load testing (handled by Wave 5 performance spec)
