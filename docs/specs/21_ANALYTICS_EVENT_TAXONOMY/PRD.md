# Spec 21 — Analytics Event Taxonomy: PRD

## Problem Statement

Without a canonical event taxonomy, every team defines their own event names, leading to inconsistent analytics, broken funnels, and unusable data.

## Acceptance Criteria

### AC-21-01: Event Schema Registry
- All product analytics events tracked in a central schema registry
- Required fields on every event: `workspace_id`, `user_id`, `timestamp`, `event_name`, `version`
- `event_name` format: `snake_case`, namespaced (`leads.created`, `campaign.sent`)

### AC-21-02: 50+ Event Inventory
- All major user actions tracked (see DESIGN for full list)

### AC-21-03: Versioning Policy
- Breaking schema changes increment `version`
- Old event version accepted for 6 months

### AC-21-04: Tracking Plan
- Each event documented: when fired, who fires it, properties, downstream use
