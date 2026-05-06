---
name: spec-driven-development
description: "Use when planning features, designing systems, creating specs, brainstorming architecture, or starting new work. Spec-Driven Development workflow that produces a validated spec before any code is written."
---

# Spec-Driven Development (SDD)

Spec-Driven Development ensures every feature is fully designed, reviewed, and planned before a single line of code is written. This is the **mandatory entry point for all non-trivial work** in this project.

<HARD-GATE>
Do NOT write any implementation code, scaffold any project, or take any implementation action until a spec has been written, reviewed, and approved by the user. This applies to EVERY feature regardless of perceived simplicity.
</HARD-GATE>

## When to Use

**Always** for:
- New features or endpoints
- Multi-file changes
- Cross-service work
- Database schema changes
- New UI flows
- Anything affecting credits, suppression, billing, AI prompts, or webhooks

**Skip only** for:
- Single-line bug fixes with obvious cause
- Documentation-only changes
- Config / env changes

## The SDD Pipeline

```
BRAINSTORM → SPEC → REVIEW → PLAN → IMPLEMENT (TDD) → VERIFY
```

Each stage gates the next. No skipping.

## Phase 1: Brainstorm — Multi-Round CPO ↔ CTO Debate

The Planner agent orchestrates this. See `.claude/agents/planner.md` for the full debate protocol.

**Key principles:**
- **Real subagent debate**, not internal simulation. Each round = two real Task calls.
- **Planner Context Summary** gathered ONCE upfront so advisors don't redundantly re-read docs
- **Convergence check** after every round: `gap ≤ 2 AND both ≥ 7` → converged
- **Deadlock format** at round 5 if not converged → user decides
- **Scale gate** is non-negotiable: any CTO scale concern caps confidence at 5

**Confidence-based gating:**

| Confidence | Action |
|---|---|
| **9–10** | Auto-approve — proceed to Spec phase |
| **7–8** | Ask user — present recommendation with specific questions |
| **4–6** | Ask user — present all approaches, highlight disagreement |
| **1–3** | Ask user — recommend further research or prototype first |

## Phase 2: Write Spec (folder, not single file)

Every spec is a **folder** under `docs/specs/`, not a single markdown file. This matches the existing 00–27 spec series.

### Folder name

- **Numbered platform spec** — `docs/specs/NN_FEATURE_NAME/` (e.g., `28_AI_BRAIN_REFLECTION/`) when extending the canonical platform series
- **Dated feature spec** — `docs/specs/YYYY-MM-DD-feature-name/` (kebab-case) for incremental work or internal tools

Ask the user which case applies if unclear.

### 8 required files

Mirror the existing structure (see `docs/specs/01_AUTH_WORKSPACE/` for reference, or `docs/specs/_TEMPLATE/` if present):

| File | What goes in it |
|---|---|
| `README.md` | One-line summary, status badge, dependencies, links to the other files |
| `PRD.md` | Problem, scope, deliverables, acceptance criteria, in/out of scope, success metrics |
| `DESIGN.md` | Architecture, data model + Alembic migration filename, API contract, event/outbox design, sequence diagrams (text), confidence score + debate summary |
| `IMPLEMENTATION.md` | Rollout plan, feature flags, monitoring metrics, risks, dependencies on other services, on-call runbook pointer |
| `TASKS.md` | Task-by-task TDD plan per `writing-plans` skill (RED → Verify-RED → GREEN → Verify-GREEN → Commit) |
| `TESTS.md` | Coverage targets per file, integration scenarios, eval cases (for AI features), critical paths needing 100% |
| `SECURITY.md` | Threat model, OWASP Top 10 walkthrough, RevLooper-specific risks (workspace isolation, credits, suppression, consent, webhook signature) |
| `RESULT.md` | Empty placeholder — filled in after ship with metrics, post-mortem, deviations from plan |

### Cross-file rules

- Don't duplicate content across files — link instead
- Every file starts with the same status header (Draft / In Review / Approved / Shipped) and confidence score
- `PRD.md` is the source of truth for *what*; `DESIGN.md` is the source of truth for *how*; `TASKS.md` is the source of truth for *what to build next*
- `SECURITY.md` is mandatory even for 🟢 STANDARD flag (just shorter)

### Spec content sections (distributed across the files)

```markdown
# [Feature Name] — Design Spec

**Date:** YYYY-MM-DD
**Author:** [name]
**Status:** Draft | In Review | Approved
**Confidence:** X/10 (from brainstorm)
**Services affected:** [list of services / frontend areas]
**Security flag:** 🔴 HIGH | 🟡 MEDIUM | 🟢 STANDARD

## Problem Statement
What problem does this solve? Who has this problem? Cite evidence.

## Solution Overview
2–3 sentences on the approach.

## Scale Design
- **Target scale:** 100 workspaces × 100k leads × 1M outbound msgs/month
- **Query patterns:** How does this perform at scale? (pagination, indexing, caching)
- **Bottleneck analysis:** What breaks first at 10× load? Mitigation?

## Architecture
- Which services are involved (and which OWNS the new tables)?
- Cross-service communication (sync REST or async via outbox + Pub/Sub?)
- Text-based data flow diagram
- New endpoints / routes

## Database Changes
- New tables / columns (specify owning service)
- TEXT-not-ENUM for status fields
- JSONB schema for any flexible fields
- Soft FKs vs hard FKs (cross-service = soft)
- Indexes (always include `workspace_id`)
- RLS policy changes
- Alembic migration filename: `YYYY_NNN_<action>_<table>.py`

## API Contract
- Request / response shapes (Pydantic schema)
- Standard envelope: `{ data, error, meta }`
- Error codes (`AppError(code, message, status_code)`)
- Rate limiting

## Event / Outbox Design
- Domain events emitted to `outbox_events`
- Pub/Sub topic and subscriber service(s)
- Cloud Tasks queue (if delayed)
- Idempotency strategy

## Credits & Cost (if AI involved)
- Credits deducted per operation (which billing-service code path)
- Estimated LLM tokens per call
- Caching strategy (RAG embeddings, prompt cache)

## Suppression / Compliance (if outbound)
- Suppression list check point
- Consent log entry (if SEA personal data)
- Unsubscribe / preference center

## UI/UX (if applicable)
- User flow
- Key screens / states (use existing shadcn components where possible)
- Empty / loading / error states
- 375px mobile viewport check

## Edge Cases & Error Handling
- What can go wrong?
- How does the system recover?
- What's the user-facing message?

## Security Considerations
- Workspace_id scope on every query (confirmed)
- Auth / AuthZ requirements
- Input validation (Pydantic + Zod)
- Webhook signature validation (if applicable)
- Data exposure risks
- For HIGH security flag: explicit OWASP Top 10 walkthrough

## Testing Strategy
- Unit test scope (per-service pytest / vitest)
- Integration test scope (real Supabase)
- E2E scenarios (Playwright)
- Coverage target (per service)
- Critical paths requiring 100%

## Rollout Plan
- Feature flag (if behind one)
- Migration sequence
- Backfill strategy
- Monitoring metrics to watch

## Open Questions
- Anything unresolved
```

## Phase 3: Self-Review

Before sharing the spec folder:
- [ ] No `TODO`, `TBD`, or placeholder text inside any of the 8 files
- [ ] No contradictions between files (e.g., API in DESIGN.md says paginated but DB section says no index)
- [ ] Every requirement in PRD.md is testable and traceable to a task in TASKS.md
- [ ] Service ownership matches `DATABASE_SCHEMA.md`
- [ ] Workspace scoping addressed in every query (called out in DESIGN.md and SECURITY.md)
- [ ] All RevLooper non-negotiables addressed (suppression, credits, consent, outbox)
- [ ] `RESULT.md` exists as a placeholder, not omitted
- [ ] `README.md` lists status, dependencies, links to other files
- [ ] Folder registered in `docs/specs/README.md` (Ordered Specs + relevant Parallel Track)

## Phase 4: User Approval Gate

If confidence < 9, **wait for explicit user approval** before proceeding to Plan phase.

## Phase 5: Implementation Plan

Use the `writing-plans` skill. The plan lives in `TASKS.md` inside the spec folder (not in a separate `docs/plans/` directory). Plan must contain task-by-task breakdown ready for the TDD Agent.

## Phase 6: Implementation

Hand off to TDD Agent following `tdd-workflow` skill.

## Phase 7: Verification

Run `verification-loop` skill before declaring done.

## "Find, Don't Invent"

Before proposing any pattern, find an existing example in the codebase and follow it. If no example exists, flag it explicitly to the user:
> "This pattern doesn't exist yet in the codebase. Confirm this is intentional."
