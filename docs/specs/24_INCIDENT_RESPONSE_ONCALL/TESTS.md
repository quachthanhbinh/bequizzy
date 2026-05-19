# Spec 24 — Incident Response & On-Call: TESTS

## Tests

This spec is primarily operational, not code-centric. Verification is via tabletop exercise.

### T24-01: Runbook Existence Test (CI)
```bash
# CI check: every P0 scenario has a runbook
for scenario in api-gateway-down db-connection-exhausted redis-failover; do
  test -f docs/runbooks/$scenario.md
done
```

### T24-02: Post-Mortem Checklist
- [ ] P0 incident within 48h has post-mortem
- [ ] Post-mortem follows template (all sections present)
- [ ] Action items assigned with due dates
