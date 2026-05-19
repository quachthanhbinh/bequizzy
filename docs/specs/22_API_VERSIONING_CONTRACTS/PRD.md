# Spec 22 — API Versioning & Contracts: PRD

## Problem Statement

Multiple external clients (Zapier, n8n, Agency white-labels) depend on stable API contracts. Without versioning policy, breaking changes will silently break integrations.

## Acceptance Criteria

### AC-22-01: URL Versioning
- All service endpoints prefixed `/v1/`
- Breaking changes require `/v2/` path

### AC-22-02: Breaking Change Policy
- Breaking change: field removal, type change, endpoint rename/delete
- Non-breaking: new optional field, new endpoint
- Deprecation notice: 6-month window via `Sunset` response header

### AC-22-03: OpenAPI Spec
- Auto-generated per service via FastAPI
- Published to `api.revlooper.com/openapi/{service}/v1.json`
- CI: spec diff check blocks breaking schema changes

### AC-22-04: Contract Testing
- Pact broker used for consumer-driven contract tests
- Consumer: frontend → api-gateway
- Provider: api-gateway → downstream services
