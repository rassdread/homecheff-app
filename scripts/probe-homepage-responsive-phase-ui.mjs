#!/usr/bin/env node
/** Homepage cross-viewport overflow + layout probe (anonymous). */
import puppeteer from 'puppeteer';

const WIDTHS = [320, 360, 390, 412, 430, 480, 640, 768, 900, 1024, 1280, 1440, 1920, 2560];
const baseUrl = process.argv.find((a) => a.startsWith('--base-url='))?.slice(11) || 'http://127.0.0.1:3010';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type()==='error' || /hydration/i.test(m.text())) errors.push(m.text().slice(0,150)); });

const results = [];
for (const w of WIDTHS) {
  await page.setViewport({ width: w, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.querySelector('header'), { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));
  const data = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    const hero = document.querySelector('.hc-hero-dorpsplein');
    const feedSkeleton = document.querySelector('[aria-label="Marketplace laden"]');
    const feedTiles = document.querySelectorAll('[data-feed-tile], .hc-feed-card, #homecheff-feed img, #homecheff-feed-desktop img').length;
    const bottomNav = document.querySelector('[data-bottom-nav-visible]');
    const strips = document.querySelectorAll('.hc-home-page-shell, .hc-dorpsplein-page');
    let maxOverflowEl = null;
    let maxOverflow = 0;
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      const over = r.right - window.innerWidth;
      if (over > maxOverflow && r.width > 10) {
        maxOverflow = over;
        maxOverflowEl = { tag: el.tagName, class: (el.className||'').toString().slice(0,60), over: Math.round(over) };
      }
    }
    return {
      overflow,
      scrollWidth: document.documentElement.scrollWidth,
      heroVisible: hero ? hero.getBoundingClientRect().width > 0 : false,
      feedSkeletonStuck: !!feedSkeleton,
      feedTileSignals: feedTiles,
      bottomNavPad: bottomNav?.getAttribute('data-bottom-nav-visible'),
      maxOverflowEl,
    };
  });
  results.push({ width: w, ...data });
}
await browser.close();
const issues = results.filter((r) => r.overflow || r.maxOverflowEl?.over > 2);
console.log(JSON.stringify({ measuredAt: new Date().toISOString(), issueCount: issues.length, issues, results, consoleErrors: errors.slice(0,5) }, null, 2));
