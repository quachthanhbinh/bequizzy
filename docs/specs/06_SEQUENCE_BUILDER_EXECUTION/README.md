# Spec 06 — Sequence Builder & Execution

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 8 / 10 |
| **Security** | 🔴 HIGH |
| **Phase** | P1 |
| **Wave** | 2 |
| **Track** | A — Core Platform |
| **Depends on** | 01 (Auth), 03 (Leads), 05 (Campaign) |
| **Blocks** | 07 (Email), 08 (Booking), 10 (Multichannel), 09 (Analytics) |
| **Owning services** | `campaign-service` (builder), `sequence-worker` (GKE execution) |
| **Last updated** | 2025-01-01 |

## One-liner

Visual drag-and-drop sequence step builder with a GKE-based state-machine execution engine that processes enrollments, enforces suppression checks before every step, and handles unsubscribes in real-time.

## Files

| File | Purpose |
|---|---|
| [README.md](README.md) | This file — status, deps, one-liner |
| [PRD.md](PRD.md) | User stories, acceptance criteria, metrics |
| [DESIGN.md](DESIGN.md) | Architecture, DB schema, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model, controls, risk rating |
| [TESTS.md](TESTS.md) | Test plan, coverage gates |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Phases, file map, integration points |
| [TASKS.md](TASKS.md) | TDD task list (≤15 tasks, RED-first) |
| [RESULT.md](RESULT.md) | Post-ship metrics, retro notes |

## Scope Boundaries

**In scope:** Sequence CRUD, step types (email/wait/condition/A-B split/LinkedIn/SMS), enrollment lifecycle state machine, execution engine (sequence-worker), suppression enforcement, unsubscribe handling, step scheduling via Cloud Tasks.

**Out of scope:** Actual email sending (Spec 07), LinkedIn API integration (Spec 10), SMS sending (Spec 10), analytics (Spec 09), A/B statistical significance (Spec 09).
