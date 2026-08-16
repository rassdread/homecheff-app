/**
 * After-pass fold metrics for multi-persona UX implementation.
 * Usage: BASE_URL=http://127.0.0.1:3017 node scripts/probe-multi-persona-ux-after-measure.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3017').replace(/\/$/, '');
const OUT = path.join(process.cwd(), 'docs/audits/multi-persona-ux', `after-${Date.now()}`);
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: 'phone-sm', width: 360, height: 740, locale: 'nl-NL' },
  { id: 'phone-lg', width: 390, height: 844, locale: 'nl-NL' },
  { id: 'phone-430', width: 430, height: 932, locale: 'nl-NL' },
  { id: 'phone-landscape', width: 844, height: 390, locale: 'nl-NL' },
  { id: 'tablet', width: 768, height: 1024, locale: 'nl-NL' },
  { id: 'desktop', width: 1440, height: 900, locale: 'nl-NL' },
  { id: 'ultrawide', width: 2560, height: 1080, locale: 'nl-NL' },
  { id: 'phone-en', width: 390, height: 844, locale: 'en-US' },
];

async function dismiss(page) {
  for (const label of [/Accept all/i, /Alles accepteren/i, /Only necessary/i, /Alleen noodzakelijk/i]) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(300);
      break;
    }
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: vp.locale,
    extraHTTPHeaders: { 'Accept-Language': vp.locale },
  });
  // Clear language cookie so cold-start applies
  await context.clearCookies();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2000);
  await dismiss(page);
  await page
    .waitForFunction(() => document.querySelectorAll('a[href*="/product"]').length > 0, {
      timeout: 45000,
    })
    .catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${vp.id}.png`), fullPage: false });

  const m = await page.evaluate(() => {
    const vh = window.innerHeight;
    const strip = document.querySelector('[data-wx-orientation-strip]');
    const sr = strip?.getBoundingClientRect();
    const title = document.querySelector('[data-wx-orientation-title]');
    const identity = document.querySelector('[data-wx-orientation-identity]');
    const body = document.querySelector('[data-wx-orientation-explain-body]');
    const actions = document.querySelector('[data-wx-orientation-cta], [data-wx-orientation-actions]');
    const keywordish = (strip?.innerText || '').includes('Zoeken ·') || (strip?.innerText || '').includes('Search ·');
    const cards = [...document.querySelectorAll('a[href*="/product"], [data-feed-tile], .hc-feed-card')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
      })
      .filter((c) => c.h > 40)
      .sort((a, b) => a.top - b.top);
    const first = cards[0];
    const visiblePct = first
      ? Math.max(
          0,
          Math.min(100, Math.round(((Math.min(vh, first.bottom) - Math.max(0, first.top)) / first.h) * 100)),
        )
      : 0;
    const filterRows = document.querySelectorAll(
      '[data-mobile-filter-collapsed="false"] > div.flex.gap-1\\.5, [data-wx-discovery-chrome] .space-y-2 > div',
    ).length;
    const permanentChromeApprox = [
      document.querySelector('[data-wx-orientation-strip]'),
      document.querySelector('[data-wx-feed-search]')?.closest('div'),
      document.querySelector('[data-testid="location-refine-banner"]'),
      document.querySelector('[data-mobile-filter-collapsed]'),
    ].filter(Boolean).length;

    return {
      htmlLang: document.documentElement.lang,
      model: strip?.getAttribute('data-wx-orientation-model'),
      level: strip?.getAttribute('data-wx-orientation-explain'),
      heroH: sr ? Math.round(sr.height) : null,
      heroBottom: sr ? Math.round(sr.bottom) : null,
      title: (title?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      identity: (identity?.textContent || '').trim(),
      body: (body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
      hasCtas: Boolean(actions),
      keywordStripVisible: keywordish,
      firstListingTop: first?.top ?? null,
      listingVisiblePct: visiblePct,
      permanentChromeApprox,
      sampleAboveFold: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 500),
    };
  });

  // Journey smoke (phone-lg + desktop)
  let journey = null;
  if (vp.id === 'phone-lg' || vp.id === 'desktop') {
    const href = await page.evaluate(() => document.querySelector('a[href*="/product/"]')?.getAttribute('href'));
    if (href) {
      await page.goto(new URL(href, BASE).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      const detailOk = await page.evaluate(() => Boolean(document.querySelector('h1') || document.body.innerText.length > 100));
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await dismiss(page);
      const sell = page.getByRole('button', { name: /Verkoop of deel|Sell or share/i }).first();
      let createOk = false;
      if (await sell.isVisible().catch(() => false)) {
        await sell.click().catch(() => {});
        await page.waitForTimeout(800);
        createOk = /Join|Aanmelden|Log in|Inloggen|Share what|Deel wat/i.test(
          await page.evaluate(() => document.body.innerText),
        );
        await page.keyboard.press('Escape');
      }
      journey = { listing: detailOk, create: createOk, href };
    }
  }

  results.push({ viewport: vp, metrics: m, pageErrors, journey });
  await context.close();
}

await browser.close();
const report = { base: BASE, at: new Date().toISOString(), out: OUT, results };
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, summary: results.map((r) => ({
  id: r.viewport.id,
  lang: r.metrics.htmlLang,
  heroH: r.metrics.heroH,
  firstY: r.metrics.firstListingTop,
  visPct: r.metrics.listingVisiblePct,
  title: r.metrics.title?.slice(0, 60),
  model: r.metrics.model,
  level: r.metrics.level,
  keyword: r.metrics.keywordStripVisible,
  errors: r.pageErrors.length,
  journey: r.journey,
})) }, null, 2));
