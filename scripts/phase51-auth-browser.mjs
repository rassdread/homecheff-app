/**
 * Phase 5.1 — authenticated browser follow-up with known Production users.
 */
import fs from 'node:fs';
import path from 'node:path';

const base = 'https://homecheff.eu';
const outDir = 'docs/audits/wx-phase51-marketplace-validation';
const shotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(shotDir, { recursive: true });

const users = {
  buyer: {
    email: 'phase51+buyer.1785887706@homecheff-validation.test',
    password: 'Phase51Validate!Only',
  },
  seller: {
    email: 'phase51+seller.1785887754@homecheff-validation.test',
    password: 'Phase51Validate!Only',
  },
};

async function login(page, email, password) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  const emailSel = '#emailOrUsername, input[name="emailOrUsername"]';
  await page.locator(emailSel).first().waitFor({ timeout: 10000 });
  await page.locator(emailSel).first().fill(email);
  await page.locator('input[name="password"], input[type="password"]').first().fill(password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2500);
  const session = await page.request
    .get(`${base}/api/auth/session`)
    .then((r) => r.json())
    .catch(() => null);
  return Boolean(session?.user?.email);
}

async function main() {
  const playwright = await import('playwright');
  const results = [];
  const viewports = {
    desktop: { width: 1440, height: 900 },
    phone: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 },
  };

  for (const [role, creds] of Object.entries(users)) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: viewports.desktop });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 160));
    });
    let loggedIn = false;
    try {
      loggedIn = await login(page, creds.email, creds.password);
    } catch (e) {
      results.push({ role, loginError: String(e).slice(0, 200) });
    }
    results.push({ role, loggedIn, email: creds.email });
    const pages =
      role === 'buyer'
        ? [
            ['buyer-profile', '/profile'],
            ['buyer-messages', '/messages'],
            ['buyer-orders', '/orders'],
            ['buyer-notifications', '/notifications'],
            ['buyer-favorites', '/favorites'],
            ['buyer-feed', '/?mode=discover'],
          ]
        : [
            ['seller-sell', '/sell'],
            ['seller-profile', '/profile'],
            ['seller-messages', '/messages'],
            ['seller-dashboard', '/verkoper/dashboard'],
          ];
    if (loggedIn) {
      for (const [name, p] of pages) {
        try {
          const resp = await page.goto(`${base}${p}`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          await page.waitForTimeout(1600);
          const file = path.join(shotDir, `auth2-${name}.png`);
          await page.screenshot({ path: file, fullPage: false });
          results.push({
            name: `auth2-${name}`,
            status: resp?.status() ?? 0,
            url: page.url().split('?')[0],
            loggedIn: true,
            screenshot: file,
            consoleErrors: consoleErrors.splice(0).slice(0, 3),
          });
        } catch (e) {
          results.push({ name: `auth2-${name}`, error: String(e).slice(0, 200) });
        }
      }
      if (role === 'buyer') {
        await page.setViewportSize(viewports.phone);
        const resp = await page.goto(`${base}/messages`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(1200);
        const file = path.join(shotDir, 'auth2-buyer-messages-phone.png');
        await page.screenshot({ path: file, fullPage: false });
        results.push({
          name: 'auth2-buyer-messages-phone',
          status: resp?.status() ?? 0,
          loggedIn: true,
          screenshot: file,
        });
        await page.setViewportSize(viewports.landscape);
        const resp2 = await page.goto(`${base}/?mode=discover`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(1200);
        const file2 = path.join(shotDir, 'auth2-buyer-feed-landscape.png');
        await page.screenshot({ path: file2, fullPage: false });
        results.push({
          name: 'auth2-buyer-feed-landscape',
          status: resp2?.status() ?? 0,
          loggedIn: true,
          screenshot: file2,
        });
      }
    }
    await browser.close();
  }

  fs.writeFileSync(path.join(outDir, 'auth-browser.json'), JSON.stringify({ results }, null, 2));
  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
