/**
 * Branding regression tests — FEAT-SC-004 White-Label Portal
 *
 * These tests verify:
 *  1. Portal injects brand CSS variables from workspace branding.
 *  2. [data-scopeiq-brand] is absent when the workspace has hideScopeiqBranding enabled.
 *  3. Screenshot regression baseline (first-run generates; subsequent runs compare).
 *
 * NOTE: Screenshot baselines are generated on first staging deploy.
 * Until then, screenshot assertions are soft-skipped in CI (SKIP_SCREENSHOT_BASELINE=1).
 */

import { test, expect } from "@playwright/test";

// A valid portal token for a branded workspace seeded in the test DB.
// In CI this is set via the BRANDED_PORTAL_TOKEN env var.
// Falls back to a known test fixture token for local dev.
const BRANDED_TOKEN = process.env.BRANDED_PORTAL_TOKEN ?? "test-branded-portal-token";

// Whether to skip screenshot baseline comparisons (true in CI until baseline is committed).
const SKIP_SCREENSHOTS = process.env.SKIP_SCREENSHOT_BASELINE === "1";

test.describe("Portal branding — CSS variable injection", () => {
  test("portal root injects --brand-primary CSS variable", async ({ page }) => {
    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    const brandPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim(),
    );

    // Should be a non-empty RGB tuple (e.g. "15, 110, 86")
    expect(brandPrimary).toMatch(/^\d+,\s*\d+,\s*\d+$/);
  });

  test("portal root injects --brand-bg CSS variable", async ({ page }) => {
    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    const brandBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand-bg").trim(),
    );

    expect(brandBg).toMatch(/^\d+,\s*\d+,\s*\d+$/);
  });

  test("portal root injects --brand-fg CSS variable", async ({ page }) => {
    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    const brandFg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand-fg").trim(),
    );

    expect(brandFg).toMatch(/^\d+,\s*\d+,\s*\d+$/);
  });

  test("portal page does not crash on branding token", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    const hardErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes("hydration") &&
        !e.toLowerCase().includes("resizeobserver"),
    );
    expect(hardErrors).toHaveLength(0);
  });
});

test.describe("Portal branding — white-label (hide ScopeIQ branding)", () => {
  // These tests use the HIDE_BRAND_PORTAL_TOKEN env var which points to a workspace
  // with hideScopeiqBranding=true (studio/agency plan).
  const HIDE_BRAND_TOKEN = process.env.HIDE_BRAND_PORTAL_TOKEN ?? BRANDED_TOKEN;

  test("[data-scopeiq-brand] element is absent when branding is hidden", async ({ page }) => {
    // Skip if env var not set — can't meaningfully test without a paid-plan workspace
    if (!process.env.HIDE_BRAND_PORTAL_TOKEN) {
      test.skip(true, "HIDE_BRAND_PORTAL_TOKEN not set — skipping white-label test");
    }

    await page.goto(`/${HIDE_BRAND_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    const brandEl = page.locator("[data-scopeiq-brand]");
    // Either hidden via CSS display:none or not rendered at all
    const isVisible = await brandEl.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test("[data-scopeiq-brand] element is present on free-plan portal", async ({ page }) => {
    // Uses the standard branded token (free or solo plan)
    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    // Not all portal pages render the footer — if it renders, the badge must be there
    const footer = page.locator("footer");
    const footerVisible = await footer.isVisible().catch(() => false);
    if (!footerVisible) {
      test.skip(true, "Footer not rendered on this portal page variant");
    }

    // If footer is present it should contain the brand badge
    await expect(page.locator("[data-scopeiq-brand]")).toBeVisible();
  });
});

test.describe("Portal branding — screenshot regression", () => {
  test.skip(SKIP_SCREENSHOTS, "Screenshot baseline pending first staging deploy");

  test("branded portal homepage matches visual baseline", async ({ page }) => {
    await page.goto(`/${BRANDED_TOKEN}`);
    await page.waitForLoadState("networkidle");

    // Mask dynamic content that changes per-run (timestamps, etc.)
    await expect(page).toHaveScreenshot("branded-portal-homepage.png", {
      maxDiffPixelRatio: 0.02,
      mask: [page.locator("time"), page.locator("[data-dynamic]")],
    });
  });
});
