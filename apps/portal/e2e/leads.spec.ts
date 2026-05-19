/**
 * Leads — expert E2E spec
 *
 * Covers four API states (empty, populated, error, loading skeleton),
 * workspace isolation verification, score badges, and filter interactions.
 *
 * All backend calls are intercepted — no running API required.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi } from "./helpers";
import {
  LEADS_EMPTY,
  LEADS_RESPONSE,
  LEADS_ERROR,
  MOCK_LEAD_HOT,
  MOCK_LEAD_WARM,
  MOCK_LEAD_COLD,
} from "./fixtures/leads";

test.use({ storageState: "e2e/auth-state.json" });

// ── State 1: Empty list ────────────────────────────────────────────────────────

test.describe("Leads — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/leads**", LEADS_EMPTY);
    await authenticate(page);
    await page.goto("/leads");
  });

  test("shows 'No leads yet.' empty state", async ({ page }) => {
    await expect(page.locator("text=No leads yet.").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Import CSV and Add Lead buttons", async ({ page }) => {
    await expect(page.locator("button[data-tour='leads-import-btn']").first()).toBeVisible();
    await expect(page.locator("button:has-text('Add Lead')").first()).toBeVisible();
  });

  test("shows 0 leads count in sub-header", async ({ page }) => {
    await expect(page.locator("text=0 leads").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── State 2: Populated list ────────────────────────────────────────────────────

test.describe("Leads — populated list", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/leads**", LEADS_RESPONSE);
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("renders all three leads in table", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName} ${MOCK_LEAD_HOT.lastName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_WARM.firstName} ${MOCK_LEAD_WARM.lastName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_COLD.firstName} ${MOCK_LEAD_COLD.lastName}`).first()).toBeVisible();
  });

  test("shows score badges with correct labels", async ({ page }) => {
    const badges = page.locator("[data-testid='lead-score-badge']");
    await expect(badges).toHaveCount(3);
    await expect(badges.filter({ hasText: "hot" }).first()).toBeVisible();
    await expect(badges.filter({ hasText: "warm" }).first()).toBeVisible();
    await expect(badges.filter({ hasText: "cold" }).first()).toBeVisible();
  });

  test("shows '3 leads · 1 hot' in header", async ({ page }) => {
    await expect(page.locator("text=3 leads").first()).toBeVisible();
    await expect(page.locator("text=1 hot").first()).toBeVisible();
  });

  test("score filter — clicking 'hot' shows only hot lead", async ({ page }) => {
    // Score filter buttons in filter row — click the last one (avoids the header nav)
    await page.locator("button:has-text('hot')").last().click();
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_WARM.firstName}`)).not.toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_COLD.firstName}`)).not.toBeVisible();
  });

  test("search input accepts text and page stays on /leads", async ({ page }) => {
    await page.locator("input[placeholder*='Search']").fill(MOCK_LEAD_HOT.firstName);
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("select-all checkbox selects all rows and shows bulk bar", async ({ page }) => {
    const selectAllCheckbox = page.locator("thead input[type='checkbox']").first();
    await selectAllCheckbox.check();
    await expect(page.locator("text=3 selected").first()).toBeVisible();
  });

  test("bulk action bar shows 'Add to Campaign' after selection", async ({ page }) => {
    await page.locator("thead input[type='checkbox']").first().check();
    await expect(page.locator("button:has-text('Add to Campaign')").first()).toBeVisible();
  });
});

// ── State 3: Error ─────────────────────────────────────────────────────────────

test.describe("Leads — error state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/leads**", LEADS_ERROR, { status: 500 });
    await authenticate(page);
    await page.goto("/leads");
  });

  test("shows error banner with message", async ({ page }) => {
    await expect(page.locator("[data-testid='leads-error-banner']")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Could not load leads")).toBeVisible();
  });

  test("does not show skeleton while error is visible", async ({ page }) => {
    await page.waitForSelector("[data-testid='leads-error-banner']");
    await expect(page.locator("[data-testid='leads-skeleton']")).not.toBeVisible();
  });
});

// ── State 4: Loading skeleton ─────────────────────────────────────────────────

test.describe("Leads — loading skeleton", () => {
  test("shows skeleton card while request is pending", async ({ page }) => {
    // Never fulfill — page stays in loading state
    await page.route("**/v1/leads**", () => { /* intentionally pending */ });
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator("[data-testid='leads-skeleton']")).toBeVisible({ timeout: 10_000 });
  });
});

// ── Workspace isolation ────────────────────────────────────────────────────────

test.describe("Leads — workspace isolation", () => {
  test("API request carries X-Workspace-ID header matching mock user", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/leads**", async (route) => {
      capturedHeaders = route.request().headers();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LEADS_EMPTY) });
    });
    await authenticate(page);
    await page.goto("/leads");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test.describe("Leads — navigation", () => {
  test("lead row link navigates to /leads/:id", async ({ page }) => {
    // Register the detail endpoint FIRST so it takes priority over the list pattern.
    await page.route(`**/v1/leads/${MOCK_LEAD_HOT.id}`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(RAW_LEAD_HOT) });
    });
    await mockApi(page, "**/v1/leads**", LEADS_RESPONSE);
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
    await page.locator(`a[href='/leads/${MOCK_LEAD_HOT.id}']`).first().click();
    await page.waitForURL(new RegExp(MOCK_LEAD_HOT.id), { timeout: 10_000 });
    await expect(page).toHaveURL(new RegExp(MOCK_LEAD_HOT.id));
  });
});

test.describe("Leads — auth guard", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access redirects to sign-in", async ({ page }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/sign-in/);
  });
});

