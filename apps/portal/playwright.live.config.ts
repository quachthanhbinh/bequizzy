import { defineConfig, devices } from "@playwright/test";

/**
 * RevLooper Portal — BE+FE Live Integration Tests.
 *
 * Runs against the Docker-compose stack:
 *   - Portal on port 3000 (NEXT_PUBLIC_E2E_TEST=1 via docker-compose.override.yml)
 *   - api-gateway on port 8080 (E2E_MODE=1 accepts "e2e-access-token")
 *   - All backend services on their standard ports
 *
 * Prerequisites:
 *   docker-compose up -d          # starts all services including portal w/ E2E flags
 *
 * Run with:
 *   npx playwright test --config playwright.live.config.ts
 */
export default defineConfig({
  testDir: "./e2e/live",
  fullyParallel: false,          // serial to avoid DB contention on shared workspace
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 45_000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // No webServer needed — portal is already running in Docker on port 3000.
});
