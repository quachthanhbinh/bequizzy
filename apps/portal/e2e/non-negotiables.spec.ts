/**
 * Non-Negotiables — architecture compliance E2E spec
 *
 * Verifies the 8 RevLooper architecture principles that must never be bypassed:
 * 1. Workspace isolation: every API call carries X-Workspace-ID header
 * 2. Credits before AI: ai-credit-cost badge is visible before AI generate button can be pressed
 * 3. Suppression: suppressed lead badge visible in lead table
 * 4. Plan gating: billing overview shows credit meter
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi } from "./helpers";
import { CAMPAIGNS_EMPTY } from "./fixtures/campaigns";
import { BILLING_PLAN_RESPONSE, CREDIT_HISTORY_RESPONSE } from "./fixtures/workspace";

test.use({ storageState: "e2e/auth-state.json" });

// ── 1. Workspace isolation ─────────────────────────────────────────────────────

test.describe("Non-Negotiable: Workspace isolation (X-Workspace-ID header)", () => {
  for (const [label, path, pattern, emptyBody] of [
    ["leads",     "/leads",     "**/v1/leads**",     JSON.stringify({ items: [], total: 0, page: 1, page_size: 50 })],
    ["campaigns", "/campaigns", "**/v1/campaigns**", JSON.stringify({ items: [], total: 0, page: 1, page_size: 50 })],
    ["inbox",     "/inbox",     "**/v1/inbox**",     JSON.stringify([])],
  ] as [string, string, string, string][]) {
    test(`${label} page sends X-Workspace-ID = e2e-workspace-id`, async ({ page }) => {
      let capturedHeaders: Record<string, string> = {};
      await page.route(pattern, async (route) => {
        if (route.request().method() !== "GET") { await route.continue(); return; }
        capturedHeaders = route.request().headers();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: emptyBody,
        });
      });
      await authenticate(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
    });
  }
});

// ── 2. Credits before AI ───────────────────────────────────────────────────────

test.describe("Non-Negotiable: Credits cost shown before AI generate", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/campaigns**", CAMPAIGNS_EMPTY);
    await mockApi(page, "**/v1/billing/plan**", BILLING_PLAN_RESPONSE);
    await authenticate(page);
    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
  });

  test("ai-credit-cost badge is visible before generate button is enabled", async ({ page }) => {
    // The credit cost badge (e.g. "5 credits") is always shown in the UI
    await expect(page.locator("[data-testid='ai-credit-cost']")).toBeVisible({ timeout: 10_000 });
    // Verify the generate button is disabled when prompt is empty (< 10 chars)
    const generateBtn = page.locator("button[type='submit']:has-text('Generate Campaign')").first();
    await expect(generateBtn).toBeDisabled({ timeout: 5_000 });
  });

  test("generate button becomes enabled only after user types a prompt", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    await textarea.fill("SaaS founders in Southeast Asia who need better outreach tooling");
    const generateBtn = page.locator("button[type='submit']:has-text('Generate Campaign')").first();
    await expect(generateBtn).toBeEnabled({ timeout: 5_000 });
  });
});

// ── 3. Suppression ─────────────────────────────────────────────────────────────

test.describe("Non-Negotiable: Suppressed lead is visually marked", () => {
  // TODO: The Lead type and leads page UI do not yet expose a suppression badge.
  // This test is skipped until the backend returns a `suppressed` field and the
  // component renders a visual indicator for suppressed leads.
  // Track: https://github.com/revlooper/revlooper/issues/TODO
  test.skip(true, "Suppressed lead badge not yet implemented in leads UI");

  test("suppressed lead row shows 'Suppressed' badge", async () => {
    // Will be implemented when the backend surfaces the suppression state.
  });
});

// ── 4. Plan gating ─────────────────────────────────────────────────────────────

test.describe("Non-Negotiable: Credit meter visible in billing overview", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/billing/plan**", BILLING_PLAN_RESPONSE);
    await mockApi(page, "**/v1/billing/credits/history**", CREDIT_HISTORY_RESPONSE);
    await authenticate(page);
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
  });

  test("credit meter (data-testid='credit-meter') is visible on billing overview tab", async ({ page }) => {
    await expect(page.locator("[data-testid='credit-meter']")).toBeVisible({ timeout: 10_000 });
  });

  test("billing page shows current plan name (Starter)", async ({ page }) => {
    await expect(page.locator("text=Starter").first()).toBeVisible({ timeout: 10_000 });
  });
});
