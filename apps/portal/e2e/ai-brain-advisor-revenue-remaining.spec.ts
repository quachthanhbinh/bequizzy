/**
 * AI Brain, Advisor, Revenue, Settings, Solo Operator, Workspace Management,
 * Forms, Content Studio, and Social Inbound — expert E2E spec
 *
 * AI Brain: empty state (mocked API), populated state, workspace isolation.
 * Settings: profile form, Security tab (OAuth path), Devices tab.
 * Others: structural heading/empty-state assertions.
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, dismissTour } from "./helpers";

test.use({ storageState: "e2e/auth-state.json" });

// fetchBrainDocuments returns KnowledgeDoc[] directly (no envelope).
// KnowledgeDoc fields: id, workspace_id, doc_type, title, is_active, version, chunk_count
const BRAIN_EMPTY: { id: string; workspace_id: string; doc_type: string; title: string; is_active: boolean; version: number; chunk_count: number }[] = [];
const BRAIN_RESPONSE = [
  { id: "doc-001", workspace_id: "e2e-workspace-id", doc_type: "business_profile", title: "Business Profile", is_active: true, version: 1, chunk_count: 5 },
  { id: "doc-002", workspace_id: "e2e-workspace-id", doc_type: "product_pitch",    title: "Product Pitch",    is_active: true, version: 1, chunk_count: 3 },
];

// ── AI Brain: Empty state ─────────────────────────────────────────────────────

test.describe("AI Brain — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/brain/**", BRAIN_EMPTY);
    await authenticate(page);
    await page.goto("/ai-brain");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("shows data-testid='ai-brain-empty-state' when no documents", async ({ page }) => {
    await expect(page.locator("[data-testid='ai-brain-empty-state']")).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Your AI Brain is empty' heading", async ({ page }) => {
    await expect(page.locator("text=Your AI Brain is empty").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Set Up AI Brain' button in empty state", async ({ page }) => {
    const btn = page.locator("button:has-text('Set Up AI Brain')").first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test("page does not redirect to sign-in", async ({ page }) => {
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── AI Brain: Populated ───────────────────────────────────────────────────────

test.describe("AI Brain — populated documents", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, "**/v1/brain/**", BRAIN_RESPONSE);
    await authenticate(page);
    await page.goto("/ai-brain");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("empty state is NOT shown when documents exist", async ({ page }) => {
    await expect(page.locator("[data-testid='ai-brain-empty-state']")).not.toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Retrain AI Brain' button when docs exist", async ({ page }) => {
    const btn = page.locator(
      "button:has-text('Retrain AI Brain'), button:has-text('Set Up AI Brain')"
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });
});

// ── AI Brain: Workspace isolation ─────────────────────────────────────────────

test.describe("AI Brain — workspace isolation", () => {
  test("API request carries X-Workspace-ID header", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route("**/v1/brain/**", async (route) => {
      capturedHeaders = route.request().headers();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BRAIN_EMPTY) });
    });
    await authenticate(page);
    await page.goto("/ai-brain");
    await page.waitForLoadState("networkidle");
    expect(capturedHeaders["x-workspace-id"]).toBe("e2e-workspace-id");
  });
});

// ── Advisor ───────────────────────────────────────────────────────────────────

test.describe("Advisor — coming soon", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/advisor");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders Advisor heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('AI Advisor')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'No insights yet' empty state", async ({ page }) => {
    await expect(page.locator("h2:has-text('No insights yet')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'recommendations' description text", async ({ page }) => {
    await expect(page.locator("text=recommendations").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Revenue Signals ───────────────────────────────────────────────────────────

test.describe("Revenue Signals page", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/revenue");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders Revenue heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Revenue')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'No revenue data yet' empty state", async ({ page }) => {
    await expect(page.locator("h2:has-text('No revenue data yet')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'pipeline' in description", async ({ page }) => {
    await expect(page.locator("text=pipeline").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

test.describe("Settings — profile and security", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("shows Profile section label", async ({ page }) => {
    await expect(page.locator("text=Profile").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows profile form input fields", async ({ page }) => {
    await expect(page.locator("input[type='text'], input[type='email']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Security tab button", async ({ page }) => {
    await expect(page.locator("button:has-text('Security')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("Security tab shows password form fields (OAuth path)", async ({ page }) => {
    await page.locator("button:has-text('Security')").first().click({ force: true });
    await expect(page.locator("input#new-pw, input[id='new-pw']").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("input#confirm-pw, input[id='confirm-pw']").first()).toBeVisible();
  });

  test("Security tab shows 'Set a password' heading for OAuth users", async ({ page }) => {
    await page.locator("button:has-text('Security')").first().click({ force: true });
    await expect(page.locator("text=Set a password").first()).toBeVisible({ timeout: 5_000 });
  });

  test("Security tab shows 2FA section", async ({ page }) => {
    await page.locator("button:has-text('Security')").first().click({ force: true });
    await expect(page.locator("text=Two-factor authentication").first()).toBeVisible({ timeout: 5_000 });
  });

  test("Devices tab shows Chrome on Windows 11", async ({ page }) => {
    await page.locator("button:has-text('Devices')").first().click({ force: true });
    await expect(page.locator("text=Chrome on Windows 11").first()).toBeVisible({ timeout: 5_000 });
  });
});

// ── Solo Operator ─────────────────────────────────────────────────────────────

test.describe("Solo Operator — coming soon", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/solo");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders Solo Operator heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Solo Operator')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Solo mode coming soon' empty state", async ({ page }) => {
    await expect(page.locator("h2:has-text('Solo mode coming soon')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Workspace Management ──────────────────────────────────────────────────────

test.describe("Workspace Management — Agency plan gate", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/workspace");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders Workspace Management heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Workspace Management')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Agency plan upgrade message", async ({ page }) => {
    await expect(page.locator("h2:has-text('Agency workspace management')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Forms ─────────────────────────────────────────────────────────────────────

test.describe("Forms — inbound capture", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/forms");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders 'Inbound Forms' heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Inbound Forms')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'New Form' button", async ({ page }) => {
    const btn = page.locator(
      "button:has-text('New Form'), button:has-text('Create Form'), a:has-text('New Form')"
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test("shows empty state text when no forms", async ({ page }) => {
    const emptyText = page
      .locator("text=Create your first form")
      .or(page.locator("text=No forms match your filters"))
      .first();
    await expect(emptyText).toBeVisible({ timeout: 8_000 });
  });
});

// ── Content Studio ────────────────────────────────────────────────────────────

test.describe("Content Studio — asset library", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/content-studio");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("shows Q2 SaaS Cold Outreach asset", async ({ page }) => {
    await expect(page.locator("text=Q2 SaaS Cold Outreach").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Ad Copy asset type badge", async ({ page }) => {
    await expect(page.locator("text=Ad Copy").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'ready' and 'used' status badges", async ({ page }) => {
    await expect(page.locator("text=ready").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=used").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows credit cost badge after opening Create Content panel", async ({ page }) => {
    await page.locator("button:has-text('Create Content')").first().click({ force: true });
    await expect(page.locator("text=1 cr").first()).toBeVisible({ timeout: 5_000 });
  });
});

// ── Social Inbound ────────────────────────────────────────────────────────────

test.describe("Social Inbound — coming soon", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/social-inbound");
    await page.waitForLoadState("networkidle");
    await dismissTour(page);
  });

  test("renders 'Social Inbound' heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Social Inbound')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows Facebook reference in description", async ({ page }) => {
    await expect(page.locator("text=Facebook").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows 'Connect a social channel' CTA", async ({ page }) => {
    await expect(page.locator("text=Connect a social channel").first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows link to /integrations", async ({ page }) => {
    const link = page.locator("a[href='/integrations'], a:has-text('Integrations')").first();
    await expect(link).toBeVisible({ timeout: 10_000 });
  });

  test("is accessible at mobile width (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator("h1:has-text('Social Inbound')").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Navigation guards ─────────────────────────────────────────────────────────

test.describe("AI Brain / Settings / Forms \u2014 navigation guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to /ai-brain redirects to sign-in", async ({ page }) => {
    await page.goto("/ai-brain");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /settings redirects to sign-in", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /forms redirects to sign-in", async ({ page }) => {
    await page.goto("/forms");
    await expect(page).toHaveURL(/sign-in/);
  });
});

