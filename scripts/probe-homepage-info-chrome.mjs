#!/usr/bin/env node
/**
 * Homepage information chrome + scroll-ownership acceptance.
 *
 *   BASE_URL=http://127.0.0.1:3128 node scripts/probe-homepage-info-chrome.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3128').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/homepage-info-chrome',
  `probe-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

const SEED = {
  lat: 51.9088,
  lng: 4.3444,
  place: 'Vlaardingen',
  countryCode: 'NL',
  radiusKm: 25,
};

async function snap(page) {
  return page.evaluate(() => {
    const feed = document.getElementById('homecheff-feed-desktop');
    const footer = document.querySelector('footer[data-homecheff-site-footer]');
    const chrome = [
      ...document.querySelectorAll('[data-hc-homepage-info-chrome]'),
    ].map((el) => {
      const style = getComputedStyle(el);
      const workspace = el.closest('[data-hc-homepage-info-workspace]');
      const workspaceDisplay = workspace ? getComputedStyle(workspace).display : null;
      return {
        variant: el.getAttribute('data-hc-homepage-info-chrome'),
        visible: style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0,
        workspaceDisplay,
        hrefs: [...el.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        hasCompany: Boolean(el.querySelector('[data-hc-homepage-company-identity]')),
      };
    });
    const identity = document.querySelector('[data-hc-homepage-company-identity]')?.textContent || '';
    const outerMaxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const nested =
      feed &&
      (getComputedStyle(feed).overflowY === 'auto' ||
        getComputedStyle(feed).overflowY === 'scroll');
    const sentinel = Boolean(
      document.querySelector('[data-feed-sentinel], [data-testid="feed-sentinel"]'),
    );
    const cards = document.querySelectorAll(
      'a[href*="/product/"],a[href*="/recipe/"],a[href*="/listing/"]',
    ).length;
    return {
      path: location.pathname,
      outerMaxScroll,
      docLock: document.documentElement.classList.contains(
        'hc-aw-feed-owns-document-scroll',
      ),
      scrollOwner: feed?.getAttribute('data-wx-scroll-owner') || null,
      supportingPanels: document
        .querySelector('[data-aw-supporting-panels]')
        ?.getAttribute('data-aw-supporting-panels'),
      nested: Boolean(nested),
      feedScrollTop: feed?.scrollTop ?? null,
      sentinel,
      cards,
      footerPresent: Boolean(footer),
      chrome,
      identity,
      bottomNav: Boolean(document.querySelector('[data-homecheff-bottom-nav], nav[aria-label*="navigatie" i]')),
    };
  });
}

async function waitReady(page) {
  await page.waitForSelector('#homecheff-feed-desktop, [data-aw-feed-workspace]', {
    timeout: 60000,
  });
  const start = Date.now();
  while (Date.now() - start < 25000) {
    const n = await page.locator(
      'a[href*="/product/"],a[href*="/recipe/"],a[href*="/listing/"]',
    ).count();
    const sentinel = await page.locator(
      '[data-feed-sentinel], [data-testid="feed-sentinel"]',
    ).count();
    if (n >= 4 || sentinel > 0) return;
    await page.waitForTimeout(500);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const report = { base: BASE, at: new Date().toISOString(), cases: [] };

  const cases = [
    { id: 'desktop-2col', viewport: { width: 1440, height: 900 } },
    { id: 'desktop-1col-comfort', viewport: { width: 900, height: 800 } },
    { id: 'mobile', viewport: { width: 390, height: 844 } },
  ];

  for (const c of cases) {
    const context = await browser.newContext({
      viewport: c.viewport,
      locale: 'nl-NL',
    });
    await context.addInitScript((seed) => {
      localStorage.setItem(
        'homecheff_feed_location_v1',
        JSON.stringify({ ...seed, source: 'manual', updatedAt: Date.now() }),
      );
    }, SEED);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitReady(page);
    const home = await snap(page);

    let moreOpened = false;
    const visibleChrome = home.chrome.find((x) => x.visible);
    if (visibleChrome) {
      const moreBtn = page.locator('[data-hc-homepage-info-chrome]:visible button[aria-haspopup="dialog"]').first();
      if (await moreBtn.count()) {
        await moreBtn.click();
        moreOpened = await page.locator('[data-hc-homepage-info-more]').isVisible();
        await page.keyboard.press('Escape');
      }
    } else if (c.id === 'mobile') {
      const menu = page.locator('button[aria-controls="navbar-mobile-menu"]');
      if (await menu.count()) {
        await menu.click();
        await page.waitForTimeout(300);
        const moreBtn = page.locator('[data-hc-homepage-info-chrome="nav"] button[aria-haspopup="dialog"]').first();
        if (await moreBtn.count()) {
          await moreBtn.click();
          moreOpened = await page.locator('[data-hc-homepage-info-more]').isVisible();
          await page.keyboard.press('Escape');
        }
      }
    }

    await page.evaluate(() => {
      const feed = document.getElementById('homecheff-feed-desktop');
      if (feed && getComputedStyle(feed).overflowY !== 'visible' && feed.clientHeight > 80) {
        feed.scrollBy(0, Math.round(feed.clientHeight * 0.7));
        feed.dispatchEvent(new Event('scroll', { bubbles: true }));
      } else {
        window.scrollBy(0, Math.round(window.innerHeight * 0.7));
      }
    });
    await page.waitForTimeout(1200);
    const afterScroll = await snap(page);

    const listing = page.locator('a[href*="/product/"]').first();
    let listingNav = { ok: false, back: false, footerOnListing: null };
    if (await listing.count()) {
      await listing.click({ timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(1200);
      listingNav.ok = !page.url().endsWith('/');
      const listingSnap = await snap(page);
      listingNav.footerOnListing = listingSnap.footerPresent;
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null);
      await waitReady(page);
      listingNav.back = (await snap(page)).path === '/';
    }

    await page.goto(`${BASE}/privacy`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const privacy = await snap(page);

    const row = {
      id: c.id,
      viewport: c.viewport,
      home,
      afterScroll: {
        outerMaxScroll: afterScroll.outerMaxScroll,
        scrollOwner: afterScroll.scrollOwner,
        sentinel: afterScroll.sentinel,
        cards: afterScroll.cards,
        footerPresent: afterScroll.footerPresent,
      },
      moreOpened,
      listingNav,
      privacyFooter: privacy.footerPresent,
      privacyPath: privacy.path,
      pageErrors: errors.slice(0, 8),
    };
    report.cases.push(row);
    await context.close();
  }

  await browser.close();
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out: OUT, summary: report.cases.map((c) => ({
    id: c.id,
    outerMaxScroll: c.home.outerMaxScroll,
    scrollOwner: c.home.scrollOwner,
    docLock: c.home.docLock,
    panels: c.home.supportingPanels,
    footerHome: c.home.footerPresent,
    chrome: c.home.chrome.map((x) => ({ variant: x.variant, visible: x.visible, workspaceDisplay: x.workspaceDisplay })),
    identity: c.home.identity,
    moreOpened: c.moreOpened,
    sentinel: c.home.sentinel,
    cards: c.home.cards,
    listingNav: c.listingNav,
    privacyFooter: c.privacyFooter,
    errors: c.pageErrors,
  })) }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
