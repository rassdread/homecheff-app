#!/usr/bin/env npx tsx
/**
 * Production certify: true unlimited recirculation on live GeoFeed.
 * Scrolls until card occurrences >= 80 OR recirculationBatchIndex >= enough
 * for 2 full cycles after unique plateau.
 */
import { chromium, devices, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const TARGET = Number(process.env.TARGET_OCCURRENCES || 80);
const OUT = path.join(
  process.cwd(),
  'docs/audits/true-unlimited-recirculation',
  `cert-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

const CARD_SEL =
  'a[href*="/product/"], a[href*="/dish/"], a[href*="/recipe/"], a[href*="/listing/"]';

async function dump(page: import('@playwright/test').Page) {
  return page.evaluate((cardSel) => {
    const anchors = [...document.querySelectorAll(cardSel)];
    // Prefer one occurrence per card: walk up to article/li/feed-card container.
    const occurrenceKeys: string[] = [];
    const seenEl = new Set<Element>();
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      if (!href) continue;
      const card =
        a.closest('[data-feed-card], article, li, [class*="FeedCard"]') || a;
      if (seenEl.has(card)) continue;
      seenEl.add(card);
      occurrenceKeys.push(href);
    }
    // Fallback: if container heuristic collapses too hard, use href list as-is.
    const keys =
      occurrenceKeys.length >= Math.ceil(anchors.length / 3)
        ? occurrenceKeys
        : anchors.map((a) => a.getAttribute('href') || '').filter(Boolean);

    const unique = new Set(keys);
    const sentinel = document.querySelector(
      '[data-feed-sentinel], [data-testid="feed-sentinel"]',
    );
    const endMsg = document.querySelector('[data-testid="feed-end-of-selection"]');
    const root = document.getElementById('homecheff-feed-desktop');
    const nested =
      root &&
      ['auto', 'scroll', 'overlay'].includes(getComputedStyle(root).overflowY)
        ? root
        : null;

    let fiber: Record<string, unknown> | null = null;
    const probeEls = [
      sentinel,
      root,
      document.getElementById('homecheff-feed'),
      document.body,
    ].filter(Boolean) as Element[];
    for (const el of probeEls) {
      const k = Object.keys(el).find((x) => x.startsWith('__reactFiber'));
      if (!k) continue;
      let f = (el as any)[k];
      for (let i = 0; i < 180 && f; i++) {
        let h = f.memoizedState;
        for (let n = 0; n < 140 && h; n++) {
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
              hist: Array.isArray(q.displayedHistory)
                ? q.displayedHistory.length
                : 0,
              exactExhausted: q.exactExhausted,
              broadenedExhausted: q.broadenedExhausted,
              marketplaceExhausted: q.marketplaceExhausted,
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

    return {
      cardCount: keys.length,
      uniqueCount: unique.size,
      anchorCount: anchors.length,
      sentinel: Boolean(sentinel),
      endOfSelection: Boolean(endMsg),
      endText: endMsg?.textContent?.trim() || null,
      fiber,
      sampleBottom: keys.slice(-8),
      nested: Boolean(nested),
    };
  }, CARD_SEL);
}

async function scrollOnce(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const root = document.querySelector('#homecheff-feed-desktop');
    if (
      root &&
      ['auto', 'scroll', 'overlay'].includes(getComputedStyle(root).overflowY)
    ) {
      (root as HTMLElement).scrollTop = (root as HTMLElement).scrollHeight;
    } else {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
}

async function runCase(
  label: string,
  browserType: typeof chromium | typeof webkit,
  viewport: { width: number; height: number },
) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport, locale: 'nl-NL' });
  const page = await context.newPage();
  const series: Array<Record<string, unknown>> = [];

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (let w = 0; w < 45; w++) {
    const s = await dump(page);
    if (s.cardCount > 0) break;
    await page.waitForTimeout(1000);
  }

  let stall = 0;
  let prevCards = 0;
  for (let i = 0; i < 60; i++) {
    await scrollOnce(page);
    await page.waitForTimeout(i < 20 ? 1100 : 750);
    const s = await dump(page);
    series.push({ i, ...s });
    if (s.cardCount <= prevCards) stall += 1;
    else stall = 0;
    prevCards = s.cardCount;
    const batch = Number((s.fiber as any)?.batch || 0);
    if (s.cardCount >= TARGET && batch >= 2) break;
    if (stall >= 12 && (s.fiber as any)?.recirc) break;
  }

  await browser.close();
  const final = series[series.length - 1] || {};
  const uniqueMax = Math.max(
    0,
    ...series.map((s) => Number(s.uniqueCount || 0)),
  );
  const cardMax = Math.max(0, ...series.map((s) => Number(s.cardCount || 0)));
  // First index where unique count stops growing for the rest of the run.
  let plateau = -1;
  for (let i = 0; i < series.length; i++) {
    const rest = series.slice(i);
    const maxRest = Math.max(...rest.map((s) => Number(s.uniqueCount || 0)));
    if (Number(series[i].uniqueCount) >= maxRest && maxRest > 0) {
      plateau = i;
      break;
    }
  }
  const after = plateau >= 0 ? series.slice(plateau) : series;
  const growthAfterUnique =
    after.length > 1
      ? Number(after[after.length - 1].cardCount) - Number(after[0].cardCount)
      : 0;
  const histMax = Math.max(
    0,
    ...series.map((s) => Number((s.fiber as any)?.hist || 0)),
  );
  const recircActive = Boolean((final.fiber as any)?.recirc);
  const batch = Number((final.fiber as any)?.batch || 0);
  const fiberUnique = Number((final.fiber as any)?.unique || 0);
  const intentionalRecirc =
    histMax > fiberUnique || growthAfterUnique > 0 || cardMax > uniqueMax;
  const pass =
    uniqueMax > 0 &&
    recircActive &&
    batch >= 1 &&
    intentionalRecirc &&
    (cardMax >= 50 || histMax >= 50) &&
    Boolean(final.sentinel);

  return {
    label,
    viewport,
    uniqueMax,
    cardMax,
    histMax,
    fiberUnique,
    growthAfterUnique,
    intentionalRecirc,
    recircActive,
    batch,
    endOfSelection: final.endOfSelection,
    endText: final.endText,
    series: series.map((s) => ({
      i: s.i,
      cards: s.cardCount,
      unique: s.uniqueCount,
      hist: (s.fiber as any)?.hist,
      stage: (s.fiber as any)?.stage,
      recirc: (s.fiber as any)?.recirc,
      batch: (s.fiber as any)?.batch,
      sentinel: s.sentinel,
    })),
    final,
    pass,
  };
}

async function main() {
  const results = [];
  results.push(
    await runCase('DESKTOP', chromium, { width: 1440, height: 900 }),
  );
  results.push(
    await runCase('MOBILE_PORTRAIT', chromium, {
      ...devices['iPhone 13'].viewport!,
      width: devices['iPhone 13'].viewport!.width,
      height: devices['iPhone 13'].viewport!.height,
    }),
  );
  results.push(
    await runCase('MOBILE_LANDSCAPE', chromium, { width: 844, height: 390 }),
  );

  const report = {
    base: BASE,
    target: TARGET,
    at: new Date().toISOString(),
    results,
    PASS: results.every((r) => r.pass),
  };
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.PASS) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
