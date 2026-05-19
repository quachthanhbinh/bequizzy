# Spec 12 — CRM, Customers & Post-sale: PRD

## Problem Statement

When RevLooper books a meeting, the deal context lives nowhere structured. Founders manage deals in spreadsheets and lose track of post-sale customers. They need a Kanban deal board, automatic deal creation from bookings, and a customer lifecycle view.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-12-01 | Founder | I want a Kanban board to track deals by stage | P0 |
| US-12-02 | Founder | I want a deal to auto-create when a meeting is booked | P0 |
| US-12-03 | Founder | I want to drag-drop deals between stages | P1 |
| US-12-04 | Founder | I want a Won deal to automatically create a customer record | P0 |
| US-12-05 | Founder | I want to track customer lifecycle stage (onboarding/active/at-risk/churned) | P1 |
| US-12-06 | Founder | I want a health score per customer | P1 |
| US-12-07 | Founder | I want to see a deal activity timeline | P1 |
| US-12-08 | Admin | I want to configure custom deal stages | P2 |

## Deal Stages

Default stages (workspace-configurable):
`Prospect → Contacted → Meeting → Proposal → Won / Lost`

Stage transition rules:
- Forward transitions: always allowed
- Lost → Prospect: allowed (retry after loss)
- Lost ↔ Won: NOT allowed

## Acceptance Criteria

### AC-12-01: Auto-Create Deal from Booking
- WHEN `booking.confirmed` outbox event is consumed by crm-service
- THEN a deal is created in "Meeting" stage
- AND deal is linked to the lead via `lead_id`
- AND creation is idempotent (`booking_id` unique constraint)

### AC-12-02: Stage Transition
- GIVEN a deal is in any stage
- WHEN user moves to a new stage
- THEN transition is validated by service layer (invalid transitions rejected with 422)
- AND a `deal_activity` row is appended (append-only)

### AC-12-03: Won → Customer Conversion
- WHEN a deal is moved to Won
- THEN a `customer` record is created (idempotent via `UNIQUE deal_id`)
- AND customer starts in `onboarding` lifecycle stage
- AND deal.won_at is set to NOW()

### AC-12-04: Customer Health Score
- GIVEN configurable health signals in `workspace.settings.health_score_config`
- WHEN scoring job runs (every 6h)
- THEN health score = weighted sum of signal values (0–100)
- AND lifecycle stage updated: at-risk if < 40, churned if < 20

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Deal board load | < 500ms |
| Health score refresh | Every 6h via Cloud Scheduler |
| Stage transition idempotency | UNIQUE constraint on deal+stage per activity |
