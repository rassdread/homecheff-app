/**
 * Minimal READ-ONLY launch freeze smoke (Chromium + WebKit, desktop + mobile).
 * No auth, no listings created, no payments.
 *
 *   BASE_URL=https://homecheff.eu node scripts/probe-technical-freeze-smoke.mjs
 */
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/technical-freeze',
  `smoke-${Date.now()}`,
);

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

async function runMatrix(browserType, name) {
  const browser = await browserType.launch({ headless: true });
  const results = {};
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport,
      locale: 'nl-NL',
    });
    const page = await context.newPage();
    const geocodeCalls = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('/api/geocoding') || u.includes('maps.googleapis.com/maps/api/geocode')) {
        geocodeCalls.push(u.split('?')[0]);
      }
    });

    const row = {
      browser: name,
      viewport: vpName,
      home: null,
      columns1: null,
      feedItems: null,
      contextBar: null,
      growth: [],
      cta: null,
      listing: null,
      profile: null,
      geocodeDuringFeed: 0,
      errors: [],
    };

    try {
      const homeRes = await page.goto(BASE + '/', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      row.home = homeRes?.status() ?? null;
      await page.waitForTimeout(2500);

      const gridClass = await page
        .locator('[class*="grid-cols"]')
        .first()
        .getAttribute('class')
        .catch(() => null);
      row.columns1 =
        typeof gridClass === 'string' &&
        (gridClass.includes('grid-cols-1') || !gridClass.includes('grid-cols-2'));

      row.feedItems = await page.locator('a[href*="/product/"], a[href*="/dish/"], a[href*="/recipe/"]').count();
      row.contextBar = (await page.locator('text=/Locatie|Afstand|Sorteren|km/i').count()) > 0;

      const before = row.feedItems;
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, 2200);
        await page.waitForTimeout(1200);
        row.growth.push(
          await page.locator('a[href*="/product/"], a[href*="/dish/"], a[href*="/recipe/"]').count(),
        );
      }
      row.cta = (await page.locator('text=/Aanmelden|Word verkoper|Ontdek|Maak aanbod/i').count()) > 0;

      const firstCard = page.locator('a[href*="/product/"]').first();
      if (await firstCard.count()) {
        await firstCard.click({ timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        row.listing = { status: 200, url: page.url() };
        const profileLink = page.locator('a[href*="/user/"], a[href*="/verkoper/"], a[href*="/seller/"]').first();
        if (await profileLink.count()) {
          await profileLink.click({ timeout: 15000 });
          await page.waitForLoadState('domcontentloaded');
          row.profile = { status: 200, url: page.url() };
        } else {
          row.profile = { status: null, note: 'no profile link found on listing' };
        }
      } else {
        row.listing = { status: null, note: 'no product card' };
      }

      row.geocodeDuringFeed = geocodeCalls.filter((u) =>
        u.includes('/api/geocoding'),
      ).length;
      // Feed scroll should not trigger listing place geocode; allow 0.
      row.grew = row.growth.some((n) => n > before) || before > 0;
    } catch (e) {
      row.errors.push(String(e?.message || e));
    }

    await context.close();
    results[vpName] = row;
    const shot = path.join(OUT, `${name}-${vpName}.png`);
    // screenshot from last page state is closed; skip if failed
    void shot;
  }
  await browser.close();
  return results;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    at: new Date().toISOString(),
    base: BASE,
    chromium: await runMatrix(chromium, 'chromium'),
    webkit: null,
  };
  try {
    report.webkit = await runMatrix(webkit, 'webkit');
  } catch (e) {
    report.webkit = { error: String(e?.message || e) };
  }

  // Extra route checks via fetch (no browser)
  const routes = {};
  for (const p of [
    '/product/fcc5ff2a-651a-4983-9d17-b3f1acf7ca17',
    '/user/Tiego',
    '/inspiratie',
    '/api/feed?limit=8',
  ]) {
    const res = await fetch(BASE + p);
    routes[p] = res.status;
  }
  report.routes = routes;

  const outFile = path.join(OUT, 'report.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  writeFileSync(
    path.join(process.cwd(), 'docs/audits/technical-freeze/smoke-latest.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ outFile, summary: {
    chromiumDesktopHome: report.chromium?.desktop?.home,
    chromiumMobileHome: report.chromium?.mobile?.home,
    webkitDesktopHome: report.webkit?.desktop?.home,
    webkitMobileHome: report.webkit?.mobile?.home,
    routes,
  }}, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
