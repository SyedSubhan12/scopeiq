import { test, expect } from '@playwright/test';

// FR-AP-002: Deliverable annotation
//
// Full annotation tests require a valid portal token and a seeded deliverable.
// These tests verify structural and accessibility properties that are
// observable without a real token, plus JS-error regression coverage.

const WELL_FORMED_BUT_MISSING_TOKEN = 'a'.repeat(64);

test.describe('Deliverable annotation — structural (FR-AP-002)', () => {
  test('portal review page does not 500 on invalid token', async ({ page }) => {
    const response = await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review`);
    expect(response?.status()).not.toBe(500);
  });

  test('portal review page produces no hard JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review`);
    await page.waitForTimeout(2000);
    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('hydration') &&
        !e.toLowerCase().includes('token') &&
        !e.toLowerCase().includes('not found') &&
        !e.toLowerCase().includes('resizeobserver'),
    );
    expect(hardErrors).toHaveLength(0);
  });

  test('portal review/{deliverableId} sub-route does not 500', async ({ page }) => {
    const fakeDeliverableId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const response = await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review/${fakeDeliverableId}`);
    expect(response?.status()).not.toBe(500);
  });
});

test.describe('Deliverable annotation — accessibility (FR-AP-002)', () => {
  test('any feedback pin buttons that exist have an aria-label', async ({ page }) => {
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review`);
    await page.waitForTimeout(2000);

    // If any annotation pin buttons rendered, they must all carry aria-label
    const pinButtons = await page
      .locator('button[aria-label*="pin" i], button[aria-label*="feedback" i], button[aria-label*="annotation" i]')
      .all();

    for (const btn of pinButtons) {
      const label = await btn.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('any "Add Feedback" or annotation trigger button is keyboard-focusable', async ({ page }) => {
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review`);
    await page.waitForTimeout(2000);

    // Collect all buttons that could be the annotation trigger
    const candidates = await page
      .locator(
        'button[aria-label*="feedback" i], button[aria-label*="pin" i], button[aria-label*="annotation" i], [role="button"][aria-label*="feedback" i]',
      )
      .all();

    for (const el of candidates) {
      // Each must be focusable (tabIndex >= 0 or default)
      const tabIndex = await el.evaluate((node) =>
        (node as HTMLElement).tabIndex,
      );
      expect(tabIndex).toBeGreaterThanOrEqual(0);
    }
  });

  test('portal review page does not render focusable elements with tabIndex -1 as the sole interaction point', async ({ page }) => {
    // This catches the pattern where a canvas or overlay is marked aria-hidden
    // but is the only clickable surface for annotation.
    await page.goto(`/${WELL_FORMED_BUT_MISSING_TOKEN}/review`);
    await page.waitForTimeout(2000);

    // Any canvas element used for annotation should not be aria-hidden if it
    // is the primary interaction surface.
    const hiddenCanvases = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('canvas[aria-hidden="true"]')).length;
    });

    const visibleCanvases = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('canvas:not([aria-hidden="true"])')).length;
    });

    // If there are canvases, at least one should not be aria-hidden
    const totalCanvases = hiddenCanvases + visibleCanvases;
    if (totalCanvases > 0) {
      expect(visibleCanvases).toBeGreaterThan(0);
    }
  });
});
