#!/usr/bin/env npx tsx
/**
 * Phase 13M — programmatic tone/settlement color verification on rendered DOM.
 * Run against local dev: npx tsx scripts/verify-phase13m-rendered-colors.ts
 */

import {
  TAXONOMY_TONE_ICON_CLASSES,
  SETTLEMENT_ICON_COLOR,
} from '../lib/marketplace/marketplace-icon-colors';

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const PRODUCT =
  '/product/homecheff-design-studio-vlaardingen-hcid-fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';

/** Tailwind -700 hex approximations for rgb() comparison tolerance */
const TONE_RGB: Record<string, string[]> = {
  'text-orange-700': ['rgb(194, 65, 12)', 'rgb(194, 65, 12)'],
  'text-emerald-700': ['rgb(4, 120, 87)', 'rgb(4, 120, 87)'],
  'text-purple-700': ['rgb(126, 34, 206)', 'rgb(126, 34, 206)'],
  'text-sky-700': ['rgb(3, 105, 161)', 'rgb(3, 105, 161)'],
  'text-indigo-700': ['rgb(67, 56, 202)', 'rgb(67, 56, 202)'],
  'text-amber-700': ['rgb(180, 83, 9)', 'rgb(180, 83, 9)'],
  'text-pink-700': ['rgb(190, 24, 93)', 'rgb(190, 24, 93)'],
  'text-cyan-700': ['rgb(14, 116, 144)', 'rgb(14, 116, 144)'],
  'text-teal-700': ['rgb(15, 118, 110)', 'rgb(15, 118, 110)'],
  'text-stone-600': ['rgb(87, 83, 78)', 'rgb(87, 83, 78)'],
};

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function colorMatches(actual: string, tailwindClass: string): boolean {
  const expected = TONE_RGB[tailwindClass];
  if (!expected) return actual !== 'rgb(0, 0, 0)' && actual !== '';
  return expected.some((e) => actual === e || actual.replace(/\s/g, '') === e.replace(/\s/g, ''));
}

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  console.log('=== Phase 13M Rendered Color Verification ===\n');

  // Product detail — creative purple + settlement row
  const detail = await browser.newPage();
  await detail.setViewportSize({ width: 1440, height: 900 });
  await detail.goto(`${BASE}${PRODUCT}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await detail.waitForTimeout(6000);

  const settlementColors = await detail.evaluate(() => {
    const section = document.querySelector('[data-detail-section="settlement"]');
    if (!section) return [];
    return [...section.querySelectorAll('svg.lucide')].map((svg) => ({
      color: getComputedStyle(svg).color,
      w: getComputedStyle(svg).width,
      h: getComputedStyle(svg).height,
    }));
  });

  assert(settlementColors.length >= 2, `product detail settlement icons present (${settlementColors.length})`);
  if (settlementColors[0]) {
    assert(
      colorMatches(settlementColors[0].color, SETTLEMENT_ICON_COLOR.homecheff),
      `homecheff settlement → ${SETTLEMENT_ICON_COLOR.homecheff} (${settlementColors[0].color})`,
    );
    assert(settlementColors[0].w === '16px', 'settlement icon width unchanged (md = 16px)');
  }

  const taxonomyOnDetail = await detail.evaluate(() =>
    [...document.querySelectorAll('svg.lucide')].map((svg) => getComputedStyle(svg).color),
  );
  assert(
    taxonomyOnDetail.some((c) => colorMatches(c, TAXONOMY_TONE_ICON_CLASSES.creative)),
    'product detail includes creative/purple taxonomy icon',
  );
  await detail.close();

  // Feed tiles — multiple tones
  const feed = await browser.newPage();
  await feed.setViewportSize({ width: 1440, height: 900 });
  await feed.goto(`${BASE}/?chip=sale#homecheff-feed`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await feed.waitForTimeout(8000);

  const tileIconColors = await feed.evaluate(() => {
    const tiles = document.querySelectorAll('[data-marketplace-tile], article, [class*="MarketplaceTile"]');
    const colors = new Set<string>();
    tiles.forEach((tile) => {
      tile.querySelectorAll('svg.lucide').forEach((svg) => {
        colors.add(getComputedStyle(svg).color);
      });
    });
    return [...colors];
  });

  assert(tileIconColors.length >= 2, `feed exposes multiple distinct icon colors (${tileIconColors.length})`);

  const hasOrange = tileIconColors.some((c) => colorMatches(c, TAXONOMY_TONE_ICON_CLASSES.food));
  const hasEmerald = tileIconColors.some((c) => colorMatches(c, TAXONOMY_TONE_ICON_CLASSES.garden));
  const hasPurple = tileIconColors.some((c) => colorMatches(c, TAXONOMY_TONE_ICON_CLASSES.creative));
  assert(hasOrange || hasEmerald || hasPurple, 'feed tiles use at least one taxonomy tone color');

  // Home vertical chips
  const verticalColors = await feed.evaluate(() => {
    const btns = [...document.querySelectorAll('button[role="listitem"] svg.lucide')];
    return btns.map((svg) => getComputedStyle(svg).color);
  });
  if (verticalColors.length >= 3) {
    assert(
      colorMatches(verticalColors[0], TAXONOMY_TONE_ICON_CLASSES.food),
      'home cheff vertical chip icon orange',
    );
    assert(
      colorMatches(verticalColors[1], TAXONOMY_TONE_ICON_CLASSES.garden),
      'home garden vertical chip icon emerald',
    );
    assert(
      colorMatches(verticalColors[2], TAXONOMY_TONE_ICON_CLASSES.creative),
      'home designer vertical chip icon purple',
    );
  } else {
    assert(false, `home vertical chips found (${verticalColors.length})`);
  }

  await feed.close();

  // Sell/new — picker tones (subcategory inheritance)
  const sell = await browser.newPage();
  await sell.setViewportSize({ width: 390, height: 844 });
  await sell.goto(`${BASE}/sell/new`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sell.waitForTimeout(5000);

  const sellIconSizes = await sell.evaluate(() =>
    [...document.querySelectorAll('svg.lucide')].slice(0, 5).map((svg) => ({
      w: getComputedStyle(svg).width,
      h: getComputedStyle(svg).height,
    })),
  );
  if (sellIconSizes.length > 0) {
    assert(
      sellIconSizes.every((s) => s.w === '16px' || s.w === '14px' || s.w === '12px'),
      'sell flow icon sizes remain h-3/h-3.5/h-4 range',
    );
  }

  await sell.close();
  await browser.close();

  console.log(`\n---\nPassed: ${passed}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
