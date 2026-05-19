# Spec 27 — Accessibility & UX Quality: PRD

## Problem Statement

RevLooper targets enterprise buyers in SEA who increasingly require WCAG compliance. Accessibility issues also harm SEO and increase support burden.

## Acceptance Criteria

### AC-27-01: WCAG 2.1 AA Compliance
- All pages meet WCAG 2.1 Level AA
- Checked via axe-core CI integration

### AC-27-02: Keyboard Navigation
- All interactive elements reachable via Tab / Shift+Tab
- Focus indicators visible (2px outline, matching brand color)

### AC-27-03: Touch Targets
- Minimum 44×44px for all buttons, links, form controls on mobile (375px viewport)

### AC-27-04: Contrast Ratio
- Text/background contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text)

### AC-27-05: Screen Reader Testing
- VoiceOver (iOS), TalkBack (Android), NVDA (Windows) smoke test on critical paths
- All form labels associated with inputs
