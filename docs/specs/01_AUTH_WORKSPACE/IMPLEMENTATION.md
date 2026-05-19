# 01 — Auth & Workspace — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-04

## Rollout Phases

### Phase 1 — Backend Foundation (Week 1–2)
**Goal:** JWT validation + workspace isolation contract live; all downstream services unblocked.

**Deliverables:**
1. Supabase project configuration: enable Google + Facebook OAuth providers
2. Alembic migration: `workspaces`, `workspace_members`, `invitations` tables + indexes + RLS
3. `workspace-service`: workspace CRUD service layer + FastAPI router
4. `api-gateway`: Supabase JWKS validation middleware (with in-memory cache + stale fallback)
5. `api-gateway`: `X-Workspace-ID`, `X-User-ID`, `X-User-Role` header injection
6. `get_workspace_id()` + `require_role()` FastAPI dependencies (published to all services)
7. All unit + integration tests passing, coverage ≥ 90%
8. Feature flag `auth_workspace_v1` (gating invite flow; basic auth flows always enabled)

**Exit gate:** Workspace A token + workspace B ID returns 403 in staging. CI all green.

### Phase 2 — Invite & Member Management (Week 2–3)
**Deliverables:**
1. Invite flow: create invitation, send via notification-service, accept/revoke endpoints
2. Member management: PATCH role, DELETE (soft-remove) member
3. Outbox events: `workspace.member.invited`, `workspace.member.joined`, `workspace.member.removed`
4. Rate limiting on auth endpoints (api-gateway Memorystore)
5. Audit log entries for all auth events

**Exit gate:** Full invite flow tested in staging with all 2 providers (Google + Facebook).

### Phase 3 — Frontend (Week 3–4)
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

## Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `invite_flow_enabled` | true | Can disable invite flow per workspace if needed |
| `facebook_oauth_enabled` | true | Facebook OAuth (can disable if Meta app review pending) |
| ~~`microsoft_oauth_enabled`~~ | removed | Microsoft OAuth removed — not supported |

## Monitoring

| Signal | Alert threshold | Tool |
|---|---|---|
| JWT validation error rate | > 1% of requests | Cloud Monitoring |
| `workspace.created` event lag | > 30s | Pub/Sub metric |
| Invite email delivery failure | > 5% | Novu webhook |
| Cross-tenant access 403 rate spike | Any spike > baseline | Anomaly detection |
| workspace-service p99 latency | > 500ms | Cloud Run metric |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ~~Microsoft OAuth enterprise tenant edge cases~~ | N/A | N/A | Microsoft OAuth removed — not in scope |
| Supabase JWT expiry mismatch with Clock skew | Low | High | Accept ±60s clock drift in exp validation |
| JWKS rotation during high traffic | Low | High | Stale fallback cache (serve last-known-good for 5 min on fetch failure) |
| Facebook OAuth app review delay | High | Low | Ship FB OAuth in Phase 2; Google first |

## Runbook

### Key rotation (Supabase JWT secret)
1. Supabase rotates signing key
2. JWKS endpoint serves new key alongside old key for 24 hours
3. api-gateway cache TTL = 15 min — picks up new key within 15 min
4. After 24h: old key removed; all tokens signed with new key

### Invite token compromise
1. Delete invitation row directly in DB (sets accepted_at to prevent future acceptance)
2. Notify workspace admin via notification-service
3. If member already joined: remove from workspace_members

### Emergency workspace lockdown (security incident)
1. Set `workspace.settings.locked = true`
2. api-gateway checks `locked` flag and returns 423 for all workspace requests
3. Ops team investigates; unlocks manually after review
