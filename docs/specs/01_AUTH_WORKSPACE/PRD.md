# 01 — Auth & Workspace — PRD

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🔴 HIGH
**Last updated:** 2026-05-04

## Problem Statement
RevLooper is a multi-tenant SaaS. Every feature depends on knowing *who is this user* and *which workspace do they belong to* with absolute certainty. Without a solid auth + workspace contract:
- Downstream services can't enforce workspace isolation
- Cross-tenant data leakage is a single buggy query away
- Onboarding friction (no SSO) kills Enterprise conversion

### Evidence
- All 28 specs require `workspace_id` in every DB query (architecture principle)
- SEA market: Google OAuth adoption ~70% for SMB; Microsoft dominates Enterprise
- Invite flow required for team collaboration (solo founder → small team path)

### Who has this problem
Every user on every plan from day one.

## Goals
1. Secure, frictionless signup/login via email or OAuth (Google, Facebook)
2. First login auto-creates a workspace; workspace is the root of all data
3. Team invite flow: workspace owner can invite members with role assignment
4. JWT + `workspace_id` isolation contract published for all downstream services
5. RBAC (owner/admin/member/viewer) enforced at the API layer

## Non-Goals
- ❌ SAML SSO (Enterprise feature — separate spec)
- ❌ Multi-workspace switching UI (v2 — most users have 1 workspace)
- ❌ Custom domain auth
- ❌ 2FA/MFA enforcement (recommended but not enforced in v1)

## Acceptance Criteria
- [ ] User can sign up with email + password; email verification sent
- [ ] User can sign up / log in via Google and Facebook OAuth
- [ ] First login for any provider auto-creates a personal workspace
- [ ] All protected API endpoints return 401 without valid JWT
- [ ] All protected API endpoints return 403 for valid JWT with wrong workspace
- [ ] JWT includes `workspace_id` claim; api-gateway injects `X-Workspace-ID` header
- [ ] Workspace owner can invite users by email; invite link expires in 7 days
- [ ] Invited user can accept invite and joins workspace with assigned role
- [ ] Role matrix enforced: owner > admin > member > viewer (see DESIGN.md)
- [ ] Token refresh is silent (no logout on page reload)
- [ ] Password reset via email works
- [ ] User can update workspace name, logo, timezone
- [ ] Workspace owner can remove members
- [ ] Audit log entry created for every auth event (login, invite, role change, removal)

## Role Matrix

| Action | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Manage workspace settings | ✅ | ❌ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ (below admin) | ❌ | ❌ |
| Create/edit campaigns | ✅ | ✅ | ✅ | ❌ |
| Send outreach | ✅ | ✅ | ✅ | ❌ |
| View all data | ✅ | ✅ | ✅ | ✅ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Signup → first workspace created | 100% | analytics event `workspace.created` |
| OAuth success rate (no error screen) | ≥ 99% | auth error events |
| Invite accept rate | ≥ 60% | analytics event `invite.accepted` |
| Cross-tenant access test | 0 incidents | security tests + prod incident log |
| JWT expiry / silent refresh failure rate | < 0.1% of sessions | error monitoring |
| Time to first protected API call after signup | < 10s | frontend perf trace |

## In-Scope Deliverables
- Supabase Auth configuration (email + Google + Facebook OAuth)
- `workspaces`, `workspace_members`, `invitations` tables + Alembic migration
- JWT validation middleware in api-gateway (Supabase JWT verification)
- `X-Workspace-ID` header injection in api-gateway
- `get_workspace_id()` FastAPI dependency for all downstream services
- Workspace CRUD API endpoints
- Member invite + accept flow
- Role check dependency `require_role(min_role: str)`
- Audit log (writes to `events` table)
- RLS policies on all workspace-scoped tables
- Frontend: sign-in page, OAuth callbacks, workspace settings, member management

## Out of Scope (deferred)
- SAML/SCIM SSO
- 2FA enforcement
- Multi-workspace switching
- Session management beyond Supabase defaults

## Dependencies
None — root spec.

## Test Checklist (PRD level — see TESTS.md)
- [ ] OAuth round-trips for all 2 providers (Google, Facebook)
- [ ] Cross-tenant access: workspace A user cannot access workspace B data
- [ ] Role enforcement: viewer cannot trigger sends
- [ ] JWT expiry: expired token returns 401
- [ ] Invite expiry: 7-day-old invite link fails

## Open Questions
1. Should workspace slug be auto-generated (company name kebab-case) or user-chosen? **Recommendation:** auto-generated from company name, user can edit once.
2. Soft-delete vs hard-delete for workspace members? **Recommendation:** soft-delete (keep audit trail), hard-delete blocked while active campaigns exist.
