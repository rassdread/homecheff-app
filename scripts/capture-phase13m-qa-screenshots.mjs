#!/usr/bin/env node
/**
 * Phase 13M visual QA — capture rendered UI screenshots (local dev only).
 * Run: node scripts/capture-phase13m-qa-screenshots.mjs
 * Requires: npx playwright (installed on first run)
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'audits', 'screenshots', 'phase13m');
const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3000';

const PRODUCT_SLUG =
  '/product/homecheff-design-studio-vlaardingen-hcid-fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';

const SHOTS = [
  {
    name: '01-desktop-feed-multi-tone',
    viewport: { width: 1440, height: 900 },
    url: `${BASE}/?chip=sale#homecheff-feed`,
    waitMs: 5000,
    fullPage: false,
  },
  {
    name: '02-mobile-feed',
    viewport: { width: 390, height: 844 },
    url: `${BASE}/?chip=sale#homecheff-feed`,
    waitMs: 5000,
    fullPage: false,
  },
  {
    name: '03-desktop-home-vertical-chips',
    viewport: { width: 1440, height: 900 },
    url: `${BASE}/?chip=sale#homecheff-feed`,
    waitMs: 4000,
    clipSelector: '[aria-label*="HomeCheff"], [data-home-feed], .homecheff-feed, main',
    fullPage: false,
  },
  {
    name: '04-mobile-sell-entry-flow',
    viewport: { width: 390, height: 844 },
    url: `${BASE}/sell/new`,
    waitMs: 4000,
    fullPage: true,
  },
  {
    name: '05-desktop-product-detail-settlement',
    viewport: { width: 1440, height: 900 },
    url: `${BASE}${PRODUCT_SLUG}`,
    waitMs: 5000,
    fullPage: true,
  },
  {
    name: '06-mobile-product-detail-settlement',
    viewport: { width: 390, height: 844 },
    url: `${BASE}${PRODUCT_SLUG}`,
    waitMs: 5000,
    fullPage: true,
  },
  {
    name: '07-desktop-inspiratie-feed',
    viewport: { width: 1440, height: 900 },
    url: `${BASE}/inspiratie`,
    waitMs: 5000,
    fullPage: false,
  },
];

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const shot of SHOTS) {
    const page = await browser.newPage();
    await page.setViewportSize(shot.viewport);
    try {
      await page.goto(shot.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(shot.waitMs);
      // Wait for feed/tile content when on marketplace routes
      await page
        .locator('[data-marketplace-tile], [data-detail-section], main')
        .first()
        .waitFor({ state: 'visible', timeout: 30000 })
        .catch(() => {});

      const outPath = path.join(OUT, `${shot.name}.png`);
      if (shot.clipSelector) {
        const el = page.locator(shot.clipSelector).first();
        if ((await el.count()) > 0) {
          await el.screenshot({ path: outPath });
        } else {
          await page.screenshot({ path: outPath, fullPage: shot.fullPage });
        }
      } else {
        await page.screenshot({ path: outPath, fullPage: shot.fullPage });
      }

      // Sample taxonomy/settlement icon computed colors
      const samples = await page.evaluate(() => {
        const icons = [...document.querySelectorAll('svg.lucide')].slice(0, 12);
        return icons.map((svg) => {
          const cs = getComputedStyle(svg);
          return {
            className: svg.getAttribute('class')?.slice(0, 120) ?? '',
            color: cs.color,
            width: cs.width,
            height: cs.height,
          };
        });
      });

      results.push({ shot: shot.name, path: outPath, iconSamples: samples });
      console.log(`✅ ${shot.name} → ${outPath}`);
    } catch (err) {
      console.error(`❌ ${shot.name}:`, err.message);
      results.push({ shot: shot.name, error: String(err) });
    } finally {
      await page.close();
    }
  }

  // Accepted-value filter on gezocht chip if available
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  try {
    await page.goto(`${BASE}/?chip=gezocht#homecheff-feed`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(4000);
    const filterBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /filter|filters|accepted|waarden|gezocht/i })
      .first();
    if ((await filterBtn.count()) > 0) {
      await filterBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    const outPath = path.join(OUT, '08-desktop-accepted-values-filter.png');
    await page.screenshot({ path: outPath, fullPage: false });
    results.push({ shot: '08-desktop-accepted-values-filter', path: outPath });
    console.log(`✅ 08-desktop-accepted-values-filter → ${outPath}`);
  } catch (err) {
    console.error('❌ accepted-values filter shot:', err.message);
  } finally {
    await page.close();
  }

  await browser.close();

  const manifestPath = path.join(OUT, 'manifest.json');
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(manifestPath, JSON.stringify({ capturedAt: new Date().toISOString(), results }, null, 2)),
  );
  console.log(`\nManifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
