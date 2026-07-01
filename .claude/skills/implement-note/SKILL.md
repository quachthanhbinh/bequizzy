---
name: implement-note
description: "Use during TDD implementation to maintain the IMPLEMENT-NOTE.md reasoning fingerprint. Update at every spec deviation, unusual pattern, or architecture decision. Future agents MUST read this before modifying the feature."
---

# Implement-Note Skill

## What Is an Implement-Note?

An `IMPLEMENT-NOTE.md` is a **reasoning fingerprint** — a living document that captures:

- **WHY** decisions were made (not WHAT was built — that's in the code)
- The full debate/reasoning chain that shaped the architecture
- Trade-offs explicitly accepted and their justifications
- Every deviation from the spec, with reasons
- Code patterns that look unusual but have deliberate rationale
- Context that a future agent or developer MUST know before touching this code

Think of it as the **missing link between the spec (intent) and the code (execution)**.

---

## When to Write / Update

| Phase | Trigger | Action |
|---|---|---|
| Plan approval | `writing-plans` skill completes TASKS.md | Initialize IMPLEMENT-NOTE.md with sections 1–2 |
| TDD RED step | Test reveals spec ambiguity or gap | Add to Section 3 (Deviation) |
| TDD GREEN step | Implementation required structural change | Add to Section 3 or 4 |
| TDD REFACTOR | A pattern that looks strange was introduced | Add to Section 4 (Fingerprint) |
| Verification | Final check before done | Complete Section 7 (Context for future AI) |

---

## File Location

```
docs/specs/{NN}_{FEATURE}/IMPLEMENT-NOTE.md
```

One file per spec. Never aggregate multiple features into one.

---

## Template

```markdown
# IMPLEMENT-NOTE — {FEATURE}

**Spec:** docs/specs/{NN}_{FEATURE}/
**Date:** YYYY-MM-DD
**Service language:** Go / Python / Java / Node.js
**Status:** 🚧 In Progress | ✅ Complete

---

## 1. Pre-Implementation Context

_What matters BEFORE writing code — constraints, out-of-scope decisions, key product facts._

- Problem being solved:
- What is explicitly OUT of scope:
- Key constraint (performance / cost / compliance):

## 2. Architecture Decisions

_Why the architecture is the way it is. What was rejected and why._

| Decision | Alternatives considered | Reason chosen |
|---|---|---|
| | | |

## 3. Deviations from Spec/Plan

_Every time the implementation differs from what TASKS.md or SPEC.md said._

### Deviation #1: {title}
- **Plan/Spec said:** {exactly what was specified}
- **Implemented instead:** {what was actually built}
- **Discovered at:** Task {N}, {RED/GREEN/REFACTOR}
- **Reason:** {full reasoning}
- **Impact on spec AC:** ✅ Still meets / ⚠️ Modified AC {ID} / 🔴 Spec update required
- **Test that captured this:** `{path}::{test_name}`

## 4. Code Fingerprints (unusual patterns)

_Patterns that look wrong but are intentional._

### Fingerprint: Why {thing} looks like {way it looks}

```{language}
// The pattern
{code snippet}
```

**Reason:** {why it was done this way}

## 5. Non-Negotiables Verified

- [ ] Tenant scope (`org_id`) in every DB query
- [ ] Services communicate via HTTP only (no shared models)
- [ ] AI cost recorded BEFORE any LLM/scoring API call
- [ ] Assessment answer keys never in client response
- [ ] PII (voice/video URLs) encrypted at rest, access logged
- [ ] No raw SQL string interpolation
- [ ] All schema changes via migration files

## 6. Known Risks / Follow-up

_Shortcuts taken under time pressure, known edge cases not handled._

## 7. Context for Future Agent

_The single most important thing to know before modifying this feature._
```

---

## Update Protocol (during TDD)

When you deviate from the spec: **STOP. Write in IMPLEMENT-NOTE.md BEFORE continuing.**

This is not optional. Future sessions (and future you) will lose context without it.
