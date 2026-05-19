import { defineConfig, devices } from "@playwright/test";

// Signal to Next.js that this is an E2E test run — the webServer process inherits this.
// AuthProvider checks this flag to bypass Supabase auth and return a mock user.
process.env.NEXT_PUBLIC_E2E_TEST = "1";

/**
 * RevLooper Portal E2E tests.
 * Runs against the Next.js dev server on port 3002 (separate from Docker on 3000).
 * NEXT_PUBLIC_E2E_TEST=1 is inherited by the webServer, bypassing Supabase auth.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,

  use: {
    // Port 3002: dedicated local Next.js server for E2E tests, separate from the
    // Docker dev container on port 3000. This avoids Docker network cookie issues.
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev -- --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
