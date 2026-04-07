import { test, expect } from "./helpers.js";

const baseUrl = process.env.WEB_URL ?? "http://localhost:3000";

const workspaceResponse = {
  data: {
    id: "workspace-1",
    name: "Test Agency",
    plan: "studio",
    onboardingProgress: { completedSteps: ["workspace"], completedAt: "2026-04-07T00:00:00.000Z" },
  },
};

const dashboardResponse = {
  data: {
    greeting: "Good morning, Test Agency",
    metrics: {
      activeProjects: 7,
      awaitingApproval: 3,
      pendingScopeFlags: 2,
      mrr: 18000,
    },
    urgentFlags: [],
    recentActivity: [],
    upcomingDeadlines: [],
  },
};

test.describe("sidebar count behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("supabase.auth.token", JSON.stringify({ access_token: "test-token" }));
    });

    await page.route("**/v1/workspaces/me", async (route) => {
      await route.fulfill({ json: workspaceResponse });
    });

    await page.route("**/v1/dashboard", async (route) => {
      await route.fulfill({ json: dashboardResponse });
    });

    await page.route("**/v1/scope-flags/count", async (route) => {
      await route.fulfill({ json: { data: { count: 2 } } });
    });

    await page.route("**/v1/change-orders/count", async (route) => {
      await route.fulfill({ json: { data: { count: 4 } } });
    });
  });

  test("renders live dashboard metrics and sidebar badges", async ({ page }) => {
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Good morning, Test Agency")).toBeVisible();
    await expect(page.getByText("Active Projects")).toBeVisible();
    await expect(page.getByText("$18,000")).toBeVisible();

    await expect(page.getByTestId("sidebar-scope-flag-count")).toHaveText("2");
    await expect(page.getByTestId("sidebar-change-order-count")).toHaveText("4");
  });
});
