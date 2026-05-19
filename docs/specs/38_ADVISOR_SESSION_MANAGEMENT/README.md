# Spec 38 — AI Feature Enhancements: Advisor Session Management + AI Brain Content Management

**Status:** 📝 In Review
**Confidence:** 8/10 (CPO 8 / CTO 8 — converged after 2 rounds)
**Track:** B (AI / Intelligence)
**Wave:** 2
**Security flag:** 🟡 MEDIUM
**Services affected:** `ai-service`, `workspace-service`, `apps/portal`
**Amends:** Spec 31 (AI Advisor §Non-Goals: "full history in Phase 3"), Spec 37 (LangGraph Orchestration — checkpointer configuration), Spec 02 (AI Brain Onboarding §Non-Goals: "Multi-document AI Brain management UI")
**Author:** CPO+CTO debate (2026-05-14)

---

## One-Line Summary

**Part A:** Persist AI Advisor conversation history across browser sessions and let users manage multiple named chat sessions via a sidebar switcher.

**Part B:** Let users review and modify their AI Brain wizard answers in-place, and view/download/edit/re-upload individual knowledge documents — without re-running setup from scratch.

---

## Problems

**Part A — Advisor Sessions:**
The AI Advisor (`POST /v1/advisor/chat`) currently:
1. **Loses all conversation history when the tab is closed** — messages live only in React `useState`, never durably written to the database.
2. **Has no session management** — users can only have one "current" session; there's no way to return to a previous conversation thread.

**Part B — AI Brain Content Management:**
The AI Brain currently:
1. **Wizard answers are write-only** — users can re-run the wizard from scratch but cannot see or partially update their existing answers. Any small correction requires re-answering all 4 steps.
2. **Uploaded documents are opaque** — the document list shows only title and type; there is no way to view, download, or edit the content of an existing document.

---

## Dependencies

| Dependency | Status |
|---|---|
| Spec 31 — AI Advisor | ✅ Shipped |
| Spec 37 — LangGraph AI Orchestration | ✅ Shipped |
| Spec 02 — AI Brain Onboarding | ✅ Shipped |
| `ai_advisor_sessions` table | ✅ Exists (schema addition needed) |
| `AsyncPostgresSaver` checkpointer | ✅ Code exists (feature-flag removal needed) |
| `workspace-service` wizard state endpoints (`GET/PATCH /v1/onboarding/wizard`) | ✅ Exists |
| `workspace_knowledge_docs` table + `content` TEXT column | ✅ Exists |
| `billing-service` credit deduction | ✅ Available |
| `get_current_user` dependency | ✅ Available in ai-service |

---

## Files in this Spec

| File | Contents |
|---|---|
| [README.md](README.md) | This file — summary, status, dependencies |
| [PRD.md](PRD.md) | Problem, acceptance criteria, in/out of scope, success metrics |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API contract, sequence diagrams, debate summary |
| [SECURITY.md](SECURITY.md) | Threat model, OWASP walkthrough, workspace isolation, RLS |
| [TESTS.md](TESTS.md) | Unit / integration / E2E / EDD test strategy |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Rollout plan, feature flags, monitoring, migration sequence |
| [TASKS.md](TASKS.md) | TDD task-by-task plan (RED → GREEN → Commit) |
| [RESULT.md](RESULT.md) | Post-ship placeholder |
