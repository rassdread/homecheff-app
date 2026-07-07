#!/usr/bin/env npx tsx
/**
 * Marketplace preview UX validation — Phase 5A.
 * Run: npx tsx scripts/validate-marketplace-preview-ux.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  PREVIEW_DESKTOP_HOVER_ENABLED,
  PREVIEW_HOVER_DELAY_MS,
  PREVIEW_LONG_PRESS_MS,
  PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX,
  PREVIEW_SCROLL_COOLDOWN_MS,
  previewStateManager,
} from '../lib/marketplace/preview';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  const raw = fs.readFileSync(
    path.join(process.cwd(), `public/i18n/${locale}.json`),
    'utf8',
  );
  return JSON.parse(raw) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

console.log('=== Marketplace Preview UX Validation (Phase 5A) ===\n');

console.log('Timing constants');
assert(PREVIEW_DESKTOP_HOVER_ENABLED === false, 'desktop hover preview disabled');
assert(PREVIEW_HOVER_DELAY_MS === 600, 'hover delay 600ms');
assert(PREVIEW_SCROLL_COOLDOWN_MS === 500, 'scroll cooldown 500ms');
assert(PREVIEW_LONG_PRESS_MS === 700, 'long press 700ms');
assert(
  PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX === 12,
  'long press move threshold 12px',
);

console.log('\nSingle preview rule');
previewStateManager.resetForTests();
previewStateManager.open('listing-a', 'info_click');
assert(
  previewStateManager.isActive('listing-a'),
  'first preview opens',
);
previewStateManager.open('listing-b', 'hover');
assert(
  !previewStateManager.isActive('listing-a'),
  'second preview replaces first',
);
assert(previewStateManager.isActive('listing-b'), 'only one active preview');
previewStateManager.resetForTests();

console.log('\nScroll cooldown');
previewStateManager.resetForTests();
previewStateManager.subscribe(() => {});
assert(previewStateManager.canHoverOpen(), 'hover allowed before scroll');
previewStateManager.open('listing-scroll', 'hover');
if (typeof window !== 'undefined') {
  window.dispatchEvent(new Event('scroll'));
  assert(
    !previewStateManager.isActive('listing-scroll'),
    'scroll closes active preview',
  );
}
previewStateManager.resetForTests();

console.log('\nShell wiring');
const shellSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/marketplace/previews/MarketplacePreviewShell.tsx'),
  'utf8',
);
assert(shellSrc.includes('previewStateManager'), 'uses preview state manager');
assert(shellSrc.includes('PREVIEW_HOVER_DELAY_MS'), 'uses hover delay constant');
assert(shellSrc.includes('PREVIEW_LONG_PRESS_MS'), 'uses long press constant');
assert(
  shellSrc.includes('PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX'),
  'uses move threshold',
);
assert(shellSrc.includes('IntersectionObserver'), 'tile visibility guard');
assert(!shellSrc.includes('tabIndex={0}'), 'no shell tab trap');
assert(
  shellSrc.includes('PREVIEW_DESKTOP_HOVER_ENABLED'),
  'shell gates desktop hover via PREVIEW_DESKTOP_HOVER_ENABLED',
);
assert(
  shellSrc.includes('scheduleDesktopOpen') && shellSrc.includes('PREVIEW_DESKTOP_HOVER_ENABLED'),
  'desktop hover path gated by PREVIEW_DESKTOP_HOVER_ENABLED',
);

console.log('\nInfo button');
const infoSrc = fs.readFileSync(
  path.join(
    process.cwd(),
    'components/marketplace/previews/MarketplacePreviewInfoButton.tsx',
  ),
  'utf8',
);
assert(infoSrc.includes('data-preview-ignore'), 'info button ignored by long-press');
assert(infoSrc.includes("e.key === 'Enter'"), 'Enter key support');
assert(infoSrc.includes("e.key === ' '"), 'Space key support');
assert(infoSrc.includes('aria-expanded'), 'aria-expanded on info button');
assert(infoSrc.includes('aria-controls'), 'aria-controls on info button');

console.log('\nKeyboard + Escape');
const hoverSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/marketplace/previews/MarketplaceHoverPreview.tsx'),
  'utf8',
);
assert(hoverSrc.includes("e.key === 'Escape'"), 'Escape closes hover preview');

const sheetSrc = fs.readFileSync(
  path.join(
    process.cwd(),
    'components/marketplace/previews/MarketplaceLongPressPreview.tsx',
  ),
  'utf8',
);
assert(sheetSrc.includes("onClose('swipe')"), 'swipe close reason');
assert(sheetSrc.includes("onClose('escape')"), 'escape close on mobile sheet');

console.log('\nAnalytics');
const analyticsSrc = fs.readFileSync(
  path.join(process.cwd(), 'lib/marketplace/preview/preview-analytics.ts'),
  'utf8',
);
for (const event of [
  'marketplace_preview_open',
  'marketplace_preview_close',
  'marketplace_preview_info_click',
]) {
  assert(analyticsSrc.includes(event), `analytics event ${event}`);
}
assert(analyticsSrc.includes('open_duration_ms'), 'openDuration tracked on close');

console.log('\ni18n');
for (const locale of ['en', 'nl'] as const) {
  const i18n = loadI18n(locale);
  for (const key of [
    'marketplace.preview.infoOpen',
    'marketplace.preview.infoClose',
    'marketplace.preview.ariaLabel',
  ]) {
    assert(getNested(i18n, key) !== undefined, `${locale}: ${key}`);
  }
}

console.log('\nTile integration');
const tileMediaSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/marketplace/tiles/primitives/TileMedia.tsx'),
  'utf8',
);
assert(tileMediaSrc.includes('showPreviewInfo'), 'TileMedia preview info prop');
assert(
  tileMediaSrc.includes('MarketplacePreviewInfoButton'),
  'info button on tile media',
);

console.log('\nDocs');
for (const doc of [
  'docs/progress/MARKETPLACE_PREVIEW_UX_PHASE5A.md',
  'docs/audits/MARKETPLACE_PREVIEW_UX_AUDIT.md',
  'lib/marketplace/preview/preview-state-manager.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), doc)), doc);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
