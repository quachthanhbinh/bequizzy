# Spec 17 — Security Threat Model: TESTS

## Test Strategy

Security is verified via CI pipeline checks, not runtime tests.

## CI Checks (Automated)

### T17-01: Gitleaks — Secrets Detected in PR
- **Tool:** gitleaks-action
- **Gate:** PR fails if any secret pattern detected
- **Verification:** Test with a sample key pattern in a dummy file

### T17-02: Bandit SAST — High-Severity Findings Block Build
- **Tool:** Bandit `-ll` (high+critical)
- **Gate:** Build fails on any B5xx finding
- **Verification:** Introduce `subprocess.call(user_input)` → should fail

### T17-03: pip-audit — Known Vulnerable Dependencies
- **Tool:** pip-audit
- **Gate:** Fail on any HIGH or CRITICAL CVE
- **Verification:** Pin a known-vulnerable package version → should fail

### T17-04: npm audit — JS Dependency Vulnerabilities
- **Tool:** npm audit
- **Gate:** `--audit-level=high`
- **Verification:** Verify frontend CI step present

## Manual Quarterly Checklist
See quarterly pen test checklist in DESIGN.md.
