/**
 * Endless recirculation runtime probe — proves unique exhaust → recirc growth.
 */
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/endless-recirc-runtime',
  `probe-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

async function dump(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll(
      'a[href*="/product/"], a[href*="/dish/"], a[href*="/recipe/"]',
    );
    const hrefs = [...cards].map((a) => a.getAttribute('href') || '');
    const unique = new Set(hrefs);
    const sentinel = document.querySelector('[data-feed-sentinel], [data-testid="feed-sentinel"]');
    const diag = window.__HC_FEED_HANDOFF_DIAG__ || null;
    const snap = typeof diag?.snapshot === 'function' ? diag.snapshot() : null;
    return {
      cardCount: cards.length,
      uniqueCount: unique.size,
      sentinelMounted: Boolean(sentinel),
      snap,
      latest: diag?.latest ?? null,
      logTail: Array.isArray(diag?.log) ? diag.log.slice(-12) : [],
      sampleBottom: hrefs.slice(-6),
    };
  });
}

async function scrollFeed(page, times = 14) {
  const series = [];
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      const root = document.querySelector('#homecheff-feed-desktop');
      if (root && getComputedStyle(root).overflowY !== 'visible') {
        root.scrollTop = root.scrollHeight;
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
    });
    await page.waitForTimeout(900);
    series.push({ i, ...(await dump(page)) });
  }
  return series;
}

async function runBrowser(browserType, label, viewport) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport, locale: 'nl-NL' });
  const page = await context.newPage();
  const feedApis = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/feed')) return;
    try {
      const j = await res.json();
      feedApis.push({
        status: res.status(),
        hasMore: j?.pagination?.hasMore,
        count: j?.items?.length ?? j?.count,
        skip: new URL(u).searchParams.get('skip'),
        scope: new URL(u).searchParams.get('scope'),
      });
    } catch {
      feedApis.push({ status: res.status(), url: u, parseError: true });
    }
  });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(8000);
  // Wait until cards appear (cold start can be slow)
  for (let w = 0; w < 40; w++) {
    const s = await dump(page);
    if (s.cardCount > 0) break;
    await page.waitForTimeout(1000);
  }

  const initial = await dump(page);
  const series = await scrollFeed(page);
  const final = series[series.length - 1] || initial;
  const uniqueMax = Math.max(initial.uniqueCount, ...series.map((s) => s.uniqueCount));
  const cardMax = Math.max(initial.cardCount, ...series.map((s) => s.cardCount));
  const plateauIdx = series.findIndex((s) => s.uniqueCount >= uniqueMax && uniqueMax > 0);
  const afterPlateau = plateauIdx >= 0 ? series.slice(plateauIdx) : series;
  const growthAfterUnique =
    afterPlateau.length > 1
      ? afterPlateau[afterPlateau.length - 1].cardCount - afterPlateau[0].cardCount
      : 0;

  const recircEvents = (final.logTail || []).filter((e) =>
    String(e?.event || '').startsWith('recirc'),
  );
  const result = {
    label,
    viewport,
    initial,
    series: series.map((s) => ({
      i: s.i,
      cardCount: s.cardCount,
      uniqueCount: s.uniqueCount,
      sentinelMounted: s.sentinelMounted,
      stage: s.snap?.stage,
      recirculationActive: s.snap?.recirculationActive,
      recirculatedRowsLen: s.snap?.recirculatedRowsLen,
      feedHasMore: s.snap?.feedHasMore,
      batchIndex: s.snap?.recirculationBatchIndex,
    })),
    final,
    uniqueMax,
    cardMax,
    growthAfterUnique,
    recircEvents,
    feedApis,
    pass:
      uniqueMax >= 1 &&
      growthAfterUnique >= 8 &&
      cardMax > uniqueMax &&
      Boolean(final.sentinelMounted || final.snap?.feedHasMore),
  };

  await page.screenshot({
    path: path.join(OUT, `${label}.png`),
    fullPage: false,
  });
  await browser.close();
  return result;
}

const runs = [];
runs.push(await runBrowser(chromium, 'chromium-desktop', { width: 1280, height: 800 }));
runs.push(await runBrowser(chromium, 'chromium-mobile', { width: 390, height: 844 }));
runs.push(await runBrowser(webkit, 'webkit-desktop', { width: 1280, height: 800 }));

const summary = {
  at: new Date().toISOString(),
  base: BASE,
  out: OUT,
  runs,
  allPass: runs.every((r) => r.pass),
};
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
writeFileSync(
  path.join(process.cwd(), 'docs/audits/endless-recirc-runtime-latest.json'),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify({
  allPass: summary.allPass,
  results: runs.map((r) => ({
    label: r.label,
    pass: r.pass,
    uniqueMax: r.uniqueMax,
    cardMax: r.cardMax,
    growthAfterUnique: r.growthAfterUnique,
    sentinelFinal: r.final?.sentinelMounted,
    stage: r.final?.snap?.stage,
    recirculationActive: r.final?.snap?.recirculationActive,
    recirculatedRowsLen: r.final?.snap?.recirculatedRowsLen,
  })),
}, null, 2));
process.exit(summary.allPass ? 0 : 1);
