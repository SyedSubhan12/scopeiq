import { test as base, expect, type Page, type APIRequestContext } from "@playwright/test";

// ── Fixed test IDs (matches test-setup.ts) ────────────────────────────────────

export const TEST_IDS = {
  workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  ownerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  clientId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  projectId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  deliverableId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  sowId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  sowClauseId: "11111111-1111-1111-1111-111111111111",
  revisionLimitClauseId: "22222222-2222-2222-2222-222222222222",
  scopeFlagId: "33333333-3333-3333-3333-333333333333",
  changeOrderId: "44444444-4444-4444-4444-444444444444",
  messageId: "55555555-5555-5555-5555-555555555555",
  inScopeMessageId: "66666666-6666-6666-6666-666666666666",
  rateCardItemId: "77777777-7777-7777-7777-777777777777",
  deliverableIdRevisionLimit: "88888888-8888-8888-8888-888888888888",
  secondDeliverableId: "99999999-9999-9999-9999-999999999999",
  rawPortalToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
} as const;

// ── SLA Timeouts (from spec) ──────────────────────────────────────────────────

export const SLA = {
  scopeFlagDetectionMs: 5_000,
  changeOrderGenerationMs: 5_000,
  portalPageLoadMs: 2_000,
  briefScoringMs: 10_000,
  realtimePushMs: 500,
} as const;

// ── Wait Helpers ──────────────────────────────────────────────────────────────

export async function waitForWithSla(page: Page, selector: string, slaMs: number = 10_000): Promise<void> {
  await page.waitForSelector(selector, { timeout: slaMs });
}

export async function pollUntil(
  fn: () => Promise<boolean>,
  slaMs: number = 10_000,
  intervalMs: number = 200,
): Promise<void> {
  const deadline = Date.now() + slaMs;
  while (Date.now() < deadline) {
    if (await fn()) return;
    await sleep(intervalMs);
  }
  throw new Error(`pollUntil timed out after ${slaMs}ms`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── API Helpers ───────────────────────────────────────────────────────────────

export async function apiPost(
  request: APIRequestContext,
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  const response = await request.post(`${apiUrl}${path}`, {
    data: body,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await response.json();
  expect(response.status()).toBeLessThan(400);
  return json as Record<string, unknown>;
}

export async function apiPatch(
  request: APIRequestContext,
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  const response = await request.patch(`${apiUrl}${path}`, {
    data: body,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await response.json();
  expect(response.status()).toBeLessThan(400);
  return json as Record<string, unknown>;
}

export async function apiGet(
  request: APIRequestContext,
  path: string,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  const response = await request.get(`${apiUrl}${path}`, { headers });
  const json = await response.json();
  expect(response.status()).toBeLessThan(400);
  return json as Record<string, unknown>;
}

// ── Auth Helpers ──────────────────────────────────────────────────────────────

export function getAgencyJwt(): string {
  return process.env.SUPABASE_JWT ?? process.env.TEST_AGENCY_TOKEN ?? "";
}

export function getPortalToken(): string {
  return process.env.TEST_PORTAL_TOKEN ?? TEST_IDS.rawPortalToken;
}

// ── Portal Navigation Helpers ────────────────────────────────────────────────

export async function gotoPortal(page: Page, path: string): Promise<number> {
  const start = Date.now();
  const portalToken = getPortalToken();
  const baseUrl = process.env.WEB_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/portal/${portalToken}${path}`);
  await page.waitForLoadState("networkidle");
  return Date.now() - start;
}

export async function gotoDashboard(page: Page, path: string): Promise<void> {
  const baseUrl = process.env.WEB_URL ?? "http://localhost:3000";
  const token = getAgencyJwt();

  await page.addInitScript(
    ({ t }) => {
      window.localStorage.setItem("supabase.auth.token", JSON.stringify({ access_token: t }));
    },
    { t: token },
  );

  await page.goto(`${baseUrl}${path}`);
  await page.waitForLoadState("networkidle");
}

// ── Extended Test Fixtures ────────────────────────────────────────────────────

interface TestFixtures {
  testIds: typeof TEST_IDS;
  sla: typeof SLA;
}

export const test = base.extend<TestFixtures>({
  testIds: async ({}, use) => {
    await use(TEST_IDS);
  },
  sla: async ({}, use) => {
    await use(SLA);
  },
});

export { expect } from "@playwright/test";
