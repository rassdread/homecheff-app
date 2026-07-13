#!/usr/bin/env npx tsx
/**
 * Phase 3C — metadata proxy index consistency with /api/feed/media loader.
 */
import {
  buildFeedMediaProxyUrl,
  resolveFeedUrlsFromMetadata,
} from '../lib/feed/resolve-feed-media-url';

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

const PRODUCT_ID = '1823cae9-2aae-400f-9a28-eadbdcded3bc';
const DISH_ID = '4f822286-1111-4222-8333-aaaaaaaaaaaa';
const BLOB = 'https://blob.vercel-storage.com/photo.jpg';

console.log('=== Phase 3C — Metadata / media endpoint consistency ===\n');

// 1. empty rows
const empty = resolveFeedUrlsFromMetadata('product', PRODUCT_ID, []);
ok('empty metadata → no images', empty.images.length === 0 && empty.image === null);

// 2. single blob URL
const blobOne = resolveFeedUrlsFromMetadata('product', PRODUCT_ID, [
  { sortOrder: 0, httpUrl: BLOB, isLegacyInline: false },
]);
ok('blob URL passes through', blobOne.image === BLOB);

// 3. legacy data at index 0 (Sacco/Marilyn pattern)
const legacy0 = resolveFeedUrlsFromMetadata('product', PRODUCT_ID, [
  { sortOrder: 0, httpUrl: null, isLegacyInline: true },
]);
ok(
  'legacy index 0 → proxy i=0',
  legacy0.image === buildFeedMediaProxyUrl('product', PRODUCT_ID, 0),
);

// 4. malformed row at 0, legacy at ordinal 1
const legacy1 = resolveFeedUrlsFromMetadata('product', PRODUCT_ID, [
  { sortOrder: 0, httpUrl: null, isLegacyInline: false },
  { sortOrder: 1, httpUrl: null, isLegacyInline: true },
]);
ok(
  'legacy at ordinal 1 → proxy i=1 (not i=0)',
  legacy1.image === buildFeedMediaProxyUrl('product', PRODUCT_ID, 1),
);

// 5. dish blob
const dishBlob = resolveFeedUrlsFromMetadata('dish', DISH_ID, [
  { sortOrder: 0, httpUrl: BLOB, isLegacyInline: false },
]);
ok('dish blob direct', dishBlob.image === BLOB);

// 6. dish legacy
const dishLegacy = resolveFeedUrlsFromMetadata('dish', DISH_ID, [
  { sortOrder: 0, httpUrl: null, isLegacyInline: true },
]);
ok(
  'dish legacy proxy',
  dishLegacy.image === buildFeedMediaProxyUrl('dish', DISH_ID, 0),
);

// 7. multiple images preserve order
const multi = resolveFeedUrlsFromMetadata('product', PRODUCT_ID, [
  { sortOrder: 0, httpUrl: BLOB, isLegacyInline: false },
  { sortOrder: 1, httpUrl: null, isLegacyInline: true },
]);
ok('multi image count', multi.images.length === 2);
ok(
  'second image legacy index',
  multi.images[1] === buildFeedMediaProxyUrl('product', PRODUCT_ID, 1),
);

// 8. media loader uses same orderBy semantics (static contract)
const loader = require('fs').readFileSync(
  'lib/feed/feed-media-access.server.ts',
  'utf8',
);
ok('loader product orderBy sortOrder asc', loader.includes("orderBy: { sortOrder: 'asc' }"));
ok('loader dish orderBy idx asc', loader.includes("orderBy: { idx: 'asc' }"));
ok('metadata product ORDER BY sortOrder', require('fs').readFileSync(
  'lib/feed/feed-media-metadata.server.ts',
  'utf8',
).includes('"sortOrder" ASC'));
ok('metadata dish ORDER BY idx', require('fs').readFileSync(
  'lib/feed/feed-media-metadata.server.ts',
  'utf8',
).includes('"idx" ASC'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
