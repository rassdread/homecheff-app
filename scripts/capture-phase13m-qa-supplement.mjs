#!/usr/bin/env node
/** Supplemental Phase 13M QA shots — dismiss cookie banner, wait for tiles. */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'audits', 'screenshots', 'phase13m');
const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3000';

async function dismissCookies(page) {
  const accept = page.getByRole('button', { name: /accepteer alle|accept all/i });
  if ((await accept.count()) > 0) {
    await accept.first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // Desktop feed with tiles
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/?chip=sale#homecheff-feed`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookies(page);
    await page.waitForTimeout(12000);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(2000);
    const text = await page.locator('body').innerText();
    console.log('Feed result hint:', text.match(/\d+\s+resultaten/i)?.[0] ?? 'no count');
    await page.screenshot({ path: path.join(OUT, '09-desktop-feed-tiles-loaded.png') });
    console.log('✅ 09-desktop-feed-tiles-loaded');
    await page.close();
  }

  // Mobile feed tile close-up
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/?chip=sale#homecheff-feed`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookies(page);
    await page.waitForTimeout(10000);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '10-mobile-feed-tile-closeup.png') });
    console.log('✅ 10-mobile-feed-tile-closeup');
    await page.close();
  }

  // Product detail — CREATE (food/orange) item
  {
    const slug = '/product/k-s-berkel-rodenrijs-hcid-3b85deeb-5801-417a-a087-5b6027130ae0';
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}${slug}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookies(page);
    await page.waitForTimeout(10000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '11-desktop-product-detail-settlement-loaded.png'), fullPage: true });
    console.log('✅ 11-desktop-product-detail-settlement-loaded');
    await page.close();
  }

  // Inspiratie detail — pick first card link if present
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/inspiratie`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookies(page);
    await page.waitForTimeout(8000);
    const link = page.locator('a[href*="/inspiratie/"]').first();
    if ((await link.count()) > 0) {
      const href = await link.getAttribute('href');
      await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(6000);
      await page.screenshot({ path: path.join(OUT, '12-desktop-inspiratie-detail.png'), fullPage: false });
      console.log('✅ 12-desktop-inspiratie-detail', href);
    } else {
      console.log('⚠ skipped inspiratie detail — no cards');
    }
    await page.close();
  }

  // Sell flow — category step with taxonomy icons
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/sell/new`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);
    await dismissCookies(page);
    const offer = page.getByRole('button', { name: /aanbod|offer|verkoop/i }).first();
    if ((await offer.count()) > 0) {
      await offer.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: path.join(OUT, '13-mobile-entry-category-step.png'), fullPage: true });
    console.log('✅ 13-mobile-entry-category-step');
    await page.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
