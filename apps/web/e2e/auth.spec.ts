import { test, expect } from '@playwright/test';

test.describe('Authentication routing', () => {
  test('unauthenticated user visiting /dashboard redirects to /login', async ({ page }) => {
    // Use a fresh context with no cookies
    await page.context().clearCookies();
    await page.goto('/dashboard');
    // Either redirected or shows login UI
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    // Password field only appears after switching modes — check toggle exists
    await expect(page.locator('button[type="button"]:has-text("Password")')).toBeVisible();
  });

  test('/login page renders the auth mode toggle', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="button"]:has-text("Magic link")')).toBeVisible();
    await expect(page.locator('button[type="button"]:has-text("Password")')).toBeVisible();
  });

  test('switching to password mode reveals password field', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="button"]:has-text("Password")');
    await expect(page.locator('#password')).toBeVisible();
  });

  test('/login page has a submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('/login page shows no JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Filter hydration noise — only surface hard crashes
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('minified react error') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });

  test('/register link is visible on /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('/forgot-password link is visible after switching to password mode', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="button"]:has-text("Password")');
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });
});
