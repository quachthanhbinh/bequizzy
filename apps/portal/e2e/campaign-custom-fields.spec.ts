/**
 * Campaign Custom Fields Tab — E2E spec
 *
 * Covers:
 * - "Custom Fields" tab appears in campaign detail navigation
 * - Empty state when no campaign-scoped fields defined
 * - Campaign-scoped fields shown in table
 * - Workspace-global fields shown in read-only table below
 * - "Add field" button shows the inline form
 * - Submitting the form fires POST /v1/leads/custom-fields
 * - Edit button switches row to edit mode
 * - Save in edit mode fires PATCH /v1/leads/custom-fields/{id}
 * - Delete button (with confirm) fires DELETE
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, waitForApi } from "./helpers";
import {
  CAMPAIGNS_RESPONSE,
  MOCK_CAMPAIGN_ACTIVE,
} from "./fixtures/campaigns";
import {
  CUSTOM_FIELDS_CAMPAIGN_RESPONSE,
  CUSTOM_FIELDS_EMPTY,
  MOCK_CF_DEAL_SIZE,
  MOCK_CF_PAIN_POINT,
  MOCK_CF_GLOBAL_NOTES,
} from "./fixtures/customFields";

test.use({ storageState: "e2e/auth-state.json" });

const CAMPAIGN_ID = MOCK_CAMPAIGN_ACTIVE.id;

/** Raw campaign object for the single-campaign endpoint */
const RAW_CAMPAIGN_ACTIVE = {
  id: CAMPAIGN_ID,
  name: MOCK_CAMPAIGN_ACTIVE.name,
  description: MOCK_CAMPAIGN_ACTIVE.description,
  status: "active",
  ai_generated: false,
  lead_count: 124,
  sent_count: 248,
  open_rate: 0.42,
  reply_rate: 0.18,
  meeting_count: 7,
  created_at: "2025-02-01T00:00:00Z",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function gotoCustomFieldsTab(
  page: Parameters<typeof mockApi>[0],
  customFieldsResponse = CUSTOM_FIELDS_CAMPAIGN_RESPONSE,
) {
  // Playwright LIFO: last registered wins — register general routes first, specific last
  await mockApi(page, `**/v1/campaigns**`, CAMPAIGNS_RESPONSE);
  await mockApi(page, `**/v1/campaigns/${CAMPAIGN_ID}**`, RAW_CAMPAIGN_ACTIVE);
  await mockApi(page, `**/v1/leads/custom-fields**`, customFieldsResponse);
  await authenticate(page);
  await page.goto(`/campaigns/${CAMPAIGN_ID}`);
  await expect(page.locator(`text=${MOCK_CAMPAIGN_ACTIVE.name}`).first()).toBeVisible({ timeout: 10_000 });
  // Click the Custom Fields tab
  await page.locator("button:has-text('Custom Fields')").first().click();
  // Wait for the tab content to be visible
  await expect(
    page.locator("text=Campaign-specific fields").first()
  ).toBeVisible({ timeout: 5_000 });
}

// ── Tab navigation ─────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — navigation", () => {
  test("'Custom Fields' tab is present in campaign detail", async ({ page }) => {
    // Playwright LIFO: last registered wins
    await mockApi(page, `**/v1/campaigns**`, CAMPAIGNS_RESPONSE);
    await mockApi(page, `**/v1/campaigns/${CAMPAIGN_ID}**`, RAW_CAMPAIGN_ACTIVE);
    await mockApi(page, `**/v1/leads/custom-fields**`, CUSTOM_FIELDS_EMPTY);
    await authenticate(page);
    await page.goto(`/campaigns/${CAMPAIGN_ID}`);
    await expect(page.locator("button:has-text('Custom Fields')").first()).toBeVisible({ timeout: 10_000 });
  });

  test("clicking Custom Fields tab renders the section header", async ({ page }) => {
    await gotoCustomFieldsTab(page, CUSTOM_FIELDS_EMPTY);
    await expect(page.locator("text=Campaign-specific fields").first()).toBeVisible();
  });
});

// ── Empty state ────────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — empty state", () => {
  test("shows 'No campaign-specific fields yet.' when none defined", async ({ page }) => {
    await gotoCustomFieldsTab(page, CUSTOM_FIELDS_EMPTY);
    await expect(
      page.locator("text=No campaign-specific fields yet").first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("shows 'Add field' button in empty state", async ({ page }) => {
    await gotoCustomFieldsTab(page, CUSTOM_FIELDS_EMPTY);
    await expect(page.locator("button:has-text('Add field')").first()).toBeVisible();
  });
});

// ── Populated state ────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — populated state", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCustomFieldsTab(page);
  });

  test("shows campaign-scoped field names in table", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_CF_DEAL_SIZE.name}`).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${MOCK_CF_PAIN_POINT.name}`).first()).toBeVisible();
  });

  test("shows field keys in table", async ({ page }) => {
    await expect(page.locator(`text=${MOCK_CF_DEAL_SIZE.key}`).first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows field types", async ({ page }) => {
    // 'Number' type for deal_size_usd
    await expect(page.locator("text=Number").first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows Required badge for required fields", async ({ page }) => {
    // pain_point is required
    await expect(page.locator("text=Yes").first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows workspace-global fields in read-only section", async ({ page }) => {
    await expect(page.locator("text=Workspace-wide fields").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${MOCK_CF_GLOBAL_NOTES.name}`).first()).toBeVisible();
  });

  test("Edit and Delete buttons are present for campaign-scoped fields", async ({ page }) => {
    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.name}')`).first();
    await expect(row.locator("button:has-text('Edit')")).toBeVisible({ timeout: 5_000 });
    await expect(row.locator("button:has-text('Delete')")).toBeVisible();
  });
});

// ── Add field form ─────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — add field", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCustomFieldsTab(page, CUSTOM_FIELDS_EMPTY);
  });

  test("clicking 'Add field' shows the inline form", async ({ page }) => {
    await page.locator("button:has-text('Add field')").first().click();
    // Actual placeholder is "e.g. Deal size (USD)"
    await expect(page.locator("input[placeholder*='Deal size']").first()).toBeVisible({ timeout: 3_000 });
  });

  test("form has a type dropdown with Text as default", async ({ page }) => {
    await page.locator("button:has-text('Add field')").first().click();
    const typeSelect = page.locator("select").first();
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveValue("text");
  });

  test("selecting 'select' type shows options input", async ({ page }) => {
    await page.locator("button:has-text('Add field')").first().click();
    await page.locator("select").first().selectOption("select");
    await expect(page.locator("input[placeholder*='Option']").first()).toBeVisible({ timeout: 3_000 });
  });

  test("submitting form fires POST /v1/leads/custom-fields", async ({ page }) => {
    // Use a single combined route handler: capture body + fulfill response.
    // waitForApi + mockApi combo breaks with LIFO (mockApi registered last wins, 
    // so waitForApi's route handler is never called).
    let capturedBody: Record<string, unknown> | null = null;
    await page.route(`**/v1/leads/custom-fields**`, (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        capturedBody = JSON.parse(req.postData() ?? "{}");
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "cf-new-001",
            workspace_id: "e2e-workspace-id",
            campaign_id: CAMPAIGN_ID,
            name: "Budget USD",
            key: "budget_usd",
            field_type: "text",
            options: [],
            required: false,
            position: 0,
            created_at: "2025-05-18T00:00:00Z",
          }),
        });
      } else {
        // Pass non-POST requests to the beforeEach GET mock
        route.continue();
      }
    });

    await page.locator("button:has-text('Add field')").first().click();
    const nameInput = page.locator("input[placeholder*='Deal size']").first();
    await nameInput.fill("Budget USD");
    await nameInput.press("Enter");

    // Wait for form to close — confirms successful submission
    await expect(nameInput).not.toBeVisible({ timeout: 5_000 });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody).toMatchObject({ name: "Budget USD", field_type: "text" });
  });

  test("Cancel button hides the form", async ({ page }) => {
    await page.locator("button:has-text('Add field')").first().click();
    await expect(page.locator("input[placeholder*='Deal size']").first()).toBeVisible();
    await page.locator("button:has-text('Cancel')").first().click();
    await expect(page.locator("input[placeholder*='Deal size']")).not.toBeVisible({ timeout: 3_000 });
  });
});

// ── Inline edit ────────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — edit field", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCustomFieldsTab(page);
  });

  test("clicking Edit shows row edit form with current name", async ({ page }) => {
    // Use the key (always visible text) as the row selector — stable in both display and edit mode
    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.key}')`).first();
    await row.locator("button:has-text('Edit')").click();
    const nameInput = row.locator("input[type='text']").first();
    await expect(nameInput).toBeVisible({ timeout: 3_000 });
    await expect(nameInput).toHaveValue(MOCK_CF_DEAL_SIZE.name);
  });

  test("editing name and saving fires PATCH", async ({ page }) => {
    const patchRequest = waitForApi(
      page,
      `**/v1/leads/custom-fields/${MOCK_CF_DEAL_SIZE.id}`,
      "PATCH",
    );

    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.key}')`).first();
    await row.locator("button:has-text('Edit')").click();
    const nameInput = row.locator("input[type='text']").first();
    await nameInput.fill("Deal Size (EUR)");
    await row.locator("button:has-text('Save')").click();

    const req = await patchRequest;
    const body = JSON.parse(req.postData() ?? "{}");
    expect(body).toMatchObject({ name: "Deal Size (EUR)" });
  });

  test("Cancel in edit mode reverts name without saving", async ({ page }) => {
    // Use the key (always visible) as the stable row selector
    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.key}')`).first();
    await row.locator("button:has-text('Edit')").click();
    await row.locator("input[type='text']").first().fill("Changed Name");
    await row.locator("button:has-text('Cancel')").click();
    // Row should show original name again as text (no longer in edit mode)
    await expect(row.locator(`text=${MOCK_CF_DEAL_SIZE.name}`).first()).toBeVisible({ timeout: 3_000 });
  });
});

// ── Delete field ───────────────────────────────────────────────────────────────

test.describe("Campaign Custom Fields Tab — delete field", () => {
  test("clicking Delete and confirming fires DELETE request", async ({ page }) => {
    await gotoCustomFieldsTab(page);

    const deleteRequest = waitForApi(
      page,
      `**/v1/leads/custom-fields/${MOCK_CF_DEAL_SIZE.id}`,
      "DELETE",
    );

    // Set up window.confirm to auto-accept
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.name}')`).first();
    await row.locator("button:has-text('Delete')").click();

    // Should have fired the DELETE
    await deleteRequest;
  });

  test("clicking Delete and cancelling does not fire DELETE", async ({ page }) => {
    await gotoCustomFieldsTab(page);

    let deleteCalled = false;
    await page.route(`**/v1/leads/custom-fields/${MOCK_CF_DEAL_SIZE.id}`, (route) => {
      if (route.request().method() === "DELETE") deleteCalled = true;
      route.fulfill({ status: 204, body: "" });
    });

    // Auto-reject confirm
    await page.evaluate(() => {
      window.confirm = () => false;
    });

    const row = page.locator(`tr:has-text('${MOCK_CF_DEAL_SIZE.name}')`).first();
    await row.locator("button:has-text('Delete')").click();
    await page.waitForTimeout(500);
    expect(deleteCalled).toBe(false);
  });
});
