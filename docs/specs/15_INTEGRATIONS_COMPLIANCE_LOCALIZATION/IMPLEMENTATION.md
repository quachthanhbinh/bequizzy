# Spec 15 — Integrations, Compliance & Localization: IMPLEMENTATION

## Phases
1. **Webhook Engine**: Schema migration; HMAC signing; delivery queue (Cloud Tasks); retry logic
2. **Compliance**: GDPR/PDPA erasure endpoint; erasure batch job; compliance dashboard
3. **HubSpot Sync**: OAuth flow; batched upsert job; sync_log tracking
4. **i18n**: next-intl setup; EN/VN translations; language switcher

## File Map
```
services/integration-service/
  app/
    models/webhook.py
    models/gdpr.py
    routers/webhooks.py
    routers/compliance.py
    services/
      webhook_service.py
      hubspot_service.py
      erasure_service.py

alembic/versions/0015_integrations.py

frontend/
  messages/en.json
  messages/vi.json
  i18n.config.ts
```

## Integration Points
| From | To | Method |
|---|---|---|
| integration-service | Customer webhook URLs | HTTP POST + HMAC |
| integration-service | HubSpot API | OAuth2 + Secret Manager |
| Cloud Scheduler | erasure batch job | Cloud Run Job |
