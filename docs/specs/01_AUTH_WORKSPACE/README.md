# 01 — Auth & Workspace

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🔴 HIGH (auth + multi-tenant isolation — critical path)
**Priority:** P0
**Parallel Track:** A (Core Platform)
**Depends on:** none
**Blocks:** 02, 03, 04, 05, 06, 07, 08, 10, 11, 12, 13, 14
**Owning service:** workspace-service (business logic) + api-gateway (JWT enforcement)

## One-line summary
Multi-tenant auth foundation: Supabase Auth with Google/Facebook OAuth, workspace bootstrap on first login, RBAC (owner/admin/member/viewer), and the JWT + `workspace_id` isolation contract every downstream service depends on.

## Why it matters
- Every other spec requires `workspace_id` scoping — this spec defines that contract
- Multi-tenant isolation failure = critical security incident affecting all customers
- Gets every downstream spec unblocked in Wave 1

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, acceptance criteria, success metrics |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API contract, RBAC matrix, events |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, feature flags, monitoring, risks |
| [TASKS.md](TASKS.md) | Task-by-task TDD plan (12 tasks) |
| [TESTS.md](TESTS.md) | Unit / integration / E2E test strategy, cross-tenant adversarial tests |
| [SECURITY.md](SECURITY.md) | 🔴 HIGH threat model — JWT attacks, OAuth state, CSRF, brute force |
| [RESULT.md](RESULT.md) | (Empty until shipped) actual metrics + post-mortem |

## Pointers
- Supabase Auth docs: https://supabase.com/docs/guides/auth
- Related: all other specs (workspace_id consumer)
- Skills: `spec-driven-development`, `tdd-workflow`
