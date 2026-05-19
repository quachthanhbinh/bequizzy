# Spec 17 — Security Threat Model: PRD

## Problem Statement

RevLooper handles PII (names, emails, phone numbers), business-critical outreach data, and payment credentials. A systematic threat model is required to proactively identify and remediate risks before production.

## Scope

| Area | Coverage |
|---|---|
| OWASP Top 10 | All 10 categories mapped to RevLooper surfaces |
| Secret management | Gitleaks CI scanning, Secret Manager enforcement |
| SAST | Bandit for Python, ESLint security rules for TypeScript |
| WAF | Cloudflare WAF rules for api-gateway |
| Pen test plan | Quarterly internal pen test checklist |

## Acceptance Criteria

### AC-17-01: Gitleaks CI Integration
- GIVEN a PR introduces a hardcoded secret (API key, password, token)
- WHEN CI runs
- THEN Gitleaks scan fails the PR
- AND developer is alerted with the finding

### AC-17-02: Bandit SAST
- GIVEN Python code has a high-severity Bandit finding (B501-B610)
- WHEN CI runs
- THEN build fails
- AND finding must be remediated or documented as accepted risk

### AC-17-03: Cloudflare WAF Rules
- Rate limit: 100 req/min per IP on `/api/*`
- Block: SQL injection patterns
- Block: XSS via reflected params
- Block: Path traversal (`../`)

### AC-17-04: OWASP Mapping
All findings from OWASP Top 10 2021 must be mapped to mitigations in this spec.
