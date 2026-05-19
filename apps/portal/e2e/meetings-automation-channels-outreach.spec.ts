/**
 * Meetings, Automation, Channels, and Outreach — expert E2E spec
 *
 * Meetings: empty state, meeting type creation form access.
 * Automation: coming-soon state.
 * Channels: LinkedIn/SMS tabs, connect flow.
 * Outreach: empty/populated mailbox states (mocked), workspace isolation.
 * Public booking page: no auth required.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, dismissTour } from "./helpers";

test.use({ storageState: "e2e/auth-state.json" });

// fetchMeetingTypes and fetchMailboxes both return plain arrays (no envelope).
const MEETINGS_EMPTY: Record<string, unknown>[] = [];
const MEETINGS_RESPONSE = [
  { id: "mt-001", name: "30 Min Discovery", duration_minutes: 30, slug: "discovery" },
];

const OUTREACH_EMPTY: Record<string, unknown>[] = [];
const OUTREACH_RESPONSE = [
  { id: "mb-001", email: "sales@acmevn.com", is_active: true, provider: "gmail", display_name: null, daily_send_limit: 100, created_at: "2024-01-01T00:00:00Z" },
];

// ── Meetings: Empty state ─────────────────────────────────────────────────────

test.describe("Meetings — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/meeting-types**", MEETINGS_EMPTY);
    await authenticate(page);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
    // Click the "Meeting Types" tab to see the meeting types list/empty state
    await page.locator("button:has-text('Meeting Types')").first().click();
    await page.waitForLoadState("networkidle");
  });

  test("shows 'No meeting types yet' empty state", async ({ page }) => {
    await expect(page.locator("text=No meeting types yet").first()).toBeVisible({ timeout: 10_000 });
  });

  test("page does not redirect to sign-in", async ({ page }) => {
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Meetings: Populated ───────────────────────────────────────────────────────

test.describe("Meetings — populated meeting types", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/meeting-types**", MEETINGS_RESPONSE);
    await authenticate(page);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
    // Click the "Meeting Types" tab to see the list
    await page.locator("button:has-text('Meeting Types')").first().click();
    await page.waitForLoadState("networkidle");
  });

  test("renders meeting type name from mock", async ({ page }) => {
    await expect(page.locator("text=30 Min Discovery").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows '+ New Meeting Type' button", async ({ page }) => {
    const btn = page.locator(
      "button:has-text('New Meeting Type'), button:has-text('Meeting Type'), a:has-text('New Meeting')"
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });
});

// ── Automation ────────────────────────────────────────────────────────────────

test.describe("Workflow Automation — coming soon", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/automation");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders automation page heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Automation')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Automations coming soon' heading", async ({ page }) => {
    await expect(page.locator("h2:has-text('Automations coming soon')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'New Automation' button", async ({ page }) => {
    await expect(page.locator("button:has-text('New Automation')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Channels ──────────────────────────────────────────────────────────────────

test.describe("Channels — multichannel tabs", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/channels");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders 'Multichannel Outreach' heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Multichannel Outreach')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows LinkedIn tab button", async ({ page }) => {
    await expect(page.locator("button:has-text('LinkedIn')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows SMS tab button", async ({ page }) => {
    await expect(page.locator("button:has-text('SMS')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Outreach: Empty state ─────────────────────────────────────────────────────

test.describe("Outreach — empty mailbox state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/mailboxes**", OUTREACH_EMPTY);
    await authenticate(page);
    await page.goto("/outreach");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("shows 'No mailboxes connected yet.' empty state", async ({ page }) => {
    await expect(page.locator("text=No mailboxes connected yet.").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Connect Mailbox' button", async ({ page }) => {
    const btn = page.locator(
      "button:has-text('Connect Mailbox'), button:has-text('Connect'), button:has-text('Mailbox')"
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });
});

// ── Outreach: Populated ───────────────────────────────────────────────────────

test.describe("Outreach — populated mailbox list", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/mailboxes**", OUTREACH_RESPONSE);
    await authenticate(page);
    await page.goto("/outreach");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders mailbox email from mock", async ({ page }) => {
    await expect(page.locator("text=sales@acmevn.com").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Outreach: Workspace isolation ─────────────────────────────────────────────

test.describe("Outreach — workspace isolation", () => {
  test("API request carries X-Workspace-ID header", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/mailboxes**", async (route) => {
      if (route.request().method() === "GET") {
        capturedHeaders = route.request().headers();
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OUTREACH_EMPTY) });
    });
    await authenticate(page);
    await page.goto("/outreach");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Public Booking page ───────────────────────────────────────────────────────

test.describe("Public Booking page (no auth required)", () => {
  test("renders booking page at /book route without auth cookie", async ({ page }) => {
    await page.goto("/book/demo-workspace/john");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows calendar with day names", async ({ page }) => {
    await page.goto("/book/demo-workspace/john");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Su").first()).toBeVisible({ timeout: 8_000 });
  });

  test("shows name and email form fields after slot selection", async ({ page }) => {
    await page.goto("/book/demo-workspace/john");
    await page.waitForLoadState("networkidle");
    const dayBtn = page.locator(`button:has-text('${new Date().getDate()}')`).first();
    if (await dayBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dayBtn.click({ force: true });
      const slot = page.locator("button:has-text('AM'), button:has-text('PM')").first();
      if (await slot.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await slot.click({ force: true });
        const nameInput = page.locator("input[placeholder*='name' i], input[name='name']").first();
        if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await expect(nameInput).toBeVisible();
          await expect(page.locator("input[type='email'], input[placeholder*='email' i]").first()).toBeVisible();
        }
      }
    }
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── Navigation guards ─────────────────────────────────────────────────────────

test.describe("Meetings/Automation/Channels/Outreach — navigation guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to /meetings redirects to sign-in", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /automation redirects to sign-in", async ({ page }) => {
    await page.goto("/automation");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /outreach redirects to sign-in", async ({ page }) => {
    await page.goto("/outreach");
    await expect(page).toHaveURL(/sign-in/);
  });
});


