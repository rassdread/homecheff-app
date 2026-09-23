/**
 * Read-only homepage hero probe.
 * Run: BASE=https://homecheff.eu/ node scripts/probe-home-hero.mjs
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'https://homecheff.eu/';
const OUT = process.env.OUT ?? '/tmp/hc-hero';
const LANG = process.env.LANG_COOKIE ?? 'nl';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const result = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: LANG === 'en' ? 'en-GB' : 'nl-NL' });
  await ctx.addCookies([{ name: 'homecheff-language', value: LANG, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${OUT}/home-${LANG}-${w}x${h}.png` });
  result[`${w}x${h}`] = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const h1 = Array.from(document.querySelectorAll('h1')).map((e) => e.textContent?.trim());
    const markers = Array.from(document.querySelectorAll('[data-wx-orientation],[data-hc-ecosystem-participation-signal],[data-wx-orientation-strip],section[aria-labelledby]'))
      .map((e) => ({ tag: e.tagName, attrs: Array.from(e.attributes).map((a) => a.name).join(' '), text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300) }));
    return { h1, markers, above: (main.innerText || '').slice(0, 900) };
  });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(result, null, 2));
