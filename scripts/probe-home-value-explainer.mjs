/**
 * Homepage "Wat kan HomeCheff voor mij betekenen?" dialog probe (read-only).
 * Env: BASE (default https://homecheff.eu/), OUT (default /tmp/hc-value-explainer), LANG_COOKIE (nl|en),
 * STORAGE_STATE (optional logged-in Playwright state), SIZES (default 1440x900,390x844,844x390).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'https://homecheff.eu/';
const OUT = process.env.OUT || '/tmp/hc-value-explainer';
const LANG = process.env.LANG_COOKIE || 'nl';
const SIZES = (process.env.SIZES || '1440x900,390x844,844x390')
  .split(',')
  .map((s) => s.split('x').map(Number));
const ZOOM = Number(process.env.ZOOM || '1');
fs.mkdirSync(OUT, { recursive: true });

const host = new URL(BASE).hostname;
const browser = await chromium.launch({ headless: true });
const results = [];

for (const [width, height] of SIZES) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: ZOOM,
    ...(process.env.STORAGE_STATE ? { storageState: process.env.STORAGE_STATE } : {}),
  });
  await context.addCookies([{ name: 'homecheff-language', value: LANG, domain: host, path: '/' }]);
  const page = await context.newPage();
  const tag = `${width}x${height}${ZOOM !== 1 ? `@${ZOOM}x` : ''}`;
  const r = { size: tag };
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3500);
  if (ZOOM !== 1) {
    await page.evaluate(`document.documentElement.style.zoom = '${ZOOM * 100}%'`);
    await page.waitForTimeout(800);
  }

  const trigger = page.locator('[data-hc-value-explainer-trigger]').first();
  r.triggerCount = await page.locator('[data-hc-value-explainer-trigger]').count();
  r.triggerVisible = r.triggerCount > 0 && (await trigger.isVisible());
  r.triggerText = r.triggerVisible ? (await trigger.innerText()).trim() : null;
  r.primaryVisible = await page.locator('[data-wx-orientation-cta] [data-wx-seller-cta]').first().isVisible().catch(() => false);
  r.docOverflowX = await page.evaluate(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth',
  );
  r.heroToggleVisible = await page
    .locator('[data-hc-hero-toggle], button:has-text("Ontdek in je buurt"), button:has-text("Discover nearby")')
    .first()
    .isVisible()
    .catch(() => false);
  await page.screenshot({ path: path.join(OUT, `${tag}-hero.png`) });

  if (r.triggerVisible) {
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    const dialog = page.locator('[data-hc-value-explainer] [role="dialog"]');
    r.dialogOpenByKeyboard = await dialog.isVisible().catch(() => false);
    r.dialogTitle = r.dialogOpenByKeyboard ? (await dialog.locator('h2').innerText()).trim() : null;
    r.dialogText = r.dialogOpenByKeyboard ? (await dialog.innerText()).trim() : null;
    r.focusInDialogOnOpen = await page.evaluate(
      `!!document.activeElement && !!document.activeElement.closest('[data-hc-value-explainer]')`,
    );
    const trap = [];
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('Tab');
      trap.push(
        await page.evaluate(`!!document.activeElement && !!document.activeElement.closest('[data-hc-value-explainer]')`),
      );
    }
    r.focusTrapped = trap.every(Boolean);
    r.exploreHref = await dialog.locator('[data-hc-value-explainer-explore]').getAttribute('href').catch(() => null);
    r.dialogOverflowX = await page.evaluate(`(() => {
      const d = document.querySelector('[data-hc-value-explainer] [role="dialog"]');
      if (!d) return null;
      const b = d.getBoundingClientRect();
      return { left: Math.round(b.left), right: Math.round(b.right), vw: window.innerWidth, scrollH: d.scrollHeight, clientH: d.clientHeight };
    })()`);
    await page.screenshot({ path: path.join(OUT, `${tag}-dialog.png`) });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    r.closedByEscape = !(await dialog.isVisible().catch(() => false));
    r.focusReturnedToTrigger = await page.evaluate(
      `!!document.activeElement && document.activeElement.hasAttribute('data-hc-value-explainer-trigger')`,
    );

    try {
      await trigger.click({ timeout: 8000 });
      await page.waitForTimeout(500);
      r.reopenedByClick = await dialog.isVisible().catch(() => false);
      await page.locator('[data-hc-value-explainer] button[aria-label]').first().click({ timeout: 8000 });
      await page.waitForTimeout(400);
      r.closedByButton = !(await dialog.isVisible().catch(() => false));

      await trigger.click({ timeout: 8000 });
      await page.waitForTimeout(500);
      await page.locator('[data-hc-value-explainer-start]').click({ timeout: 8000 });
      await page.waitForTimeout(1500);
      r.afterStartUrl = page.url();
      r.afterStartDialogs = await page.evaluate(`Array.from(document.querySelectorAll('[role="dialog"]')).filter(e => e.getBoundingClientRect().height > 0).map(e => (e.innerText || '').trim().slice(0, 80))`);
      await page.screenshot({ path: path.join(OUT, `${tag}-after-start.png`) });
    } catch (error) {
      r.clickFlowError = String(error.message || error).split('\n')[0];
      await page.screenshot({ path: path.join(OUT, `${tag}-click-error.png`) });
    }
  }
  results.push(r);
  console.log(JSON.stringify(r));
  await context.close();
}

fs.writeFileSync(path.join(OUT, 'value-explainer.json'), JSON.stringify(results, null, 2));
await browser.close();
