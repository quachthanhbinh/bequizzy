---
description: "Start a new feature with Spec-Driven Development: brainstorm → spec folder → plan → implement with TDD"
agent: planner
argument-hint: "Describe the feature you want to build"
---

Start the Spec-Driven Development workflow for a new RevLooper feature.

**Feature description:** $ARGUMENTS

Follow the SDD pipeline strictly. Do NOT write any implementation code until the spec folder is approved.

## Spec Folder Convention

Every new feature gets its own folder under `docs/specs/`. Two cases:

**Case A — Numbered platform spec** (extends the 00–27 series): use `docs/specs/NN_FEATURE_NAME/` where NN is the next free number and FEATURE_NAME is `SCREAMING_SNAKE_CASE`. Use this when the feature is a major platform capability that belongs in the canonical spec series.

**Case B — Dated feature spec** (incremental work, internal tools, refinements): use `docs/specs/YYYY-MM-DD-feature-name/` (kebab-case). Use this when the feature is a discrete unit of work that doesn't merit a slot in the numbered series.

When in doubt, ask the user which case applies.

## Required Files Inside the Folder

Mirror the existing 8-file structure used by every numbered spec:

| File | Purpose |
|---|---|
| `README.md` | Index + status badge + links to other files |
| `PRD.md` | Product requirements: scope, deliverables, acceptance criteria, dependencies |
| `DESIGN.md` | Architecture, data model, API contract, event/outbox design |
| `IMPLEMENTATION.md` | Rollout plan, feature flags, monitoring, risks |
| `TASKS.md` | Task-by-task TDD plan per `writing-plans` skill |
| `TESTS.md` | Test strategy, coverage targets, eval cases (for AI features) |
| `SECURITY.md` | Threat model + OWASP walkthrough + RevLooper-specific risks |
| `RESULT.md` | Empty placeholder — captures actual outcomes once shipped |

Look at `docs/specs/01_AUTH_WORKSPACE/` (and the `_TEMPLATE/` folder if present) for the canonical shape. "Find, don't invent" — mirror existing structure.

## Workflow

1. **EXPLORE** — Gather Planner Context Summary (one pass): read `CLAUDE.md`, relevant section of `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, neighboring specs in `docs/specs/`, similar existing service code if any
2. **CLASSIFY** — Set security flag (🔴 HIGH / 🟡 MEDIUM / 🟢 STANDARD) AND choose Case A vs Case B for the folder name
3. **DEBATE** — Run multi-round CPO ↔ CTO debate via real subagent calls until convergence or deadlock
4. **PRESENT** — Show synthesis or deadlock to user with confidence score and proposed folder path
5. **GATE** — If confidence < 9, wait for explicit user approval of folder path + design before writing files
6. **CREATE FOLDER** — Create `docs/specs/<name>/` with all 8 files populated using the SDD spec template (split across the files appropriately, do not duplicate content)
7. **SELF-REVIEW** — Check for placeholders, contradictions, missing non-negotiables; verify cross-file consistency
8. **REGISTER** — Add the new folder to `docs/specs/README.md` (Ordered Specs list and the relevant Parallel Track)
9. **HANDOFF** — Hand off to TDD Agent for implementation, pointing at `TASKS.md`
10. **QA** — After TDD Agent completes, invoke the `qa-engineer` agent to write and run Playwright E2E tests that cover every user-facing acceptance criterion in `TESTS.md`

Use the `spec-driven-development` skill for the complete workflow.

Remember the RevLooper non-negotiables every advisor must consider:
- workspace_id scoping on every query
- Credits deducted via billing-service BEFORE every AI op
- suppression_list checked BEFORE every outbound message
- Webhook signature validation BEFORE processing
- consent_log written for SEA personal data
- Outbox pattern for all domain events
- Bounded context (no cross-service ORM imports)
- Scale gate: 100 workspaces × 100k leads × 1M msgs/month
