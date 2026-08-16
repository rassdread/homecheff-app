/**
 * READ-ONLY multi-persona / multi-viewport UX probe against production.
 * No mutations, no auth, no purchases. Captures screenshots + structural metrics.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/multi-persona-ux',
  `probe-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: 'phone-sm-portrait', width: 360, height: 740, isMobile: true },
  { id: 'phone-lg-portrait', width: 430, height: 932, isMobile: true },
  { id: 'phone-landscape', width: 844, height: 390, isMobile: true },
  { id: 'tablet-portrait', width: 768, height: 1024, isMobile: true },
  { id: 'tablet-landscape', width: 1024, height: 768, isMobile: true },
  { id: 'laptop', width: 1366, height: 768, isMobile: false },
  { id: 'desktop', width: 1440, height: 900, isMobile: false },
  { id: 'ultrawide', width: 2560, height: 1080, isMobile: false },
];

function visibleText(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
    return null;
  return {
    text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    left: Math.round(r.left),
    right: Math.round(r.right),
    width: Math.round(r.width),
    height: Math.round(r.height),
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    bg: style.backgroundColor,
  };
}

async function measureViewport(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    locale: 'nl-NL',
    userAgent: vp.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

  const t0 = Date.now();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('header, .hc-hero-dorpsplein, #homecheff-feed', { timeout: 45000 }).catch(() => {});
  // Wait for feed cards or skeleton resolve
  await page
    .waitForFunction(
      () => {
        const sk = document.querySelector('[aria-label="Marketplace laden"], [aria-label="Feed laden"]');
        const tiles = document.querySelectorAll(
          '[data-feed-tile], .hc-feed-card, #homecheff-feed a, #homecheff-feed article, [data-testid="feed-tile"]',
        );
        return !sk && tiles.length > 0;
      },
      { timeout: 45000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1800);
  const loadMs = Date.now() - t0;

  const shotInitial = path.join(OUT, `${vp.id}-initial.png`);
  await page.screenshot({ path: shotInitial, fullPage: false });

  const metrics = await page.evaluate(({ vh }) => {
    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => [...document.querySelectorAll(sel)];
    const vis = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
        return null;
      return {
        text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 600),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        height: Math.round(r.height),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        href: el.getAttribute?.('href') || null,
      };
    };

    const hero = q('.hc-hero-dorpsplein');
    const heroH1 = hero?.querySelector('h1');
    const heroPs = hero ? [...hero.querySelectorAll('p')].map(vis).filter(Boolean) : [];
    const heroBtns = hero
      ? [...hero.querySelectorAll('button, a')].map(vis).filter(Boolean)
      : [];
    const chips = hero
      ? [...hero.querySelectorAll('li span, .hc-hero-platform-strip span')]
          .map(vis)
          .filter(Boolean)
          .slice(0, 20)
      : [];

    // Above fold text sample
    const aboveFoldNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (!['H1', 'H2', 'H3', 'P', 'BUTTON', 'A', 'LABEL', 'SPAN'].includes(n.tagName)) continue;
      const r = n.getBoundingClientRect();
      if (r.top < 0 || r.top > vh || r.height < 8 || r.width < 8) continue;
      const t = (n.innerText || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length < 2 || t.length > 220) continue;
      // skip nested duplicates roughly
      if (n.children.length > 3 && n.tagName === 'SPAN') continue;
      aboveFoldNodes.push({
        tag: n.tagName,
        text: t.slice(0, 180),
        top: Math.round(r.top),
        fontSize: getComputedStyle(n).fontSize,
        clickable: n.tagName === 'A' || n.tagName === 'BUTTON' || n.closest('a,button') != null,
      });
      if (aboveFoldNodes.length > 80) break;
    }

    const search =
      vis(q('input[type="search"], input[placeholder*="zoek" i], input[placeholder*="search" i], [role="searchbox"]')) ||
      vis(q('[data-search], [aria-label*="zoek" i], [aria-label*="search" i]'));

    const categoryChips = qa(
      '[data-category], [data-vertical], .hc-category, [aria-label*="categorie" i], button[aria-pressed]',
    )
      .map(vis)
      .filter(Boolean)
      .slice(0, 30);

    const feedRoot = q('#homecheff-feed, #homecheff-feed-desktop, [data-feed], .hc-feed');
    const feedVis = vis(feedRoot);
    const tiles = qa(
      '[data-feed-tile], .hc-feed-card, article[data-product], a[href*="/product"], a[href*="/listing"], #homecheff-feed a[href]',
    );
    const firstTiles = tiles
      .map(vis)
      .filter(Boolean)
      .slice(0, 8);

    const firstListingInViewport = firstTiles.find((t) => t.top >= 0 && t.top < vh) || null;
    const firstListingAny = firstTiles[0] || null;

    const bottomNav = vis(q('[data-bottom-nav], nav[aria-label*="bottom" i], [data-bottom-nav-visible]'));
    const header = vis(q('header'));
    const plusBtns = qa('button, a')
      .filter((el) => {
        const t = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
        return (
          t.includes('verkoop') ||
          t.includes('deel') ||
          t.includes('plaats') ||
          t.includes('sell') ||
          t.includes('share') ||
          t.includes('aanbied') ||
          el.querySelector('svg.lucide-plus') != null
        );
      })
      .map(vis)
      .filter(Boolean)
      .slice(0, 10);

    const discoverBtns = qa('button, a')
      .filter((el) => {
        const t = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
        return t.includes('ontdek') || t.includes('discover') || t.includes('browse');
      })
      .map(vis)
      .filter(Boolean)
      .slice(0, 8);

    // Touch targets below 44px
    const smallTargets = qa('button, a, [role="button"]')
      .map((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return null;
        const label = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        return { w: Math.round(r.width), h: Math.round(r.height), label, top: Math.round(r.top) };
      })
      .filter((x) => x && (x.w < 44 || x.h < 44) && x.top >= 0 && x.top < vh)
      .slice(0, 25);

    // Radius / location controls
    const location = qa('button, input, [aria-label], label')
      .filter((el) => {
        const t = `${el.innerText || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`.toLowerCase();
        return /km|radius|afstand|locatie|buurt|dichtbij|nearby|postcode|gps/.test(t);
      })
      .map(vis)
      .filter(Boolean)
      .slice(0, 12);

    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || null;

    return {
      title,
      metaDesc,
      viewport: { w: window.innerWidth, h: window.innerHeight, scrollW: document.documentElement.scrollWidth },
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      hero: vis(hero),
      heroH1: vis(heroH1),
      heroPs,
      heroBtns,
      chips,
      search,
      categoryChips,
      feedVis,
      firstListingInViewport,
      firstListingAny,
      listingCountSignal: tiles.length,
      bottomNav,
      header,
      plusBtns,
      discoverBtns,
      smallTargets,
      location,
      aboveFoldSample: aboveFoldNodes.slice(0, 50),
      bodyTextAboveFold: aboveFoldNodes
        .map((x) => x.text)
        .join(' | ')
        .slice(0, 2500),
    };
  }, { vh: vp.height });

  // Scroll halfway — second screenshot
  await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.85)));
  await page.waitForTimeout(600);
  const shotScroll = path.join(OUT, `${vp.id}-scroll.png`);
  await page.screenshot({ path: shotScroll, fullPage: false });

  // Journey (desktop + one mobile only to limit time): open first listing if possible
  let journey = null;
  if (vp.id === 'desktop' || vp.id === 'phone-lg-portrait') {
    journey = await runJourney(page, vp, OUT);
  }

  await context.close();
  return {
    viewport: vp,
    loadMs,
    screenshots: { initial: path.basename(shotInitial), scroll: path.basename(shotScroll) },
    consoleErrors: consoleErrors.slice(0, 5),
    metrics,
    journey,
  };
}

async function runJourney(page, vp, outDir) {
  const result = {
    listingOpened: false,
    listingUrl: null,
    sellerVisible: false,
    backWorked: false,
    createEntryFound: false,
    createEntryLabel: null,
    createPanelOpened: false,
    createPanelText: null,
    frictions: [],
  };

  try {
    // Find a clickable feed tile
    const clicked = await page.evaluate(() => {
      const candidates = [
        ...document.querySelectorAll(
          '[data-feed-tile] a, .hc-feed-card a, #homecheff-feed a[href], #homecheff-feed-desktop a[href], a[href*="/dish"], a[href*="/product"], a[href*="/item"], a[href*="/u/"]',
        ),
      ];
      for (const a of candidates) {
        const href = a.getAttribute('href') || '';
        if (!href || href === '/' || href.startsWith('#')) continue;
        const r = a.getBoundingClientRect();
        if (r.width > 40 && r.height > 40) {
          a.scrollIntoView({ block: 'center' });
          return { href, text: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120) };
        }
      }
      return null;
    });

    if (!clicked) {
      result.frictions.push('Geen klikbare listing gevonden in feed');
      return result;
    }

    await page.locator(`a[href="${clicked.href}"]`).first().click({ timeout: 8000 }).catch(async () => {
      await page.goto(new URL(clicked.href, page.url()).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    });
    await page.waitForTimeout(2000);
    result.listingOpened = !page.url().endsWith('/') || page.url().includes(clicked.href);
    result.listingUrl = page.url();
    await page.screenshot({
      path: path.join(outDir, `${vp.id}-listing.png`),
      fullPage: false,
    });

    const detail = await page.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 1500);
      const seller =
        !!document.querySelector('[data-seller], [href*="/profile"], [href*="/u/"], a[href*="seller"]') ||
        /verkoper|maker|aanbieder|seller|profiel/i.test(t);
      return { seller, snippet: t.slice(0, 400) };
    });
    result.sellerVisible = detail.seller;

    // Back
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1200);
    result.backWorked = /homecheff\.eu\/?$/.test(page.url()) || page.url().includes('homecheff.eu');

    // Create entry
    const create = await page.evaluate(() => {
      const els = [...document.querySelectorAll('button, a')];
      for (const el of els) {
        const label = `${el.innerText || ''} ${el.getAttribute('aria-label') || ''}`.replace(/\s+/g, ' ').trim();
        const low = label.toLowerCase();
        if (
          /verkoop of deel|sell or share|plaats|aanbied|deel|create|nieuw|plus/i.test(low) ||
          el.querySelector('.lucide-plus, svg.lucide-plus')
        ) {
          const r = el.getBoundingClientRect();
          if (r.width > 10 && r.height > 10) {
            return { label: label.slice(0, 80), top: Math.round(r.top), inHero: !!el.closest('.hc-hero-dorpsplein') };
          }
        }
      }
      return null;
    });
    if (create) {
      result.createEntryFound = true;
      result.createEntryLabel = create.label;
      // Click guest share CTA in hero if present
      const heroShare = page.locator('.hc-hero-dorpsplein button', { hasText: /verkoop|deel|share|sell/i }).first();
      if (await heroShare.count()) {
        await heroShare.click().catch(() => {});
        await page.waitForTimeout(1200);
        const panelText = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"], [data-guest-panel], .hc-guest-panel');
          const body = (dialog || document.body).innerText.replace(/\s+/g, ' ').trim();
          return body.slice(0, 600);
        });
        result.createPanelOpened = /inloggen|aanmelden|login|registreer|verkoop|deel|plaats/i.test(panelText);
        result.createPanelText = panelText.slice(0, 400);
        await page.screenshot({
          path: path.join(outDir, `${vp.id}-create-entry.png`),
          fullPage: false,
        });
        // Close with Escape
        await page.keyboard.press('Escape').catch(() => {});
      }
    } else {
      result.frictions.push('Geen duidelijke create/aanbied-CTA gevonden');
    }
  } catch (e) {
    result.frictions.push(`Journey error: ${String(e).slice(0, 180)}`);
  }
  return result;
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const vp of VIEWPORTS) {
  process.stderr.write(`Probing ${vp.id}...\n`);
  try {
    results.push(await measureViewport(browser, vp));
  } catch (e) {
    results.push({ viewport: vp, error: String(e).slice(0, 400) });
  }
}
await browser.close();

const report = {
  base: BASE,
  at: new Date().toISOString(),
  out: OUT,
  results,
};
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, viewports: results.map((r) => r.viewport?.id || 'err'), errors: results.filter((r) => r.error).length }, null, 2));
