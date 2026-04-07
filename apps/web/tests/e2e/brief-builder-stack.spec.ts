import { test, expect } from "./helpers.js";

const baseUrl = process.env.WEB_URL ?? "http://localhost:3000";
const templateId = "brief-builder-stack-test";

const workspaceResponse = {
  data: {
    id: "workspace-1",
    name: "Test Agency",
    plan: "studio",
    onboardingProgress: { completedSteps: ["workspace"], completedAt: "2026-04-07T00:00:00.000Z" },
  },
};

const templateResponse = {
  data: {
    id: templateId,
    name: "Website Redesign Brief",
    description: "Collect the essentials for a redesign kickoff.",
    fieldsJson: [
      {
        key: "company_name",
        type: "text",
        label: "Company Name",
        required: true,
        order: 0,
        conditions: [],
      },
      {
        key: "project_goals",
        type: "textarea",
        label: "Project Goals",
        required: false,
        order: 1,
        conditions: [],
      },
    ],
    isDefault: false,
    status: "draft",
    createdAt: "2026-04-07T00:00:00.000Z",
    updatedAt: "2026-04-07T00:00:00.000Z",
  },
};

test.describe("brief builder stack UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("supabase.auth.token", JSON.stringify({ access_token: "test-token" }));
    });

    await page.route("**/v1/workspaces/me", async (route) => {
      await route.fulfill({ json: workspaceResponse });
    });

    await page.route(`**/v1/brief-templates/${templateId}`, async (route) => {
      await route.fulfill({ json: templateResponse });
    });

    await page.route(`**/v1/brief-templates/${templateId}/versions`, async (route) => {
      await route.fulfill({ json: { data: [] } });
    });
  });

  test("adds fields and reorders the stacked list", async ({ page }) => {
    await page.goto(`${baseUrl}/briefs/templates/${templateId}`);
    await page.waitForLoadState("domcontentloaded");

    const stack = page.locator('[data-testid="brief-field-card"]');
    await expect(stack).toHaveCount(2);
    await expect(stack.nth(0)).toContainText("Step 1 of 2");
    await expect(stack.nth(1)).toContainText("Step 2 of 2");

    await page.getByTestId("brief-field-library-text").click();
    await expect(stack).toHaveCount(3);
    await expect(stack.nth(2)).toContainText("Short Text");
    await expect(stack.nth(2)).toContainText("Step 3 of 3");

    await page.getByTestId("brief-field-library-textarea").click();
    await expect(stack).toHaveCount(4);
    await expect(stack.nth(3)).toContainText("Long Text");

    await stack.nth(3).getByRole("button", { name: "Move field Long Text up" }).click();

    await expect(stack.nth(2)).toContainText("Long Text");
    await expect(stack.nth(2)).toContainText("Step 3 of 4");
  });
});
