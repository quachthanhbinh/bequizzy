# 00 — Implementation Plan — SECURITY

**Status:** ✅ Approved
**Security flag:** 🟢 LOW (process spec — security risk lives in feature specs)

## Threat Model Summary
This spec governs *how* features ship; security risk is in the features themselves. The plan-level threat is **systemic security debt from rushing waves**. Mitigation: cross-cutting security requirements that bind every spec.

## Cross-cutting Security Requirements (the "non-negotiables")

Every spec MUST satisfy these before its DoD. The code-reviewer + security-auditor agents enforce on every PR.

### S1 — Workspace isolation (multi-tenant)
- Every DB query includes `workspace_id` filter
- RLS policies on every table that holds workspace data
- Automated cross-tenant test in every spec's TESTS.md
- CI grep rule: any new SQLAlchemy query without `workspace_id` filter fails the build

### S2 — No cross-service ORM imports
- Bounded context: services communicate via REST + Pub/Sub only
- CI grep rule: imports of another service's `models/` directory fail the build

### S3 — Credits before AI / paid op
- Every AI / paid external call deducts credits via billing-service first
- code-reviewer agent inspects `services/*/services/*.py` for ordering

### S4 — Suppression before outbound
- Every outbound channel checks suppression list
- Enforced in outreach-service domain layer; never bypassable from the API

### S5 — Secrets management
- All secrets via GCP Secret Manager — never in code, env files, or logs
- gitleaks runs on every PR

### S6 — Service-to-service auth
- All non-gateway Cloud Run services use `--ingress=internal`
- All inter-service calls use Workload Identity OIDC tokens

### S7 — Auth at the edge
- JWT validated only at api-gateway; downstream services trust the gateway-set `X-Workspace-ID` header
- Frontend never bypasses api-gateway

### S8 — PII handling
- PII never logged at INFO+
- Reflection / RAG strips PII before LLM ingestion (spec 28 PII stripper pattern)
- Data export endpoints redact PII per workspace policy

### S9 — Consent (SEA)
- For VN/TH/SG workspaces: `consent_log` entry required before any personal data is processed for outreach
- spec 15 + spec 20 own the implementation; every outreach-emitting spec verifies the check

### S10 — Outbox + idempotency
- All domain events use the transactional outbox pattern (spec 16)
- All event consumers are idempotent on a stable key
- Prevents duplicate sends and inconsistent state

### S11 — Feature flags for risk
- Any new external integration ships behind a feature flag (spec 23)
- Allows fast rollback without code revert

### S12 — Rate limiting + abuse
- API gateway enforces per-workspace + per-user rate limits (Memorystore sliding window)
- Public endpoints (booking, forms) have anti-bot measures

## OWASP Top 10 — Plan-Level Mapping

This is the cross-cutting OWASP coverage strategy; each feature spec applies it to its surface.

| OWASP | Plan-level mitigation | Owning spec(s) |
|---|---|---|
| **A01 Broken Access Control** | S1 + S6 + S7 | 01, 17, every spec |
| **A02 Cryptographic Failures** | S5 + TLS everywhere + Supabase column encryption for sensitive | 17, 20 |
| **A03 Injection** | SQLAlchemy parameterized only; Pydantic validation; prompt injection patterns from spec 28 | 17, every spec |
| **A04 Insecure Design** | SDD workflow with security-auditor in debate | 00 (this) |
| **A05 Security Misconfiguration** | S6; Terraform templates audited | 17 |
| **A06 Vulnerable Components** | pip-audit + npm audit in CI; Renovate bot | 16 |
| **A07 Auth Failures** | S7; Supabase Auth handles, never roll our own | 01, 17 |
| **A08 Software Integrity** | Signed Docker images; SBOM | 16, 17 |
| **A09 Logging Failures** | S8; structured JSON; trace_id everywhere | 18 |
| **A10 SSRF** | Egress allowlist on Cloud Run | 17 |

## Compliance Stack (SEA-first)

| Region | Standard | Owning spec | Status |
|---|---|---|---|
| Vietnam | PDPL 2023 | 15, 20 | In design |
| Thailand | PDPA | 15, 20 | In design |
| Singapore | PDPA | 15, 20 | In design |
| Global | GDPR (right to export, right to delete) | 20 | In design |
| Global | CAN-SPAM (US email) | 07 | In design |

## Audit Schedule

| Audit | Cadence | Owner |
|---|---|---|
| security-auditor agent on every 🟡/🔴 spec | Per-PR | security-auditor |
| Penetration test (external) | Annually | CTO |
| SOC 2 readiness review | Annually | Eng Lead |
| Dependency vulnerability scan | Weekly | devops |
| Secret rotation | Quarterly | devops |

## Done Definition for THIS plan
- All 12 cross-cutting security requirements live + enforced in CI where automatable
- security-auditor agent invoked on every 🟡/🔴 spec without exception
- No Sev1 security incident in production for 90 days post-launch
