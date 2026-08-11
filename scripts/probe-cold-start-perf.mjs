/**
 * Cold-start / first-feed-paint probe (multi-browser).
 * Tracks T0→shell/card/image, feed request start, JS transfer, early bootstrap.
 */
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const COLD_N = Number(process.env.COLD_N || 4);
const WARM_N = Number(process.env.WARM_N || 3);
const OUT = path.join(process.cwd(), 'docs/audits/cold-start', `probe-${Date.now()}`);
mkdirSync(OUT, { recursive: true });

function pct(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.max(0, Math.ceil((p / 100) * a.length) - 1));
  return a[i];
}
function stats(arr) {
  const clean = arr.filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (!clean.length) return null;
  return {
    n: clean.length,
    best: Math.min(...clean),
    median: pct(clean, 50),
    p90: pct(clean, 90),
    worst: Math.max(...clean),
  };
}

async function oneRun(browserType, viewport, { cold }) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    locale: 'nl-NL',
    serviceWorkers: 'block',
  });
  if (cold) {
    await context.clearCookies();
  }
  const page = await context.newPage();
  const marks = {
    T0: Date.now(),
    T1_shell: null,
    T2_skeleton: null,
    T3_firstCard: null,
    T4_firstImage: null,
    T5_interactive: null,
    feedRequestStartMs: null,
    feedResponseMs: null,
    feedRequestCount: 0,
    docTTFB: null,
    jsTransferred: 0,
    jsChunks: [],
    earlyBootstrap: null,
    geocodeRequests: 0,
  };

  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/api/feed?') && marks.feedRequestStartMs == null) {
      marks.feedRequestStartMs = Date.now() - marks.T0;
    }
    if (u.includes('/api/feed?')) marks.feedRequestCount += 1;
    if (u.includes('/api/geocoding') || u.includes('maps.googleapis.com/maps/api/geocode')) {
      marks.geocodeRequests += 1;
    }
  });
  page.on('response', async (res) => {
    const u = res.url();
    const req = res.request();
    if (req.resourceType() === 'script') {
      try {
        const buf = await res.body();
        marks.jsTransferred += buf.length;
        const name = u.split('/').pop()?.slice(0, 80) || u.slice(0, 80);
        marks.jsChunks.push({ name, bytes: buf.length });
      } catch {
        /* ignore */
      }
    }
    if (u.includes('/api/feed?') && marks.feedResponseMs == null) {
      marks.feedResponseMs = Date.now() - marks.T0;
    }
  });

  const navStart = Date.now();
  marks.T0 = navStart;
  await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 90000 });
  marks.docTTFB = Date.now() - navStart;

  try {
    await page.waitForFunction(
      () => /HomeCheff|Locatie|Ontdek/i.test(document.body?.innerText || '') || document.querySelector('header,nav'),
      { timeout: 20000 },
    );
    marks.T1_shell = Date.now() - marks.T0;
  } catch {
    marks.T1_shell = null;
  }

  try {
    await page.waitForSelector('a[href*="/product/"], a[href*="/dish/"], a[href*="/recipe/"]', {
      timeout: 60000,
    });
    marks.T3_firstCard = Date.now() - marks.T0;
  } catch {
    marks.T3_firstCard = null;
  }

  try {
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('img')].some(
          (img) => img.complete && img.naturalWidth > 20 && img.getBoundingClientRect().top < window.innerHeight,
        ),
      { timeout: 60000 },
    );
    marks.T4_firstImage = Date.now() - marks.T0;
  } catch {
    marks.T4_firstImage = null;
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 12000 });
  } catch {
    /* ignore */
  }
  marks.T5_interactive = Date.now() - marks.T0;

  marks.earlyBootstrap = await page.evaluate(() => {
    const slot = window.__HC_EARLY_FEED__;
    return slot
      ? { present: true, requestKey: String(slot.requestKey || '').slice(0, 120) }
      : { present: false };
  });

  marks.topJs = [...marks.jsChunks]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);

  await context.close();
  await browser.close();
  return marks;
}

async function matrix(label, browserType, viewport) {
  const cold = [];
  for (let i = 0; i < COLD_N; i++) {
    cold.push(await oneRun(browserType, viewport, { cold: true }));
  }
  const warm = [];
  for (let i = 0; i < WARM_N; i++) {
    warm.push(await oneRun(browserType, viewport, { cold: false }));
  }
  const pick = (rows, key) => rows.map((r) => r[key]);
  return {
    label,
    viewport,
    cold: {
      T0_shell: stats(pick(cold, 'T1_shell')),
      T0_firstCard: stats(pick(cold, 'T3_firstCard')),
      T0_firstImage: stats(pick(cold, 'T4_firstImage')),
      T0_interactive: stats(pick(cold, 'T5_interactive')),
      feedRequestStart: stats(pick(cold, 'feedRequestStartMs')),
      feedResponse: stats(pick(cold, 'feedResponseMs')),
      jsTransferred: stats(pick(cold, 'jsTransferred')),
      feedRequestCount: stats(pick(cold, 'feedRequestCount')),
      geocode: stats(pick(cold, 'geocodeRequests')),
    },
    warm: {
      T0_firstCard: stats(pick(warm, 'T3_firstCard')),
      feedRequestStart: stats(pick(warm, 'feedRequestStartMs')),
      jsTransferred: stats(pick(warm, 'jsTransferred')),
    },
    sampleCold: cold[0] || null,
    sampleWarm: warm[0] || null,
  };
}

const runs = [];
runs.push(await matrix('chromium-desktop', chromium, { width: 1280, height: 800 }));
runs.push(await matrix('chromium-mobile', chromium, { width: 390, height: 844 }));
runs.push(await matrix('webkit-desktop', webkit, { width: 1280, height: 800 }));
try {
  runs.push(await matrix('webkit-mobile', webkit, { width: 390, height: 844 }));
} catch (e) {
  runs.push({ label: 'webkit-mobile', error: String(e) });
}

const summary = {
  at: new Date().toISOString(),
  base: BASE,
  out: OUT,
  runs,
};
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
writeFileSync(
  path.join(process.cwd(), 'docs/audits/cold-start-perf-latest.json'),
  JSON.stringify(summary, null, 2),
);
console.log(
  JSON.stringify(
    {
      base: BASE,
      results: runs.map((r) =>
        r.error
          ? r
          : {
              label: r.label,
              coldCard: r.cold.T0_firstCard,
              coldFeedStart: r.cold.feedRequestStart,
              coldJs: r.cold.jsTransferred,
              warmCard: r.warm.T0_firstCard,
              sampleTopJs: r.sampleCold?.topJs,
            },
      ),
    },
    null,
    2,
  ),
);
