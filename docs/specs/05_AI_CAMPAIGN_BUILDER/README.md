# Spec 05 — AI Campaign Builder

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 8 / 10 |
| **Security** | 🟡 MEDIUM |
| **Phase** | P1 |
| **Wave** | 2 |
| **Track** | B — AI Layer |
| **Depends on** | 01 (Auth), 02 (AI Brain), 03 (Leads) |
| **Blocks** | 06 (Sequence Builder), 07 (Email), 10 (Multichannel), 11 (Inbox) |
| **Owning services** | `campaign-service`, `ai-service` |
| **Last updated** | 2025-01-01 |

## One-liner

AI generates full campaign structure (name, description, audience, goals, sequence outline) using workspace Brain context; users refine and publish.

## Files

| File | Purpose |
|---|---|
| [README.md](README.md) | This file — status, deps, one-liner |
| [PRD.md](PRD.md) | User stories, acceptance criteria, metrics |
| [DESIGN.md](DESIGN.md) | Architecture, DB schema, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model, controls, risk rating |
| [TESTS.md](TESTS.md) | Test plan, EDD cases, coverage gates |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Phases, file map, integration points |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | Post-ship metrics, retro notes |

## Scope Boundaries

**In scope:** Campaign CRUD, AI draft generation (name/description/ICP/goals/sequence outline), draft conversation history, user editing of AI suggestions, 5-credit AI creation gate, campaign status lifecycle.

**Out of scope:** Sequence step execution (Spec 06), email sending (Spec 07), multichannel steps (Spec 10), analytics (Spec 09).
