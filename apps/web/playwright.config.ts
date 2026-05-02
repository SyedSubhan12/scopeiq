import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup project runs first
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    // Authenticated tests
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /portal\.spec\.ts|unauthenticated/,
    },
    // Mobile viewport (375px) for portal tests — no auth needed
    {
      name: 'mobile-portal',
      use: {
        ...devices['iPhone 12'],
      },
      testMatch: /portal\.spec\.ts/,
    },
  ],
});
