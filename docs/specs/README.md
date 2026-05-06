# BeQuizzy Feature Specs

This folder breaks the product requirements into implementation-ready feature specs using the Spec-Driven Development (SDD) workflow.

Each spec uses a folder with the full SDD file set (8 files):
- `README.md` — index, status, confidence, debate summary pointer
- `PRD.md` — product and acceptance requirements
- `DESIGN.md` — architecture, data model, API, events, 3-round CPO↔CTO debate
- `SECURITY.md` — threat model, OWASP walkthrough, mitigations
- `TESTS.md` — unit / integration / E2E / EDD strategy
- `IMPLEMENTATION.md` — rollout plan, file map, phase breakdown
- `TASKS.md` — task-by-task TDD plan (≤15 tasks, RED-first)
- `RESULT.md` — post-ship metrics (empty stub until shipped)

See `_TEMPLATE/` for the canonical layout.

## Naming Convention

**Case A — Numbered platform spec** (major platform capabilities):
`docs/specs/NN_FEATURE_NAME/` where NN is the next free number and FEATURE_NAME is `SCREAMING_SNAKE_CASE`.

**Case B — Dated feature spec** (incremental work, internal tools, refinements):
`docs/specs/YYYY-MM-DD-feature-name/` (kebab-case).

## Status Grid

| # | Spec | Confidence | Security | Files |
|---|---|---|---|---|
| `_TEMPLATE` | Reference Template | — | — | 8/8 ✅ |
