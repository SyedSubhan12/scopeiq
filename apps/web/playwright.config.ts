import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables with defaults for local development.
 */
const BASE_URL = process.env.WEB_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://scopeiq:scopeiq_dev@localhost:5433/scopeiq";

const localWebServer = {
  command: "cd ../api && pnpm dev",
  url: `${API_URL}/health`,
  timeout: 30_000,
  reuseExistingServer: true,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // DB tests share state; run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000, // 60s global timeout
  expect: {
    timeout: 10_000, // SLA-matched expectation timeout
  },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  ...(!process.env.CI ? { webServer: localWebServer } : {}),
});
