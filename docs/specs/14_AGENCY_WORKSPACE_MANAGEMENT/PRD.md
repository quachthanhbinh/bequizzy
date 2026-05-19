# Spec 14 — Agency Workspace Management: PRD

## Problem Statement

Sales agencies manage outreach for 5–50 client workspaces. They need a parent "agency account" to provision client workspaces, set billing, monitor performance across all clients, and white-label the UI.

## User Stories

| ID | Role | Story | Priority |
|---|---|---|---|
| US-14-01 | Agency Admin | I want to create and provision client workspaces from a single dashboard | P0 |
| US-14-02 | Agency Admin | I want to see aggregated metrics across all managed workspaces | P0 |
| US-14-03 | Agency Admin | I want to impersonate a client workspace without sharing credentials | P1 |
| US-14-04 | Agency Admin | I want to set usage limits per client workspace | P1 |
| US-14-05 | Agency Admin | I want white-label branding (logo, domain) for client portals | P2 |
| US-14-06 | Client | I only see my own workspace data | P0 (CRITICAL) |

## Acceptance Criteria

### AC-14-01: Workspace Provisioning
- GIVEN agency admin calls POST /agency/workspaces
- THEN a new workspace is created with agency_id relationship
- AND workspace inherits agency default settings

### AC-14-02: Cross-Workspace Reporting
- GIVEN agency admin with N managed workspaces
- WHEN they load the agency dashboard
- THEN they see aggregate email/reply metrics per workspace for the last 30 days

### AC-14-03: Workspace Impersonation
- GIVEN agency admin with access to workspace W
- WHEN they impersonate W
- THEN JWT scoped to W is issued (short TTL: 1h)
- AND audit log records impersonation start + end

### AC-14-04: Client Data Isolation (CRITICAL)
- GIVEN client user in workspace W
- WHEN they access any endpoint
- THEN they CANNOT see data from other workspaces (even agency-owned ones)

## Non-Functional Requirements
| Requirement | Target |
|---|---|
| Agency dashboard load | < 1s (pre-aggregated) |
| Max managed workspaces | 100 per agency |
| Impersonation audit | 100% logged |
