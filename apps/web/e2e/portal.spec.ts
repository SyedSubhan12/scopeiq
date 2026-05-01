import { test, expect } from '@playwright/test';

// Portal routes are token-based and do not require Supabase auth.
// The portal URL structure is /{portalToken}/* at the root (Next.js catch-all group).

const INVALID_TOKEN = 'invalid-token-that-does-not-exist-xxxxxxxxxxxxxxxxxx';
const WELL_FORMED_BUT_MISSING_TOKEN = 'a'.repeat(64);

test.describe('Portal access — invalid / unknown tokens', () => {
  test('portal with a clearly-invalid token does not 500', async ({ page }) => {
    const response = await page.goto(`/${INVALID_TOKEN}`);
    expect(response?.status()).not.toBe(500);
  });

  test('portal with well-formed but non-existent token shows error state', async ({ page }) => {
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    // Should show some error UI — not a blank white screen and not an uncaught crash
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('portal page does not crash with a JS error on invalid token', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`/${INVALID_TOKEN}`);
    await page.waitForTimeout(2000);
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('token') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });

  test('/portal/by-slug/ with unknown slug does not return 500', async ({ page }) => {
    const response = await page.goto('/portal/by-slug/this-workspace-does-not-exist');
    expect(response?.status()).not.toBe(500);
  });

  test('/portal/by-slug/ with unknown slug shows an error or not-found state', async ({ page }) => {
    await page.goto('/portal/by-slug/this-workspace-does-not-exist');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

test.describe('Portal sub-routes — structural integrity', () => {
  test('portal /messages sub-route does not 500 on invalid token', async ({ page }) => {
    const response = await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/messages`);
    expect(response?.status()).not.toBe(500);
  });

  test('portal /brief sub-route does not 500 on invalid token', async ({ page }) => {
    const response = await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/brief`);
    expect(response?.status()).not.toBe(500);
  });

  test('portal /clarification sub-route does not 500 on invalid token', async ({ page }) => {
    const response = await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/clarification`);
    expect(response?.status()).not.toBe(500);
  });
});

test.describe('Portal — mobile viewport rendering', () => {
  // These run in the mobile-portal project at 375px

  test('portal page renders without horizontal overflow on mobile', async ({ page }) => {
    await page.goto(`/${INVALID_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    // Check the body does not overflow horizontally (width === scrollWidth)
    const overflows = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(overflows).toBe(false);
  });

  test('portal page body is not empty on mobile viewport', async ({ page }) => {
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}`);
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
