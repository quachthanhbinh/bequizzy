# 28 — AI Brain Reflection Loop — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM
**Last updated:** 2026-05-04

## Problem Statement

RevLooper's **AI Brain** (RAG over workspace-specific knowledge) is currently human-fed. Workspace owners onboard documents, ICPs, value props, objection handlers — and that knowledge stays static unless they manually update it. Meanwhile, the AI sales rep generates thousands of outbound messages and processes hundreds of replies per workspace per month. **Every reply is a learning signal that we discard.**

### Evidence
- Onboarding telemetry (assumption — validate with PM): 60%+ of workspaces never update their AI Brain after week 2
- Reply-rate variance across workspaces: 4× spread, suggesting some prompt/persona patterns work and others don't — but the system never notices
- Competitive scan: 11x.ai, Regie, Lavender all ship static prompts. None close the loop. **Strong differentiator.**
- Hermes Agent's "self-improving skills" pattern proves the loop UX works at the agent layer

### Who has this problem
Every paying workspace, but the pain compounds for higher-volume customers (worse marginal AI quality vs. competitors with human SDRs).

## Goals

1. After each campaign batch (or weekly cron), the AI reflects on what worked / what didn't
2. The AI **proposes** new AI Brain chunks (lessons, refined personas, updated objection handlers)
3. User reviews and approves with one click; accepted chunks become canonical RAG context
4. Knowledge compounds week over week → measurable lift in reply rates after 4+ weeks of accepted proposals

## Non-Goals

- ❌ Auto-applying lessons without user approval (v1 is human-in-the-loop)
- ❌ Cross-workspace meta-learning (privacy implications need a dedicated spec)
- ❌ Auto-tuning prompts from rejection reasons (v2)
- ❌ Real-time reflection (weekly cadence is sufficient for MVP)

## Acceptance Criteria

- [ ] Workspace owner can trigger a manual reflection from the AI Brain settings page
- [ ] Weekly scheduled reflection runs automatically when feature flag is on
- [ ] Workspaces with <10 replies in the window skip reflection silently (no failure notification)
- [ ] Generated proposals appear in `/dashboard/brain/proposals` grouped by category
- [ ] Each proposal shows: title, rationale, confidence score, supporting evidence (anonymized reply IDs)
- [ ] User can Accept / Edit-then-Accept / Reject any proposal
- [ ] Accepted proposals become canonical AI Brain chunks within 60 seconds (embedding + index)
- [ ] Rejected proposals stay rejected (don't re-propose for 30 days)
- [ ] Pending proposals expire after 30 days
- [ ] In-app notification fires when N≥1 proposals are ready
- [ ] Insufficient credits → reflection fails gracefully + credit-purchase CTA
- [ ] Settings panel: toggle auto-reflection on/off, choose cadence (weekly/biweekly/manual)

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Proposal accept rate | ≥ 30% | analytics-service event `brain.proposal.accepted` |
| Workspaces with ≥1 accepted proposal in 30 days | ≥ 50% of beta workspaces | dashboard cohort query |
| Reply-rate lift on campaigns sent after accepting ≥3 proposals | +10% within 4 weeks | A/B between accepted-cohort vs control |
| Notification opt-out rate | < 20% | settings telemetry |
| LLM cost per workspace per month | ≤ $0.05 | finops dashboard |

## In-Scope Deliverables

- New tables `brain_proposals` + `reflection_runs` in `ai-service`
- Modification to existing `ai_brain_chunks` (add `source` + `source_proposal_id`)
- Cloud Scheduler config + 7 hash buckets
- 5 internal API endpoints (run/list/get/accept/reject)
- Reflection prompt template (versioned)
- PII stripper (names, emails, phones — including Vietnamese name patterns and +84 phone format)
- Frontend: proposals dashboard + settings panel
- In-app notification template
- EDD eval suite (5 RevLooper-specific adversarial cases)
- Feature flag `ai_brain_reflection_enabled`

## Out of Scope (deferred to follow-ups)

- Email digest of pending proposals (Phase 4 if engagement data supports it)
- Multi-workspace meta-learning
- Auto-prompt-tuning from rejection reasons
- Reflection on Vietnamese / Thai replies — needs dedicated multilingual eval set first

## Dependencies

| Dep | What we need from it |
|---|---|
| 02_AI_BRAIN_ONBOARDING | `ai_brain_chunks` table must exist; embedding pipeline functional |
| 07_EMAIL_OUTREACH_DELIVERABILITY | `outbound_messages` table with `responded_at` |
| 11_UNIFIED_INBOX_AI_REPLY | `replies` table with intent classifier scores |
| 25_FINOPS_COST_CONTROL | Credits balance API in billing-service |
| 23_FEATURE_FLAGS_ROLLOUT | Per-workspace feature flag infrastructure |

## Test Checklist (PRD level — see `TESTS.md` for full strategy)

- [ ] Owner triggers manual reflection → sees proposals
- [ ] Skip when <10 replies in window
- [ ] Insufficient credits handled
- [ ] Accept proposal → chunk appears in AI Brain
- [ ] Reject proposal → stays rejected for 30 days
- [ ] Expiry sweep removes pending proposals after 30 days
- [ ] Cross-workspace isolation: workspace A's reflection never references workspace B data

## Open Questions

1. Email digest cadence vs in-app only? **Recommendation:** in-app only for MVP, evaluate email in Phase 4
2. Multi-language reply handling? **Action:** PM to provide 30 multilingual reply samples for golden dataset before Phase 2
3. Inter-workspace pattern detection? **Out of scope for v1.**
4. Auto-prompt-tuning from rejections? **Out of scope for v1.**
