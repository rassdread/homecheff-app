#!/usr/bin/env node
/**
 * Adaptive navbar geometry probe — guest + synthetic auth chrome stress.
 * Usage: node scripts/probe-navbar-adaptive-clip.mjs --base-url=http://127.0.0.1:3030
 */
import puppeteer from 'puppeteer';

const WIDTHS = [2560, 1920, 1680, 1600, 1536, 1440, 1366, 1280, 1180, 1024, 900, 768, 640, 480, 390, 320];
const INTERMEDIATE = [1500, 1320, 1100, 980, 850, 700, 520, 410, 350];
const baseUrl = process.argv.find((a) => a.startsWith('--base-url='))?.slice(11) || 'http://127.0.0.1:3030';

function overlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

async function measure(page, width, label) {
  await page.setViewport({ width, height: 900 });
  await new Promise((r) => setTimeout(r, 280));
  return page.evaluate((w, lab) => {
    const header = document.querySelector('header');
    if (!header) return { width: w, label: lab, error: 'no header' };
    const row = header.querySelector(':scope > div > div') || header.querySelector('div');
    const issues = [];
    const headerOverflow = header.scrollWidth > header.clientWidth + 1;
    const docOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    if (headerOverflow) issues.push('header_overflow');
    if (docOverflow) issues.push('doc_overflow');

    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const cta = [...header.querySelectorAll('button, a')].find(
      (el) =>
        /verkoop of deel|sell or share|sell & share/i.test(el.textContent || '') &&
        isVisible(el),
    );
    // Below xl, guest CTA is intentionally menu-only (not a defect).
    const expectVisibleCta = w >= 1280 || (w >= 1024 && document.body.dataset.auth === '1');
    if (expectVisibleCta && !cta) issues.push('cta_missing');
    if (cta) {
      const r = cta.getBoundingClientRect();
      const labelEl = cta.querySelector('span') || cta;
      if (labelEl.scrollWidth > labelEl.clientWidth + 2) issues.push('cta_label_truncated');
      if (r.right > window.innerWidth + 1 || r.left < -1) issues.push('cta_outside_viewport');
    }

    const login = [...header.querySelectorAll('a[href="/login"]')].find((a) => {
      const r = a.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
    const register = [...header.querySelectorAll('a[href="/register"]')].find((a) => {
      const r = a.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
    const menu = header.querySelector('button[aria-controls="navbar-mobile-menu"]');
    const menuVisible = !!(menu && menu.getBoundingClientRect().width > 2);

    // Cluster overlap check among visible primary controls
    const controls = [...header.querySelectorAll('a, button')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8 && r.top < 80 && isVisible(el);
    });
    for (let i = 0; i < controls.length; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i].getBoundingClientRect();
        const b = controls[j].getBoundingClientRect();
        if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
        // Require meaningful overlap area (ignore adjacent flex siblings)
        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (xOverlap > 6 && yOverlap > 6) {
          issues.push(`overlap:${(controls[i].textContent || '').trim().slice(0, 24)}|${(controls[j].textContent || '').trim().slice(0, 24)}`);
        }
      }
    }

    return {
      width: w,
      label: lab,
      issues: [...new Set(issues)],
      headerOverflow,
      docOverflow,
      ctaVisible: !!cta,
      ctaText: cta ? (cta.textContent || '').trim().slice(0, 40) : null,
      loginVisible: !!login,
      registerVisible: !!register,
      menuVisible,
      mode: w >= 1280 ? 'desktop-nav' : w >= 1024 ? 'compact-laptop' : 'mobile',
    };
  }, width, label);
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || /hydration/i.test(m.text())) consoleErrors.push(m.text().slice(0, 140));
});
page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 140)));

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('header', { timeout: 45000 });
await new Promise((r) => setTimeout(r, 2000));

const results = [];
for (const w of WIDTHS) results.push(await measure(page, w, 'matrix'));
for (const w of INTERMEDIATE) results.push(await measure(page, w, 'intermediate'));

// Continuous resize sweep
const sweep = [];
for (let w = 1920; w >= 320; w -= 40) {
  sweep.push(await measure(page, w, 'sweep'));
}

await browser.close();

const failing = [...results, ...sweep].filter((r) => (r.issues || []).length);
const out = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  failCount: failing.length,
  failing: failing.slice(0, 40),
  matrix: results.filter((r) => r.label === 'matrix'),
  hydrationOrConsole: consoleErrors.slice(0, 8),
};
console.log(JSON.stringify(out, null, 2));
process.exit(failing.length ? 1 : 0);
