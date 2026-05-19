# Spec 07 — Email Outreach & Deliverability

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 8 / 10 |
| **Security** | 🔴 HIGH |
| **Phase** | P1 |
| **Wave** | 2 |
| **Track** | A — Core Platform |
| **Depends on** | 01 (Auth), 03 (Leads), 06 (Sequence) |
| **Blocks** | 09 (Analytics), 11 (Unified Inbox) |
| **Owning services** | `outreach-service` |
| **Last updated** | 2025-01-01 |

## One-liner

Connect ESP accounts (SendGrid/Postmark/SES/SMTP), manage warmup schedules, enforce bounce/complaint suppression, and track deliverability health per mailbox.

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

**In scope:** Mailbox connection (ESP credentials), warmup schedules, DKIM/DMARC/SPF setup guidance, send/bounce/complaint/open/click event tracking, suppression enforcement, deliverability health score per mailbox, daily send limits.

**Out of scope:** Sequence scheduling (Spec 06), analytics dashboards (Spec 09), unified inbox view (Spec 11), SMS/LinkedIn channels (Spec 10).
