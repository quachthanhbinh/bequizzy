# Spec 11 — Unified Inbox & AI Reply: PRD

## Problem Statement

Founders are drowning in replies scattered across email clients. They need a single inbox to see all inbound replies, with AI helping classify intent and draft responses — so they can focus on hot leads instead of triaging.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-11-01 | Founder | I want to see all inbound replies in one inbox | P0 |
| US-11-02 | Founder | I want AI to classify the intent of each reply | P0 |
| US-11-03 | Founder | I want AI to draft a reply using my Brain context (1 credit) | P0 |
| US-11-04 | Founder | I want one-click send from AI draft | P0 |
| US-11-05 | Founder | I want the sequence to auto-pause when a lead replies | P0 |
| US-11-06 | Founder | I want to mark threads as read / unread / archived | P1 |
| US-11-07 | Founder | I want to filter inbox by intent class | P1 |
| US-11-08 | Founder | I want real-time updates when a new reply arrives | P1 |

## Intent Classes

| Class | Description |
|---|---|
| `interested` | Lead expressed interest or wants more info |
| `not_interested` | Explicit rejection |
| `out_of_office` | Auto-reply OOO |
| `question` | Lead asked a question |
| `meeting_request` | Lead wants to schedule |

## Acceptance Criteria

### AC-11-01: Reply Ingest
- WHEN email arrives at inbound handler
- THEN `email-inbound` Cloud Function publishes `email.inbound` to Pub/Sub
- AND customer-service creates/updates `inbox_thread` and appends `inbox_message`
- AND enrollment for that lead is PAUSED in sequence-worker via `enrollment.pause` Pub/Sub event

### AC-11-02: Intent Classification
- WHEN a new inbound message is created
- THEN ai-service classifies into one of 5 intent classes
- AND if confidence ≥ 0.7: auto-set on message; if < 0.7: left for human
- AND classification happens asynchronously; frontend updates via Supabase Realtime

### AC-11-03: AI Reply Draft
- GIVEN a user requests an AI draft for a thread
- THEN billing-service is called to reserve 1 credit BEFORE LLM call
- AND ai-service fetches Brain chunks relevant to the thread subject
- AND draft is generated using credit reserve model (reserve → consume or release)
- AND draft saved in `ai_reply_drafts`

### AC-11-04: Sequence Pause on Reply
- WHEN any inbound message is received for a lead with an active enrollment
- THEN enrollment is immediately paused (status = `paused`)
- AND no further steps are dispatched until enrollment is manually resumed

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Intent classification latency | < 5s from ingest |
| Real-time notification | Supabase Realtime < 1s |
| Draft generation latency | < 8s |
