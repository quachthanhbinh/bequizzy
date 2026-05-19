# 29 — AI Lead Scoring — TESTS

**Status:** 📝 Draft
**Coverage gate:** ≥ 85% line coverage on `scoring/` module
**Last updated:** 2025-05-05

## Unit Tests (`services/lead-service/tests/scoring/`)

### score_calculator.py
- [ ] `test_open_event_increases_score` — email_opened adds correct weight
- [ ] `test_open_event_caps_at_24_per_email` — multiple opens on same email max out at +24
- [ ] `test_reply_event_increases_score` — replied adds +25
- [ ] `test_bounce_event_decreases_score` — bounced subtracts 50
- [ ] `test_unsubscribe_floors_score_at_zero` — unsubscribe → score = 0
- [ ] `test_score_clamps_at_100` — signals beyond 100 don't overflow
- [ ] `test_score_label_hot` — score ≥ 70 → label = Hot
- [ ] `test_score_label_warm` — 40 ≤ score < 70 → label = Warm
- [ ] `test_score_label_cold` — score < 40 → label = Cold
- [ ] `test_decay_reduces_score` — decay function subtracts 2/day to floor of 10
- [ ] `test_decay_does_not_go_below_floor` — score at 10 stays at 10 after decay

### Pub/Sub subscriber
- [ ] `test_hot_transition_publishes_event` — Warm → Hot fires `lead_scored_hot`
- [ ] `test_no_event_on_non_hot_transition` — Warm → Cold does NOT fire hot event
- [ ] `test_wrong_workspace_id_rejected` — message with mismatched workspace_id is nacked

## Integration Tests
- [ ] Full event flow: send `email_opened` Pub/Sub message → assert `leads.score` updated within 5s
- [ ] Decay CronJob: seed stale leads → run decay job → assert scores reduced correctly
- [ ] `GET /leads/{id}/score` returns breakdown for Pro plan; returns 402 for Free plan

## E2E Tests (Playwright)
- [ ] Lead table shows correct Hot badge after simulated reply event
- [ ] Clicking Hot badge on Pro plan opens breakdown panel
- [ ] Clicking Hot badge on Free plan shows upgrade prompt

## Adversarial / Edge Cases
- [ ] 10,000 signals for one lead: score stays at 100, no OOM
- [ ] Score calculation is idempotent if same event replayed (Pub/Sub at-least-once delivery)
- [ ] Lead deleted mid-scoring: `lead_score_signals` cascade delete, no FK errors
