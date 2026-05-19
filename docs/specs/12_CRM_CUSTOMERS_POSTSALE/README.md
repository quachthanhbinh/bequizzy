# Spec 12 — CRM, Customers & Post-sale

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 7 / 10 |
| **Security** | 🟡 MEDIUM |
| **Phase** | P2 |
| **Wave** | 3 |
| **Track** | A — Core Platform |
| **Depends on** | 01 (Auth), 03 (Leads), 06 (Sequence), 08 (Booking) |
| **Blocks** | — |
| **Owning services** | `crm-service`, `customer-service` |
| **Last updated** | 2025-01-01 |

## One-liner

Deal pipeline Kanban (Prospect→Contacted→Meeting→Proposal→Won/Lost), drag-drop cards, Won→Customer conversion, and customer lifecycle management (onboarding/active/at-risk/churned) with health score.

## Files

| File | Purpose |
|---|---|
| [README.md](README.md) | This file |
| [PRD.md](PRD.md) | User stories, acceptance criteria, metrics |
| [DESIGN.md](DESIGN.md) | Architecture, DB schema, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model, controls, risk rating |
| [TESTS.md](TESTS.md) | Test plan, coverage gates |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Phases, file map, integration points |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | Post-ship metrics, retro notes |

## Scope Boundaries

**In scope:** Deal CRUD + Kanban, deal stage transitions, deal-to-customer conversion on Won, customer lifecycle stages, customer health score (configurable signals), deal activity timeline, booking → deal auto-create trigger.

**Out of scope:** Revenue forecasting (future), invoice management (future), post-sale sequence automation (Spec 13), analytics (Spec 09).
