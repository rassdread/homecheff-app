/**
 * Natural-paced endless scroll acceptance (local/preview/prod).
 * Primary metric: no long dead zone after recirculation batch >= 2.
 */
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/natural-endless-trigger',
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

async function dump(page) {
  return page.evaluate(() => {
    const cards = [
      ...document.querySelectorAll(
        'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
      ),
    ];
    const s = document.querySelector(
      '[data-feed-sentinel], [data-testid="feed-sentinel"]',
    );
    const root = document.getElementById('homecheff-feed-desktop');
    const nested =
      root &&
      (getComputedStyle(root).overflowY === 'auto' ||
        getComputedStyle(root).overflowY === 'scroll' ||
        getComputedStyle(root).overflowY === 'overlay')
        ? root
        : null;
    let fiber = null;
    const probeEls = [
      s,
      document.getElementById('homecheff-feed-desktop'),
      document.getElementById('homecheff-feed'),
      document.body,
    ].filter(Boolean);
    for (const el of probeEls) {
      const k = Object.keys(el).find((x) => x.startsWith('__reactFiber'));
      if (!k) continue;
      let f = el[k];
      for (let i = 0; i < 160 && f; i++) {
        let h = f.memoizedState;
        for (let n = 0; n < 120 && h; n++) {
          const q = h.memoizedState;
          if (
            q &&
            typeof q === 'object' &&
            !Array.isArray(q) &&
            ('recirculationBatchIndex' in q || 'marketplaceExhausted' in q)
          ) {
            fiber = {
              batch: q.recirculationBatchIndex ?? 0,
              stage: q.stage,
              empty: q.emptyTerminal,
              recirc: q.recirculationActive,
              unique: q.uniqueEligibleCount,
              hist: q.displayedHistory?.length,
            };
            break;
          }
          h = h.next;
        }
        if (fiber) break;
        f = f.return;
      }
      if (fiber) break;
    }
    const rem = nested
      ? nested.scrollHeight - nested.scrollTop - nested.clientHeight
      : document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
    const sr = s?.getBoundingClientRect();
    const rr = nested?.getBoundingClientRect();
    return {
      cards: cards.length,
      fiber,
      sentinel: !!s,
      rem,
      dist: sr
        ? nested && rr
          ? sr.top - rr.bottom
          : sr.top - window.innerHeight
        : null,
      scrollTop: nested ? nested.scrollTop : window.scrollY,
      clientH: nested ? nested.clientHeight : window.innerHeight,
      scrollHeight: nested
        ? nested.scrollHeight
        : document.documentElement.scrollHeight,
    };
  });
}

async function waitForFeed(page, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await dump(page);
    if (s.cards >= 4 && s.sentinel) return s;
    await page.waitForTimeout(500);
  }
  return dump(page);
}

async function naturalStep(page, mobile) {
  await page.evaluate((mobile) => {
    const root = document.getElementById('homecheff-feed-desktop');
    const nested =
      root &&
      getComputedStyle(root).overflowY !== 'visible' &&
      root.clientHeight > 100;
    const delta = Math.round(
      (mobile
        ? window.innerHeight
        : nested
          ? root.clientHeight
          : window.innerHeight) * 0.6,
    );
    if (nested && !mobile) root.scrollBy(0, delta);
    else window.scrollBy(0, delta);
  }, mobile);
}

async function runIdleOnly(browserType, label, opts = {}) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 800 },
    locale: 'nl-NL',
  });
  await context.addInitScript((seed) => {
    localStorage.setItem(
      'homecheff_feed_location_v1',
      JSON.stringify({ ...seed, source: 'manual', updatedAt: Date.now() }),
    );
  }, SEED);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForFeed(page);
  // Allow initial auto-chain (batch cap < 2) to settle before idle window.
  await page.waitForTimeout(6000);
  const a = await dump(page);
  await page.waitForTimeout(30000);
  const b = await dump(page);
  await browser.close();
  const batchDelta = (b.fiber?.batch ?? 0) - (a.fiber?.batch ?? 0);
  const cardDelta = b.cards - a.cards;
  return {
    label,
    pass: batchDelta <= 2 && cardDelta <= 64,
    initialCards: a.cards,
    finalCards: b.cards,
    initialBatch: a.fiber?.batch ?? 0,
    finalBatch: b.fiber?.batch ?? 0,
    runaway: batchDelta > 2 || cardDelta > 64,
  };
}

async function runNatural(browserType, label, opts = {}) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 800 },
    locale: 'nl-NL',
    isMobile: !!opts.mobile,
    hasTouch: !!opts.mobile,
  });
  await context.addInitScript((seed) => {
    localStorage.setItem(
      'homecheff_feed_location_v1',
      JSON.stringify({ ...seed, source: 'manual', updatedAt: Date.now() }),
    );
  }, SEED);
  const page = await context.newPage();
  const apis = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/feed?')) return;
    const url = new URL(u);
    apis.push({
      scope: url.searchParams.get('scope'),
      skip: url.searchParams.get('skip'),
      at: Date.now(),
    });
  });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const ready = await waitForFeed(page);
  if (ready.cards < 4) {
    await browser.close();
    return {
      label,
      pass: false,
      maxBatch: 0,
      maxDeadMs: 0,
      maxDeadPx: 0,
      appends: [],
      appendCount: 0,
      final: ready,
      spaBack: null,
      apiDuringDeepRecirc: [],
      elapsed: 0,
      error: 'feed-not-ready',
    };
  }

  const t0 = Date.now();
  const appends = [];
  let lastCards = ready.cards;
  let lastBatch = ready.fiber?.batch ?? 0;
  let lastAppendAt = t0;
  let maxDeadMs = 0;
  let maxDeadPx = 0;
  let scrollSinceAppend = 0;
  let timeSinceAppend = 0;
  let maxBatch = lastBatch;
  let approachArmed = false;

  const maxSteps = opts.maxSteps || 160;
  for (let step = 0; step < maxSteps; step++) {
    await page.waitForTimeout(320 + Math.random() * 280);
    const before = await dump(page);
    await naturalStep(page, !!opts.mobile);
    await page.waitForTimeout(500);
    const s = await dump(page);
    const batch = s.fiber?.batch ?? 0;
    if (batch > maxBatch) maxBatch = batch;

    const scrolled = Math.max(0, s.scrollTop - before.scrollTop);
    // Dead-zone metrics only while approaching the end — reset when mid-list.
    const approachPx = Math.max(s.clientH * 4, 6000);
    const inApproach = s.rem < approachPx;
    if (!inApproach) {
      approachArmed = false;
      scrollSinceAppend = 0;
    } else {
      if (!approachArmed) {
        approachArmed = true;
        scrollSinceAppend = 0;
        lastAppendAt = Date.now();
      }
      scrollSinceAppend += scrolled;
      timeSinceAppend = Date.now() - lastAppendAt;
    }

    if (s.cards > lastCards || batch > lastBatch) {
      if (lastBatch >= 2 && approachArmed) {
        maxDeadMs = Math.max(maxDeadMs, timeSinceAppend);
        maxDeadPx = Math.max(maxDeadPx, scrollSinceAppend);
      }
      appends.push({
        step,
        elapsed: Date.now() - t0,
        cards: s.cards,
        batch,
        rem: Math.round(s.rem),
        dist: s.dist == null ? null : Math.round(s.dist),
        gapMs: timeSinceAppend,
        gapPx: Math.round(scrollSinceAppend),
        approachGap: lastBatch >= 2 && approachArmed,
      });
      lastCards = s.cards;
      lastBatch = batch;
      lastAppendAt = Date.now();
      scrollSinceAppend = 0;
    }

    if (maxBatch >= 10 && appends.length >= 8) break;
  }

  // Optional SPA back
  let spaBack = null;
  if (opts.spaBack) {
    try {
      const beforeBack = await dump(page);
      const link = page
        .locator(
          'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
        )
        .first();
      await link.click({ timeout: 20000 });
      await page.waitForTimeout(1200);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const afterBack = await dump(page);
      const cards0 = afterBack.cards;
      for (let i = 0; i < 40; i++) {
        await naturalStep(page, !!opts.mobile);
        await page.waitForTimeout(550);
      }
      const afterScroll = await dump(page);
      spaBack = {
        beforeBatch: beforeBack.fiber?.batch,
        afterBack: {
          cards: afterBack.cards,
          batch: afterBack.fiber?.batch,
          empty: afterBack.fiber?.empty,
          recirc: afterBack.fiber?.recirc,
          sentinel: afterBack.sentinel,
        },
        afterNatural: {
          cards: afterScroll.cards,
          batch: afterScroll.fiber?.batch,
          empty: afterScroll.fiber?.empty,
        },
        grew: afterScroll.cards > cards0,
      };
    } catch (e) {
      spaBack = { error: String(e).slice(0, 240), grew: false };
    }
  }

  const final = await dump(page);
  await browser.close();

  const pass =
    maxBatch >= 10 &&
    maxDeadMs < 25000 &&
    maxDeadPx < 12000 &&
    final.fiber?.empty !== true &&
    final.sentinel === true &&
    (!opts.spaBack || (spaBack?.grew && spaBack?.afterBack?.empty === false));

  return {
    label,
    pass,
    maxBatch,
    maxDeadMs,
    maxDeadPx,
    appends: appends.slice(-15),
    appendCount: appends.length,
    final,
    spaBack,
    apiDuringDeepRecirc: apis.filter((_, i) => i > 4),
    elapsed: Date.now() - t0,
  };
}

const results = {};
results.idleDesktop = await runIdleOnly(chromium, 'idle-desktop');
results.chromiumDesktop = await runNatural(chromium, 'chromium-desktop', {
  spaBack: true,
});
results.chromiumMobile = await runNatural(chromium, 'chromium-mobile', {
  mobile: true,
  viewport: { width: 390, height: 844 },
  spaBack: true,
});
try {
  results.webkitDesktop = await runNatural(webkit, 'webkit-desktop');
} catch (e) {
  results.webkitDesktop = { pass: false, error: String(e).slice(0, 300) };
}

writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, results }, null, 2));
console.log(JSON.stringify({ out: OUT, summary: Object.fromEntries(Object.entries(results).map(([k,v]) => [k, { pass: v.pass, maxBatch: v.maxBatch, maxDeadMs: v.maxDeadMs, maxDeadPx: v.maxDeadPx, idle: v.initialCards != null ? { i: v.initialCards, f: v.finalCards, runaway: v.runaway } : undefined, spa: v.spaBack?.grew }])) }, null, 2));
const failed = Object.values(results).filter((r) => r && r.pass === false);
process.exit(failed.length ? 1 : 0);
