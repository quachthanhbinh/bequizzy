# 31 — AI Advisor — PRD

**Status:** 📝 Draft
**Confidence:** 8/10
**Last updated:** 2025-05-05

## Problem Statement

RevLooper users are running campaigns, managing leads, and tracking deals — but the system never tells them what to do next. A solo founder checking RevLooper at 9am has to mentally aggregate: open rates, reply backlog, hot leads, pipeline health, and AI Brain state — before deciding what to work on.

The AI Advisor eliminates this cognitive load by proactively surfacing the right action at the right moment, and answering any sales question in plain language.

### Evidence
- "I know my data is in RevLooper but I still have to go look for what matters" — user interview (Jan 2025)
- Competitors: HubSpot has "CRM Advisor" but it's generic suggestions divorced from actual campaign data; 11x.ai is fully autonomous with no human in the loop
- The AI Advisor is listed in PRD §9.3 and is referenced as a consumer in specs 29, 30, 28 — it is blocked on those specs

### Who has this problem
All plan tiers (notifications on all plans; NLQ chat on Pro+).

## Goals
1. Proactive notifications surface the right action ≤ 60 seconds after a triggering event
2. NLQ chat answers campaign/lead/pipeline questions in ≤ 5 seconds using workspace data + RAG
3. Every notification includes a 1-click action so users never have to navigate manually

## Non-Goals
- ❌ Autonomous execution (Advisor recommends; user approves — no auto-send in Phase 2)
- ❌ Persistent chat history across sessions (session memory only in Phase 2; full history in Phase 3)
- ❌ Advisor answering questions outside RevLooper domain (no general knowledge Q&A)

## Acceptance Criteria

### Proactive Notifications
- [ ] In-app badge (bell icon) + optional email notification for each trigger condition
- [ ] Notification shows: trigger reason, lead/campaign name, recommended action, 1-click button
- [ ] User can configure notification preferences (in-app only / email / both / off) per trigger type
- [ ] Notification marked as read/dismissed; dismissed notifications not repeated for 24h

### Trigger Conditions (Phase 2)
| Trigger | Condition | 1-click Action |
|---|---|---|
| Hot lead | Lead transitions to Hot (spec 29) | "Draft follow-up" |
| Stalled hot lead | Hot lead: no outreach in 24h | "Draft follow-up" |
| Stalling replies | 5+ leads in Replied > 7 days | "Draft meeting push batch" |
| Pipeline drop | Pipeline drops > 20% WoW (spec 30) | "Launch new campaign batch" |
| High bounce rate | Workspace bounce rate > 3% | "View domain health" |
| Meeting booked | Meeting confirmed | "View pre-meeting brief" |
| AI Brain updated | New document uploaded | "Refresh campaign emails" |

### NLQ Chat Panel
- [ ] Floating button (bottom-right) accessible on all dashboard pages
- [ ] Chat panel opens as a drawer; does not block page content
- [ ] Chat context: read access to workspace analytics, lead scores, pipeline data, inbox messages, workspace RAG
- [ ] AI Advisor uses GPT-4o-mini for fast responses (< 5s); escalates to Claude 3.5 Sonnet for complex multi-step queries
- [ ] Supported query types (examples from PRD §9.3):
  - "Which campaign is performing best this month?"
  - "Write a follow-up for leads who opened but didn't reply this week"
  - "What should I focus on today to hit my meeting target?"
  - "How many deals do I need to close to hit $10K this month?"
  - "Rewrite my step 2 email using my brand voice guide"
- [ ] Advisor responses include source attribution: "Based on your Recruitment campaign analytics…"
- [ ] Session context maintained within single chat session (not persisted across sessions in Phase 2)
- [ ] Free plan: 5 NLQ queries/day; Pro+: unlimited

## Success Metrics

| Metric | Target | Where measured |
|---|---|---|
| Notification CTR (any trigger) | ≥ 25% | `advisor_notification_clicked / advisor_notification_sent` |
| Hot lead same-day follow-up rate | ≥ 60% | `lead_scored_hot → outbound_sent` within 24h |
| NLQ chat daily active users (Pro+) | ≥ 20% of Pro+ users | `advisor_chat_opened` |
| NLQ response quality score | ≥ 4.0/5.0 | User thumbs-up/down, weekly EDD eval |

## In-Scope Deliverables
- `advisor_notifications` table (trigger log, read/dismissed state)
- Pub/Sub subscriber for trigger events (hot_lead, pipeline_dropped, bounce_threshold)
- `POST /advisor/chat` endpoint (ai-service)
- `GET /advisor/notifications` + `PATCH /advisor/notifications/{id}` endpoints
- AI Advisor chat panel UI (floating drawer)
- Notification bell UI with badge count
- Pre-meeting brief generation (triggered on `meeting_booked`)

## Out of Scope
- Autonomous action execution
- Persistent cross-session chat history (Phase 3)
- Custom trigger configuration by user (Phase 3)

## Dependencies

| Dep | What we need from it |
|---|---|
| 29_AI_LEAD_SCORING | `lead_scored_hot` event |
| 30_REVENUE_SIGNALS | `pipeline_dropped` event |
| 07_EMAIL_OUTREACH | Bounce rate monitoring event |
| 08_MEETING_BOOKING | `meeting_booked` event |
| 02_AI_BRAIN | Workspace RAG for context injection |
| 09_ANALYTICS | Campaign analytics read access |
| 12_CRM | Pipeline and deal read access |
| 11_UNIFIED_INBOX | Inbox message read access |

## Open Questions
1. Should pre-meeting brief be auto-generated or user-initiated? **Recommendation:** auto-generated as a notification with "View brief" CTA; brief is available immediately after booking.
2. NLQ query scope — should Advisor be able to draft and send emails directly? **Recommendation:** draft only in Phase 2; user confirms before send.
