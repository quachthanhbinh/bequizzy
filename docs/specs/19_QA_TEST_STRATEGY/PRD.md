# Spec 19 — QA Test Strategy: PRD

## Problem Statement

Without a consistent test strategy, RevLooper's 14 microservices + Next.js frontend will accumulate bugs, flaky tests, and coverage gaps that block velocity and erode confidence in deploys.

## Test Pyramid

| Layer | % of Tests | Tools |
|---|---|---|
| Unit | 70% | pytest (backend), Vitest (frontend) |
| Integration | 20% | pytest + testcontainers |
| E2E | 10% | Playwright |

## Coverage Gates (Per Service)

| Service Type | Gate |
|---|---|
| Core services (campaign, sequence, outreach, ai) | ≥ 85% |
| Supporting services | ≥ 80% |
| Frontend | ≥ 75% |
| Workers + Cloud Run Jobs | ≥ 80% |

## Acceptance Criteria

### AC-19-01: CI Coverage Enforcement
- GIVEN a PR reduces coverage below the service gate
- WHEN CI runs
- THEN build fails with coverage report

### AC-19-02: Flaky Test Policy
- GIVEN a test fails 2+ times in the last 10 CI runs without code changes
- THEN it is flagged as flaky
- AND quarantined to a separate test suite pending fix

### AC-19-03: E2E Smoke Tests
- Covering the critical path: sign up → create campaign → add sequence → send test email
- Running on every deploy to staging

### AC-19-04: Test Naming Convention
- Backend: `test_{operation}_{context}_{expected_result}`
- Frontend: `renders {component} correctly`, `handles {event} when {condition}`
