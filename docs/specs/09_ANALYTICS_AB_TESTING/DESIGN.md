# Spec 09 — Analytics & A/B Testing: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Analytics is table-stakes. Founders need open/click/reply rates TODAY. The dashboard must feel instant (< 500ms). A/B testing with statistical significance differentiates us from cheap tools. Priority: campaign metrics first, then A/B, then step funnel. Confidence: 7.

**CTO:** Pre-aggregation is the only way to hit 500ms at scale. `analytics-aggregator` is a Cloud Run Job that runs hourly, reads from `email_events` and `sequence_step_executions`, and writes to `campaign_metrics_snapshots`. No on-the-fly aggregation in the API path. For A/B: chi-squared is the right test for conversion rates; implement in Python using scipy, not SQL. Confidence: 7.

**Gap: 0. Both ≥ 7.**

### Round 2

**CPO:** For A/B: auto-declare winner when p < 0.05 AND min 100 samples/variant. Winner gets flagged and the UI can auto-pause the losing variant (optional). Meeting booked rate requires joining across booking-service data — use the outbox event `booking.confirmed` to update campaign metrics. Confidence: 8.

**CTO:** `booking.confirmed` event → analytics-service consumes via Pub/Sub → updates `campaign_meetings_booked` counter. Agree on auto-winner logic — stored in `ab_test_results` table. Aggregation job runs every hour via Cloud Scheduler; idempotent (UPSERT by `{campaign_id, date}`). Confidence: 8.

**Gap: 0. Converged at Round 2.**

### Round 3 (Confirm)

**Final Confidence: 8 / 10.** Why not 10: Meeting rate attribution (linking bookings to campaigns) is fuzzy when a lead is in multiple campaigns. We use "last campaign that sent an email to this lead" heuristic — acceptable for P1 but should be revisited.

---

## Data Model

### Table: `campaign_metrics_snapshots`

```sql
CREATE TABLE campaign_metrics_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  campaign_id   UUID NOT NULL,
  date          DATE NOT NULL,
  emails_sent   INTEGER NOT NULL DEFAULT 0,
  opens         INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  replies       INTEGER NOT NULL DEFAULT 0,
  bounces       INTEGER NOT NULL DEFAULT 0,
  meetings      INTEGER NOT NULL DEFAULT 0,
  unsubscribes  INTEGER NOT NULL DEFAULT 0,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, date)
);
CREATE INDEX idx_campaign_metrics_workspace ON campaign_metrics_snapshots (workspace_id, date DESC);
```

### Table: `sequence_step_metrics`

```sql
CREATE TABLE sequence_step_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  step_id       UUID NOT NULL,
  date          DATE NOT NULL,
  sent          INTEGER NOT NULL DEFAULT 0,
  completed     INTEGER NOT NULL DEFAULT 0,
  skipped       INTEGER NOT NULL DEFAULT 0,
  failed        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (step_id, date)
);
```

### Table: `ab_test_results`

```sql
CREATE TABLE ab_test_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL,
  step_id         UUID NOT NULL UNIQUE,   -- ab_split step
  variant_a_metric NUMERIC(6,4),
  variant_b_metric NUMERIC(6,4),
  p_value         NUMERIC(8,6),
  is_significant  BOOLEAN NOT NULL DEFAULT FALSE,
  winner          TEXT,                   -- 'a'|'b'|null
  sample_a        INTEGER NOT NULL DEFAULT 0,
  sample_b        INTEGER NOT NULL DEFAULT 0,
  last_computed   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Aggregation Architecture

```
Cloud Scheduler (every 1h) → analytics-aggregator (Cloud Run Job)
  ├─ For each workspace:
  │   ├─ Read email_events for last 25h (overlap for late arrivals)
  │   ├─ Aggregate by campaign_id + date
  │   ├─ UPSERT campaign_metrics_snapshots
  │   ├─ Aggregate sequence_step_metrics
  │   ├─ Re-compute ab_test_results (chi-squared via scipy)
  │   └─ Update workspace-level totals
```

---

## A/B Statistical Significance

```python
from scipy.stats import chi2_contingency

def compute_ab_significance(a_opens: int, a_sent: int, b_opens: int, b_sent: int) -> dict:
    if a_sent < 100 or b_sent < 100:
        return {"is_significant": False, "p_value": None, "winner": None}
    contingency = [[a_opens, a_sent - a_opens], [b_opens, b_sent - b_opens]]
    _, p_value, _, _ = chi2_contingency(contingency)
    is_significant = p_value < 0.05
    winner = None
    if is_significant:
        winner = "a" if (a_opens / a_sent) >= (b_opens / b_sent) else "b"
    return {"is_significant": is_significant, "p_value": float(p_value), "winner": winner}
```
