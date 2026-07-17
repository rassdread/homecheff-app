/**
 * Capture Nearby-without-location empty state screenshots (desktop/tablet/mobile).
 * Usage: BASE_URL=https://… node scripts/capture-nearby-empty-state.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT = process.env.OUT_DIR || join('docs/audits/screenshots', 'nearby-empty-state');

mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

async function selectNearby(page) {
  // Prefer scoped buttons in feed chrome
  const candidates = [
    page.getByRole('button', { name: /In je buurt|Nearby/i }),
    page.locator('button[aria-pressed="true"]').filter({ hasText: /buurt|Nearby/i }),
    page.locator('button').filter({ hasText: /In je buurt|Nearby/i }),
  ];
  for (const loc of candidates) {
    const first = loc.first();
    if (await first.count()) {
      await first.click({ timeout: 5000 }).catch(() => {});
      break;
    }
  }
  // Deny geolocation so Nearby has no GPS
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      geolocation: undefined,
      permissions: [], // no geolocation grant
      locale: 'nl-NL',
    });
    // Explicitly deny geolocation permission prompt
    await context.grantPermissions([], { origin: BASE });

    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2500);
    await selectNearby(page);
    await page.waitForTimeout(2000);

    const empty = page.locator('[data-testid="nearby-location-required-empty"]');
    const visible = await empty.isVisible().catch(() => false);
    const path = join(OUT, `nearby-empty-${vp.name}.png`);
    await page.screenshot({ path, fullPage: false });
    results.push({
      viewport: vp.name,
      emptyVisible: visible,
      path,
      status: await empty.getAttribute('data-hc-nearby-status').catch(() => null),
    });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ base: BASE, out: OUT, results }, null, 2));
  const allOk = results.every((r) => r.emptyVisible);
  process.exit(allOk ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
