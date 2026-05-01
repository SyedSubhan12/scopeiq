import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  if (!email || !password) {
    console.warn('[E2E] E2E_EMAIL / E2E_PASSWORD not set — skipping auth setup. Authenticated tests will be skipped.');
    // Write empty auth state so tests can still run (they'll redirect to login)
    fs.writeFileSync(path.join(authDir, 'user.json'), JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);

  // Login page uses a mode toggle: default is "magic link", switch to "password"
  await page.click('button[type="button"]:has-text("Password")');

  // Fill credentials using id selectors (login page uses id="email" and id="password")
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
    console.warn('[E2E] Auth redirect did not reach dashboard — storageState may be empty');
  });

  await page.context().storageState({ path: path.join(authDir, 'user.json') });
  await browser.close();
}

export default globalSetup;
