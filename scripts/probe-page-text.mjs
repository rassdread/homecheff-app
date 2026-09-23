/**
 * Rendered-text probe (read-only): visible <main> text after client i18n has loaded.
 * Env: BASE, PATHS (comma list), LANG_COOKIE (nl|en), OUT (json path).
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.env.BASE || 'https://homecheff.eu').replace(/\/$/, '');
const PATHS = (process.env.PATHS || '/over-ons,/faq,/affiliate').split(',');
const LANG = process.env.LANG_COOKIE || 'nl';
const OUT = process.env.OUT || '/tmp/hc-page-text.json';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([{ name: 'homecheff-language', value: LANG, url: BASE }]);
const page = await context.newPage();
const results = {};
for (const p of PATHS) {
  const res = await page.goto(`${BASE}${p}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500);
  const text = await page.evaluate(() => (document.querySelector('main') || document.body).innerText);
  results[p] = {
    status: res?.status() ?? null,
    unresolvedKeys: (text.match(/\b[a-z][a-zA-Z]+\.[a-z][a-zA-Z0-9]+\.[a-zA-Z0-9.]+\b/g) || []).filter((k) => !k.includes('homecheff.eu')),
    emDashLines: text.split('\n').filter((l) => l.includes('—')).length,
    text,
  };
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`${PATHS.length} pages -> ${OUT}`);
