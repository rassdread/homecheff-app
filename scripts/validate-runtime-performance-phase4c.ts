#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 4C — Runtime / smart-caching / instant-navigation guard.
 *
 * Verifies the unified SWR architecture and the executed deferred optimizations,
 * and that Phase 4 / 4B wins are preserved. Complements the earlier guards.
 *
 * Run: npx tsx scripts/validate-runtime-performance-phase4c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

console.log('=== UX-FIN Phase 4C — Runtime performance guard ===\n');

// --- 4C.1/4C.2 Unified SWR architecture ---------------------------------
console.log('4C.1/4C.2 Unified session SWR cache');
const swrLib = read('lib/runtime/sessionSwrCache.ts');
const swrHook = read('hooks/useSessionSwr.ts');
assert(exists('lib/runtime/sessionSwrCache.ts'), 'sessionSwrCache module exists');
assert(exists('hooks/useSessionSwr.ts'), 'useSessionSwr hook exists');
assert(
  swrLib.includes('SWR_FRESH_MS') && swrLib.includes('isStale'),
  'cache exposes freshness window + staleness',
);
assert(
  swrLib.includes('sessionStorage'),
  'cache is per-tab sessionStorage (no cross-session leak)',
);
assert(
  swrHook.includes('AbortController') &&
    swrHook.includes('writeSwrCache') &&
    swrHook.includes('refreshing'),
  'hook is cache-first, abortable, background-refreshing',
);
assert(
  swrHook.includes('setLoading(false)') && swrHook.includes('entry'),
  'hook shows cache instantly (no skeleton on revisit)',
);

// --- 4C.6 Notifications SWR ---------------------------------------------
console.log('\n4C.6 Notifications instant reopen');
const noti = read('app/notifications/page.tsx');
assert(noti.includes('useSessionSwr'), 'notifications use unified SWR');
assert(
  noti.includes('mutate(') && noti.includes('isRead: true'),
  'mark-as-read stays optimistic via cache mutate',
);
assert(
  !noti.includes('setLoading(true)'),
  'no manual cold-load skeleton toggle remains',
);

// --- 4C.11 Operations client-side filter --------------------------------
console.log('\n4C.11 Operations client-side filtering');
const deals = read('components/profile/ProfileDealsClient.tsx');
assert(deals.includes('useSessionSwr'), 'operations hub uses unified SWR');
assert(
  deals.includes('itemMatchesFilter') &&
    deals.includes('allItems.filter'),
  'filter switches are client-side (same predicate as server)',
);
assert(
  deals.includes("fetch('/api/agreements'") &&
    !deals.includes('/api/agreements${qs}') &&
    !deals.includes('?filter=${'),
  'hub is fetched once unfiltered (no per-filter API call)',
);

// --- 4C.7 Profile parallel fetches --------------------------------------
console.log('\n4C.7 Profile fans/follows parallel');
const fans = read('components/FansAndFollowsList.tsx');
assert(fans.includes('Promise.all'), 'follows/fans/favorites fetched in parallel');
assert(fans.includes('AbortController'), 'fans/follows fetch is abortable');

// --- 4C.10 Checkout runtime ---------------------------------------------
console.log('\n4C.10 Checkout parallel + debounce');
const checkout = read('app/checkout/page.tsx');
assert(
  checkout.includes('productIds.map(async') && checkout.includes('Promise.all'),
  'product locations fetched in parallel (no serial loop)',
);
assert(
  !checkout.includes('for (const productId of productIds)'),
  'serial product loop removed',
);
assert(
  checkout.includes('setTimeout(() => {\n      calculateDeliveryFee') ||
    (checkout.includes('calculateDeliveryFee();') &&
      checkout.includes('300')),
  'delivery-fee recalc is debounced',
);

// --- 4C.9 Delivery diff poll --------------------------------------------
console.log('\n4C.9 Delivery poll diffing');
const delivery = read('components/delivery/DeliveryDashboard.tsx');
assert(
  delivery.includes('lastDeliveryPayloadRef'),
  'delivery keeps a last-payload signature ref',
);
assert(
  delivery.includes('signature === lastDeliveryPayloadRef.current'),
  'background poll skips setState when payload unchanged',
);

// --- 4C.5 Chat dedupe ----------------------------------------------------
console.log('\n4C.5 Chat deep-link dedupe');
const messages = read('app/messages/page.tsx');
assert(
  messages.includes('deepLinkHeaderAppliedIdRef'),
  'deep-link + header effects share one fetch (no duplicate)',
);

// --- 4C.8 Seller runtime -------------------------------------------------
console.log('\n4C.8 Seller orders runtime');
const sellerOrders = read('app/verkoper/orders/page-client.tsx');
assert(
  sellerOrders.includes('const filteredOrders = useMemo'),
  'filteredOrders is derived (no extra render pass)',
);
assert(
  sellerOrders.includes('loadOrders({ background: true })'),
  'post-optimistic reconcile runs in background (no skeleton)',
);
assert(
  read('app/verkoper/dashboard/page-client.tsx').includes('Promise.all'),
  'seller dashboard parallel fetch preserved (4B)',
);

// --- No regressions to prior phases -------------------------------------
console.log('\nRegression: Phase 4 / 4B preserved');
assert(
  read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'),
  'homepage SWR return cache still present',
);
assert(
  exists('scripts/validate-homepage-performance.ts') &&
    exists('scripts/validate-platform-performance-phase4b.ts'),
  'earlier regression guards still present',
);
assert(
  read('components/chat/ChatThreadMessageRow.tsx').includes('memo(ChatThreadMessageRow)'),
  'chat row memoization preserved (4B)',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
