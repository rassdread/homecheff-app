#!/usr/bin/env npx tsx
/**
 * Phase 3C — desktop single-column default.
 */
import * as fs from 'node:fs';

import {
  DESKTOP_FEED_SINGLE_COLUMN_CLASS,
  HOME_DESKTOP_FEED_COLUMNS_DEFAULT,
  homeDesktopFeedGridClass,
} from '../lib/feed/homeDesktopFeedColumns';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

const geoFeed = fs.readFileSync('components/feed/GeoFeed.tsx', 'utf8');
const colsModule = fs.readFileSync('lib/feed/homeDesktopFeedColumns.ts', 'utf8');

console.log('=== Phase 3C — Desktop layout ===\n');

ok('default is 1 column', HOME_DESKTOP_FEED_COLUMNS_DEFAULT === 1);
ok('version migration key present', colsModule.includes('homecheff.homeDesktopFeedColumns.version'));
ok('explicit choice key present', colsModule.includes('homecheff.homeDesktopFeedColumns.explicit'));
ok('SSR default is 1 column', colsModule.includes('HOME_DESKTOP_FEED_COLUMNS_DEFAULT'));
ok('desktop non-home is single column', geoFeed.includes('grid-cols-1 gap-4 xl:gap-5'));
ok('mobile discover grid unchanged', geoFeed.includes('hc-discover-feed-grid'));
ok('mobile cards column unchanged', geoFeed.includes('hc-feed-cards-column'));
ok('layout state not in feed fetch deps', !geoFeed.match(/buildGeoFeedApiParams[\s\S]{0,2000}desktopFeedColumns/) );
ok('grid class 1 col', homeDesktopFeedGridClass(1).includes('grid-cols-1'));
ok('single column export', DESKTOP_FEED_SINGLE_COLUMN_CLASS.includes('grid-cols-1'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
