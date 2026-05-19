# 28 — AI Brain Reflection Loop — SECURITY

**Status:** 📝 Draft
**Security flag:** 🟡 MEDIUM
**Auditor:** awaiting security-auditor agent review pre-Phase 4

## Threat Model Summary

**Primary risk:** Cross-workspace data leakage. The reflection LLM ingests workspace data, then produces text that becomes part of that workspace's RAG context. A bug or prompt injection could cause:
- Workspace A's reply data to appear in workspace B's proposals
- PII (lead names/emails/phones) to be embedded into the AI Brain (then surfaced in future outbound)
- System prompt extraction → enables further attacks
- Credit bypass → unbounded LLM cost

## Trust Boundaries

```
[Workspace owner] ─jwt→ [api-gateway] ─OIDC→ [ai-service] ─OIDC→ [outreach-service]
                                                  │
                                                  ├─OIDC→ [billing-service]
                                                  │
                                                  ├──→ [LiteLLM Router] ──→ [LLM provider — UNTRUSTED]
                                                  │
                                                  └─Pub/Sub→ [outbox] → [rag-processor] → [pgvector]
```

**Untrusted inputs:** reply bodies (user-generated), LLM outputs (probabilistic)
**Trusted:** workspace_id from validated JWT, internal service-to-service tokens

## Mitigations (mapped to threats)

### T1 — Cross-workspace data leak in proposals
- ✅ Every DB query in `reflection_service` filters by `workspace_id` (enforced by tests in [TESTS.md](TESTS.md))
- ✅ RLS policies on `brain_proposals` and `reflection_runs` mirror `ai_brain_chunks`
- ✅ One LLM call per workspace — never batch across workspaces
- ✅ Reflection prompt template is workspace-agnostic; data is per-workspace
- ✅ Workload Identity service account for ai-service has no DB role bypass
- ✅ Adversarial test ADV-01 verifies isolation (see [TESTS.md](TESTS.md))

### T2 — PII embedded into AI Brain
- ✅ `pii_stripper.py` runs BEFORE LLM call — strips names/emails/phones (incl. Vietnamese, Thai, +84 formats)
- ✅ Anonymization is one-shot (no reverse-mapping table persisted)
- ✅ Code-based eval grades output for absence of PII patterns (regex)
- ✅ Adversarial test ADV-03 (PII fabrication) gates public launch
- ✅ 100% test coverage required on `pii_stripper.py`

### T3 — Prompt injection via reply bodies
- ✅ Reply bodies wrapped in `<reply>...</reply>` delimiters in prompt
- ✅ System prompt explicitly instructs model to treat content inside delimiters as data, not instructions
- ✅ Adversarial test ADV-02 (system prompt extraction attempt) gates public launch
- ✅ Output validation: schema check + system-prompt-fragment substring check

### T4 — Credit bypass / DoS
- ✅ `billing_client.deduct_credits()` is the FIRST action in `reflection_service.run()` — raises `INSUFFICIENT_CREDITS` before any LLM call
- ✅ Manual trigger rate-limited 1/24h per workspace via Memorystore sliding window
- ✅ Token caps `max_input_tokens=8000`, `max_output_tokens=2000`
- ✅ LLM cost monitoring + daily alert threshold $5 during beta
- ✅ Adversarial test ADV-05 verifies bypass impossible

### T5 — Suppression list bypass via reflection
- ✅ Reflection input excludes leads marked as suppressed (filter in outreach client query)
- ✅ Adversarial test ADV-04 verifies suppressed leads never appear in proposals
- ✅ Eval LLM-as-judge dimension "no-fabrication" downgrades proposals that target suppressed addresses

### T6 — Authorization bypass
- ✅ Accept/reject endpoints require `workspace.brain.write` permission (workspace owner + admins, not all members)
- ✅ Permission check via api-gateway middleware, not in service code
- ✅ Audit log entry in existing `events` table on every accept/reject (`actor_user_id`, `proposal_id`, `action`)

### T7 — Webhook replay / event duplication
- ✅ Pub/Sub handler dedup on `(event_type, run_id)` for `ai.brain.reflection.requested`
- ✅ Pub/Sub handler dedup on `(event_type, chunk_id)` for `ai.brain.chunk.created`
- ✅ Unique partial index `reflection_runs(workspace_id) WHERE status='running'` blocks concurrent runs

## OWASP Top 10 Walkthrough

| OWASP | Status | Notes |
|---|---|---|
| **A01 Broken Access Control** | ✅ | workspace_id scope + RLS + permission check (workspace.brain.write) |
| **A02 Cryptographic Failures** | ✅ | All secrets via Secret Manager; OIDC tokens for service-to-service; no PII in logs |
| **A03 Injection** | ✅ | SQLAlchemy parameterized queries; Pydantic validation; prompt injection defense (delimiters + instructions) |
| **A04 Insecure Design** | ✅ | Outbox pattern + idempotency + credit gate + rate limit |
| **A05 Security Misconfiguration** | ✅ | ai-service uses `--ingress=internal`; no CORS exposure |
| **A06 Vulnerable Components** | ⏳ | LiteLLM dependency pinned; pip-audit in CI |
| **A07 Auth Failures** | ✅ | JWT validated at api-gateway only; service-to-service via Workload Identity |
| **A08 Software Integrity** | ✅ | Signed Docker images via Artifact Registry; no runtime pip install |
| **A09 Logging Failures** | ✅ | Structured JSON; PII never logged at INFO+; workspace_id + trace_id always present |
| **A10 SSRF** | ✅ | LLM calls only to allowlisted LiteLLM router endpoints |

## RevLooper Non-Negotiables Check

- ✅ Every DB query scoped by `workspace_id` — verified by tests
- ✅ No imports of another service's SQLAlchemy models — uses internal REST + OIDC
- ✅ Credits deducted via billing-service BEFORE LLM call
- ✅ Suppression check applied (reflection input filter excludes suppressed leads)
- ✅ Outbox pattern for all 5 domain events
- ✅ Soft FKs across service boundaries (workspace_id, reviewed_by are plain UUIDs)
- ✅ No hardcoded secrets — all via Secret Manager
- ✅ No direct LLM SDK imports — only LiteLLM router
- ✅ SEA consent: existing `consent_log` entry at lead creation covers reply-data processing for reflection (validate with legal before staging launch)

## Open Security Items

1. **Legal review** — confirm SEA consent_log entry at lead creation covers downstream reflection use (action: legal team review before Phase 2)
2. **Multi-language PII detection** — Thai script names not yet in stripper test set (action: add 20+ Thai cases before Phase 2)
3. **Rejection reasons** stored as free text — could contain PII if user pastes reply content (action: warn in UI; consider truncation/sanitization)

## Done Definition
- [ ] All 7 mitigations implemented and tested
- [ ] All 5 adversarial evals pass
- [ ] Legal sign-off on SEA consent coverage
- [ ] security-auditor agent review with no BLOCKER findings
- [ ] Penetration test on accept/reject endpoints (cross-tenant access attempts)
