# 01 — Auth & Workspace — SECURITY

**Status:** 📝 Draft
**Security flag:** 🔴 HIGH
**Last updated:** 2026-05-04

## Threat Summary
Auth is the highest-value attack surface. A successful attack bypasses ALL workspace isolation protections built into every downstream service. Every finding here is P0.

## OWASP Top 10 Mapping

| # | Risk | Applicable? | Mitigation |
|---|---|---|---|
| A01 | Broken Access Control | 🔴 YES | JWT workspace validation in api-gateway; RBAC dependency in all routes |
| A02 | Cryptographic Failures | 🔴 YES | Supabase JWKS RS256 verification; invite tokens via `secrets.token_urlsafe(32)` |
| A03 | Injection | 🟡 YES | Pydantic validation on all input; parameterised queries (SQLAlchemy ORM) |
| A04 | Insecure Design | 🟡 YES | Workspace isolation contract documented and tested |
| A05 | Security Misconfiguration | 🟡 YES | Supabase RLS enabled; api-gateway internal-only ingress |
| A07 | Auth & Auth Failures | 🔴 YES | See threat model below |
| A09 | Logging Failures | 🟡 YES | Structured audit log for all auth events |

## Threat Model

### T01 — JWT Theft & Replay
**Attack:** Attacker steals a valid access token (XSS, local storage exposure, network sniff).
**Impact:** Full workspace access as the victim.
**Mitigation:**
- Supabase access tokens expire in 3600s (1 hour); can be reduced to 300s for Enterprise
- Tokens stored in httpOnly cookies (not localStorage) — XSS cannot read httpOnly
- Refresh token rotation enabled — old refresh token immediately invalidated on use
- api-gateway validates `exp` claim on every request
**Test:** `test_expired_jwt_returns_401`, `test_replay_of_rotated_refresh_token_returns_401`

### T02 — OAuth State Parameter CSRF
**Attack:** Attacker crafts an OAuth initiation URL without a state parameter; victim clicks, authenticates, attacker captures the code.
**Impact:** Account hijacking via OAuth login.
**Mitigation:**
- Supabase Auth handles state parameter generation and verification (PKCE flow)
- Frontend must never initiate OAuth without Supabase client SDK
- Verify `state` matches on callback — Supabase enforces this
**Test:** `test_oauth_callback_without_state_returns_error`

### T03 — Cross-Tenant Access (Workspace Isolation Failure)
**Attack:** Authenticated user in workspace A sends requests with workspace B's ID.
**Impact:** Cross-tenant data leakage — most critical production security incident type.
**Mitigation:**
- api-gateway: validates user is a member of requested workspace_id BEFORE forwarding
- All downstream services: `workspace_id` comes only from `X-Workspace-ID` header set by api-gateway — never from request body/params
- RLS on all workspace-scoped tables (defense-in-depth)
- Integration test suite: workspace A token + workspace B ID = 403 (CRITICAL test, must never be skipped)
**Test:** `test_cross_workspace_access_returns_403` — marked CRITICAL, blocks merge

### T04 — Brute Force on Login / Password Reset
**Attack:** Attacker sends high-volume login or password reset requests.
**Impact:** Account takeover or denial of service.
**Mitigation:**
- Supabase Auth built-in rate limiting (5 attempts/IP/15min for password login)
- Additional: api-gateway Memorystore sliding window on `POST /auth/v1/token` (10 req/min/IP)
- Password reset: Supabase sends signed time-limited email link (1-hour expiry)
**Test:** `test_login_rate_limit_blocks_11th_attempt`

### T05 — Invite Token Enumeration / Brute Force
**Attack:** Attacker guesses or enumerates invite tokens to join a workspace without an invite.
**Impact:** Unauthorized workspace access.
**Mitigation:**
- `secrets.token_urlsafe(32)` = 32 bytes = 256-bit entropy — brute force infeasible
- Token stored as SHA-256 hash in DB, compared in constant-time
- Token lookup returns generic "invalid or expired" regardless of reason (no enumeration info)
- Token expires 7 days after creation
**Test:** `test_expired_invite_token_returns_410`, `test_invalid_invite_token_returns_410`

### T06 — Privilege Escalation via Role Manipulation
**Attack:** Member-role user sends PATCH with `role: "owner"` to elevate own privileges.
**Impact:** Unauthorized access to billing, workspace deletion.
**Mitigation:**
- `require_role("admin")` dependency on role-change endpoint
- Admins cannot set roles ≥ their own (owner-level role changes require owner)
- Cannot remove the last owner
**Test:** `test_member_cannot_change_own_role`, `test_admin_cannot_set_owner_role`

### T07 — Session Fixation via OAuth
**Attack:** Pre-authenticated attacker sets a crafted session, then victim uses it.
**Impact:** Attacker inherits victim's session.
**Mitigation:**
- Supabase Auth issues a fresh session token on every OAuth callback — old session invalidated
- No client-provided session tokens
**Test:** Covered by Supabase Auth unit tests; verify in E2E smoke test

### T08 — Insecure Workspace Deletion / Mass Data Loss
**Attack:** Attacker with owner access (compromised account) deletes workspace.
**Impact:** All leads, campaigns, sequences permanently lost.
**Mitigation:**
- Workspace deletion is soft-delete; data retained 30 days for recovery
- Deletion blocked if active campaigns exist (explicit error)
- Deletion requires re-authentication (Supabase `reauthenticate()`)
- Audit log entry created before deletion
**Test:** `test_workspace_delete_blocked_with_active_campaigns`, `test_workspace_delete_requires_reauth`

## RevLooper Non-Negotiables Checklist

| Requirement | Status | Notes |
|---|---|---|
| workspace_id on every DB query | ✅ | get_workspace_id() dependency enforced in all routes |
| Workspace isolation — no cross-tenant access | ✅ | T03 tests are CRITICAL |
| Transactional outbox pattern | ✅ | workspace events via outbox_events table |
| Credits before AI | N/A | This spec has no AI calls |
| Suppression check before send | N/A | No outbound messaging in this spec |
| Secrets via GCP Secret Manager | ✅ | No hardcoded secrets; Supabase keys from Secret Manager |
| Service-to-service OIDC auth | ✅ | workspace-service → billing-service via Workload Identity |
| SEA consent (consent_log) | 🟡 | Consent at registration (TOS checkbox); logged in audit_events |

## Security Tests (specific to this spec)
See TESTS.md for full test pyramid. Critical security tests marked `[SECURITY]`:
- `[SECURITY]` `test_cross_workspace_access_returns_403`
- `[SECURITY]` `test_expired_jwt_returns_401`
- `[SECURITY]` `test_oauth_state_missing_returns_error`
- `[SECURITY]` `test_invite_token_timing_attack_constant_time`
- `[SECURITY]` `test_member_cannot_escalate_role`
- `[SECURITY]` `test_workspace_delete_requires_owner_reauth`

## External Security Posture
- Supabase Auth is SOC2 Type 2 certified — review annually
- PKCE enforced for all OAuth flows (no implicit grant)
- `Content-Security-Policy` on all auth pages: `frame-ancestors 'none'`
- `X-Frame-Options: DENY` on auth callback pages
