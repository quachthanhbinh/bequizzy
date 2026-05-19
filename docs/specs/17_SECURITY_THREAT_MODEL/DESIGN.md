# Spec 17 — Security Threat Model: DESIGN

## OWASP Top 10 2021 — RevLooper Mitigations

| # | Risk | RevLooper Mitigation |
|---|---|---|
| A01 | Broken Access Control | workspace_id on every query; JWT validation in api-gateway; RBAC roles table |
| A02 | Cryptographic Failures | TLS everywhere; secrets in GCP Secret Manager; no plaintext credentials |
| A03 | Injection | Pydantic v2 input validation; SQLAlchemy parameterized queries; XML isolation for LLM prompts |
| A04 | Insecure Design | Transactional outbox; suppression-first; credit-before-AI; bounded contexts |
| A05 | Security Misconfiguration | Cloud Run internal ingress for all services except api-gateway; Terraform IaC |
| A06 | Vulnerable Components | Dependabot PRs; `pip-audit` + `npm audit` in CI |
| A07 | Auth Failures | Supabase Auth; JWT RS256; short-TTL access tokens (1h); MFA support |
| A08 | Software & Data Integrity | Gitleaks CI; signed container images (Binary Authorization); Pub/Sub message ordering |
| A09 | Logging Failures | Structured JSON logs; workspace_id+trace_id on all logs; Cloud Logging; 1-year retention |
| A10 | SSRF | Webhook URL validation (private IP blocklist); no user-controlled URLs in server fetch paths |

---

## CI Security Pipeline

```yaml
# .github/workflows/security.yml
steps:
  - name: Gitleaks secret scan
    uses: gitleaks/gitleaks-action@v2
  - name: Bandit SAST (Python)
    run: bandit -r services/ -ll  # high + critical only
  - name: pip-audit (Python deps)
    run: pip-audit
  - name: npm audit (JS deps)
    run: npm audit --audit-level=high
    working-directory: frontend
```

---

## Cloudflare WAF Rules

```
# Rate limit: 100 req/min per IP
(http.request.uri.path matches "^/api/") → rate limit 100/min

# SQL injection
(http.request.uri.query contains "' OR '") → block
(http.request.uri.query contains "UNION SELECT") → block

# Path traversal
(http.request.uri.path contains "../") → block
```

---

## Quarterly Pen Test Checklist

1. Auth bypass attempts (token forgery, JWT alg confusion)
2. IDOR: access other workspace's resources with valid JWT
3. Prompt injection in AI endpoints
4. Webhook SSRF
5. Suppression bypass
6. Rate limit bypass on billing-service credit endpoints
7. CSV export for cross-workspace data
8. SQL injection via Pydantic bypass
