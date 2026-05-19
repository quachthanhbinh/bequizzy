# Spec 27 — Accessibility & UX Quality: TASKS

## TDD Task List

### Task 1 — jest-axe Setup + LeadForm Test
**RED first:** Test U27-01 fails (no matchers registered).
**Done when:** U27-01 and U27-02 pass.

### Task 2 — axe-playwright on Critical Pages
**RED first:** E2E test fails with a11y violations.
**Done when:** All 4 critical pages pass WCAG 2.1 AA.

### Task 3 — Fix Identified Violations
**Done when:** 0 violations on CI run.

### Task 4 — Touch Target Audit
**Done when:** All interactive elements ≥ 44×44px at 375px viewport.

## Completion Checklist
- [ ] 0 WCAG 2.1 AA violations on critical pages
- [ ] All form inputs labeled
- [ ] Keyboard navigation working on all flows
- [ ] Touch targets ≥ 44×44px
