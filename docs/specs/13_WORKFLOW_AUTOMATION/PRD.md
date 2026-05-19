# Spec 13 — Workflow Automation: PRD

## Problem Statement

Founders repeat the same actions manually: "when a deal moves to Won, send a congratulations email; when a lead replies, add a tag; when a meeting is booked, update the stage." These should be automatable without code.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-13-01 | Founder | I want to create an automation rule with a trigger and actions | P0 |
| US-13-02 | Founder | I want "deal stage changed" as a trigger | P0 |
| US-13-03 | Founder | I want "lead replied to email" as a trigger | P0 |
| US-13-04 | Founder | I want "meeting booked" as a trigger | P0 |
| US-13-05 | Founder | I want "send email" as an action | P0 |
| US-13-06 | Founder | I want "add tag to lead" as an action | P1 |
| US-13-07 | Founder | I want "update deal stage" as an action | P1 |
| US-13-08 | Founder | I want "enroll lead in sequence" as an action | P1 |
| US-13-09 | Founder | I want to see execution history for each rule | P1 |
| US-13-10 | Founder | I want to enable/disable rules without deleting them | P1 |

## Trigger Types (P0)
- `deal.stage_changed` — when a deal moves to a specific stage
- `lead.replied` — when a lead sends an inbound message
- `booking.confirmed` — when a meeting is booked

## Action Types (P0)
- `send_email` — send a single email via outreach-service
- `add_tag` — add a tag to the lead
- `update_deal_stage` — move deal to a target stage
- `enroll_in_sequence` — enroll lead in a specified sequence

## Acceptance Criteria

### AC-13-01: Rule Evaluation
- GIVEN an event is emitted (e.g., `deal.stage_changed`)
- WHEN a rule matches the trigger type AND conditions
- THEN all rule actions are executed in order
- AND an `automation_execution` row is created per action

### AC-13-02: Condition Matching
- GIVEN rule has `conditions: [{"field": "stage_name", "op": "eq", "value": "Won"}]`
- WHEN event payload contains `stage_name = "Won"`
- THEN rule executes

### AC-13-03: Execution Idempotency
- GIVEN same event published twice (Pub/Sub at-least-once)
- WHEN rule evaluator processes both
- THEN idempotent: second execution is skipped if `{rule_id, event_id}` already processed

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Rule evaluation latency | < 2s from event |
| Execution history retention | 30 days |
| Max actions per rule | 10 |
