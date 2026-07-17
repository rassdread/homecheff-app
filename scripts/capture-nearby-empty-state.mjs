/**
 * Capture Nearby-without-location empty state screenshots (desktop/tablet/mobile).
 * Usage: BASE_URL=https://homecheff.eu node scripts/capture-nearby-empty-state.mjs
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

async function dismissPrivacy(page) {
  for (const label of [
    'Only necessary',
    'Alleen noodzakelijk',
    'Accept all',
    'Alles accepteren',
  ]) {
    const b = page.getByRole('button', { name: new RegExp(label, 'i') });
    if (await b.count()) {
      await b.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function forceNearbyNoLocation(page) {
  await page.evaluate(() => {
    const payload = {
      scope: 'nearby',
      radius: 25,
      place: '',
      feedChip: 'all',
      category: 'all',
    };
    const envelope = {
      home: { savedAt: Date.now(), payload },
    };
    sessionStorage.setItem('hc_feed_surfaces_v2', JSON.stringify(envelope));
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2500);
  await dismissPrivacy(page);
  await page.waitForTimeout(1500);

  // Ensure nearby selected if persist didn't stick
  const nearbyBtn = page.getByRole('button', { name: /In je buurt|Nearby/i }).first();
  if (await nearbyBtn.count()) {
    await nearbyBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'nl-NL',
      // Deny geolocation — Nearby must show empty state
      permissions: [],
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);
    await dismissPrivacy(page);
    await forceNearbyNoLocation(page);

    const empty = page.locator('[data-testid="nearby-location-required-empty"]');
    await empty.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    const visible = await empty.isVisible().catch(() => false);
    const path = join(OUT, `nearby-empty-${vp.name}.png`);
    // Prefer cropping to empty state when visible
    if (visible) {
      await empty.screenshot({ path });
    } else {
      await page.screenshot({ path, fullPage: false });
    }
    results.push({
      viewport: vp.name,
      emptyVisible: visible,
      path,
      status: await empty.getAttribute('data-hc-nearby-status').catch(() => null),
      wrong: (await page.locator('body').innerText()).includes('Something went wrong'),
    });
    await context.close();
  }

  // Android-ish: same mobile viewport + Android UA (Capacitor WebView proxy)
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'nl-NL',
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      permissions: [],
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);
    await dismissPrivacy(page);
    await forceNearbyNoLocation(page);
    const empty = page.locator('[data-testid="nearby-location-required-empty"]');
    await empty.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    const visible = await empty.isVisible().catch(() => false);
    const path = join(OUT, 'nearby-empty-android.png');
    if (visible) await empty.screenshot({ path });
    else await page.screenshot({ path, fullPage: false });
    results.push({
      viewport: 'android-ua',
      emptyVisible: visible,
      path,
      status: await empty.getAttribute('data-hc-nearby-status').catch(() => null),
      wrong: (await page.locator('body').innerText()).includes('Something went wrong'),
    });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ base: BASE, out: OUT, results }, null, 2));
  const allOk = results.every((r) => r.emptyVisible && !r.wrong);
  process.exit(allOk ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
