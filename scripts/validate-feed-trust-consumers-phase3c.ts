#!/usr/bin/env npx tsx
/**
 * Phase 3C — minimal vs extended trust consumer safety.
 */
import * as fs from 'node:fs';

import {
  TRUST_TIER_PRESENT,
  TRUST_TIER_UNKNOWN,
} from '../lib/discovery/contracts/discovery-trust-contract';
import { buildDiscoveryTrust } from '../lib/discovery/trust/build-discovery-trust';
import { emptySellerTrustSnapshot } from '../lib/discovery/trust/types';

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

const read = (p: string) => fs.readFileSync(p, 'utf8');

console.log('=== Phase 3C — Trust consumers ===\n');

// minimal feed path
ok('feed forces minimal mode', read('lib/feed/trust-enrichment-timing.ts').includes("const trustMode = 'minimal'"));

// extended still default elsewhere
ok('products route uses full default bundles', read('app/api/products/[id]/route.ts').includes('fetchSellerTrustBundles'));
ok('products route does not force minimal', !read('app/api/products/[id]/route.ts').includes("mode: 'minimal'"));

// minimal snapshot → conservative buyer tier (present, not expert)
const minimalSnap = emptySellerTrustSnapshot('user-1');
const trust = buildDiscoveryTrust({ sellerSnapshot: minimalSnap, listingIsActive: true });
ok('minimal buyerTier not unknown', trust.buyerTier >= TRUST_TIER_PRESENT);
ok('minimal buyerTier not falsely expert', trust.buyerTier < 5);
ok('minimal reviewsLeft implicit zero', minimalSnap.reviewsLeftCount === 0);
ok('minimal completedDealsAsBuyer zero', minimalSnap.completedDealsAsBuyer === 0);

// seller tile fields still populated from seller-side evidence
const sellerSnap = {
  ...emptySellerTrustSnapshot('seller-1'),
  hasSellerProfile: true,
  dealReviewCount: 3,
  completedDealsAsSeller: 2,
  productReviewCountSeller: 1,
};
const sellerTrust = buildDiscoveryTrust({
  sellerSnapshot: sellerSnap,
  listingIsActive: true,
  productReviewCount: 2,
});
ok('seller tier derives with minimal seller evidence', sellerTrust.sellerTier > TRUST_TIER_UNKNOWN);
ok('deal reviews on contract', sellerTrust.deal.reviewCount === 3);

// activity cards use separate eligibility fetch
ok(
  'activity cards separate from trust snapshots',
  read('app/api/feed/route.ts').includes('fetchActivityCardEligibilityInput'),
);

// profile trust uses separate module
ok('profile trust summary separate', fs.existsSync('lib/trust/profile-trust-summary.ts'));

// ranking uses repeatCustomers — conservative when buyer-side omitted
ok('ranking profile references repeatCustomers', read('lib/discovery/ranking/ranking-profiles.ts').includes('repeatCustomers'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
