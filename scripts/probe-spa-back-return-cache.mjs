/**
 * Focused SPA-back continuation probe (local/preview/prod).
 * Waits for cards, scrolls into recirculation, listing→back→scroll growth.
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

async function snap(page) {
  return page.evaluate(() => {
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
      for (let i = 0; i < 140 && f; i++) {
        let h = f.memoizedState;
        for (let n = 0; n < 120 && h; n++) {
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
              rk: q.requestKey || '',
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
      fiber,
      path: location.pathname,
      rem: root
        ? root.scrollHeight - root.scrollTop - root.clientHeight
        : document.documentElement.scrollHeight - window.scrollY - window.innerHeight,
    };
  });
}

async function scrollFeed(page, times, waitMs = 600) {
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

async function waitForCards(page, min = 1, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const n = await page
      .locator(
        'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
      )
      .count();
    if (n >= min) return n;
    await page.waitForTimeout(500);
  }
  return 0;
}

async function runOne(browserType, label, opts = {}) {
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
  const initialCards = await waitForCards(page, 1, 90000);
  if (initialCards < 1) {
    await browser.close();
    return { label, pass: false, error: 'no-cards' };
  }

  // Grow until recirculation or enough depth
  let before = await snap(page);
  for (let i = 0; i < 40; i++) {
    await scrollFeed(page, 1, 700);
    before = await snap(page);
    if ((before.fiber?.batch ?? 0) >= 3 || (before.fiber?.recirc && (before.fiber?.batch ?? 0) >= 1)) {
      break;
    }
  }

  const apiBefore = apis.length;
  const link = page
    .locator(
      'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
    )
    .first();
  await link.click({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const afterBack = await snap(page);

  await scrollFeed(page, 12, 750);
  const afterScroll = await snap(page);

  // 3 cycles
  let cyclesOk = true;
  let last = afterScroll.cards;
  for (let c = 0; c < 3; c++) {
    await page
      .locator(
        'a[href*="/product/"],a[href*="/recipe/"],a[href*="/dish/"],a[href*="/listing/"]',
      )
      .first()
      .click({ timeout: 20000 });
    await page.waitForTimeout(900);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    await scrollFeed(page, 8, 700);
    const st = await snap(page);
    if (!st.sentinel || st.fiber?.empty || (st.fiber?.unique ?? 0) < 1) {
      cyclesOk = false;
    }
    if (st.cards > last) last = st.cards;
  }
  const afterCycles = await snap(page);

  const grew = afterScroll.cards > afterBack.cards;
  const pass =
    afterBack.sentinel === true &&
    afterBack.fiber?.empty !== true &&
    (afterBack.fiber?.unique ?? 0) > 0 &&
    Boolean(afterBack.fiber?.rk) &&
    afterBack.fiber.rk.length > 0 &&
    grew &&
    afterScroll.sentinel === true &&
    afterScroll.fiber?.empty !== true &&
    cyclesOk;

  await browser.close();
  return {
    label,
    pass,
    before,
    afterBack,
    afterScroll,
    afterCycles,
    cyclesOk,
    grew,
    apiAfterBack: apis.slice(apiBefore),
  };
}

const results = [];
results.push(await runOne(chromium, 'chromium-desktop'));
results.push(
  await runOne(chromium, 'chromium-mobile', {
    mobile: true,
    viewport: { width: 390, height: 844 },
  }),
);
try {
  results.push(await runOne(webkit, 'webkit-desktop'));
} catch (e) {
  results.push({ label: 'webkit-desktop', pass: false, error: String(e).slice(0, 300) });
}

console.log(JSON.stringify({ base: BASE, results }, null, 2));
process.exit(results.every((r) => r.pass) ? 0 : 1);
