# Spec 27 — Accessibility & UX Quality: TESTS

## Tests

### U27-01: Component Has No axe Violations
```typescript
it("LeadForm has no a11y violations", async () => {
  const { container } = render(<LeadForm />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### U27-02: All Interactive Elements Have Labels
```typescript
it("form inputs are labeled", () => {
  render(<LeadForm />);
  screen.getAllByRole("textbox").forEach((el) => {
    expect(el).toHaveAccessibleName();
  });
});
```

### E2E: axe Check on Critical Pages (Playwright)
```typescript
const pages = ["/", "/leads", "/campaigns", "/inbox"];
for (const path of pages) {
  test(`${path} is accessible`, async ({ page }) => {
    await page.goto(path);
    await checkA11y(page, undefined, { runOnly: ["wcag2a", "wcag2aa"] });
  });
}
```

## Coverage Gate
- 0 WCAG 2.1 AA violations on all critical pages (CI blocks on any violation)
