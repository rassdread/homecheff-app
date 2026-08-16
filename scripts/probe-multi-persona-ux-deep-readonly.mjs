/**
 * READ-ONLY deep UX probe: dismiss cookies, force NL, clean fold, journeys.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(process.cwd(), 'docs/audits/multi-persona-ux', `probe-deep-${Date.now()}`);
mkdirSync(OUT, { recursive: true });

async function dismissOverlays(page) {
  for (const label of [/Accept all/i, /Alles accepteren/i, /Only necessary/i, /Alleen noodzakelijk/i]) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
      break;
    }
  }
  // Close location nudge if present (don't grant geolocation)
  const closeLoc = page.locator('[aria-label*="close" i], button:has-text("×")').first();
  // leave location banner — it's part of UX
}

async function forceDutch(page) {
  // Try language switcher NL flag / Nederlands
  const nl = page.locator('button:has-text("🇳🇱"), [aria-label*="Nederlands" i], button:has-text("NL")').first();
  if (await nl.isVisible().catch(() => false)) {
    await nl.click().catch(() => {});
    await page.waitForTimeout(800);
    return 'clicked-nl-control';
  }
  // cookie/localStorage locale
  await page.evaluate(() => {
    try {
      localStorage.setItem('locale', 'nl');
      localStorage.setItem('language', 'nl');
      localStorage.setItem('hc-locale', 'nl');
      localStorage.setItem('NEXT_LOCALE', 'nl');
    } catch {}
  });
  return 'localStorage-nl-attempt';
}

async function foldMetrics(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const textBlocks = [];
    const els = [...document.querySelectorAll('h1,h2,h3,p,button,a,input,[role="button"],[placeholder]')];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.height < 6) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const text = (el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) continue;
      textBlocks.push({
        tag: el.tagName,
        text: text.slice(0, 220),
        top: Math.round(r.top),
        h: Math.round(r.height),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        clickable: el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button',
      });
    }
    // Deduplicate similar
    const seen = new Set();
    const unique = [];
    for (const b of textBlocks) {
      const k = b.tag + '|' + b.text.slice(0, 40) + '|' + b.top;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(b);
    }

    const hero = document.querySelector('[class*="hero"], section');
    let heroEl = null;
    for (const s of document.querySelectorAll('section, [class*="hero"], [class*="banner"]')) {
      const t = (s.innerText || '').slice(0, 80).toLowerCase();
      if (t.includes('neighbourhood') || t.includes('buurt') || t.includes('dichtbij') || t.includes('nearby')) {
        const r = s.getBoundingClientRect();
        heroEl = {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          height: Math.round(r.height),
          text: (s.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 900),
          wordCount: (s.innerText || '').trim().split(/\s+/).filter(Boolean).length,
        };
        break;
      }
    }

    const firstCard = [...document.querySelectorAll('a[href*="/product"], [data-feed-tile], article, .hc-feed-card')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          h: Math.round(r.height),
          href: el.getAttribute('href'),
          text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          inFold: r.top < vh && r.bottom > 80,
        };
      })
      .filter((x) => x.h > 40)
      .sort((a, b) => a.top - b.top)[0];

    const cookie = !!document.body.innerText.match(/Cookies & privacy|Cookies & privacy|Alleen noodzakelijk|Accept all/);
    const cookieVisible = [...document.querySelectorAll('button, div, section')].some((el) => {
      const t = el.innerText || '';
      if (!/Accept all|Alles accepteren|Only necessary|Alleen noodzakelijk/.test(t)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 80 && r.height > 40 && r.top < vh;
    });

    return {
      vh,
      title: document.title,
      lang: document.documentElement.lang,
      heroEl,
      firstCard,
      cookieVisible,
      aboveFoldText: unique
        .filter((b) => b.top >= 0 && b.top < vh)
        .map((b) => b.text)
        .join(' · ')
        .slice(0, 2800),
      aboveFoldBlocks: unique.filter((b) => b.top >= 0 && b.top < vh).slice(0, 60),
      pxUntilFirstCard: firstCard ? Math.max(0, firstCard.top) : null,
      listingVisiblePct: firstCard
        ? Math.max(0, Math.min(100, Math.round(((Math.min(vh, firstCard.bottom) - Math.max(0, firstCard.top)) / firstCard.h) * 100)))
        : 0,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const report = { base: BASE, at: new Date().toISOString(), out: OUT, scenarios: [] };

// Scenario matrix
const scenarios = [
  { id: 'mobile-nl-clean', width: 390, height: 844, mobile: true, nl: true },
  { id: 'mobile-en-clean', width: 390, height: 844, mobile: true, nl: false },
  { id: 'desktop-nl-clean', width: 1440, height: 900, mobile: false, nl: true },
  { id: 'desktop-en-clean', width: 1440, height: 900, mobile: false, nl: false },
  { id: 'phone-landscape-clean', width: 844, height: 390, mobile: true, nl: true },
  { id: 'tablet-portrait-clean', width: 768, height: 1024, mobile: true, nl: true },
];

for (const sc of scenarios) {
  process.stderr.write(`Deep ${sc.id}...\n`);
  const context = await browser.newContext({
    viewport: { width: sc.width, height: sc.height },
    isMobile: sc.mobile,
    hasTouch: sc.mobile,
    locale: sc.nl ? 'nl-NL' : 'en-GB',
    geolocation: undefined,
    permissions: [],
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);
  await dismissOverlays(page);
  let langAction = null;
  if (sc.nl) {
    langAction = await forceDutch(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await dismissOverlays(page);
  }
  await page
    .waitForFunction(() => document.querySelectorAll('a[href*="/product"]').length > 0, { timeout: 40000 })
    .catch(() => {});
  await page.waitForTimeout(1000);

  const beforeShot = path.join(OUT, `${sc.id}-fold.png`);
  await page.screenshot({ path: beforeShot, fullPage: false });
  const fold = await foldMetrics(page);

  // Journey: open listing + inspect + back + create
  let journey = { ok: false };
  try {
    const href = await page.evaluate(() => {
      const a = document.querySelector('a[href*="/product/"]');
      return a ? a.getAttribute('href') : null;
    });
    if (href) {
      await page.goto(new URL(href, BASE).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      await dismissOverlays(page);
      await page.screenshot({ path: path.join(OUT, `${sc.id}-listing.png`), fullPage: false });
      const detail = await page.evaluate(() => {
        const t = document.body.innerText.replace(/\s+/g, ' ').trim();
        return {
          url: location.href,
          hasPrice: /€|\bEUR\b|gratis|free|prijs|price/i.test(t),
          hasSeller: /verkoper|seller|maker|aanbieder|profiel|profile|@/i.test(t),
          hasBuy: /koop|buy|bestel|order|contact|bericht|message|chat/i.test(t),
          hasBack: !!document.querySelector('a[href="/"], button[aria-label*="back" i], a[aria-label*="terug" i]'),
          snippet: t.slice(0, 700),
          h1: document.querySelector('h1')?.innerText?.slice(0, 120) || null,
        };
      });
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await dismissOverlays(page);
      // Create CTA
      const create = await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('button, a')].filter((el) =>
          /verkoop|deel|sell or share|plaats|aanbied|\+/i.test(
            `${el.innerText || ''} ${el.getAttribute('aria-label') || ''}`,
          ),
        );
        return candidates.slice(0, 6).map((el) => ({
          text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          top: Math.round(el.getBoundingClientRect().top),
        }));
      });
      // Click bottom + or Sell or share
      const sell = page.getByRole('button', { name: /Sell or share|Verkoop of deel/i }).first();
      let createPanel = null;
      if (await sell.isVisible().catch(() => false)) {
        await sell.click().catch(() => {});
        await page.waitForTimeout(1200);
        createPanel = await page.evaluate(() =>
          document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 800),
        );
        await page.screenshot({ path: path.join(OUT, `${sc.id}-create.png`), fullPage: false });
        await page.keyboard.press('Escape');
      } else {
        const plus = page.locator('[data-bottom-nav] button, nav button').filter({ hasText: /^\+$|^$/ }).first();
        // Try aria plus
        const plusBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
        if (await plusBtn.isVisible().catch(() => false)) {
          await plusBtn.click().catch(() => {});
          await page.waitForTimeout(1000);
          createPanel = await page.evaluate(() =>
            document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 800),
          );
          await page.screenshot({ path: path.join(OUT, `${sc.id}-create.png`), fullPage: false });
          await page.keyboard.press('Escape');
        }
      }
      journey = { ok: true, href, detail, create, createPanel: createPanel?.slice(0, 500) || null };
    }
  } catch (e) {
    journey = { ok: false, error: String(e).slice(0, 250) };
  }

  report.scenarios.push({
    ...sc,
    langAction,
    fold,
    journey,
    screenshots: { fold: path.basename(beforeShot) },
  });
  await context.close();
}

await browser.close();
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, n: report.scenarios.length }, null, 2));
