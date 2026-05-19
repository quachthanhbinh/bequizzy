# Spec 08 — Meeting Booking: IMPLEMENTATION

## Phases

### Phase 1 — Cal.com Integration + Booking Schema
- Alembic migration: `cal_connections`, `meeting_types`, `bookings`
- SQLAlchemy models
- Cal.com OAuth flow (connect/disconnect endpoints)
- Meeting type CRUD (synced to Cal.com via API)
- Secret Manager for Cal.com OAuth tokens

### Phase 2 — Webhook Consumer
- Cloud Functions 2nd gen webhook handler (`/webhooks/cal`)
- HMAC signature validation using per-workspace Cal.com secret
- `booking.created` / `booking.cancelled` / `booking.rescheduled` handlers
- Idempotent INSERT (ON CONFLICT cal_booking_id DO NOTHING)
- Lead matching by attendee email
- Outbox event emission

### Phase 3 — Round-Robin + Reminders
- Round-robin host assignment (Redis counter)
- Cloud Scheduler job (every 30min) for reminder detection
- Reminder dispatch via notification-service
- `reminder_24h_sent` + `reminder_1h_sent` idempotency flags

### Phase 4 — Frontend
- Cal.com connection settings page
- Meeting types list + create/edit form
- Booking link display + copy button
- Bookings list with status badges

---

## File Map

```
services/booking-service/
  app/
    models/
      booking.py              # CalConnection, MeetingType, Booking models
    schemas/
      booking.py              # Pydantic v2 schemas
    routers/
      cal_connection.py       # OAuth connect/disconnect
      meeting_types.py        # Meeting type CRUD
      bookings.py             # Booking list/detail
      webhooks.py             # POST /webhooks/cal
    services/
      booking_service.py      # create_booking, cancel_booking, etc.
      round_robin.py          # assign_round_robin_host()
      reminder_service.py     # send_reminders_for_window()
      cal_client.py           # Cal.com API client
    utils/
      hmac_validator.py       # Cal.com webhook HMAC validation
  alembic/versions/0008_bookings.py

frontend/
  app/(dashboard)/
    settings/calendar/page.tsx   # Cal.com connection + meeting types
    bookings/page.tsx            # Bookings list
  components/booking/
    MeetingTypeCard.tsx
    BookingTable.tsx
    CalConnectButton.tsx
```

---

## Integration Points

| From | To | Method | Auth |
|---|---|---|---|
| booking-service | Cal.com API | HTTP (cal_client.py) | OAuth token from Secret Manager |
| booking-service | notification-service | HTTP POST `/notifications/send` | Workload Identity OIDC |
| Cloud Functions (webhook) | booking-service | Pub/Sub | Service account |
| Cloud Scheduler | booking-service | HTTP GET `/internal/send-reminders` | Workload Identity |

---

## Environment Variables

```env
# booking-service
CAL_API_BASE_URL=https://api.cal.com/v1
CAL_WEBHOOK_SECRET_PREFIX=cal_webhook_secret_  # {workspace_id} appended
BOOKING_LINK_BASE_URL=https://revlooper.com/book
ROUND_ROBIN_REDIS_PREFIX=rr:
```
