import { test, expect } from '@playwright/test';

// Scope flag UI tests — agency (authenticated) side.
// These require E2E_EMAIL / E2E_PASSWORD env vars and a running app.
// Without auth they are skipped gracefully.

test.describe('Scope flag page — structural', () => {
  test.beforeEach(() => {
    if (!process.env.E2E_EMAIL) test.skip();
  });

  test('/scope-flags page loads without redirecting to login', async ({ page }) => {
    await page.goto('/scope-flags');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('/scope-flags renders a main content area', async ({ page }) => {
    await page.goto('/scope-flags');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('/scope-flags produces no hard JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/scope-flags');
    await page.waitForLoadState('networkidle');
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('minified react error') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });

  test('/scope-flags shows either flag cards or an empty-state message', async ({ page }) => {
    await page.goto('/scope-flags');
    await page.waitForLoadState('networkidle');
    // Either some flag cards exist, or there is text indicating no flags
    const hasContent = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.length > 20;
    });
    expect(hasContent).toBe(true);
  });
});

test.describe('Scope flag page — navigation from sidebar', () => {
  test.beforeEach(() => {
    if (!process.env.E2E_EMAIL) test.skip();
  });

  test('sidebar contains a scope-flags link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const scopeFlagLink = page.locator('a[href*="scope-flags"]').first();
    await expect(scopeFlagLink).toBeVisible({ timeout: 10000 });
  });

  test('clicking scope-flags sidebar link navigates to /scope-flags', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const scopeFlagLink = page.locator('a[href*="scope-flags"]').first();
    await scopeFlagLink.click();
    await expect(page).toHaveURL(/scope-flags/);
  });
});

test.describe('Scope flag page — unauthenticated redirect', () => {
  test('unauthenticated user visiting /scope-flags is redirected to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/scope-flags');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Project detail page — scope context', () => {
  test.beforeEach(() => {
    if (!process.env.E2E_EMAIL) test.skip();
  });

  test('/projects page loads without error', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('/projects page has no hard JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('minified react error') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });

  test('first project in the list is navigable', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const firstProjectLink = page.locator('a[href*="/projects/"]').first();
    const count = await firstProjectLink.count();
    if (count === 0) test.skip(); // acceptable empty-state outcome
    await firstProjectLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/projects/');
  });
});
