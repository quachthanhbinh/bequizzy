# Spec 17 — Security Threat Model: IMPLEMENTATION

## Phases
1. **CI Integration**: Add Gitleaks, Bandit, pip-audit, npm audit to GitHub Actions CI workflow
2. **WAF Rules**: Configure Cloudflare WAF rate limits and block rules via Terraform
3. **Dep Scanning**: Enable Dependabot for all services + frontend
4. **Living Doc**: Update DESIGN.md after each quarterly pen test with new findings

## File Map
```
.github/workflows/security.yml     # CI security pipeline
infra/cloudflare-waf.tf            # Terraform WAF rules
.github/dependabot.yml             # Dependabot config
```

## Maintenance Schedule
| Activity | Frequency |
|---|---|
| Gitleaks + Bandit + pip-audit | Every PR (CI) |
| Dependabot PRs | Weekly |
| Pen test checklist | Quarterly |
| OWASP Top 10 review | Annually |
