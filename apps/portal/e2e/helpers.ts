/**
 * Shared Playwright helpers for RevLooper portal E2E tests.
 *
 * authenticate()  — tour suppression + storageState cookie (set via test.use)
 * dismissTour()   — safety-net Escape for any live driver.js overlay
 * mockApi()       — intercept API calls with typed mock data
 * waitForApi()    — helper that resolves once a route is hit (returns captured request)
 */
import type { Page, Route, Request } from "@playwright/test";

// ── Tour suppression ──────────────────────────────────────────────────────────

/**
 * Suppress driver.js tour overlays on every page navigation.
 * Auth cookie (rl-auth=1) is injected via storageState — no cookies set here.
 */
export async function authenticate(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const TOUR_KEY = "rl_tour_done";
    const routes = [
      "/dashboard", "/campaigns", "/leads", "/sequences", "/inbox",
      "/crm", "/analytics", "/billing", "/plans", "/meetings",
      "/scoring", "/revenue", "/advisor", "/ai-brain", "/forms",
      "/channels", "/outreach", "/integrations", "/automation",
      "/content-studio", "/solo", "/settings", "/workspace", "/onboarding",
    ];
    for (const r of routes) {
      try { localStorage.setItem(`${TOUR_KEY}:${r}`, "1"); } catch { /* ignore */ }
    }
  });
}

/** Dismiss any driver.js overlay if present (safety net). */
export async function dismissTour(page: Page): Promise<void> {
  const overlay = page.locator(".driver-overlay").first();
  const visible = await overlay.isVisible().catch(() => false);
  if (visible) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

// ── API mocking ───────────────────────────────────────────────────────────────

export interface MockOptions {
  /** HTTP status code — defaults to 200 */
  status?: number;
  /** Additional response headers */
  headers?: Record<string, string>;
  /** Only intercept requests matching this HTTP method (default: all methods) */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

/**
 * Intercept all requests whose URL contains `pattern` and respond with `body`.
 *
 * Always wraps body in the standard API envelope unless `rawBody` is true.
 * Pattern is matched as a glob against the full request URL.
 */
export async function mockApi(
  page: Page,
  pattern: string,
  body: unknown,
  options: MockOptions = {},
): Promise<void> {
  const { status = 200, headers = {}, method } = options;
  await page.route(pattern, (route: Route) => {
    if (method && route.request().method().toUpperCase() !== method) {
      return route.continue();
    }
    return route.fulfill({
      status,
      contentType: "application/json",
      headers,
      body: JSON.stringify(body),
    });
  });
}

/**
 * Install an API route that captures the first matching request and resolves
 * the returned promise with it. Useful for asserting request bodies / headers.
 */
export function waitForApi(
  page: Page,
  pattern: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
): Promise<Request> {
  return new Promise((resolve) => {
    page.route(pattern, async (route: Route) => {
      if (route.request().method().toUpperCase() === method) {
        resolve(route.request());
        // Still fulfill so the page doesn't hang
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      } else {
        await route.continue();
      }
    });
  });
}

// ── Standard empty-envelope helper ───────────────────────────────────────────

/** Return a valid API envelope with an empty array. */
export function emptyList(page?: number, perPage?: number) {
  return { data: [], error: null, meta: { page: page ?? 1, per_page: perPage ?? 50, total: 0 } };
}

/** Return a valid single-item API envelope. */
export function singleItem<T>(item: T) {
  return { data: item, error: null, meta: null };
}

/** Return a valid list API envelope. */
export function listOf<T>(items: T[], total?: number) {
  return { data: items, error: null, meta: { page: 1, per_page: 50, total: total ?? items.length } };
}

/** Return a 500 error envelope. */
export function serverError(message = "Internal server error") {
  return { data: null, error: message, meta: null };
}
