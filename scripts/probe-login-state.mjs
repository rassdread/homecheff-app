/**
 * Logs in a synthetic cert account through /login and saves a Playwright storageState.
 * Env: BASE (default https://homecheff.eu), EMAIL + PASSWORD (required), OUT (default /tmp/hc-login-state.json).
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE || 'https://homecheff.eu').replace(/\/$/, '');
const EMAIL = process.env.EMAIL || process.env.MEDIA_TEST_EMAIL;
const PASSWORD = process.env.PASSWORD || process.env.MEDIA_TEST_PASSWORD;
const OUT = process.env.OUT || '/tmp/hc-login-state.json';
if (!EMAIL || !PASSWORD) {
  console.error('Set EMAIL and PASSWORD (or MEDIA_TEST_EMAIL / MEDIA_TEST_PASSWORD) for a synthetic cert account.');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const host = new URL(BASE).hostname;
await context.addCookies([{ name: 'homecheff-language', value: 'nl', domain: host, path: '/' }]);
const page = await context.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.fill('input[name="email"], input[type="email"], input[name="emailOrUsername"]', EMAIL);
await page.fill('input[name="password"], input[type="password"]', PASSWORD);
await Promise.all([
  page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 120000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(1500);
const session = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()).catch(() => null));
const loggedIn = Boolean(session && session.user);
await context.storageState({ path: OUT });
console.log(JSON.stringify({ base: BASE, url: page.url(), loggedIn, out: OUT }));
await browser.close();
process.exit(loggedIn ? 0 : 1);
