# Spec 08 — Meeting Booking

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 7 / 10 |
| **Security** | 🟡 MEDIUM |
| **Phase** | P1 |
| **Wave** | 2 |
| **Track** | C — Inbound Growth |
| **Depends on** | 01 (Auth), 06 (Sequence) |
| **Blocks** | 09 (Analytics), 12 (CRM) |
| **Owning services** | `booking-service` |
| **Last updated** | 2025-01-01 |

## One-liner

Integrate Cal.com for meeting scheduling — round-robin assignment, availability rules, booking confirmation emails, and booking links usable in sequence steps and email signatures.

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

**In scope:** Cal.com OAuth integration, meeting type CRUD, availability rules, booking webhook consumer, booking confirmation emails (via notification-service), round-robin assignment, booking link generation, CRM deal creation trigger (event).

**Out of scope:** Native calendar UI (use Cal.com embed), video conferencing setup (Zoom/Google Meet handled by Cal.com), analytics (Spec 09), CRM pipeline management (Spec 12).
