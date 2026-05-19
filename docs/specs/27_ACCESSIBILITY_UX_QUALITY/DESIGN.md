# Spec 27 — Accessibility & UX Quality: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** WCAG AA is an enterprise procurement checkbox. It also reduces support from frustrated mobile users. Screen reader coverage catches the most impactful issues for VN/TH users who use mobile screen readers at higher rates. Confidence: 7.

**CTO:** axe-core via `@axe-core/playwright` in E2E CI. Vitest: `@testing-library/jest-dom` + `jest-axe` for component-level checks. shadcn/ui components are ARIA-compliant by default — focus on custom components and forms. Storybook a11y addon for design review. Confidence: 7.

**Gap: 0. Both ≥ 7. Converge.**

**Final Confidence: 7 / 10.**

---

## CI Integration

```typescript
// playwright.config.ts — axe check on every E2E page
import { checkA11y } from "axe-playwright";
test("homepage is accessible", async ({ page }) => {
  await page.goto("/");
  await checkA11y(page, undefined, { runOnly: ["wcag2a", "wcag2aa"] });
});
```

## Component Check Pattern

```typescript
// __tests__/LeadForm.test.tsx
import { axe } from "jest-axe";
it("LeadForm has no a11y violations", async () => {
  const { container } = render(<LeadForm />);
  expect(await axe(container)).toHaveNoViolations();
});
```
