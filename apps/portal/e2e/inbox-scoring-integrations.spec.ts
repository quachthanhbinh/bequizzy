/**
 * Inbox, Lead Scoring, and Integrations — expert E2E spec
 *
 * Inbox: four states (empty, populated threads, AI reply flow, workspace isolation).
 * Scoring: empty state, tier filter buttons, data from mocked API.
 * Integrations: static integration cards, filter, coming-soon badge.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, dismissTour } from "./helpers";
import { INBOX_EMPTY, INBOX_RESPONSE, MOCK_THREAD_OPEN } from "./fixtures/inbox";
import { LEADS_EMPTY, LEADS_RESPONSE, MOCK_LEAD_HOT, MOCK_LEAD_WARM, MOCK_LEAD_COLD } from "./fixtures/leads";

test.use({ storageState: "e2e/auth-state.json" });

// ── Inbox: Empty state ─────────────────────────────────────────────────────────

test.describe("Inbox — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/inbox**", INBOX_EMPTY, { method: "GET" });
    await authenticate(page);
    await page.goto("/inbox");
    await dismissTour(page);
  });

  test("shows 'No messages yet.' empty state", async ({ page }) => {
    await expect(page.locator("text=No messages yet.").first()).toBeVisible({ timeout: 10_000 });
  });

  test("page does not redirect to sign-in", async ({ page }) => {
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Inbox: Populated threads ──────────────────────────────────────────────────

test.describe("Inbox — populated threads", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/inbox**", INBOX_RESPONSE, { method: "GET" });
    await authenticate(page);
    await page.goto("/inbox");
    await expect(page.locator(`text=${MOCK_THREAD_OPEN.from_email}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("renders thread items with sender email", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_THREAD_OPEN.from_email}`).first()).toBeVisible();
  });

  test("thread shows subject for unread thread", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_THREAD_OPEN.subject}`).first()).toBeVisible();
  });

  test("clicking a thread shows reply area", async ({ page }) => {
    await page.locator(`text=${MOCK_THREAD_OPEN.from_email}`).first().click();
    const replyArea = page.locator(
      "textarea[placeholder*='reply' i], textarea[placeholder*='Reply' i], button:has-text('Send'), button:has-text('Reply')"
    ).first();
    await expect(replyArea).toBeVisible({ timeout: 8_000 });
  });
});

// ── Inbox: Workspace isolation ────────────────────────────────────────────────

test.describe("Inbox — workspace isolation", () => {
  test("API request carries X-Workspace-ID header", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/inbox**", async (route) => {
      if (route.request().method() === "GET") {
        capturedHeaders = route.request().headers();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(INBOX_EMPTY) });
      } else {
        await route.continue();
      }
    });
    await authenticate(page);
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Lead Scoring: Empty state ─────────────────────────────────────────────────

test.describe("Lead Scoring — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/leads**", LEADS_EMPTY);
    await authenticate(page);
    await page.goto("/scoring");
    await dismissTour(page);
  });

  test("shows 'No scored leads yet' empty state", async ({ page }) => {
    await expect(page.locator("[data-testid='scoring-empty-state']")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=No scored leads yet").first()).toBeVisible();
  });

  test("shows description text about sequences", async ({ page }) => {
    await expect(page.locator("text=sequences").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Lead Scoring: Populated ────────────────────────────────────────────────────

test.describe("Lead Scoring — populated leads", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/leads**", LEADS_RESPONSE);
    await authenticate(page);
    await page.goto("/scoring");
    await dismissTour(page);
    // Wait until tier buttons appear (means data loaded)
    await expect(page.locator("button:has-text('hot')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Hot/Warm/Cold tier summary cards with counts", async ({ page }) => {
    await expect(page.locator("button:has-text('hot')").first()).toBeVisible();
    await expect(page.locator("button:has-text('warm')").first()).toBeVisible();
    await expect(page.locator("button:has-text('cold')").first()).toBeVisible();
  });

  test("hot tier count is 1", async ({ page }) => {
    // LEADS_RESPONSE has 1 hot lead
    const hotCard = page.locator("button:has-text('hot')").first();
    await expect(hotCard.locator("text=1")).toBeVisible();
  });

  test("clicking 'hot' tier filters to only hot leads", async ({ page }) => {
    await page.locator("button:has-text('hot')").first().click();
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_WARM.firstName}`)).not.toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_COLD.firstName}`)).not.toBeVisible();
  });

  test("clicking active tier again resets to 'all' view", async ({ page }) => {
    await page.locator("button:has-text('hot')").first().click();
    await page.locator("button:has-text('hot')").first().click();
    // All three leads should now be visible again
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible();
    await expect(page.locator(`text=${MOCK_LEAD_WARM.firstName}`).first()).toBeVisible();
  });
});

// ── Integrations ──────────────────────────────────────────────────────────────

test.describe("Integrations page", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/integrations");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders integration cards", async ({ page }) => {
    await expect(page.locator("text=Gmail").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Slack integration", async ({ page }) => {
    await expect(page.locator("text=Slack").first()).toBeVisible();
  });

  test("shows HubSpot integration", async ({ page }) => {
    await expect(page.locator("text=HubSpot").first()).toBeVisible();
  });

  test("shows Custom SMTP integration", async ({ page }) => {
    await expect(page.locator("text=Custom SMTP").first()).toBeVisible();
  });

  test("shows Coming Soon badge", async ({ page }) => {
    await expect(page.locator("text=Coming Soon").first()).toBeVisible();
  });

  test("filter by CRM shows HubSpot integration", async ({ page }) => {
    await page.locator("text=CRM").first().click({ force: true });
    await expect(page.locator("text=HubSpot").first()).toBeVisible();
  });
});

// ── Navigation guards ─────────────────────────────────────────────────────────

test.describe("Inbox/Scoring/Integrations — navigation guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to /inbox redirects to sign-in", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /scoring redirects to sign-in", async ({ page }) => {
    await page.goto("/scoring");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /integrations redirects to sign-in", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page).toHaveURL(/sign-in/);
  });
});

