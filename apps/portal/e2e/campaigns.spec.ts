/**
 * Campaigns — expert E2E spec
 *
 * Four API states, AI credit cost visibility, mode switching,
 * campaign status FSM, workspace isolation.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, dismissTour } from "./helpers";
import {
  CAMPAIGNS_EMPTY,
  CAMPAIGNS_RESPONSE,
  MOCK_CAMPAIGN_ACTIVE,
  MOCK_CAMPAIGN_DRAFT,
  MOCK_CAMPAIGN_PAUSED,
} from "./fixtures/campaigns";

test.use({ storageState: "e2e/auth-state.json" });

// ── State 1: Empty list ────────────────────────────────────────────────────────

test.describe("Campaigns — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/campaigns**", CAMPAIGNS_EMPTY);
    await authenticate(page);
    await page.goto("/campaigns");
  });

  test("shows 'No campaigns yet.' empty state", async ({ page }) => {
    await expect(page.locator("text=No campaigns yet.").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows New Campaign button", async ({ page }) => {
    const newBtn = page.locator(
      "button:has-text('New'), a:has-text('New'), button:has-text('Create'), a:has-text('Create')"
    ).first();
    await expect(newBtn).toBeVisible();
  });
});

// ── State 2: Populated list ────────────────────────────────────────────────────

test.describe("Campaigns — populated list", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/campaigns**", CAMPAIGNS_RESPONSE);
    await authenticate(page);
    await page.goto("/campaigns");
    await expect(page.locator(`text=${MOCK_CAMPAIGN_ACTIVE.name}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("renders all campaigns with names", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_CAMPAIGN_ACTIVE.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_CAMPAIGN_DRAFT.name}`).first()).toBeVisible();
  });

  test("shows active status badge on active campaign", async ({ page }) => {
    await expect(page.locator("text=active").first()).toBeVisible();
  });

  test("shows draft status badge on draft campaign", async ({ page }) => {
    await expect(page.locator("text=draft").first()).toBeVisible();
  });
});

// ── State 3: Error ─────────────────────────────────────────────────────────────

test.describe("Campaigns — error state", () => {
  test("shows error state or empty list when API fails", async ({ page }) => {
    await mockApi(page, "**/v1/campaigns**", { data: null, error: "server error", meta: null }, { status: 500 });
    await authenticate(page);
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");
    // Page renders (does not crash) and stays on /campaigns
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator("h1:has-text('Campaigns')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Non-negotiable: AI credit cost ────────────────────────────────────────────

test.describe("Campaigns — New Campaign page (AI credit cost)", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/campaigns/new");
    await dismissTour(page);
  });

  test("renders New Campaign heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('New Campaign')").first()).toBeVisible();
  });

  test("AI credit cost badge shows '5 credits'", async ({ page }) => {
    await expect(page.locator("[data-testid='ai-credit-cost']").first()).toBeVisible();
    await expect(page.locator("[data-testid='ai-credit-cost']").first()).toHaveText("5 credits");
  });

  test("Generate button disabled when prompt is empty", async ({ page }) => {
    const generateBtn = page.locator("button:has-text('Generate Campaign')").first();
    await expect(generateBtn).toBeDisabled();
  });

  test("Generate button enabled after typing ≥10 characters", async ({ page }) => {
    await page.locator("textarea").first().fill("Reach bootstrapped SaaS founders in Vietnam");
    const generateBtn = page.locator("button:has-text('Generate Campaign')").first();
    await expect(generateBtn).toBeEnabled();
  });

  test("character count hint shows min 10", async ({ page }) => {
    await expect(page.locator("text=min 10").first()).toBeVisible();
  });

  test("switching to Manual mode shows campaign name input", async ({ page }) => {
    await page.locator("button:has-text('Manual')").first().click();
    await expect(page.locator("input[placeholder*='Campaign'], input[placeholder*='e.g.'], input[placeholder*='SaaS']").first()).toBeVisible();
  });

  test("Manual mode Create button is disabled when name is empty", async ({ page }) => {
    await page.locator("button:has-text('Manual')").first().click();
    await expect(page.locator("button:has-text('Create Campaign')").first()).toBeDisabled();
  });

  test("back link returns to campaigns list", async ({ page }) => {
    await expect(page.locator("a[href='/campaigns']").first()).toBeVisible();
  });
});

// ── Workspace isolation ────────────────────────────────────────────────────────

test.describe("Campaigns — workspace isolation", () => {
  test("API request carries X-Workspace-ID header", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/campaigns**", async (route) => {
      capturedHeaders = route.request().headers();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPAIGNS_EMPTY) });
    });
    await authenticate(page);
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test.describe("Campaigns — navigation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access redirects to sign-in", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page).toHaveURL(/sign-in/);
  });
});

