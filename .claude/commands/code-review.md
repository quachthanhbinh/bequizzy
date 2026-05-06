---
description: "Run a comprehensive code review on recent changes, a specific service, or a PR diff"
agent: code-reviewer
argument-hint: "Describe what to review: a service, recent changes, files, or paste a diff"
---

Perform a systematic code review.

**Target:** $ARGUMENTS

Follow this order:

1. **SPEC TRACEABILITY (Section 0)** — If a spec exists in `docs/specs/`, read it first. For every requirement: verify a corresponding implementation exists. For every change: verify it was in-scope per the spec (flag scope creep). **Do NOT approve if spec requirements are partially implemented or silently dropped.**

2. **ARCHITECTURE** — Correct service ownership? handler → service → data pattern? Cross-service calls via REST/Pub-Sub (not ORM imports)?

3. **SECURITY (OWASP + RevLooper)** —
   - workspace_id scope on every query
   - Suppression check before outbound
   - Credits deducted before AI ops
   - Webhook signature validation
   - SEA consent logged for personal data
   - No hardcoded secrets
   - Internal Cloud Run services use `--ingress=internal`

4. **DATA FLOW** — Outbox events written atomically with business data? Soft FKs across service boundaries? RLS policy on new tables? TEXT not ENUM?

5. **ERROR HANDLING** — `AppError(code, message, status_code)` for domain errors? Structured logging with `workspace_id` and `trace_id`? No raw exceptions leaking to API responses?

6. **TESTING** — Coverage threshold met for the service? Edge cases (empty/nil/cross-workspace/race) covered? Reproducer test for any bug fix?

7. **CODE QUALITY** — Naming matches conventions? No duplication? No `any` in TypeScript? No `pass`-only stubs?

Report findings by severity:

- **🔴 BLOCKER** — must fix before merge (security, workspace leak, suppression bypass, credit bypass, missing test for new behavior, cross-service ORM import, hardcoded secret)
- **🟠 HIGH** — should fix before merge
- **🟡 MEDIUM** — fix in follow-up
- **🟢 LOW / SUGGESTION** — optional

Format each finding:
```
### [SEVERITY] — Title
**Location:** `path/to/file.py:42`
**Issue:** {what's wrong}
**Why it matters:** {risk}
**Fix:** {specific code change}
```

Use the `code-reviewer` agent's BLOCKER list as the canonical reference for what's non-negotiable.
