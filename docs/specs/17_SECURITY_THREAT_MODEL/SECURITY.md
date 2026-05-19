# Spec 17 — Security Threat Model: SECURITY

This spec IS the security document. All risks are in DESIGN.md.

**Overall Risk: 🔴 HIGH** (meta-spec for all security posture)

## Top Priority Findings (Cross-Spec)

| Finding | Severity | Spec | Status |
|---|---|---|---|
| Suppression bypass | CRITICAL | Specs 06, 07, 10 | Mitigated via suppression-first pattern |
| Cross-workspace data access | CRITICAL | All specs | Mitigated via workspace_id mandatory scoping |
| Prompt injection | HIGH | Specs 05, 11 | Mitigated via XML isolation |
| Webhook SSRF | HIGH | Spec 15 | Mitigated via IP blocklist |
| PDPA consent bypass | HIGH | Spec 10 | Mitigated via consent gate |
| Credit bypass before AI | HIGH | Specs 02, 05, 11 | Mitigated via pre-deduction pattern |
