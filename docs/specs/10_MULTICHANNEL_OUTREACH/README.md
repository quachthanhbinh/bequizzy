# Spec 10 — Multichannel Outreach

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 7 / 10 |
| **Security** | 🔴 HIGH |
| **Phase** | P2 |
| **Wave** | 3 |
| **Track** | C — Inbound Growth |
| **Depends on** | 01 (Auth), 03 (Leads), 06 (Sequence) |
| **Blocks** | 11 (Unified Inbox) |
| **Owning services** | `outreach-service` |
| **Last updated** | 2025-01-01 |

## One-liner

LinkedIn connect/message steps and SMS (Twilio global + ESMS.vn Vietnam) as first-class sequence step types, with channel-specific rate limits, suppression enforcement, and PDPA-compliant consent gating for Vietnam.

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

**In scope:** LinkedIn connect + message via browser extension bridge, SMS via Twilio (global) and ESMS.vn (VN), channel credential management, per-channel rate limits, suppression enforcement, consent gating (VN/TH/SG).

**Out of scope:** WhatsApp Business API (future), Zalo (behind feature flag), email (Spec 07), sequence execution engine (Spec 06).
