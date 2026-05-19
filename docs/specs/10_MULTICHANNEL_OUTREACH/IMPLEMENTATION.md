# Spec 10 — Multichannel Outreach: IMPLEMENTATION

## Phases
1. **Schema + SMS**: `channel_sends` migration; Twilio + ESMS.vn adapters; SMS routing; consent gate; suppression check
2. **LinkedIn Extension Bridge**: Redis task queue; browser extension API; rate limiter; result callback endpoint
3. **Frontend**: Channel credential settings; SMS/LinkedIn step config panels in sequence builder

## File Map
```
services/outreach-service/
  app/
    models/channel_send.py
    routers/channels.py
    services/
      sms_service.py       # SMS routing + consent gate + suppression
      linkedin_service.py  # Extension bridge
    adapters/
      twilio_adapter.py
      esms_vn_adapter.py

alembic/versions/0010_channel_sends.py
```

## Integration Points
| From | To | Auth |
|---|---|---|
| outreach-service | Twilio API | Auth token from Secret Manager |
| outreach-service | ESMS.vn API | API key from Secret Manager |
| outreach-service | consent_log DB | AsyncSession (same DB) |
| Browser extension | outreach-service | JWT token |
