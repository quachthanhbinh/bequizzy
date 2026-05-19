# 01 — Auth & Workspace — DESIGN

**Status:** 📝 Draft
**Confidence:** 9/10
**Last updated:** 2026-05-04

## Architecture

**Owning service:** `workspace-service` (business logic) + `api-gateway` (JWT enforcement)

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

Auth is entirely handled by Supabase. RevLooper services **never** see passwords or OAuth tokens — only the Supabase-issued JWT. The api-gateway is the single validation point.

## Data Model

**Owning service:** `workspace-service`

```sql
-- Managed by Supabase Auth — do not touch:
-- auth.users (id, email, created_at, ...)

-- RevLooper tables:
CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,          -- kebab-case, user-editable once
  plan            TEXT NOT NULL DEFAULT 'free',  -- 'free'|'pro'|'business'|'enterprise'
  timezone        TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  logo_url        TEXT,
  settings        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL,                 -- auth.users.id (soft FK)
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member',
  token           TEXT NOT NULL UNIQUE,          -- signed, opaque
  invited_by      UUID NOT NULL,                 -- auth.users.id
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,          -- now() + 7 days
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id) WHERE removed_at IS NULL;
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id) WHERE removed_at IS NULL;
CREATE INDEX idx_invitations_token ON invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_invitations_email ON invitations(email, workspace_id);
```

### RLS
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

### Migration
`alembic/versions/2026_05_05_001_create_workspaces_members_invitations.py`

## JWT + workspace_id Contract

```
Supabase JWT payload:
{
  "sub": "<user_uuid>",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "workspaces": [
      { "workspace_id": "<uuid>", "role": "owner" }
    ]
  },
  "exp": ...,
  "iss": "https://<project>.supabase.co/auth/v1"
}
```

**api-gateway contract:**
1. Verify JWT signature against Supabase JWKS (`/auth/v1/.well-known/jwks.json`)
2. Check `exp` claim
3. Extract `workspace_id` from request path/header
4. Confirm user is a member of that workspace (DB lookup or JWT `app_metadata`)
5. Inject `X-Workspace-ID: <uuid>` + `X-User-ID: <uuid>` + `X-User-Role: <role>` headers
6. Forward to downstream service

**Downstream services:** read `X-Workspace-ID` via `get_workspace_id()` dependency — never validate JWT themselves.

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

## API Contract

All routes under `services/workspace-service/app/api/v1/`. Standard envelope `{ data, error, meta }`.

### Workspace endpoints
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/v1/workspaces` | (no auth — first-login) | Create workspace on signup |
| `GET` | `/v1/workspaces/{id}` | viewer | Get workspace details |
| `PATCH` | `/v1/workspaces/{id}` | owner | Update name, slug, logo, timezone, settings |
| `DELETE` | `/v1/workspaces/{id}` | owner | Soft-delete (requires no active campaigns) |

### Member endpoints
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/v1/workspaces/{id}/members` | viewer | List members with roles |
| `PATCH` | `/v1/workspaces/{id}/members/{user_id}` | admin | Change role |
| `DELETE` | `/v1/workspaces/{id}/members/{user_id}` | admin | Remove member (soft-delete) |

### Invitation endpoints
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/v1/workspaces/{id}/invitations` | admin | Send invite email |
| `GET` | `/v1/invitations/{token}` | public | Preview invite (who invited, workspace name) |
| `POST` | `/v1/invitations/{token}/accept` | authenticated | Accept invite |
| `DELETE` | `/v1/workspaces/{id}/invitations/{inv_id}` | admin | Revoke invite |

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `WORKSPACE_NOT_FOUND` | 404 | |
| `WORKSPACE_SLUG_TAKEN` | 409 | |
| `INVITATION_EXPIRED` | 410 | |
| `INVITATION_ALREADY_ACCEPTED` | 409 | |
| `MEMBER_ALREADY_EXISTS` | 409 | |
| `INSUFFICIENT_ROLE` | 403 | Caller role below required |
| `CANNOT_REMOVE_OWNER` | 409 | Last owner cannot be removed |

## Event / Outbox Design

| Event type | Producer | Subscribers | Payload |
|---|---|---|---|
| `workspace.created` | workspace-service | billing-service (create subscription), notification-service (welcome email) | `{ workspace_id, owner_user_id, plan }` |
| `workspace.member.invited` | workspace-service | notification-service (invite email) | `{ workspace_id, email, role, token, invited_by }` |
| `workspace.member.joined` | workspace-service | analytics-service | `{ workspace_id, user_id, role }` |
| `workspace.member.removed` | workspace-service | analytics-service | `{ workspace_id, user_id }` |

## Scale Design

| Concern | Plan |
|---|---|
| JWT validation per request | In-memory JWKS cache (15-min TTL) in api-gateway — 0 extra DB hits |
| Workspace membership lookup | Index on `workspace_members(user_id)` — O(1) |
| Invite token generation | `secrets.token_urlsafe(32)` — cryptographically random |
| 10k workspaces | workspace-service stateless + Cloud Run autoscale, no shared state |

## CPO ↔ CTO Debate Summary

**Round 1 (gap: 2):**
- CPO 8: "ship email + Google OAuth Day 1; Facebook in Week 2 (Microsoft OAuth dropped — target users use Google/Facebook)"
- CTO 7: "JWKS key rotation edge case and invite token expiry attack surface need explicit mitigations"

**Round 2 (gap: 1, both ≥ 8) — converged:**
- Both 9: JWKS cache with stale fallback + short invite token TTL (7 days) + signed-token pattern accepted

**Final: 9/10.** Microsoft OAuth removed from scope — SEA target users predominantly use Google and Facebook accounts.
