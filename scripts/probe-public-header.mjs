/**
 * Read-only header probe. Logged out by default; pass COOKIE_FILE with a
 * Playwright storageState for a logged-in run.
 * Run: BASE=https://homecheff.eu/ node scripts/probe-public-header.mjs
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'https://homecheff.eu/';
const OUT = process.env.OUT ?? '/tmp/hc-header';
const STORAGE = process.env.STORAGE_STATE;
const ZOOM = process.env.ZOOM === '1';
const sizes = (process.env.SIZES ?? '1920x1080,1536x864,1440x900,1366x768,1280x900,1024x768,844x390,390x844')
  .split(',')
  .map((s) => s.split('x').map(Number));

function probe() {
  const header = document.querySelector('header[data-wx-navbar]');
  if (!header) return { header: false };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return null;
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      x: Math.round(r.left),
      r: Math.round(r.right),
      inViewport: r.left >= 0 && r.right <= innerWidth + 0.5,
      hit: !!top && (top === el || el.contains(top)),
    };
  };
  const items = [];
  for (const el of header.querySelectorAll('a,button')) {
    const b = box(el);
    if (!b) continue;
    items.push({
      text: (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 32),
      ...b,
    });
  }
  const row = header.querySelector('[data-wx-navbar-row] > div');
  return {
    vw: innerWidth,
    row: row ? { scrollWidth: row.scrollWidth, clientWidth: row.clientWidth } : null,
    items,
  };
}

const browser = await chromium.launch({ headless: true });
const result = {};
fs.mkdirSync(OUT, { recursive: true });
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    locale: 'nl-NL',
    ...(STORAGE ? { storageState: STORAGE } : {}),
  });
  await ctx.addCookies([{ name: 'homecheff-language', value: 'nl', url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(5000);
  if (ZOOM) {
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await page.waitForTimeout(500);
  }
  result[`${w}x${h}`] = await page.evaluate(probe);
  await page.screenshot({ path: `${OUT}/header-${w}x${h}${ZOOM ? '-zoom200' : ''}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, ZOOM ? 200 : 100) } });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/header.json`, JSON.stringify(result, null, 2));
for (const [k, v] of Object.entries(result)) {
  console.log(`== ${k} row=${JSON.stringify(v.row)}`);
  for (const i of v.items ?? []) {
    console.log(`   ${i.text.padEnd(32)} ${String(i.x).padStart(5)} ${String(i.r).padStart(5)} ${i.inViewport ? '' : 'OFFSCREEN '}${i.hit ? 'hit' : 'NOHIT'}`);
  }
}
