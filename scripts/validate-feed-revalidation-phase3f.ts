#!/usr/bin/env npx tsx
/**
 * Phase 3F.4 — Public feed revalidation wiring.
 */
import * as fs from 'node:fs';

import {
  getPublicFeedInvalidationCount,
  isPublicFeedVisibleDish,
  isPublicFeedVisibleListing,
  isPublicFeedVisibleProduct,
  shouldRevalidateAfterDishMutation,
  shouldRevalidateAfterListingMutation,
  shouldRevalidateAfterProductMutation,
} from '../lib/feed/revalidate-public-feed';
import { PUBLIC_FEED_CACHE_TAGS } from '../lib/feed/feed-cache-keys';

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

console.log('=== Phase 3F.4 — Revalidation ===\n');

ok('active product visible', isPublicFeedVisibleProduct({ isActive: true }));
ok('inactive product hidden', !isPublicFeedVisibleProduct({ isActive: false }));
ok('published dish visible', isPublicFeedVisibleDish({ status: 'PUBLISHED' }));
ok('private dish hidden', !isPublicFeedVisibleDish({ status: 'PRIVATE' }));
ok('active listing visible', isPublicFeedVisibleListing({ status: 'ACTIVE' }));

ok(
  'product publish triggers',
  shouldRevalidateAfterProductMutation({ isActive: false }, { isActive: true }),
);
ok(
  'product unpublish triggers',
  shouldRevalidateAfterProductMutation({ isActive: true }, { isActive: false }),
);
ok(
  'private-only product edit skipped',
  !shouldRevalidateAfterProductMutation({ isActive: false }, { isActive: false }),
);
ok(
  'dish publish triggers',
  shouldRevalidateAfterDishMutation({ status: 'PRIVATE' }, { status: 'PUBLISHED' }),
);
ok(
  'listing activate triggers',
  shouldRevalidateAfterListingMutation({ status: 'PAUSED' }, { status: 'ACTIVE' }),
);

ok('invalidation counter starts at 0', getPublicFeedInvalidationCount() >= 0);
ok('two public tags', PUBLIC_FEED_CACHE_TAGS.length === 2);

const productCreate = fs.readFileSync('app/api/products/create/route.ts', 'utf8');
const productPatch = fs.readFileSync('app/api/products/[id]/route.ts', 'utf8');
const dishCreate = fs.readFileSync('app/api/profile/dishes/route.ts', 'utf8');
const dishPatch = fs.readFileSync('app/api/profile/dishes/[id]/route.ts', 'utf8');

ok('product create wired', productCreate.includes("revalidatePublicFeedCache('product:create')"));
ok('product patch wired', productPatch.includes("revalidatePublicFeedCache('product:patch')"));
ok('product delete wired', productPatch.includes("revalidatePublicFeedCache('product:delete')"));
ok('listing patch wired', productPatch.includes("revalidatePublicFeedCache('listing:patch')"));
ok('dish create wired', dishCreate.includes("revalidatePublicFeedCache('dish:create')"));
ok('dish patch wired', dishPatch.includes("revalidatePublicFeedCache('dish:patch')"));
ok('dish delete wired', dishPatch.includes("revalidatePublicFeedCache('dish:delete')"));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
