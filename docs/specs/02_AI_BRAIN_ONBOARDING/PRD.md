# 02 — AI Brain Onboarding — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM
**Last updated:** 2026-05-04

## Problem Statement
New RevLooper workspaces start with zero context about the business. Without workspace-specific knowledge the AI campaign builder generates generic, low-converting copy that frustrates early users and causes churn in the first week.

### Evidence
- Hypothesis: generic AI copy → reply rates 2–3× lower than personalised copy (validate in Phase 1 A/B)
- Competitive analysis: 11x.ai onboarding takes 20+ minutes; users drop off. Opportunity to win on speed + quality.
- ROADMAP.md M6: "AI Brain onboarding wizard — 5-question chat flow on first login; auto-creates Business Profile doc"

### Who has this problem
Every new workspace. Pain compounds for users who come from a structured sales background and expect the AI to "know the pitch."

## Goals
1. New workspace owner answers ≤ 5 questions → AI Brain populated in < 3 minutes
2. Business Profile RAG document created automatically (no manual doc upload required)
3. Skip path respects user agency; reminder banner persists until first doc exists
4. Wizard re-runnable from settings (iterate as business evolves)
5. AI Brain chunks immediately available to campaign builder (spec 05)

## Non-Goals
- ❌ Multi-document AI Brain management UI (spec 28 / settings deep-dive)
- ❌ File upload / PDF ingestion at wizard stage (v2)
- ❌ Cross-workspace knowledge sharing
- ❌ Real-time streaming wizard response (standard request/response is fine)

## Acceptance Criteria
- [ ] New workspace sees wizard modal before main dashboard (can be dismissed = skip)
- [ ] Wizard has 5 questions: company name + product/service, ICP (ideal customer), value proposition, top 3 objections, tone/style preference
- [ ] Each answer is free-text; AI can ask a clarifying follow-up if answer is very short (<20 chars)
- [ ] On complete: LLM synthesizes a "Business Profile" document with title, body, and 3–5 category tags
- [ ] Document stored in `workspace_knowledge_docs` + chunked into `ai_brain_chunks` + embedded via rag-processor
- [ ] Skip → reminder banner shown on dashboard header until wizard completed OR first doc manually uploaded
- [ ] Wizard re-run from `/settings/brain` overwrites the Business Profile (keeps version history in audit table)
- [ ] Completion credits cost: 2 credits (shown before final submit)
- [ ] If insufficient credits: show upgrade CTA; wizard not submitted
- [ ] AI Brain readiness indicator on dashboard: ✅ Ready / ⚠️ No data / 🔄 Processing
- [ ] EDD quality gate: Business Profile contains all 5 input dimensions

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Wizard completion rate (not skipped) | ≥ 65% within 24h of signup | `brain.wizard.completed` event |
| Time to wizard complete (median) | < 3 minutes | session trace |
| Embedding processing time | < 60s p95 | rag-processor metric |
| Campaign quality lift vs no-brain workspaces | +15% reply rate | A/B cohort (Phase 1) |
| Wizard re-run rate (iterating) | ≥ 20% at 30 days | `brain.wizard.rerun` event |

## In-Scope Deliverables
- Wizard UI (modal, 5 steps + review + submit)
- Wizard API endpoint (`POST /v1/brain/wizard`)
- `onboarding_wizard_state` table (tracks progress, answers, skip status)
- LLM synthesis pipeline (wizard answers → Business Profile text)
- `workspace_knowledge_docs` table + `ai_brain_chunks` population
- rag-processor trigger (event `ai.brain.chunk.created`)
- Reminder banner component
- AI Brain readiness indicator (API + frontend badge)
- Feature flag `ai_brain_wizard_enabled`

## Out of Scope
- PDF/URL ingestion (v2)
- Multi-language wizard (English first; Vietnamese/Thai v2)
- Manual AI Brain editor (separate settings spec)

## Dependencies

| Dep | What we need |
|---|---|
| 01_AUTH_WORKSPACE | `workspace_id`, user auth |
| billing-service | Credit deduction endpoint (`deduct_credits`) |
| rag-processor | Subscribes to `ai.brain.chunk.created`, handles embedding |

## Test Checklist
- [ ] Complete wizard → Business Profile doc created with all 5 dimensions
- [ ] Skip → reminder banner shown
- [ ] Insufficient credits → upgrade CTA, no submission
- [ ] Re-run → old Business Profile versioned, new one becomes active
- [ ] Short answer → clarifying follow-up fires
- [ ] EDD: LLM output quality ≥ 4.0/5.0 on all dimensions

## Open Questions
1. Should the wizard fire again when the workspace is >30 days old and AI Brain is stale? **Recommendation:** no forced re-prompt; let user trigger from settings. Surface a nudge banner at 30 days if no Brain updates.
2. Clarifying follow-up — how many rounds max? **Recommendation:** max 1 follow-up per question to avoid wizard fatigue.
