# 31 — AI Advisor — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2025-05-05

## Phase Breakdown

### Phase 1 — Trigger notifications (Week 1–2)
- DB migration: `advisor_notifications`, `advisor_chat_sessions`
- `ai-service/app/subscribers/advisor_trigger_handler.py` — Pub/Sub subscriber
- Debounce logic for hot-lead batching (2-minute window per workspace)
- `GET /advisor/notifications`, `PATCH /advisor/notifications/{id}`
- Notification bell UI component + drawer (frontend)

### Phase 2 — NLQ Chat panel (Week 2–3)
- Tool definitions in `ai-service/app/advisor/tools.py`
- `ai-service/app/advisor/chat.py` — LiteLLM function calling loop
- Prompt injection defence (XML tagging, system prompt)
- `POST /advisor/chat` endpoint
- Frontend chat panel (AdvisorChatPanel.tsx, floating drawer)
- Credit deduction integration (billing-service call)

### Phase 3 — Pre-meeting brief (Week 3)
- `meeting_booked` subscriber auto-generates brief
- Brief stored in `advisor_notifications` with action_url → meeting detail page
- Meeting brief prompt uses workspace RAG + lead history

## File Map
```
services/ai-service/
  app/
    subscribers/
      advisor_trigger_handler.py
    advisor/
      tools.py              # Tool registry + implementations
      chat.py               # LLM function calling loop
      brief_generator.py    # Pre-meeting brief
    routers/
      advisor.py            # GET /notifications, PATCH, POST /chat
    schemas/
      advisor.py

frontend/
  components/advisor/
    NotificationBell.tsx
    NotificationDrawer.tsx
    AdvisorChatPanel.tsx    # Floating drawer
    ChatMessage.tsx
  hooks/
    useAdvisorNotifications.ts
    useAdvisorChat.ts
```

## Feature Flags
- `ai_advisor_notifications` — workspace-level, default on for Phase 2
- `ai_advisor_chat` — plan gate: Pro+ only
- `ai_advisor_chat_free_quota` — 5 queries/day for Free plan

## Risks
| Risk | Mitigation |
|---|---|
| Prompt injection from inbox content | XML tagging + system prompt instruction (see SECURITY.md) |
| LLM latency > 5s on complex multi-tool queries | Tool call cap 5; timeout 8s; show "thinking" indicator; stream response |
| Notification spam (high-volume workspaces) | Debounce + per-trigger daily cap (max 3 notifications of same type per day) |
