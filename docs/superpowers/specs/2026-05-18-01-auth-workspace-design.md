# Auth & Workspace Foundation — Design Spec

**Date:** 2026-05-18  
**Status:** Draft  
**Priority:** P0 — Blocks all other specs  
**Security flag:** HIGH — Multi-tenant isolation critical path  
**Scope:** Spec 01 — Core Platform (Track A)

---

## Problem Statement

RevLooper is a multi-tenant SaaS where every feature depends on knowing *who is this user* and *which workspace do they belong to* with absolute certainty. Without a solid auth and workspace isolation contract:

- Downstream services cannot enforce workspace isolation
- Cross-tenant data leakage is a single buggy query away
- All 27 downstream specs are blocked (every spec requires `workspace_id` scoping)
- No SSO creates onboarding friction that kills Enterprise conversion

**Evidence:**
- All 28 specs require `workspace_id` in every DB query (architecture principle)
- SEA market: Google OAuth adoption ~70% for SMB; Facebook dominates consumer accounts
- Invite flow required for solo founder → small team collaboration path

---

## Design Goals

1. Secure, frictionless signup/login via email or OAuth (Google, Facebook)
2. First login auto-creates a workspace; workspace is the root of all data
3. Team invite flow with role-based access control (RBAC)
4. JWT + `workspace_id` isolation contract published for all downstream services
5. RBAC (owner/admin/member/viewer) enforced at the API layer
6. Zero cross-tenant data leakage — workspace isolation is non-negotiable

## Non-Goals

- SAML/SCIM SSO (Enterprise feature — separate spec)
- Multi-workspace switching UI (v2 — most users have 1 workspace)
- Custom domain auth
- 2FA/MFA enforcement (recommended but not enforced in v1)
- Microsoft OAuth (removed — target users use Google/Facebook)

---

## Current Codebase Baseline

This is a greenfield implementation. No existing auth or workspace code exists. All downstream services are currently blocked waiting for the `workspace_id` isolation contract.

**Dependencies:**
- Supabase Auth (third-party, SOC2 Type 2 certified)
- GCP Secret Manager for secrets
- Memorystore (Redis) for rate limiting

---

## Recommended Approach

### Architecture Decision: Supabase Auth + api-gateway JWT Validation

**Why Supabase Auth:**
- SOC2 Type 2 certified, battle-tested
- Built-in OAuth providers (Google, Facebook)
- PKCE flow enforcement (no implicit grant)
- JWT signing with RS256 + JWKS rotation
- Email verification and password reset flows included
- Refresh token rotation built-in

**Why api-gateway as single validation point:**
- Downstream services never validate JWTs themselves
- Single source of truth for `workspace_id` extraction
- Centralized rate limiting and audit logging
- Service-to-service calls use GCP Workload Identity (OIDC)

**Alternative considered:** Self-hosted auth with Keycloak or Auth0
**Trade-off:** More control but higher operational burden; Supabase Auth meets all requirements and reduces attack surface

---

## Architecture

### Service Boundaries

```
[Browser/Client]
  │  HTTPS
  ▼
[Cloudflare Pages / Workers] ── JWT cookie ──►
  │
  ▼
[api-gateway — Cloud Run]
  ├── Validate Supabase JWT (JWKS endpoint)
  ├── Extract workspace_id → inject X-Workspace-ID header
  ├── Enforce rate limits (Memorystore)
  └── Forward request + headers ──OIDC──►
        [workspace-service — Cloud Run]
          ├── /v1/workspaces/**
          ├── /v1/members/**
          └── /v1/invitations/**

[Supabase Auth] ── JWT ──► [api-gateway JWKS verify]
```

**Key principle:** Auth is entirely handled by Supabase. RevLooper services never see passwords or OAuth tokens — only the Supabase-issued JWT. The api-gateway is the single validation point.

### JWT + workspace_id Contract

**Supabase JWT payload:**
```json
{
  "sub": "<user_uuid>",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "workspaces": [
      { "workspace_id": "<uuid>", "role": "owner" }
    ]
  },
  "exp": 1234567890,
  "iss": "https://<project>.supabase.co/auth/v1"
}
```

**api-gateway contract:**
1. Verify JWT signature against Supabase JWKS (`/auth/v1/.well-known/jwks.json`)
2. Check `exp` claim (with ±60s clock drift tolerance)
3. Extract `workspace_id` from request path/header
4. Confirm user is a member of that workspace (DB lookup or JWT `app_metadata`)
5. Inject headers: `X-Workspace-ID`, `X-User-ID`, `X-User-Role`
6. Forward to downstream service

**Downstream services:** Read `X-Workspace-ID` via `get_workspace_id()` dependency — never validate JWT themselves.

```python
# services/workspace-service/app/dependencies/auth.py
def get_workspace_id(x_workspace_id: str = Header(...)) -> UUID:
    return UUID(x_workspace_id)

def require_role(min_role: str):
    def _dep(x_user_role: str = Header(...)):
        ROLE_ORDER = ["viewer", "member", "admin", "owner"]
        if ROLE_ORDER.index(x_user_role) < ROLE_ORDER.index(min_role):
            raise HTTPException(403, "Insufficient role")
    return Depends(_dep)
```

---

## Persistence Model

**Owning service:** `workspace-service`

### Tables

#### `workspaces`
```sql
CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,          -- kebab-case, user-editable
  plan            TEXT NOT NULL DEFAULT 'free',  -- 'free'|'pro'|'business'|'enterprise'
  timezone        TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  logo_url        TEXT,
  settings        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL,                 -- auth.users.id (soft FK)
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `workspace_members`
```sql
CREATE TABLE workspace_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,                 -- auth.users.id (soft FK)
  role            TEXT NOT NULL DEFAULT 'member', -- 'owner'|'admin'|'member'|'viewer'
  invited_by      UUID,                          -- auth.users.id
  joined_at       TIMESTAMPTZ,
  removed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
```

#### `invitations`
```sql
CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',
  token           TEXT NOT NULL UNIQUE,          -- secrets.token_urlsafe(32)
  invited_by      UUID NOT NULL,                 -- auth.users.id
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,          -- now() + 7 days
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id) WHERE removed_at IS NULL;
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id) WHERE removed_at IS NULL;
CREATE INDEX idx_invitations_token ON invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_invitations_email ON invitations(email, workspace_id);
```

### Row-Level Security (RLS)

```sql
-- workspace_members: user can see members of workspaces they belong to
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid() AND wm.removed_at IS NULL
  ));

-- invitations: only admins/owners of that workspace can see
CREATE POLICY invitations_select ON invitations
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner','admin')
      AND wm.removed_at IS NULL
  ));
```

### Migration Strategy

Single Alembic migration: `alembic/versions/2026_05_05_001_create_workspaces_members_invitations.py`

Creates all three tables, indexes, and RLS policies in one atomic migration.

---

## API Surface

All routes under `services/workspace-service/app/api/v1/`. Standard envelope: `{ data, error, meta }`.

### Workspace Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/v1/workspaces` | (no auth — first-login) | Create workspace on signup |
| `GET` | `/v1/workspaces/{id}` | viewer | Get workspace details |
| `PATCH` | `/v1/workspaces/{id}` | owner | Update name, slug, logo, timezone, settings |
| `DELETE` | `/v1/workspaces/{id}` | owner | Soft-delete (requires no active campaigns) |

### Member Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/v1/workspaces/{id}/members` | viewer | List members with roles |
| `PATCH` | `/v1/workspaces/{id}/members/{user_id}` | admin | Change role |
| `DELETE` | `/v1/workspaces/{id}/members/{user_id}` | admin | Remove member (soft-delete) |

### Invitation Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/v1/workspaces/{id}/invitations` | admin | Send invite email |
| `GET` | `/v1/invitations/{token}` | public | Preview invite (who invited, workspace name) |
| `POST` | `/v1/invitations/{token}/accept` | authenticated | Accept invite |
| `DELETE` | `/v1/workspaces/{id}/invitations/{inv_id}` | admin | Revoke invite |

### Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `WORKSPACE_NOT_FOUND` | 404 | Workspace does not exist |
| `WORKSPACE_SLUG_TAKEN` | 409 | Slug already in use |
| `INVITATION_EXPIRED` | 410 | Invite token expired (>7 days) |
| `INVITATION_ALREADY_ACCEPTED` | 409 | Invite already used |
| `MEMBER_ALREADY_EXISTS` | 409 | User already in workspace |
| `INSUFFICIENT_ROLE` | 403 | Caller role below required |
| `CANNOT_REMOVE_OWNER` | 409 | Last owner cannot be removed |

---

## Core Flows

### 1. First-Time Signup Flow

1. User signs up via email or OAuth (Google/Facebook)
2. Supabase Auth creates `auth.users` row and issues JWT
3. Frontend calls `POST /v1/workspaces` with user's name/email
4. workspace-service creates workspace with auto-generated slug
5. workspace-service creates `workspace_members` row with `role=owner`
6. workspace-service writes `workspace.created` event to `outbox_events`
7. billing-service consumes event and creates free plan subscription
8. notification-service sends welcome email

### 2. OAuth Login Flow

1. User clicks "Continue with Google" in frontend
2. Frontend calls Supabase JS client `signInWithOAuth({ provider: 'google' })`
3. Supabase redirects to Google OAuth consent screen
4. User approves, Google redirects back to Supabase callback URL
5. Supabase validates OAuth code, creates/updates `auth.users`, issues JWT
6. Frontend receives JWT in httpOnly cookie
7. Frontend redirects to dashboard

### 3. Invite Flow

1. Owner/admin calls `POST /v1/workspaces/{id}/invitations` with email and role
2. workspace-service generates `secrets.token_urlsafe(32)` token
3. workspace-service creates `invitations` row with `expires_at = now() + 7 days`
4. workspace-service writes `workspace.member.invited` event to `outbox_events`
5. notification-service consumes event and sends invite email with token link
6. Invited user clicks link, frontend calls `GET /v1/invitations/{token}` (preview)
7. User signs up/logs in via Supabase Auth
8. Frontend calls `POST /v1/invitations/{token}/accept`
9. workspace-service creates `workspace_members` row, sets `invitation.accepted_at`
10. workspace-service writes `workspace.member.joined` event to `outbox_events`

### 4. JWT Validation Flow (api-gateway)

1. Request arrives at api-gateway with `Authorization: Bearer <jwt>`
2. api-gateway extracts JWT, checks in-memory JWKS cache (15-min TTL)
3. If cache miss, fetch JWKS from Supabase `/.well-known/jwks.json`
4. Verify JWT signature using RS256 public key from JWKS
5. Check `exp` claim (with ±60s clock drift tolerance)
6. Extract `workspace_id` from request path or `X-Workspace-ID` header
7. Query `workspace_members` to confirm user is member of workspace
8. Inject headers: `X-Workspace-ID`, `X-User-ID`, `X-User-Role`
9. Forward request to downstream service

**JWKS cache strategy:**
- In-memory cache with 15-min TTL
- On fetch failure, serve stale cache for 5 min (graceful degradation)
- Handles Supabase key rotation without downtime

---

## Security Model

### Threat Model

#### T01 — JWT Theft & Replay
**Attack:** Attacker steals a valid access token (XSS, local storage exposure, network sniff).  
**Impact:** Full workspace access as the victim.  
**Mitigation:**
- Supabase access tokens expire in 3600s (1 hour)
- Tokens stored in httpOnly cookies (not localStorage) — XSS cannot read
- Refresh token rotation enabled — old refresh token invalidated on use
- api-gateway validates `exp` claim on every request

#### T02 — OAuth State Parameter CSRF
**Attack:** Attacker crafts an OAuth initiation URL without a state parameter; victim clicks, authenticates, attacker captures the code.  
**Impact:** Account hijacking via OAuth login.  
**Mitigation:**
- Supabase Auth handles state parameter generation and verification (PKCE flow)
- Frontend must never initiate OAuth without Supabase client SDK

#### T03 — Cross-Tenant Access (Workspace Isolation Failure)
**Attack:** Authenticated user in workspace A sends requests with workspace B's ID.  
**Impact:** Cross-tenant data leakage — most critical production security incident type.  
**Mitigation:**
- api-gateway validates user is a member of requested workspace_id BEFORE forwarding
- All downstream services: `workspace_id` comes only from `X-Workspace-ID` header set by api-gateway — never from request body/params
- RLS on all workspace-scoped tables (defense-in-depth)
- Integration test suite: workspace A token + workspace B ID = 403 (CRITICAL test, must never be skipped)

#### T04 — Brute Force on Login / Password Reset
**Attack:** Attacker sends high-volume login or password reset requests.  
**Impact:** Account takeover or denial of service.  
**Mitigation:**
- Supabase Auth built-in rate limiting (5 attempts/IP/15min for password login)
- Additional: api-gateway Memorystore sliding window on `POST /auth/v1/token` (10 req/min/IP)
- Password reset: Supabase sends signed time-limited email link (1-hour expiry)

#### T05 — Invite Token Enumeration / Brute Force
**Attack:** Attacker guesses or enumerates invite tokens to join a workspace without an invite.  
**Impact:** Unauthorized workspace access.  
**Mitigation:**
- `secrets.token_urlsafe(32)` = 32 bytes = 256-bit entropy — brute force infeasible
- Token stored as SHA-256 hash in DB, compared in constant-time
- Token lookup returns generic "invalid or expired" regardless of reason (no enumeration info)
- Token expires 7 days after creation

#### T06 — Privilege Escalation via Role Manipulation
**Attack:** Member-role user sends PATCH with `role: "owner"` to elevate own privileges.  
**Impact:** Unauthorized access to billing, workspace deletion.  
**Mitigation:**
- `require_role("admin")` dependency on role-change endpoint
- Admins cannot set roles >= their own (owner-level role changes require owner)
- Cannot remove the last owner

#### T07 — Insecure Workspace Deletion / Mass Data Loss
**Attack:** Attacker with owner access (compromised account) deletes workspace.  
**Impact:** All leads, campaigns, sequences permanently lost.  
**Mitigation:**
- Workspace deletion is soft-delete; data retained 30 days for recovery
- Deletion blocked if active campaigns exist (explicit error)
- Deletion requires re-authentication (Supabase `reauthenticate()`)
- Audit log entry created before deletion

### RBAC Matrix

| Action | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Manage workspace settings | YES | NO | NO | NO |
| Invite / remove members | YES | YES | NO | NO |
| Change member roles | YES | YES (below admin) | NO | NO |
| Create/edit campaigns | YES | YES | YES | NO |
| Send outreach | YES | YES | YES | NO |
| View all data | YES | YES | YES | YES |
| Delete workspace | YES | NO | NO | NO |
| Manage billing | YES | NO | NO | NO |

### RevLooper Non-Negotiables Checklist

- workspace_id on every DB query: Enforced via `get_workspace_id()` dependency
- Workspace isolation — no cross-tenant access: T03 tests are CRITICAL
- Transactional outbox pattern: workspace events via `outbox_events` table
- Secrets via GCP Secret Manager: No hardcoded secrets; Supabase keys from Secret Manager
- Service-to-service OIDC auth: workspace-service → billing-service via Workload Identity
- SEA consent (consent_log): Consent at registration (TOS checkbox); logged in `audit_events`

---

## Testing Strategy

### Test Pyramid

```
         /\          E2E (Playwright, ~10 scenarios)
        /  \         OAuth round-trips, invite flow, RBAC smoke
       /----\
      / Integ \      Integration (~40 tests)
     /  tests  \     JWT validation, cross-tenant, role enforcement
    /------------\
   /  Unit tests  \  Unit (~60 tests)
  /________________\ Invite token generation, role order logic, dedup guards
```

### Unit Tests

**File:** `services/workspace-service/tests/unit/`

- `test_role_order_owner_above_admin` — ROLE_ORDER list ordering is correct
- `test_require_role_blocks_insufficient_role` — `require_role("admin")` raises 403 for member
- `test_require_role_allows_equal_role` — `require_role("member")` passes for member
- `test_invite_token_is_32_bytes_urlsafe` — `secrets.token_urlsafe(32)` length and charset
- `test_invite_token_expiry_calculation` — expires_at = now() + 7 days (UTC)
- `test_workspace_slug_generated_from_name` — "Acme Corp" → "acme-corp"
- `test_workspace_slug_uniqueness_suffix` — "acme-corp" taken → "acme-corp-2"
- `test_cannot_remove_last_owner` — Service raises `CANNOT_REMOVE_OWNER`
- `test_workspace_soft_delete_sets_deleted_at` — `deleted_at` populated, not hard-deleted
- `test_workspace_delete_blocked_with_active_campaigns` — `WORKSPACE_HAS_ACTIVE_CAMPAIGNS` raised

### Integration Tests

**File:** `services/workspace-service/tests/integration/`

**JWT Validation:**
- `test_missing_jwt_returns_401` — No Authorization header → 401
- `test_expired_jwt_returns_401` — Token with past `exp` → 401
- `test_valid_jwt_passes_gateway` — Valid token → 200 (mocked Supabase JWKS)
- `test_malformed_jwt_returns_401` — Random string in header → 401
- `test_jwt_with_wrong_issuer_returns_401` — Wrong `iss` claim → 401

**Workspace Isolation (CRITICAL — all must pass):**
- `[SECURITY] test_cross_workspace_access_returns_403` — Workspace A token + workspace B ID → 403
- `[SECURITY] test_workspace_id_from_header_not_body` — Request body `workspace_id` is ignored
- `test_rls_blocks_direct_db_select_wrong_workspace` — RLS enforced at DB level

**Member & Invite Flow:**
- `test_invite_creates_invitation_row` — POST invite → row in invitations table
- `test_invite_sends_notification_event` — Outbox event `workspace.member.invited` created
- `test_accept_invite_creates_membership` — Accept → workspace_member row with correct role
- `test_accept_expired_invite_returns_410` — 7-day-old token → 410
- `test_accept_already_accepted_invite_returns_409` — Second accept → 409
- `test_revoke_invite_prevents_acceptance` — Revoke → subsequent accept → 410

**RBAC Enforcement:**
- `[SECURITY] test_member_cannot_change_own_role` — PATCH role with member token → 403
- `[SECURITY] test_admin_cannot_set_owner_role` — Admin sets role=owner → 403
- `test_owner_can_set_admin_role` — Owner sets member→admin → 200
- `test_viewer_cannot_create_campaign` — POST /campaigns with viewer → 403 (via api-gateway)

### E2E Tests

**File:** `frontend/tests/e2e/auth/`  
**Tool:** Playwright

- Email signup → workspace created
- Google OAuth login
- Facebook OAuth login
- Invite flow (owner invites → invited user accepts → member appears)
- Expired invite link → "Link expired" page
- Password reset flow
- RBAC — viewer cannot create campaign
- Workspace settings update
- Remove member

### Coverage Gates

| Layer | Gate | Enforcement |
|---|---|---|
| workspace-service unit + integration | 90% line | `pytest --cov --cov-fail-under=90` in CI |
| Security tests (`[SECURITY]` tagged) | 100% must pass | CI gate — any failure blocks merge |
| Frontend (Vitest, components + hooks) | 80% | `vitest --coverage` in CI |
| E2E (Playwright) | All 10 scenarios green | CI playwright job |

---

## Definition of Done

This spec is complete when:

1. Supabase project configured with Google + Facebook OAuth providers
2. Alembic migration creates `workspaces`, `workspace_members`, `invitations` tables + indexes + RLS
3. workspace-service implements all workspace, member, and invitation endpoints
4. api-gateway implements Supabase JWKS validation middleware with in-memory cache + stale fallback
5. api-gateway injects `X-Workspace-ID`, `X-User-ID`, `X-User-Role` headers
6. `get_workspace_id()` + `require_role()` FastAPI dependencies published to all services
7. All unit + integration tests passing, coverage >= 90%
8. All `[SECURITY]` tagged tests passing (100% gate)
9. `test_cross_workspace_access_returns_403` NEVER skipped (P0 security test)
10. Frontend sign-in/sign-up pages with email + OAuth buttons
11. Frontend OAuth callback handler (Supabase JS client)
12. Frontend workspace settings + member management pages
13. All 10 E2E scenarios green in CI
14. Monitoring alerts live in staging (JWT validation error rate, invite email delivery failure, cross-tenant 403 spike)
15. Workspace A token + workspace B ID returns 403 in staging (exit gate)

---

## Rollout Plan

### Phase 1 — Backend Foundation (Week 1-2)

**Goal:** JWT validation + workspace isolation contract live; all downstream services unblocked.

**Deliverables:**
1. Supabase project configuration: enable Google + Facebook OAuth providers
2. Alembic migration: `workspaces`, `workspace_members`, `invitations` tables + indexes + RLS
3. workspace-service: workspace CRUD service layer + FastAPI router
4. api-gateway: Supabase JWKS validation middleware (with in-memory cache + stale fallback)
5. api-gateway: `X-Workspace-ID`, `X-User-ID`, `X-User-Role` header injection
6. `get_workspace_id()` + `require_role()` FastAPI dependencies (published to all services)
7. All unit + integration tests passing, coverage >= 90%

**Exit gate:** Workspace A token + workspace B ID returns 403 in staging. CI all green.

### Phase 2 — Invite & Member Management (Week 2-3)

**Deliverables:**
1. Invite flow: create invitation, send via notification-service, accept/revoke endpoints
2. Member management: PATCH role, DELETE (soft-remove) member
3. Outbox events: `workspace.member.invited`, `workspace.member.joined`, `workspace.member.removed`
4. Rate limiting on auth endpoints (api-gateway Memorystore)
5. Audit log entries for all auth events

**Exit gate:** Full invite flow tested in staging with all 2 providers (Google + Facebook).

### Phase 3 — Frontend (Week 3-4)

**Deliverables:**
1. Sign-in / sign-up page (email + 2 OAuth buttons: Google + Facebook)
2. Email verification page + password reset flow
3. OAuth callback handler (Supabase JS client)
4. Workspace settings page (name, logo, timezone, slug)
5. Member management page (list, invite, role change, remove)
6. RBAC-gated UI elements (role-based rendering)
7. JWT storage: httpOnly cookies via Supabase SSR helpers

### Phase 4 — Hardening (Week 4)

**Deliverables:**
1. Security test suite passes 100% (`[SECURITY]` tagged tests)
2. JWKS cache rotation test + stale fallback test
3. Brute force rate limit verified in load test
4. Soft-delete workspace + 30-day recovery confirmation
5. Facebook OAuth app review status verified

---

## Monitoring & Alerts

| Signal | Alert threshold | Tool |
|---|---|---|
| JWT validation error rate | > 1% of requests | Cloud Monitoring |
| `workspace.created` event lag | > 30s | Pub/Sub metric |
| Invite email delivery failure | > 5% | Novu webhook |
| Cross-tenant access 403 rate spike | Any spike > baseline | Anomaly detection |
| workspace-service p99 latency | > 500ms | Cloud Run metric |

---

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Signup → first workspace created | 100% | analytics event `workspace.created` |
| OAuth success rate (no error screen) | >= 99% | auth error events |
| Invite accept rate | >= 60% | analytics event `invite.accepted` |
| Cross-tenant access test | 0 incidents | security tests + prod incident log |
| JWT expiry / silent refresh failure rate | < 0.1% of sessions | error monitoring |
| Time to first protected API call after signup | < 10s | frontend perf trace |

---

## Out of Scope

The following are explicitly NOT included in this implementation:

- SAML/SCIM SSO (Enterprise feature — separate spec)
- 2FA/MFA enforcement (recommended but not enforced in v1)
- Multi-workspace switching UI (v2 feature)
- Session management beyond Supabase defaults
- Microsoft OAuth (removed — target users use Google/Facebook)
- Custom domain auth
