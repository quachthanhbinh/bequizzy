# Spec 06 — Sequence Builder & Execution: SECURITY

**Overall Risk: 🔴 HIGH**

The sequence execution engine sends outbound messages at scale. A single suppression bypass or unsubscribe failure violates CAN-SPAM, GDPR, and Vietnam's PDPA. This is a legal and reputational risk, not just a technical one.

---

## Threat Model

### T06-01: Suppression Check Bypass (CRITICAL)
- **Threat:** A bug, code path shortcut, or deployment error causes the suppression check to be skipped before a step executes
- **Impact:** CRITICAL — email sent to suppressed/unsubscribed contact; GDPR/CAN-SPAM violation; legal liability
- **Likelihood:** Medium (complex async execution makes it easy to accidentally skip)
- **Controls:**
  - Suppression check is the FIRST operation in `execute_step()` — before any business logic
  - `execute_step()` signature requires a `SuppressionCheckResult` parameter — callers must pass it; it cannot be None
  - Integration test MUST assert suppressed lead never receives a step (T06-SEC-01)
  - Code reviewer MUST flag any PR that moves or wraps the suppression check
- **Residual Risk:** Low with enforced structural pattern

### T06-02: Unsubscribe Propagation Failure
- **Threat:** Lead unsubscribes but active enrollments continue executing
- **Impact:** HIGH — continued sends after unsubscribe; legal violation
- **Controls:**
  - `lead.unsubscribed` Pub/Sub event triggers bulk enrollment update in sequence-worker
  - Pub/Sub delivery guarantee: at-least-once; idempotent update (UPDATE ... WHERE status='active')
  - Integration test: enroll lead → unsubscribe → assert all enrollments flipped to 'unsubscribed' within 1s
  - Dead-letter topic for failed unsubscribe processing events → PagerDuty alert
- **Residual Risk:** Low — DLQ monitoring prevents silent failures

### T06-03: Cross-Workspace Enrollment Access
- **Threat:** A workspace accesses or manipulates enrollments belonging to another workspace
- **Impact:** CRITICAL — competitor can see another company's outreach strategy and lead data
- **Controls:**
  - All DB queries include `WHERE workspace_id = :workspace_id`
  - Cloud Tasks task payload includes `workspace_id`; worker validates it matches enrollment's workspace_id before executing
  - Integration test: T06-SEC-02 cross-workspace enrollment access returns 404
- **Residual Risk:** Low

### T06-04: Cloud Task Forgery
- **Threat:** Attacker crafts a fake Cloud Task HTTP request to trigger unauthorized step execution
- **Impact:** HIGH — arbitrary step execution outside normal flow
- **Controls:**
  - Cloud Tasks requests are authenticated via OIDC token (Cloud Tasks service account)
  - sequence-worker validates the OIDC token signature using Google's JWKS endpoint
  - Internal Cloud Run service — `--ingress=internal` (not publicly reachable)
- **Residual Risk:** Low

### T06-05: Daily Send Cap Bypass via Race Condition
- **Threat:** Concurrent step executions race past the Redis counter check, exceeding the daily send cap
- **Impact:** Medium — over-sending to domain → deliverability damage
- **Controls:**
  - Redis `INCR` is atomic — no race condition
  - Counter decremented on cap overflow (see DESIGN.md)
- **Residual Risk:** Low

### T06-06: A/B Split Manipulation
- **Threat:** User sets `split_pct = 0` or `split_pct = 100` to force all leads into one variant, gaming reported metrics
- **Impact:** Low — self-harm only; user manipulating their own results
- **Controls:**
  - `split_pct` validated 1–99 (not 0 or 100) at API boundary
- **Residual Risk:** Low

---

## Security Controls Summary

| Control | Implementation |
|---|---|
| Suppression-first execution | Structural: SuppressionCheckResult required parameter |
| Unsubscribe fan-out | Pub/Sub + bulk UPDATE + DLQ monitoring |
| workspace_id scoping | All queries + Cloud Task payload validation |
| Cloud Task auth | OIDC token + internal Cloud Run ingress |
| Daily send cap | Redis atomic INCR |
| Input validation | Pydantic v2 strict, split_pct 1–99 |
