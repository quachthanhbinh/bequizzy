# 39 — AI Brain Knowledge Harvester — PRD

**Status:** 🔍 In Review
**Confidence:** 8/10
**Security flag:** 🔴 HIGH
**Last updated:** 2026-05-18 (v1.1 — Comprehensive Knowledge Capture Update)

## Problem Statement

Spec 02's 5-question wizard gets a new workspace to "AI-ready" in 3 minutes, but it can only capture surface-level facts (company name, ICP one-liner, top 3 objections). The deep operational expertise that makes outreach actually convert — the *nuances* of "how we handle finance-led procurement", the *edge cases* in "what to say when a Series B reschedules twice" — lives only in the founder's head. Today there is no tool in RevLooper to extract that tacit knowledge incrementally.

Manual document upload (`POST /v1/brain/documents`) exists but assumes the user can sit down and write a structured doc. Most owners can't. They can, however, *answer questions about their business* for 5–10 minutes when prompted well.

### Evidence
- Spec 02 captures ~500–1500 chars of input per workspace. Mature RAG-driven AI SDRs (per public benchmarks) require 10–50KB of nuanced workspace context to lift reply rates ≥ +25%.
- User behaviour observed in Spec 02 wizard sessions: free-text answers are systematically short (median ~25 words/question). Form fields suppress depth.
- Competitive scan: every AI-SDR competitor either ships static prompts (no per-workspace knowledge) or requires manual doc upload — none uses a conversational harvester.
- **Method diversity gap:** different owners capture knowledge in different ways — some prefer talking it through; others already have unstructured notes to paste; others don't know where to start and need a guided template; none want to manually track which topics the AI already knows. A chat-only interface leaves too many owners underserved.

### Who has this problem
- **Workspace owners (founders, solo operators)** who want better AI output than the wizard can produce.
- **Power users (≥ 7 days in product)** who already saw the value of the AI Brain and want to expand it.
- Not in scope for v1: sales reps / teammates (RBAC for harvester deferred to a later spec).

## Goals
1. A workspace owner can grow their AI Brain by **chatting** rather than writing docs. **The AI acts exclusively as a knowledge extractor — it probes, clarifies, and records. It never answers the owner's questions, offers advice, or generates content outside of synthesising what the owner told it. Every LLM call is paid for to extract knowledge, not to give it.**
2. Knowledge is captured **per-topic per-session** (forced single-topic to maintain quality and reviewability).
3. Output is **previewed as markdown, never auto-committed** — user is always in control of what enters the AI Brain.
4. The harvester can iterate: add more context, AI **rewrites** (does not append) the draft seamlessly.
5. Hard-delete works end-to-end: deleting a session purges the conversation, the committed doc, and its pgvector embeddings.
6. **Knowledge Topic Templates** give owners guided interview tracks for common B2B topics (ICP, objection handling, pricing, brand voice, competitive positioning, sales playbook, product USPs, onboarding process) — no blank-page anxiety; selectable from the "Start Session" modal.
7. **Quick Brain Dump** lets owners submit raw notes, bullet lists, or unstructured text in a single step; AI synthesises immediately without a probing interview — ideal for owners who already know exactly what they want to add.
8. **Reflection & Gap Detection** analyses the workspace's committed AI Brain on demand or on a weekly schedule and surfaces a prioritised list of missing topics — the system proactively tells the owner what knowledge is absent, directly fulfilling the "no information missed" requirement.

## Non-Goals

### v1 Non-Goals
- ❌ Voice / audio input
- ❌ Multi-topic per session (forced single-topic; multi-topic = multi-session)
- ❌ Auto-commit / skip-preview path
- ❌ Multi-user collaborative editing of one session
- ❌ Diff-view UI between draft versions (toggle between versions is enough for MVP)
- ❌ i18n of UI strings (conversation itself follows user language via prompt)
- ❌ Replacement of the Spec 02 wizard (Wizard remains the activation path)
- ❌ Sales-rep / non-owner RBAC (defer to Spec 14 follow-up)
- ❌ Workspace-custom template creation UI (v1 templates are system-defined only)

### Deferred to v2 (designed here, not built in v1)
- ❌ **URL / Link Ingestion** — paste a URL, AI scrapes the page and opens a harvest session around it. Deferred due to SSRF risk requiring sandboxed fetch infrastructure; SSRF design pre-empted in SECURITY.md §T9.
- ❌ **Document Annotation Mode** — upload a PDF/Notion export, AI reads it and probes for tacit knowledge not present in the doc. Deferred to Spec 40.
- ❌ **Knowledge Freshness Reminders** — periodic notifications when committed docs are stale (> N days old). Spec 28 Reflection Loop is the natural host.

## Acceptance Criteria

### Session lifecycle
- [ ] Owner can start a new session from the AI Brain page; required input is **topic name** (1–80 chars).
- [ ] Session enters `active` status; system seeds a welcome turn that acknowledges the topic and asks the first question.
- [ ] Server enforces hard cap of **30 user turns per session** (returns `422 SESSION_TURN_CAP`).
- [ ] Server enforces hard cap of **3 synthesis runs per session** (returns `422 SESSION_SYNTHESIS_CAP`).
- [ ] Server enforces **20 sessions/day/workspace** rate limit (returns `429 RATE_LIMITED`).
- [ ] Owner can click "Synthesize" → session transitions to `draft` with `draft_markdown` populated.
- [ ] Owner can click "Continue chatting" from `draft` → session transitions back to `active` (draft_version preserved).
- [ ] Owner can click "Re-synthesize" from `draft` → new draft produced, `draft_version` increments, previous draft retrievable via `?version=N`.
- [ ] Owner can click "Commit to AI Brain" → session transitions to `committed`, `workspace_knowledge_docs` row created (`doc_type='harvested'`, `source='harvester'`), chunks + embeddings created via existing `chunk_and_embed_document`.
- [ ] Owner can click "Delete" from any state → session transitions to `deleted` (terminal); if was `committed`, the `workspace_knowledge_docs` row + `ai_brain_chunks` rows are **hard-deleted** (CASCADE).
- [ ] Invalid state transitions return `422 INVALID_STATE_TRANSITION` with the current state in the error body.

### Conversation behaviour (enforced by prompt + EDD)
- [ ] **Single-purpose lock (HARD RULE):** The AI is an interviewer, not an advisor. If the owner asks the AI a question (e.g., *"What should my ICP look like?"*, *"What's a good pricing model?"*), the AI must: (1) briefly acknowledge it cannot answer that here, (2) redirect back to the topic, and (3) ask a probing question — it must NOT answer, suggest, or provide any advice. (EDD adversarial pass rate ≥ 95%; see `ADV-REDIRECT-01`.)
- [ ] AI mirrors the user's language (English, Vietnamese, Thai inputs all produce same-language replies).
- [ ] AI asks 1–2 follow-up questions per user turn, never more.
- [ ] AI never invents specifics not present in the conversation (EDD adversarial pass rate ≥ 95%).
- [ ] On re-synthesis, AI **rewrites** the draft to integrate new info — no "Update:" / "Addendum:" sections appended (EDD pass rate ≥ 90%).
- [ ] AI replies stream to the UI via SSE (first byte < 1s p95).

### Multi-tenancy & consent
- [ ] Every session row scoped by `workspace_id` + `user_id`; cross-workspace fetch returns 403 (not 404 — prevents enumeration), mirroring Spec 38.
- [ ] "Scan existing context" step calls `/v1/brain/search` which already enforces workspace_id (no new query path needed).
- [ ] For workspaces with `region IN ('VN','TH','SG')`, the FIRST harvester session creation requires consent: response 412 `CONSENT_REQUIRED` with consent contract; subsequent calls succeed once `consent_log` row exists.

### Credits & billing
- [ ] All harvester operations are **always free** — knowledge capture is never credit-gated regardless of plan or workspace age.
- [ ] `billing-service` is still invoked for each LLM call with `credits: 0` for analytics and audit purposes; it must never return `402 INSUFFICIENT_CREDITS` for any harvester operation.
- [ ] No credit counter is shown in the session UI for harvester operations.

### Hard delete
- [ ] Deleting a `committed` session purges `ai_brain_chunks.embedding_json` rows (via existing `ON DELETE CASCADE` on `doc_id`).
- [ ] Outbox event `harvester.session.deleted` is written atomically with the delete.
- [ ] An admin can verify via `SELECT COUNT(*) FROM ai_brain_chunks WHERE doc_id = $committed_doc_id` → 0 rows.

### Auto-cleanup
- [ ] Daily cron `harvester-draft-cleanup` hard-deletes sessions with `status IN ('active','draft') AND updated_at < now() - INTERVAL '30 days'`.

### Knowledge Topic Templates (v1)
- [ ] `GET /v1/brain/harvester/templates` returns all active system templates ordered by `sort_order`; ≥ 8 templates shipped at launch.
- [ ] `POST /v1/brain/harvester/sessions` accepts optional `template_id`; if supplied, the AI probe system prompt is enriched with the template's `seed_questions` and `system_prompt_fragment`.
- [ ] Template selection is optional — free-form topics (no `template_id`) remain fully supported.
- [ ] Template names and descriptions are visible in the "Start Session" modal.
- [ ] Supplying an unknown `template_id` returns `422 TEMPLATE_NOT_FOUND`.
- [ ] Template-guided sessions go through the identical `chat → synthesize → commit` flow as free-form sessions.

### Quick Brain Dump (v1)
- [ ] Session can be created with `mode='dump'` (default: `mode='chat'`).
- [ ] `POST /v1/brain/harvester/sessions/{id}/dump` accepts `{ content: str }` (1–10,000 chars), immediately transitions session to `draft` with `draft_markdown` populated via SSE-streamed synthesis LLM call; no credits charged.
- [ ] Dump sessions respect `synthesis_count ≤ 3` cap and the same `draft → commit → delete` lifecycle as chat sessions.
- [ ] `POST /v1/brain/harvester/sessions/{id}/turn` on a dump-mode session returns `422 MODE_MISMATCH`.
- [ ] `POST /v1/brain/harvester/sessions/{id}/dump` on a chat-mode session returns `422 MODE_MISMATCH`.
- [ ] Content exceeding 10,000 chars is rejected before any LLM call or credit deduction.
- [ ] UI: "Quick Dump" tab/toggle in the session creation modal; a text area replaces the chat interface for dump-mode sessions.

### Reflection & Gap Detection (v1)
- [ ] `POST /v1/brain/harvester/reflect` analyses committed AI Brain documents for the workspace and returns up to 10 prioritised topic suggestions.
- [ ] Response: `{ suggestions: [{ topic, reasoning, priority: 'high'|'medium'|'low', related_doc_titles }] }`.
- [ ] Reflection is **always free**; no credits are deducted regardless of scan results.
- [ ] AI must not hallucinate coverage — it must only report gaps absent from existing docs (EDD `ADV-REFLECT-01`).
- [ ] `POST /v1/internal/harvester/reflect-all` (cron-only, OIDC) runs reflection for every eligible workspace weekly; writes `harvester.reflection.completed` outbox event → notification-service shows in-app notification.
- [ ] Owner can click a suggestion in the UI → session creation modal pre-fills the suggested topic.

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| % activated workspaces that commit ≥1 harvester doc in first 14d | ≥ 30% | `harvester.session.committed` outbox event |
| Median time from session start → first commit | < 8 min | session trace |
| Re-synthesis rate (proxy for engaged iteration) | ≥ 25% of sessions trigger ≥ 1 re-synth | session metrics |
| Reply-rate lift vs. wizard-only workspaces | +10–15% | Phase 1 A/B cohort |
| SSE first-byte latency p95 | < 1s | Cloud Run latency |
| EDD "no-hallucination" pass rate | ≥ 95% | nightly eval |
| EDD "rewrite-don't-append" pass rate | ≥ 90% | nightly eval |
| Cost per committed session (LLM only) | < $0.06 | LiteLLM accounting |
| Template adoption (% of new sessions started with a template) | ≥ 40% within 30 days of launch | session `template_id` presence |
| Quick Dump adoption (% sessions in `mode='dump'`) | ≥ 15% of new sessions | session `mode` field |
| Reflection scan rate (manual or auto per workspace/month) | ≥ 1 | `harvester.reflection.completed` event |
| Reflection suggestion acted on (new session started within 7 days of suggestion) | ≥ 30% of surfaced suggestions | outbox correlation analytics |

## In-Scope Deliverables
- New table `ai_harvester_sessions` (ai-service-owned; v1.1 adds `mode`, `template_id` columns)
- New table `ai_harvester_topic_templates` (ai-service-owned; 8 system-defined templates seeded at deploy)
- New table `consent_log` (ai-service-owned, minimal v1)
- New service `harvester_session_service.py` (CRUD + state machine + caps; mode + template support)
- New service `harvester_chat_service.py` (probe turn + synthesis + dump synthesis, LiteLLM)
- New service `harvester_template_service.py` (template CRUD + seed-question injection into prompts)
- New service `harvester_reflection_service.py` (AI Brain gap analysis, fast LiteLLM model, outbox event)
- New API router `/v1/brain/harvester/*` (REST + SSE; includes `/templates`, `/dump`, `/reflect`, `/reflect-all`)
- Reuses existing `chunk_and_embed_document` for commit ingestion
- Reuses existing `ai_outbox_events` for domain events
- New frontend route `apps/portal/app/(dashboard)/ai-brain/harvester/[sessionId]/page.tsx`
- New frontend "Drafts" tab + "Templates" panel + reflection suggestion banner on AI Brain page
- New cron `harvester-draft-cleanup` (Cloud Scheduler → ai-service internal endpoint)
- New weekly cron `harvester-reflection-scan` (Cloud Scheduler → `/v1/internal/harvester/reflect-all`)
- Seed data script `services/ai-service/scripts/seed_harvester_templates.py` (8 system templates)
- EDD eval suite under `evals/golden/harvester_*` + `evals/adversarial/harvester_*`
- Feature flag `ai_brain_harvester_enabled` (default OFF)

## Out of Scope (deferred to v2 or later specs)
- Voice / audio input
- URL / Link Ingestion (SSRF pre-design in SECURITY.md §T9; implement in Spec 40)
- Document Annotation Mode — upload doc + Socratic annotation (Spec 40)
- Knowledge Freshness push notifications (Spec 28 Reflection Loop)
- Workspace-custom template creation UI (v1 templates are system-defined only)
- Diff-view UI between draft versions
- Multi-user collaborative sessions
- Non-owner RBAC for harvester (Spec 14)
- Cross-session knowledge graph linking

## Dependencies

| Dep | What we need from it |
|---|---|
| Spec 02 | `chunk_and_embed_document`, `workspace_knowledge_docs`, `ai_brain_chunks`, `ai_outbox_events` |
| Spec 32 (Billing & Credits) | `POST /internal/credits/deduct` (already exists; this spec adds new `reason` values: `harvester_probe`, `harvester_synthesis`) |
| Spec 38 (Advisor Session Mgmt) | Pattern reuse only — session CRUD shape, 100-cap auto-archive logic |
| `workspaces.region` column | Used to gate consent requirement; verify column exists in workspace-service before TASK 1 |

## Test Checklist (PRD-level — see TESTS.md for full strategy)

### Core chat (original)
- [ ] Session created → first welcome turn is in user's language
- [ ] Insufficient credits → state unchanged, no LLM call, 402 returned
- [ ] Hard delete of committed session → chunk count goes to 0
- [ ] Cross-workspace fetch → 403 (not 404)
- [ ] 31st turn rejected with `SESSION_TURN_CAP`
- [ ] SEA workspace first session → 412 `CONSENT_REQUIRED`

### Templates (v1)
- [ ] Template-guided session → AI probe turns incorporate template seed questions
- [ ] Unknown `template_id` → `422 TEMPLATE_NOT_FOUND`
- [ ] `GET /templates` returns ≥ 8 templates ordered by `sort_order`

### Quick Dump (v1)
- [ ] `POST /dump` on chat-mode session → `422 MODE_MISMATCH`
- [ ] `POST /turn` on dump-mode session → `422 MODE_MISMATCH`
- [ ] 10,001-char dump content rejected before LLM call; 0 credits charged
- [ ] Dump deducts 5 credits and transitions session directly to `draft`

### Reflection (v1)
- [ ] Reflect with 0 committed docs → `{ suggestions: [], reason: 'NO_BRAIN_CONTENT' }`, 0 credits charged
- [ ] Reflect returns gaps with `topic`, `reasoning`, `priority` fields
- [ ] EDD `ADV-REFLECT-01`: reflect does NOT claim a well-covered topic is missing

### EDD quality gates
- [ ] No-hallucination pass rate ≥ 95%
- [ ] Rewrite-don't-append pass rate ≥ 90%

## Open Questions
1. **`workspaces.region` column existence** — verify in workspace-service before TASK 1. If absent, this spec adds it (one migration in workspace-service). **Recommendation:** verify during TASK 1; if missing, scope-creep is acceptable since SEA compliance is non-negotiable.
2. **Free trial start trigger** — measured from `workspaces.created_at` or from first activated user signing in? **Recommendation:** `workspaces.created_at` — simpler, harder to game, sufficient for MVP.
3. **`consent_log` ownership** — proposed in `ai-service` for MVP; longer-term may move to a dedicated `compliance-service`. **Recommendation:** ship in `ai-service` now; flag a Spec 20 follow-up for compliance-service extraction.
