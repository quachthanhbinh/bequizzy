# Spec 05 — AI Campaign Builder: PRD

## Problem Statement

Solo founders and small teams lack time to strategize outreach. They know their product but struggle to translate it into a structured campaign with audience targeting, goals, and sequenced steps. AI should do the heavy lifting — generating a campaign plan the user can tweak in minutes.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-05-01 | Founder | I want to describe my goal in plain language and get a full campaign draft | P0 |
| US-05-02 | Founder | I want the AI to use my AI Brain context (ICP, value prop, objections) when building the campaign | P0 |
| US-05-03 | Founder | I want to edit any AI-generated field before publishing | P0 |
| US-05-04 | Sales Rep | I want to create a campaign manually without AI | P1 |
| US-05-05 | Founder | I want to see how many credits an AI campaign costs before I confirm | P0 |
| US-05-06 | Founder | I want to iterate on the campaign draft via chat (follow-up prompts) | P1 |
| US-05-07 | Admin | I want to set a campaign status (draft / active / paused / archived) | P1 |
| US-05-08 | Founder | I want to duplicate an existing campaign as a starting point | P2 |

## Acceptance Criteria

### AC-05-01: AI Campaign Draft Generation
- GIVEN the user enters a goal prompt (≥10 chars) and confirms 5-credit cost
- WHEN the AI draft endpoint is called
- THEN `campaign-service` calls `billing-service` to deduct 5 credits BEFORE calling `ai-service`
- AND `ai-service` retrieves the top-10 Brain chunks for the workspace
- AND generates: campaign name, description, target_audience (ICP JSON), goals list, sequence outline (3–5 step summaries)
- AND stores the draft in `campaign_ai_drafts` with the full prompt/response
- AND returns the draft within 10 seconds (p95)

### AC-05-02: Brain Context Injection
- GIVEN a workspace has completed AI Brain onboarding (Spec 02)
- WHEN the AI generates a campaign
- THEN the prompt includes the Business Profile doc and top-5 relevant chunks via RAG lookup
- AND the generated audience matches the ICP from the Brain (company size, industry, region)

### AC-05-03: Manual Campaign Creation
- GIVEN the user selects "Create manually"
- WHEN they fill in name + description
- THEN a campaign is created with `ai_generated = false`, 0 credits consumed
- AND all fields are editable

### AC-05-04: Campaign Lifecycle
- GIVEN a campaign exists
- WHEN the user changes status
- THEN valid transitions: `draft → active`, `active → paused`, `paused → active`, `active → archived`, `draft → archived`
- AND `active` campaigns cannot be deleted (must archive first)

### AC-05-05: Credit Gate
- GIVEN the workspace has insufficient credits (< 5)
- WHEN AI campaign generation is requested
- THEN return HTTP 402 with `code: INSUFFICIENT_CREDITS` before any LLM call
- AND no credits are consumed

### AC-05-06: Campaign Duplication
- GIVEN a campaign exists in any status
- WHEN the user duplicates it
- THEN a new campaign is created with `status = draft`, `ai_generated = false` (copy of human-edited state), name prefixed "Copy of …"

## Non-functional Requirements

| Requirement | Target |
|---|---|
| AI draft latency | p95 < 10s, p99 < 15s |
| Manual create latency | p95 < 300ms |
| Credit deduction atomicity | Deducted before LLM call, no refund on LLM error (budget-based) |
| Draft storage | All AI prompts/responses stored for audit |
| Scale | 100 workspaces × 1000 campaigns/workspace |

## Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| AI campaign adoption rate | ≥ 60% of campaigns use AI draft |
| AI draft → publish rate | ≥ 40% |
| AI latency p95 | < 10s |
| Credit error rate | < 0.1% |
| User edits per AI draft | ≤ 3 fields changed (product quality signal) |

## Out of Scope

- Sequence step execution (Spec 06)
- Email sending / deliverability (Spec 07)
- Multichannel steps (Spec 10)
- Campaign analytics (Spec 09)
- Campaign templates marketplace
