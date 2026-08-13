/**
 * SPA-back endless continuation probe (local/preview/production).
 * Scrolls into recirculation → listing → back → scroll again.
 * Does not mutate app data.
 */
import { chromium, webkit } from '@playwright/test';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const SEED = {
  lat: 51.9088,
  lng: 4.3444,
  place: 'Vlaardingen',
  countryCode: 'NL',
  radiusKm: 25,
};

function fiberScript() {
  return (() => {
    const s = document.querySelector('[data-feed-sentinel]');
    const cards = [
      ...document.querySelectorAll(
        'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
      ),
    ];
    const root = document.getElementById('homecheff-feed-desktop');
    let fiber = null;
    const el = s || document.querySelector('#homecheff-feed') || document.body;
    const k2 = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
    if (k2) {
      let f = el[k2];
      for (let i = 0; i < 120 && f; i++) {
        let h = f.memoizedState;
        for (let n = 0; n < 100 && h; n++) {
          const q = h.memoizedState;
          if (
            q &&
            typeof q === 'object' &&
            ('recirculationBatchIndex' in q || 'marketplaceExhausted' in q)
          ) {
            fiber = {
              stage: q.stage,
              batch: q.recirculationBatchIndex,
              recirc: q.recirculationActive,
              mEx: q.marketplaceExhausted,
              bEx: q.broadenedExhausted,
              unique: q.uniqueEligibleCount,
              hist: q.displayedHistory?.length,
              recent: q.recentIds?.length,
              rk: (q.requestKey || '').slice(0, 100),
              empty: q.emptyTerminal,
              recircCount: q.recirculatedCount,
            };
            break;
          }
          h = h.next;
        }
        if (fiber) break;
        f = f.return;
      }
    }
    return {
      cards: cards.length,
      sentinel: !!s,
      rem: root
        ? root.scrollHeight - root.scrollTop - root.clientHeight
        : null,
      fiber,
      path: location.pathname,
    };
  })();
}

async function scrollFeed(page, times, waitMs = 500) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      const root = document.getElementById('homecheff-feed-desktop');
      if (root && getComputedStyle(root).overflowY !== 'visible') {
        root.scrollTop = root.scrollHeight;
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
    });
    await page.waitForTimeout(waitMs);
  }
}

async function runMatrix(browserType, label, opts = {}) {
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
      JSON.stringify({
        lat: seed.lat,
        lng: seed.lng,
        place: seed.place,
        countryCode: seed.countryCode,
        radiusKm: seed.radiusKm,
        source: 'manual',
        updatedAt: Date.now(),
      }),
    );
  }, SEED);

  const page = await context.newPage();
  const apis = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/feed?')) return;
    let n = null;
    let more = null;
    try {
      const j = await res.json();
      n = j?.items?.length ?? null;
      more = j?.pagination?.hasMore ?? null;
    } catch {
      /* ignore */
    }
    const url = new URL(u);
    apis.push({
      scope: url.searchParams.get('scope'),
      skip: url.searchParams.get('skip'),
      n,
      more,
      status: res.status(),
    });
  });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);

  await scrollFeed(page, opts.mobile ? 18 : 14, opts.mobile ? 650 : 500);
  const before = await page.evaluate(fiberScript);
  const apiBefore = apis.length;

  await page.locator('a[href*="/product/"]').first().click({ timeout: 15000 });
  await page.waitForURL(/\/product\//, { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const afterBack = await page.evaluate(fiberScript);

  await scrollFeed(page, 10, 700);
  const afterScroll = await page.evaluate(fiberScript);

  // 3 cycles
  let cycleOk = true;
  let lastCards = afterScroll.cards;
  for (let c = 0; c < 3; c++) {
    await page.locator('a[href*="/product/"]').first().click({ timeout: 15000 });
    await page.waitForURL(/\/product\//, { timeout: 20000 });
    await page.waitForTimeout(600);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await scrollFeed(page, 6, 650);
    const st = await page.evaluate(fiberScript);
    if (!st.sentinel || st.fiber?.empty || st.cards <= lastCards) {
      // allow equal if already huge, but must have sentinel and not empty
      if (!st.sentinel || st.fiber?.empty) cycleOk = false;
    }
    if (st.cards > lastCards) lastCards = st.cards;
  }
  const afterCycles = await page.evaluate(fiberScript);

  const pass =
    afterBack.sentinel === true &&
    afterBack.fiber?.empty !== true &&
    (afterBack.fiber?.unique ?? 0) > 0 &&
    afterBack.fiber?.rk &&
    afterScroll.cards > afterBack.cards &&
    afterScroll.sentinel === true &&
    afterScroll.fiber?.empty !== true &&
    cycleOk;

  await browser.close();
  return {
    label,
    pass,
    before,
    afterBack,
    afterScroll,
    afterCycles,
    cycleOk,
    apiAfterBack: apis.slice(apiBefore),
    apiTotal: apis.length,
  };
}

const results = [];
results.push(await runMatrix(chromium, 'chromium-desktop'));
results.push(
  await runMatrix(chromium, 'chromium-mobile', {
    mobile: true,
    viewport: { width: 390, height: 844 },
  }),
);
try {
  results.push(await runMatrix(webkit, 'webkit-desktop'));
} catch (e) {
  results.push({ label: 'webkit-desktop', pass: false, error: String(e) });
}

console.log(JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
