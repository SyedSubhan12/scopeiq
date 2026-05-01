import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_EMAIL) test.skip();
    await page.goto('/dashboard');
  });

  test('dashboard page loads without redirecting to login', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('dashboard renders a main content area', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation is present', async ({ page }) => {
    // Sidebar or nav should have at least one link
    await page.waitForSelector('nav a, aside a, [data-testid="sidebar"] a', { timeout: 10000 });
    const navLinks = await page.locator('nav a, aside a').count();
    expect(navLinks).toBeGreaterThan(0);
  });

  test('scope-flags nav item is reachable from sidebar', async ({ page }) => {
    // Should have a link to scope-flags somewhere in the nav
    const scopeFlagLink = page.locator('a[href*="scope-flags"]');
    await expect(scopeFlagLink.first()).toBeVisible({ timeout: 10000 });
  });

  test('projects nav item is reachable from sidebar', async ({ page }) => {
    const projectsLink = page.locator('a[href*="projects"]');
    await expect(projectsLink.first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard page produces no hard JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForLoadState('networkidle');
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('minified react error') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });
});

test.describe('Dashboard — projects navigation', () => {
  test.beforeEach(() => {
    if (!process.env.E2E_EMAIL) test.skip();
  });

  test('clicking a project link navigates to project detail page', async ({ page }) => {
    await page.goto('/dashboard');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    const count = await projectLink.count();
    if (count === 0) {
      // No projects seeded — this is an acceptable empty-state outcome
      test.skip();
    }
    await projectLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/projects/');
  });
});
