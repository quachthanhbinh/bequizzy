# Spec 11 — Unified Inbox & AI Reply

| Field | Value |
|---|---|
| **Status** | Draft |
| **Confidence** | 8 / 10 |
| **Security** | 🟡 MEDIUM |
| **Phase** | P2 |
| **Wave** | 3 |
| **Track** | B — AI Layer |
| **Depends on** | 01 (Auth), 07 (Email), 02 (AI Brain) |
| **Blocks** | — |
| **Owning services** | `customer-service` (inbox), `ai-service` (reply draft) |
| **Last updated** | 2025-01-01 |

## One-liner

All inbound replies across channels in one thread view — AI classifies intent (interested/not-interested/OOO/question/meeting-request) and drafts a contextual reply using Brain; one-click send or human edit.

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

**In scope:** Unified inbox (email replies, future: LinkedIn/SMS), thread view, AI intent classification (5 classes), AI draft reply (1 credit), one-click send, lead activity update, pause enrollment on reply.

**Out of scope:** LinkedIn inbox messages (Spec 10 prerequisite), SMS two-way (Spec 10), full CRM conversation history (Spec 12), analytics (Spec 09).
