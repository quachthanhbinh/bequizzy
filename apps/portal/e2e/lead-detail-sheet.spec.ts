/**
 * Lead Detail Sheet — E2E spec
 *
 * Covers:
 * - Clicking a table row opens the right-side sheet
 * - Sheet renders lead name, email, status, score
 * - Inline editing: clicking a field shows an input
 * - Saving a field fires PATCH /v1/leads/{id}
 * - Escape key closes the sheet
 * - Backdrop click closes the sheet
 * - Custom Fields tab shows applicable definitions
 * - Activity tab shows empty state when no activities
 */
import { test, expect } from "@playwright/test";
import { authenticate, mockApi, waitForApi } from "./helpers";
import {
  LEADS_RESPONSE,
  MOCK_LEAD_HOT,
  RAW_LEAD_HOT,
} from "./fixtures/leads";
import {
  CUSTOM_FIELDS_CAMPAIGN_RESPONSE,
  CUSTOM_FIELDS_EMPTY,
  MOCK_CF_DEAL_SIZE,
  MOCK_CF_PAIN_POINT,
  MOCK_CF_GLOBAL_NOTES,
} from "./fixtures/customFields";

test.use({ storageState: "e2e/auth-state.json" });

/** Full snake_case raw lead including all new fields for the GET /v1/leads/{id} endpoint */
const RAW_LEAD_HOT_FULL = {
  ...RAW_LEAD_HOT,
  phone: "+84-912-345-678",
  linkedin_url: "https://linkedin.com/in/ana-nguyen",
  industry: "SaaS",
  company_size: "11-50",
  website: "https://acmevn.com",
  city: "Hanoi",
  timezone: "Asia/Ho_Chi_Minh",
  notes: "Met at SaaS SEA summit",
  enrichment_status: "enriched",
  source_campaign_id: "camp-00000001",
  custom_fields: { deal_size_usd: 25000, pain_point: "Speed" },
  updated_at: "2025-06-01T00:00:00Z",
  score_label: "Hot",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function setupLeadsPage(page: Parameters<typeof mockApi>[0]) {
  // Playwright LIFO: last registered wins — register general routes first, specific last
  await mockApi(page, `**/v1/leads**`, LEADS_RESPONSE);
  await mockApi(page, `**/v1/leads/custom-fields**`, CUSTOM_FIELDS_CAMPAIGN_RESPONSE);
  await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}**`, RAW_LEAD_HOT_FULL);
  await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}/activities**`, []);
  await authenticate(page);
  await page.goto("/leads");
  await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
}

// ── Opening the sheet ─────────────────────────────────────────────────────────

test.describe("Lead Detail Sheet — open / close", () => {
  test("clicking a table row opens the sheet", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
  });

  test("sheet shows lead full name and email", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator(`text=${MOCK_LEAD_HOT.firstName} ${MOCK_LEAD_HOT.lastName}`).first()).toBeVisible();
    await expect(dialog.locator(`text=${MOCK_LEAD_HOT.email}`).first()).toBeVisible();
  });

  test("sheet shows score and status badges", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator("text=hot").first()).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator("text=verified").first()).toBeVisible();
  });

  test("Escape key closes the sheet", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 3_000 });
  });

  test("clicking the backdrop closes the sheet", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
    // Click the backdrop (aria-hidden overlay)
    await page.locator("[aria-hidden='true']").first().click({ position: { x: 10, y: 10 } });
    await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 3_000 });
  });

  test("close button (×) closes the sheet", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
    await page.locator("[aria-label='Close']").first().click();
    await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 3_000 });
  });
});

// ── Details tab — inline editing ──────────────────────────────────────────────

test.describe("Lead Detail Sheet — inline field editing", () => {
  test.beforeEach(async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
  });

  test("clicking Company value shows an input", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    // Click the Company field button (editable area)
    await dialog.locator("button:has-text('Acme VN')").first().click();
    await expect(dialog.locator("input[type='text']").first()).toBeVisible();
  });

  test("editing Company and pressing Enter fires PATCH", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    const patchRequest = waitForApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}`, "PATCH");

    await dialog.locator("button:has-text('Acme VN')").first().click();
    const input = dialog.locator("input[type='text']").first();
    await input.fill("Acme Global");
    await input.press("Enter");

    const req = await patchRequest;
    const body = JSON.parse(req.postData() ?? "{}");
    expect(body).toMatchObject({ company: "Acme Global" });
  });

  test("pressing Escape on input cancels edit without saving", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    await dialog.locator("button:has-text('Acme VN')").first().click();
    const input = dialog.locator("input[type='text']").first();
    await input.fill("Should not save");
    await input.press("Escape");
    // Input gone, original value restored
    await expect(dialog.locator("button:has-text('Acme VN')").first()).toBeVisible();
    await expect(dialog.locator("input[type='text']")).not.toBeVisible();
  });

  test("phone field shows 'Click to edit' placeholder when empty", async ({ page }) => {
    // Fresh setup with phone=null
    await mockApi(page, `**/v1/leads**`, LEADS_RESPONSE);
    await mockApi(page, `**/v1/leads/custom-fields**`, CUSTOM_FIELDS_CAMPAIGN_RESPONSE);
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}**`, {
      ...RAW_LEAD_HOT_FULL,
      phone: null,
    });
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}/activities**`, []);
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5_000 });
    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator("text=Click to edit").first()).toBeVisible();
  });
});

// ── Custom Fields tab ─────────────────────────────────────────────────────────

test.describe("Lead Detail Sheet — Custom Fields tab", () => {
  test.beforeEach(async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator("button:has-text('Custom Fields')").first().click();
  });

  test("shows campaign-scoped custom field names", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator(`text=${MOCK_CF_DEAL_SIZE.name}`).first()).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator(`text=${MOCK_CF_PAIN_POINT.name}`).first()).toBeVisible();
  });

  test("shows workspace-global custom field", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator(`text=${MOCK_CF_GLOBAL_NOTES.name}`).first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows existing custom field value", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    // deal_size_usd = 25000, pain_point = "Speed"
    await expect(dialog.locator("text=25000").first()).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator("text=Speed").first()).toBeVisible();
  });

  test("clicking a custom field value shows input", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    // Deal size is a number field — click the "25000" value
    await dialog.locator("button:has-text('25000')").first().click();
    await expect(dialog.locator("input[type='number']").first()).toBeVisible();
  });

  test("editing a custom field fires PATCH to /custom-fields endpoint", async ({ page }) => {
    const dialog = page.locator("[role='dialog']");
    const patchRequest = waitForApi(
      page,
      `**/v1/leads/${MOCK_LEAD_HOT.id}/custom-fields`,
      "PATCH",
    );

    await dialog.locator("button:has-text('25000')").first().click();
    const input = dialog.locator("input[type='number']").first();
    await input.fill("30000");
    await input.press("Enter");

    const req = await patchRequest;
    const body = JSON.parse(req.postData() ?? "{}");
    expect(body).toMatchObject({ deal_size_usd: 30000 });
  });

  test("shows empty state when no custom fields defined", async ({ page }) => {
    // Fresh page setup with empty custom fields
    await mockApi(page, `**/v1/leads**`, LEADS_RESPONSE);
    await mockApi(page, `**/v1/leads/custom-fields**`, CUSTOM_FIELDS_EMPTY);
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}**`, {
      ...RAW_LEAD_HOT_FULL,
      source_campaign_id: null,
      custom_fields: {},
    });
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}/activities**`, []);
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    await page.locator("[role='dialog']").locator("button:has-text('Custom Fields')").first().click();
    await expect(
      page.locator("[role='dialog']").locator("text=No custom fields defined").first()
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ── Activity tab ──────────────────────────────────────────────────────────────

test.describe("Lead Detail Sheet — Activity tab", () => {
  test("shows empty state when no activities", async ({ page }) => {
    await setupLeadsPage(page);
    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator("button:has-text('Activity')").first().click();
    await expect(dialog.locator("text=No activity yet").first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows activity items when present", async ({ page }) => {
    // Playwright LIFO: last registered wins — general routes first, specific last
    await mockApi(page, `**/v1/leads**`, LEADS_RESPONSE);
    await mockApi(page, `**/v1/leads/custom-fields**`, CUSTOM_FIELDS_EMPTY);
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}**`, RAW_LEAD_HOT_FULL);
    await mockApi(page, `**/v1/leads/${MOCK_LEAD_HOT.id}/activities**`, [
      {
        id: "act-001",
        activity_type: "email_sent",
        metadata: {},
        actor_user_id: null,
        created_at: "2025-05-01T10:00:00Z",
      },
      {
        id: "act-002",
        activity_type: "replied",
        metadata: {},
        actor_user_id: null,
        created_at: "2025-05-02T08:00:00Z",
      },
    ]);
    await authenticate(page);
    await page.goto("/leads");
    await expect(page.locator(`text=${MOCK_LEAD_HOT.firstName}`).first()).toBeVisible({ timeout: 10_000 });

    await page.locator(`tr:has-text('${MOCK_LEAD_HOT.firstName}')`).first().click();
    const dialog = page.locator("[role='dialog']");
    await dialog.locator("button:has-text('Activity')").first().click();
    await expect(dialog.locator("text=email sent").first()).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator("text=replied").first()).toBeVisible();
  });
});
