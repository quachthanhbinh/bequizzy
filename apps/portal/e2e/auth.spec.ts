import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests.
 * Tests the sign-in page without a real Supabase backend:
 * validates that the form renders and validation works.
 */

test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("renders sign-in form", async ({ page }) => {
    await expect(page.locator("input[type='email'], input[placeholder*='mail' i], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
    await expect(page.locator("button[type='submit'], button:has-text('Sign'), button:has-text('Log')")).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    const submitBtn = page.locator("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')").first();
    await submitBtn.click();
    // After click, at least one error message should appear
    const errors = page.locator("[role='alert'], .text-red, .text-destructive, .error, [class*='error']");
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test("has link to sign-up page", async ({ page }) => {
    const signUpLink = page.locator("a[href*='sign-up'], a:has-text('Sign up'), a:has-text('Register'), a:has-text('Create')").first();
    await expect(signUpLink).toBeVisible();
  });

});

test.describe("Auth guard — unauthenticated redirects", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to /campaigns redirects to sign-in", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Sign-up page", () => {
  test("renders sign-up form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']").first()).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/sign-up");
    await page.locator("button[type='submit']").click();
    // At least one validation error should appear for empty required fields
    const errors = page.locator(".text-destructive, [class*='text-red'], [class*='error']");
    await expect(errors.first()).toBeVisible({ timeout: 5_000 });
  });

  test("has link back to sign-in page", async ({ page }) => {
    await page.goto("/sign-up");
    const signInLink = page.locator("a[href*='sign-in'], a:has-text('Sign in'), a:has-text('Log in')").first();
    await expect(signInLink).toBeVisible();
  });

  test("shows Google sign-in option", async ({ page }) => {
    await page.goto("/sign-up");
    const googleBtn = page.locator("button:has-text('Google'), a:has-text('Google')").first();
    await expect(googleBtn).toBeVisible();
  });
});

test.describe("Social auth on sign-in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("shows Google sign-in button", async ({ page }) => {
    const googleBtn = page.locator("button:has-text('Google'), a:has-text('Google')").first();
    await expect(googleBtn).toBeVisible();
  });

  test("shows Facebook sign-in button", async ({ page }) => {
    const facebookBtn = page.locator("button:has-text('Facebook'), a:has-text('Facebook')").first();
    await expect(facebookBtn).toBeVisible();
  });

  test("has forgot password link", async ({ page }) => {
    const forgotLink = page.locator("a[href*='forgot'], a:has-text('Forgot'), a:has-text('forgot')").first();
    await expect(forgotLink).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("shows validation error on empty email submit", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator("button[type='submit']").click();
    const error = page.locator(".text-destructive, [class*='text-red'], [class*='error']").first();
    await expect(error).toBeVisible({ timeout: 5_000 });
  });

  test("has link back to sign-in", async ({ page }) => {
    await page.goto("/forgot-password");
    const signInLink = page.locator("a[href*='sign-in'], a:has-text('Sign in'), a:has-text('Back')").first();
    await expect(signInLink).toBeVisible();
  });
});

// ── Update Password page ───────────────────────────────────────────────────────

test.describe("Update password page", () => {
  test("renders the set-new-password form", async ({ page }) => {
    await page.goto("/update-password");
    await expect(page.locator("h1:has-text('Set new password')").first()).toBeVisible();
  });

  test("shows new password and confirm password fields", async ({ page }) => {
    await page.goto("/update-password");
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirm")).toBeVisible();
  });

  test("submit button reads 'Set new password'", async ({ page }) => {
    await page.goto("/update-password");
    await expect(page.locator("button[type='submit']:has-text('Set new password')").first()).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/update-password");
    await page.locator("button[type='submit']").click();
    const error = page.locator(".text-destructive, [class*='text-red'], [class*='error']").first();
    await expect(error).toBeVisible({ timeout: 5_000 });
  });

  test("has link back to sign-in", async ({ page }) => {
    await page.goto("/update-password");
    const link = page.locator("a[href*='sign-in'], a:has-text('Back to sign in')").first();
    await expect(link).toBeVisible();
  });

  test("show/hide password toggle is present", async ({ page }) => {
    await page.goto("/update-password");
    const toggle = page.locator("button[aria-label='Show password'], button[aria-label='Hide password']").first();
    await expect(toggle).toBeVisible();
  });

  test("verify-email page (no token) shows verification-failed state", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.locator("h1:has-text('Verification failed')").first()).toBeVisible({ timeout: 12_000 });
  });
});

// ── Verify Email page ─────────────────────────────────────────────────────────

test.describe("Verify email page", () => {
  test("default (no token) shows failed state", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.locator("h1:has-text('Verification failed')").first()).toBeVisible({ timeout: 12_000 });
  });

  test("failed state shows reason list", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.locator("text=Already used").first()).toBeVisible({ timeout: 12_000 });
  });

  test("failed state has back to sign-in link", async ({ page }) => {
    await page.goto("/verify-email");
    const link = page.locator("a[href*='sign-in'], a:has-text('Back to sign in')").first();
    await expect(link).toBeVisible({ timeout: 12_000 });
  });

  test("with valid token shows verified state", async ({ page }) => {
    // token param length > 8 and no error param triggers the verified branch
    await page.goto("/verify-email?token=abc123defghij");
    await expect(page.locator("h1:has-text('Email verified!')").first()).toBeVisible({ timeout: 12_000 });
  });

  test("verified state shows Set up my workspace CTA", async ({ page }) => {
    await page.goto("/verify-email?token=abc123defghij");
    await expect(page.locator("a[href='/onboarding'], a:has-text('Set up my workspace')").first()).toBeVisible({ timeout: 12_000 });
  });

  test("with ?error param shows failed state even if token present", async ({ page }) => {
    await page.goto("/verify-email?token=abc123defghij&error=otp_expired");
    await expect(page.locator("h1:has-text('Verification failed')").first()).toBeVisible({ timeout: 12_000 });
  });
});

test.describe("Unauthenticated redirect guards", () => {
  test("unauthenticated access to /leads redirects to sign-in", async ({ page }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /inbox redirects to sign-in", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /crm redirects to sign-in", async ({ page }) => {
    await page.goto("/crm");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /billing redirects to sign-in", async ({ page }) => {
    await page.goto("/billing");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /settings redirects to sign-in", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/sign-in/);
  });
});
