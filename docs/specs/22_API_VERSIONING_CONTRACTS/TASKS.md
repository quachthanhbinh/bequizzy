# Spec 22 — API Versioning & Contracts: TASKS

## TDD Task List

### Task 1 — Apply /v1 Prefix to All Services
**RED first:** Test U22-01 fails.
**Done when:** U22-01 passes on all 14 services.

### Task 2 — oasdiff CI Integration
**RED first:** PR with field removal passes CI.
**Done when:** Breaking change is detected and CI fails.

### Task 3 — Sunset Header on Deprecated Endpoints
**RED first:** Test U22-02 fails.
**Done when:** Deprecated endpoints return Sunset header.

## Completion Checklist
- [ ] All service routes have /v1 prefix
- [ ] oasdiff CI check blocking breaking changes
- [ ] OpenAPI spec disabled in prod
