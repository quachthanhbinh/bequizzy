# Spec 17 — Security Threat Model: TASKS

## TDD Task List

### Task 1 — GitHub Actions Security Workflow
**RED first:** Security CI job missing → manually verify workflow absent.
**File:** `.github/workflows/security.yml`
**Done when:** Gitleaks + Bandit + pip-audit + npm audit all run on PRs.

### Task 2 — Gitleaks Config (.gitleaks.toml)
**RED first:** No config = default patterns; add custom patterns for RevLooper secrets.
**Done when:** Custom patterns for GCP service account keys detected.

### Task 3 — Bandit Config (bandit.yaml)
**RED first:** No config; add `.bandit` to services/.
**Done when:** High-severity Python security issues block PR.

### Task 4 — Cloudflare WAF Terraform
**RED first:** Terraform plan shows no WAF rules.
**File:** `infra/cloudflare-waf.tf`
**Done when:** Rate limit + SQL injection + path traversal rules applied.

### Task 5 — Dependabot Config
**RED first:** `.github/dependabot.yml` missing.
**Done when:** Weekly dependency updates for pip + npm enabled.

## Completion Checklist
- [ ] All 4 CI security checks enabled and blocking
- [ ] Cloudflare WAF rate limit verified (100 req/min)
- [ ] Dependabot weekly updates configured
- [ ] Quarterly pen test schedule documented
