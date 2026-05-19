# Spec 12 — CRM, Customers & Post-sale: IMPLEMENTATION

## Phases
1. **Schema**: Alembic migration for deal_stages, deals, deal_activities, customers; seed default stages
2. **CRM Core**: Stage validation service; deal CRUD; activity append; booking.confirmed consumer
3. **Customer Lifecycle**: Won → customer conversion; health score computation (Cloud Run Job 6h)
4. **Frontend**: Kanban deal board (drag-drop); deal detail; customer list; health score badge

## File Map
```
services/crm-service/
  app/
    models/deal.py
    models/customer.py
    routers/deals.py
    routers/customers.py
    services/
      deal_service.py        # stage transitions, validation
      customer_service.py    # health score
    consumers/
      booking_consumer.py    # booking.confirmed Pub/Sub

services/scoring-worker/
  app/
    jobs/customer_health.py  # 6h Cloud Scheduler

alembic/versions/0012_crm.py

frontend/
  app/(dashboard)/crm/page.tsx
  components/crm/
    KanbanBoard.tsx
    DealCard.tsx
    CustomerList.tsx
```

## Integration Points
| Event | From | To |
|---|---|---|
| `booking.confirmed` Pub/Sub | booking-service | crm-service |
| Cloud Scheduler 6h | GCP | scoring-worker |
