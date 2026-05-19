# 35 — Solo Operator Mode

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM (execution mode change affects live send pipeline; approval queue CSRF/replay; ops brief cross-service data isolation)
**Priority:** P1
**Parallel Track:** A (Outreach Engine) + B (AI / Intelligence)
**Depends on:** 01 (Auth), 06 (Sequence Builder), 07 (Email Outreach), 09 (Analytics), 11 (Inbox), 29 (Lead Scoring), 32 (Billing/Credits)
**Blocks:** 31 (AI Advisor — brief tool functions are extracted here first)
**Owning service:** campaign-service (execution mode + approval queue), ai-service (daily brief), sequence-worker (dispatch fork)

## One-line summary
Give solo operators a "set and forget" Autopilot mode that runs campaigns without daily approval, paired with an AI Daily Ops Brief that surfaces the 5 most important things to act on each morning — turning RevLooper into a one-person company operating system.

## Why it matters
- The primary paid persona (solo recruiter, founder) churn reason is daily operational friction: they have to babysit campaigns that should run themselves
- A solo operator currently needs to check 4 tabs (Analytics, Inbox, Campaign, CRM) every morning before knowing what to do — the Brief collapses this to one screen
- E-commerce and B2B solo operators in SEA explicitly described in user research: "One-Man Company" workflow where AI handles execution bandwidth
- Without Autopilot, RevLooper is a smarter CRM — *with* Autopilot it is an autonomous sales rep
- Daily Ops Brief creates a daily return-visit habit — the strongest churn-prevention signal in SaaS

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | User stories, acceptance criteria, brief card definitions, plan gating |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API contract, events, debate summary |
| [SECURITY.md](SECURITY.md) | Threat model, suppression invariant, replay protection, data isolation |
| [TESTS.md](TESTS.md) | Unit / integration / E2E coverage targets and critical invariant tests |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | 3-phase rollout, file map, feature flags, risks |
| [TASKS.md](TASKS.md) | 15 TDD tasks (RED-first) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Debate Summary
Single-round CPO↔CTO debate. CPO 8/10, CTO 7/10 → gap = 1 → **converged Round 1**.

**Resolved tensions:**
- Naming: "Copilot" renamed to "Review" (avoids Microsoft trademark confusion; plain-English for SEA)
- Review/approval queue UI: data model built now (Phase 1); batch approval UI shipped Phase 2
- Daily Ops Brief: zero LLM credits by default (structured assembly only); optional 2-credit narrative summary deferred
- Spec 31 dependency: Brief tool functions extracted as standalone `ai-service` service-layer functions, not gated on Spec 31 shipping
- `execution_mode DEFAULT 'autopilot'`: preserves current sequence-worker auto-dispatch behavior for existing campaigns
- Bulk "Approve All" must be paginated batch loop of 500, not a single UPDATE — enforced in service layer

## ADR Summary
| Decision | Choice | Rationale |
|---|---|---|
| Execution mode storage | Dedicated `TEXT` column on `campaigns`, not `settings` JSONB | `sequence-worker` reads this on every step; JSONB extraction in hot path wastes CPU and is non-indexable |
| Approval queue model | New `step_approval_queue` table (campaign-service), same lifecycle as `linkedin_job_queue` | Existing precedent; clear status machine; prevents double-dispatch via atomic `dispatching` UPDATE |
| Daily Ops Brief storage | Reuses `advisor_notifications` with `trigger_type='daily_ops_brief'` | No new table; Brief is the morning digest of Spec 31 signals — same source of truth |
| Suppression check | Always in `outreach-service /internal/dispatch`, regardless of mode | Cannot be bypassed; suppression is checked at dispatch time not queue time |
| execution_mode cache | Redis `campaign:exec_mode:{campaign_id}` TTL 5 min; invalidated via outbox event | Avoids DB join on every step in hot path; 5-min stale window acceptable for mode changes |

## Pointers
- Related specs: 06 (Sequence Builder — step execution flow), 07 (Email Outreach — suppression), 09 (Analytics — bounce rate data), 11 (Inbox — overnight replies), 31 (AI Advisor — shared tool functions), 32 (Billing — credits), 33 (Feature Gates)
- Skills: `spec-driven-development`, `tdd-workflow`, `verification-loop`
- Runbook: `docs/runbooks/solo-operator-mode.md` (post-ship)
