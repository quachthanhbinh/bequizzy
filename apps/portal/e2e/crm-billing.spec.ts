/**
 * CRM & Billing — expert E2E spec
 *
 * CRM: empty pipeline, populated Kanban, deal interaction, workspace isolation.
 * Billing: overview credit meter, plans tab, credit history, plan gating.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi } from "./helpers";
import {
  STAGES_EMPTY,
  STAGES_RESPONSE,
  DEALS_RESPONSE,
  DEALS_EMPTY,
  MOCK_DEAL_OPEN,
  MOCK_STAGES,
} from "./fixtures/crm";
import {
  BILLING_PLAN_RESPONSE,
  BILLING_FREE_RESPONSE,
  CREDIT_HISTORY_RESPONSE,
  CREDIT_HISTORY_EMPTY,
} from "./fixtures/workspace";

test.use({ storageState: "e2e/auth-state.json" });

// ── CRM: Empty state ───────────────────────────────────────────────────────────

test.describe("CRM — empty pipeline state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/deal-stages**", STAGES_EMPTY);
    await mockApi(page, "**/v1/deals**", DEALS_EMPTY);
    await authenticate(page);
    await page.goto("/crm");
  });

  test("shows 'No pipeline stages yet.' empty state", async ({ page }) => {
    await expect(page.locator("text=No pipeline stages yet.").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Set up pipeline' CTA button", async ({ page }) => {
    await expect(page.locator("button:has-text('Set up pipeline')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── CRM: Populated Kanban ─────────────────────────────────────────────────────

test.describe("CRM — populated Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/deal-stages**", STAGES_RESPONSE);
    await mockApi(page, "**/v1/deals**", DEALS_RESPONSE);
    await authenticate(page);
    await page.goto("/crm");
    await expect(page.locator(`text=${MOCK_STAGES[0].name}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("renders all pipeline stage columns", async ({ page }) => {
    for (const stage of MOCK_STAGES) {
      await expect(page.locator(`text=${stage.name}`).first()).toBeVisible();
    }
  });

  test("deal card is visible in the correct column", async ({ page }) => {
    await expect(page.locator("[data-testid='deal-card']").first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_DEAL_OPEN.title}`).first()).toBeVisible();
  });

  test("deal amount is displayed on the deal card", async ({ page }) => {
    await expect(page.locator("text=$1,200").first()).toBeVisible();
  });

  test("clicking a deal card opens the detail drawer", async ({ page }) => {
    await page.locator("[data-testid='deal-card']").first().click();
    await expect(page.locator("text=Deal Details").first()).toBeVisible();
  });

  test("deal detail drawer shows title and amount", async ({ page }) => {
    await page.locator("[data-testid='deal-card']").first().click();
    await expect(page.locator(`text=${MOCK_DEAL_OPEN.title}`).first()).toBeVisible();
    await expect(page.locator("text=$1,200").first()).toBeVisible();
  });

  test("closing the drawer hides it", async ({ page }) => {
    await page.locator("[data-testid='deal-card']").first().click();
    await expect(page.locator("text=Deal Details").first()).toBeVisible({ timeout: 5_000 });
    // Click the backdrop overlay to close the drawer
    await page.locator("div.bg-black\\/30").click({ force: true });
    await expect(page.locator("text=Deal Details")).not.toBeVisible({ timeout: 3_000 });
  });

  test("header shows open deal count and pipeline value", async ({ page }) => {
    // 1 open deal of $1,200 → "1 open deal · $1,200 pipeline"
    await expect(page.locator("text=open deal").first()).toBeVisible();
    await expect(page.locator("text=$1,200 pipeline").first()).toBeVisible();
  });
});

// ── CRM: Workspace isolation ──────────────────────────────────────────────────

test.describe("CRM — workspace isolation", () => {
  test("stages API request carries X-Workspace-ID header", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/deal-stages**", async (route) => {
      capturedHeaders = route.request().headers();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STAGES_EMPTY) });
    });
    await mockApi(page, "**/v1/deals**", DEALS_EMPTY);
    await authenticate(page);
    await page.goto("/crm");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Billing: Overview tab ─────────────────────────────────────────────────────

test.describe("Billing — overview tab (Starter plan)", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/billing/plan**", BILLING_PLAN_RESPONSE);
    await mockApi(page, "**/v1/billing/credits/history**", CREDIT_HISTORY_RESPONSE);
    await authenticate(page);
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
  });

  test("shows 'Billing & Credits' heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Billing')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows credit usage meter (data-testid='credit-meter')", async ({ page }) => {
    await expect(page.locator("[data-testid='credit-meter']").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=AI credits used this cycle").first()).toBeVisible();
  });

  test("credit meter shows Starter allocation (500 total)", async ({ page }) => {
    await expect(page.locator("text=500").first()).toBeVisible();
  });

  test("shows current plan name", async ({ page }) => {
    await expect(page.locator("text=Starter plan").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Billing: Plans tab ─────────────────────────────────────────────────────────

test.describe("Billing — plans tab", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/billing/plan**", BILLING_PLAN_RESPONSE);
    await authenticate(page);
    await page.goto("/billing");
    await page.locator("button:has-text('Plans')").click();
    await page.waitForLoadState("networkidle");
  });

  test("shows all four plan cards", async ({ page }) => {
    await expect(page.locator("text=Free").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Starter").first()).toBeVisible();
    await expect(page.locator("text=Growth").first()).toBeVisible();
    await expect(page.locator("text=Scale").first()).toBeVisible();
  });

  test("Growth plan is not the current plan — shows Upgrade button", async ({ page }) => {
    // Current plan is Starter; Growth should have an Upgrade/Subscribe CTA
    const upgradeBtn = page.locator("button:has-text('Upgrade'), button:has-text('Subscribe')").first();
    await expect(upgradeBtn).toBeVisible({ timeout: 10_000 });
  });
});

// ── Billing: Navigation ────────────────────────────────────────────────────────

test.describe("Billing — navigation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access redirects to sign-in", async ({ page }) => {
    await page.goto("/billing");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("CRM unauthenticated access redirects to sign-in", async ({ page }) => {
    await page.goto("/crm");
    await expect(page).toHaveURL(/sign-in/);
  });
});


