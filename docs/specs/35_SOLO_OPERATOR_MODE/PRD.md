# 35 — Solo Operator Mode — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Security flag:** 🟡 MEDIUM
**Last updated:** 2026-05-05

## Problem Statement

RevLooper's current campaign execution model requires the operator to stay engaged daily to monitor and nudge sequences forward. For the primary paid persona — the solo recruiter, founder, or insurance agent running outreach at scale — this daily overhead is the main friction that causes churn. They signed up for an autonomous AI sales rep, not a smarter send button.

Two distinct but complementary problems:

**Problem A — Campaign execution requires babysitting.**
The current model (sequence-worker auto-dispatches at scheduled time) already works without human intervention, but there is no formal mode model, no anomaly safety net, and no "Review before send" option for operators who want oversight. Solo operators want either full autonomy (Autopilot) or structured batch review (Review mode) — not a hidden default they didn't consciously choose.

**Problem B — Morning context assembly wastes 15+ minutes daily.**
Solo operators open 4 separate tabs every morning before they know what to work on: Analytics (did my open rates change?), Inbox (did anyone reply overnight?), Campaigns (what's running today?), CRM (any deals stalling?). The mental overhead of aggregating this across an active RevLooper account is the number-one onboarding complaint in the first 30 days.

### Evidence
- User research from the VN solo operator segment: "AI is doing the work but I still have to check on it every day — why?"
- Spec 31 PRD explicitly documents the "what to focus on today" problem; the Daily Ops Brief is the direct UI solution
- Comparable tools (Instantly, Apollo Sequences) all auto-dispatch without approval — users migrating from those tools expect the same behaviour, just with better AI

### Who has this problem
- **All Pro+ users** with active campaigns (Autopilot + Brief)
- **Free-plan users** (Brief teaser — locked cards as upgrade prompt)
- Most acute for: solo recruiters (Persona A), founders doing cold outreach; less relevant for insurance agents (Persona B) who prefer Review mode

---

## Goals
1. Solo operators can set a campaign to Autopilot and never manually trigger sends again
2. Every morning, the operator sees the 5 most important things to act on in < 60 seconds
3. Review mode provides a structured approval queue for operators who want pre-send oversight
4. Autopilot never bypasses suppression checks or daily send limits — safety is non-negotiable

## Non-Goals
- ❌ AI-generated narrative coaching ("Why did your pipeline drop?") — deferred; requires 2 credits and a full LLM call. Phase 2 item.
- ❌ Brief delivery via Zalo or WhatsApp push — deferred to Phase 2 when those channels are live
- ❌ Per-step granularity (different mode per sequence step) — too complex for MVP; cognitive overload
- ❌ Cross-campaign aggregate "Approve All" across multiple campaigns at once — Phase 2 enhancement
- ❌ Brief history / archive (only today's brief in MVP)
- ❌ Team-level roll-up Brief for multi-user workspaces — Phase 3

---

## Feature A — Campaign Execution Mode

### User Stories
- As a solo operator, I can set a campaign to **Autopilot** so that sequence steps dispatch automatically on schedule without daily intervention
- As an operator who wants oversight, I can set a campaign to **Review** so that steps are queued for my batch approval before sending
- As a new user, I can keep a campaign in **Manual** mode so that I control each send explicitly until I'm confident in my content
- As an operator, I am warned before switching a live campaign's execution mode so that I don't accidentally change in-flight behavior
- As an operator, I can see which execution mode each campaign is in from the campaign list

### Acceptance Criteria — Autopilot Mode
- [ ] Campaign has an `execution_mode` field: `autopilot | review | manual` (default: `autopilot`)
- [ ] In Autopilot mode: `sequence-worker` dispatches each step at the scheduled time without any human gate
- [ ] Suppression check is **always** enforced in `outreach-service` regardless of execution mode — this is a non-negotiable invariant
- [ ] Daily send limits (Redis counter) are **always** enforced regardless of execution mode
- [ ] **Anomaly circuit breaker:** if campaign-scoped bounce rate exceeds 5% in a rolling 1-hour window, `sequence-worker` auto-pauses the campaign (`status = 'paused'`) and emits `campaign.auto_paused` event → Brief alert fires
- [ ] Mode is shown as a badge on Campaign List and Campaign Detail header

### Acceptance Criteria — Review Mode
- [ ] In Review mode: `sequence-worker` inserts step into `step_approval_queue` instead of dispatching
- [ ] In-app notification fires when new steps are queued: "X steps ready for your review in [Campaign Name]"
- [ ] Approval queue UI shows: lead email, sequence step number, preview subject line, preview body snippet (300 chars), scheduled time, expiry countdown
- [ ] Operator can approve or reject individual rows or batch-select + bulk approve
- [ ] Bulk "Approve All" is chunked in batches of 500; progress shown ("Approving 450 of 1,200…")
- [ ] Approved steps are dispatched via the same Cloud Tasks → `sequence-worker` → `outreach-service` path as Autopilot — no separate code path
- [ ] Rejected steps skip to the next sequence step for that lead (not a permanent block)
- [ ] Queued rows expire after 48 hours (configurable via `campaigns.settings.copilot_step_expiry_hours`); expired rows set to `status='expired'` and `campaign_lead.next_step_at` is reset
- [ ] Step preview snapshot taken at queue time; if the step template is edited after queuing, a "content changed — re-preview" flag appears on the queued row

### Acceptance Criteria — Execution Mode Management
- [ ] Execution mode selectable in campaign wizard (Launch step, before audience assignment) AND in Campaign Settings post-launch
- [ ] Changing execution mode on an `active` campaign requires pausing the campaign first (enforced in service layer; UI shows confirmation)
- [ ] Execution mode change is restricted to `owner` and `admin` roles only
- [ ] Every mode change is written to `audit_log`
- [ ] Pre-launch credit estimate shown when Autopilot is enabled: "This campaign is estimated to send ~N emails this week based on enrolled leads"

### Plan Gating
| Mode | Free | Pro | Business | Agency |
|---|---|---|---|---|
| Manual | ✅ | ✅ | ✅ | ✅ |
| Autopilot | ❌ | ✅ | ✅ | ✅ |
| Review (with approval queue UI) | ❌ | ✅ | ✅ | ✅ |

Feature flag: `campaign_execution_modes` (billing-service)

---

## Feature B — AI Daily Ops Brief

### User Stories
- As a solo operator, I see a "Start Your Day" brief every morning on first dashboard load so that I know exactly what needs attention without checking multiple tabs
- As an operator, each Brief card has a 1-click action so that I can act on it without navigating away
- As an operator using Review mode, I can batch-approve today's queued steps directly from the Brief
- As a Free-plan user, I see a teaser of locked Brief cards so that I understand the value before upgrading

### Brief Card Definitions (in priority order)
| # | Card | Data Source | 1-Click Action | Plan |
|---|---|---|---|---|
| 1 | **Replies overnight** — unread messages received since last login | `outreach-service` inbox unread count | Open Inbox | Pro+ |
| 2 | **Hot leads, no follow-up >24 h** — leads scored hot with no outbound message in 24h | `lead-service` scores + `outreach-service` last-contact | Draft AI follow-up | Pro+ |
| 3 | **Steps due today** — sequence steps scheduled for today (Autopilot: show count; Review: show queue link) | `campaign_leads.next_step_at` + `step_approval_queue` | View campaign / Approve batch | Pro+ |
| 4 | **Autopilot anomaly** — any campaign auto-paused since last Brief | `campaign.auto_paused` events | View campaign + resume | Pro+ |
| 5 | **Credit balance warning** — credits < 20% of monthly quota | `billing-service` | Top up / Upgrade | All plans |
| 6 | **Stalled deals** — deals in `replied` stage > 7 days | `crm-service` | Open CRM → push to meeting | Business+ |
| 7 | **Pipeline velocity** — WoW deal value change | `pipeline_snapshots` (Spec 30) | Open CRM Kanban | Business+ |

Cards 6–7 are shown only if Spec 30 (Revenue Signals) data is available; otherwise hidden (not shown as locked). Cards 1–5 are the MVP core.

### Acceptance Criteria — Daily Ops Brief
- [ ] Brief is generated by Cloud Scheduler at **06:00 workspace timezone** (UTC cron: varies by workspace; implemented as timezone-aware job fan-out)
- [ ] Brief is served from cache (`advisor_notifications` row + Redis flag) — no real-time recalculation on each dashboard load
- [ ] Brief is displayed as the dashboard landing state on **first page load of the day** (dismissed after viewing; not shown again until next morning unless re-opened)
- [ ] Brief panel is accessible at any time via "Today" pill in sidebar nav showing unread action count
- [ ] Each card shows: count, 2–3 preview items (truncated), 1-click action button
- [ ] Empty state (no active campaigns): show campaign launch CTA — Brief becomes an activation prompt
- [ ] Brief is **zero credits** for structured data cards (Cards 1–7 above)
- [ ] Brief re-computed immediately if: a campaign is auto-paused, or credit balance drops below warning threshold (event-driven invalidation via Pub/Sub)
- [ ] **Free-plan teaser:** Show locked versions of Cards 1–3 with counts but blurred content + "Upgrade to Pro to unlock" CTA
- [ ] Mobile-responsive at 375px min-width; swipeable card layout on mobile

### Plan Gating
| Brief | Free | Pro | Business | Agency |
|---|---|---|---|---|
| Cards 1–5 | Teaser (locked) | ✅ | ✅ | ✅ |
| Cards 6–7 (pipeline) | ❌ | ❌ | ✅ | ✅ |

Feature flag: `daily_ops_brief` (billing-service)

---

## Acceptance Criteria: Combined

- [ ] AC-01: Suppression check enforced in `outreach-service` in ALL execution modes (Autopilot, Review, Manual)
- [ ] AC-02: Daily send Redis counter enforced in ALL modes before any dispatch
- [ ] AC-03: Execution mode change rejected by service layer if `campaign.status = 'active'`
- [ ] AC-04: Execution mode change requires `role IN ('owner', 'admin')` — member-role users receive 403
- [ ] AC-05: Autopilot bounce circuit breaker fires at 5% bounce rate (rolling 1h) → campaign paused + Brief alert
- [ ] AC-06: step_approval_queue rows are idempotent — same `(campaign_lead_id, step_position)` cannot produce two queued rows
- [ ] AC-07: Daily Ops Brief Redis cache key includes `workspace_id` — cross-workspace data leakage impossible
- [ ] AC-08: Bulk approval batch processes 500 rows, checks Redis counter after each batch, stops if daily limit reached

---

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Autopilot adoption (Pro+ campaigns) | ≥ 60% of active campaigns set to Autopilot within 30 days of launch | `campaign.execution_mode` analytics event |
| Daily Ops Brief open rate | ≥ 50% of Pro+ daily-active users open Brief in first 2 weeks | `brief.opened` event |
| Brief → action conversion | ≥ 30% of Brief opens result in at least one 1-click action | `brief.action_clicked` event |
| Churn reduction (30-day) | 5 pp improvement in Pro 30-day retention vs. baseline | Billing cohort analysis |
| Review mode approval rate | ≥ 70% of queued steps approved (not rejected/expired) | `step_approval_queue` aggregate |

---

## Dependencies

| Dep | What we need from it |
|---|---|
| 06_SEQUENCE_BUILDER | Cloud Tasks + sequence-worker step execution path |
| 07_EMAIL_OUTREACH | `outreach-service /internal/dispatch`; suppression check invariant |
| 09_ANALYTICS | `campaign_stats` for brief assembly; bounce rate data for circuit breaker |
| 11_INBOX | Inbox unread count for Brief Card 1 |
| 29_LEAD_SCORING | Lead score for Brief Card 2 (hot leads) |
| 32_BILLING | Credit balance for Brief Card 5; feature gate enforcement |
| 33_FEATURE_GATES | `campaign_execution_modes` + `daily_ops_brief` flags |

---

## Open Questions
1. **Default execution_mode for new campaigns** — Set to `autopilot` (preserves existing auto-dispatch behavior and sets user expectation correctly) vs `manual` (safer for new users). **Recommendation:** `autopilot` for Pro+, `manual` for Free. Handled at campaign creation in service layer.
2. **Bounce circuit breaker threshold** — 5% (rolling 1h) is a reasonable starting point; make it configurable in `campaigns.settings.bounce_pause_threshold` so advanced users can tune it. **Action:** Document in DESIGN.md.
3. **Brief for multi-user workspaces** — Phase 1 Brief is per-user (scoped to the JWT user, not workspace-wide). Phase 3 can add team-level aggregate views. **Action:** Ensure `workspace_id + user_id` cache key in Phase 1.
