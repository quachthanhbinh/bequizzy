# Spec 12 — CRM, Customers & Post-sale: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Kanban board must feel like Trello — drag-drop across columns, inline deal editing, quick-add from any stage. Auto-deal from bookings is the star feature — zero friction from meeting → deal. Health score differentiates from basic CRMs. Confidence: 7.

**CTO:** Drag-drop is pure frontend state; backend just needs `PATCH /deals/{id}` with `stage_id`. Won→Customer conversion must be idempotent: UNIQUE constraint on `customers.deal_id` + upsert. Health score: Cloud Scheduler 6h → scoring-worker CronJob reads signals → updates health_score on `customers`. Stage validation in service layer (not DB constraints — easier to configure). Confidence: 7.

**Gap: 0. Both ≥ 7.**

### Round 2

**CPO:** Activity timeline must be append-only (never edit/delete). Show: deal created, stage changed, note added, meeting booked, customer converted. Confidence: 8.

**CTO:** `deal_activities` append-only: INSERT only, no UPDATE/DELETE in ORM. Health signals: default config in `workspace.settings.health_score_config` (JSONB); configurable weights. Signal sources: login events, email opens, support ticket count (from customer-service internal data). Confidence: 8.

**Final Confidence: 7 / 10.** Why not higher: Health score signal sources (product usage data) require future integration with client-side events — signal fidelity is limited at P1.

---

## Data Model

### Table: `deal_stages`
```sql
CREATE TABLE deal_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  name          TEXT NOT NULL,
  position      INTEGER NOT NULL,
  is_won        BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (workspace_id, name)
);
```

### Table: `deals`
```sql
CREATE TABLE deals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  lead_id       UUID NOT NULL,
  booking_id    UUID,                   -- soft FK (no constraint across services)
  stage_id      UUID NOT NULL,
  title         TEXT NOT NULL,
  value         NUMERIC(15,2),
  currency      TEXT NOT NULL DEFAULT 'USD',
  assigned_to   UUID,
  won_at        TIMESTAMPTZ,
  lost_at       TIMESTAMPTZ,
  lost_reason   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id)                   -- idempotent creation from booking
);
CREATE INDEX idx_deals_workspace_stage ON deals (workspace_id, stage_id);
```

### Table: `deal_activities`
```sql
CREATE TABLE deal_activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  deal_id    UUID NOT NULL REFERENCES deals(id),
  actor_id   UUID,
  activity_type TEXT NOT NULL,           -- stage_changed|note|meeting_booked|customer_created
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO updated_at, NO delete — append-only
);
```

### Table: `customers`
```sql
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  lead_id         UUID NOT NULL,
  deal_id         UUID NOT NULL,
  UNIQUE (deal_id),                      -- idempotent Won → Customer
  lifecycle_stage TEXT NOT NULL DEFAULT 'onboarding',  -- onboarding|active|at_risk|churned
  health_score    INTEGER NOT NULL DEFAULT 100,
  health_computed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Stage Transition Rules
```python
VALID_TRANSITIONS = {
    "Prospect": ["Contacted", "Meeting", "Proposal", "Won", "Lost"],
    "Contacted": ["Meeting", "Proposal", "Won", "Lost"],
    "Meeting": ["Proposal", "Won", "Lost"],
    "Proposal": ["Won", "Lost"],
    "Won": [],   # Terminal
    "Lost": ["Prospect"],  # Retry only
}
```

## Health Score Calculation
```python
def compute_health_score(signals: dict, weights: dict) -> int:
    total_weight = sum(weights.values())
    if total_weight == 0:
        return 100
    score = sum(signals.get(k, 0) * w for k, w in weights.items()) / total_weight
    return min(100, max(0, int(score * 100)))
```
