#!/usr/bin/env npx tsx
/**
 * Phase 2E discovery feed integration validation.
 * Run: npx tsx scripts/validate-discovery-feed.ts
 */

import type { DiscoveryReadModel } from '../lib/discovery/contracts/discovery-read-model';
import {
  EMPTY_DISCOVERY_CAPABILITY,
  EMPTY_DISCOVERY_SOCIAL,
} from '../lib/discovery/contracts/discovery-read-model';
import {
  EMPTY_DISCOVERY_TRUST_CONTRACT,
  TRUST_TIER_ACTIVE,
  TRUST_TIER_ESTABLISHED,
  TRUST_TIER_PRESENT,
  TRUST_TIER_REVIEWED,
} from '../lib/discovery/contracts/discovery-trust-contract';
import { buildDiscoveryFeed } from '../lib/feed/build-discovery-feed';
import { discoveryFeedActive } from '../lib/feed/discovery-feed-client';
import { isMarketplaceSaleItem } from '../lib/feed/marketplace-sale';

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

function mockItem(
  id: string,
  overrides: Partial<DiscoveryReadModel> = {},
): Record<string, unknown> {
  const discovery: DiscoveryReadModel = {
    id,
    entityType: 'product',
    listingKind: 'PRODUCT',
    listingIntent: 'OFFER',
    title: `Item ${id}`,
    slug: `/p/${id}`,
    description: 'Fresh local produce from the garden.',
    coverImage: 'https://example.com/x.jpg',
    imageCount: 1,
    videoCount: 0,
    city: 'Rotterdam',
    region: null,
    country: 'NL',
    distanceKm: 5,
    marketplaceCategory: 'GROW',
    specializations: [],
    acceptedSpecializations: [],
    barterOpenness: null,
    trust: { ...EMPTY_DISCOVERY_TRUST_CONTRACT, sellerTier: TRUST_TIER_PRESENT },
    social: { ...EMPTY_DISCOVERY_SOCIAL, favoriteCount: 0 },
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    availabilityDate: null,
    isActive: true,
    capability: { ...EMPTY_DISCOVERY_CAPABILITY },
    ...overrides,
  };
  return {
    id,
    title: discovery.title,
    createdAt: discovery.createdAt,
    priceCents: 500,
    feedSource: 'PRODUCT',
    ownerId: `seller-${id}`,
    discovery,
  };
}

const items = [
  mockItem('a', {
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 6, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 4, tier: TRUST_TIER_REVIEWED },
    },
  }),
  mockItem('b', { distanceKm: 3 }),
  mockItem('c', {
    createdAt: daysAgo(2),
    social: { favoriteCount: 5, fansCount: 0, workspacePropsCount: 0 },
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_REVIEWED,
    },
  }),
  mockItem('d', {
    createdAt: daysAgo(4),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ACTIVE,
    },
  }),
];

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

console.log('=== Discovery Feed Integration (Phase 2E) ===\n');

const feed = buildDiscoveryFeed({
  items,
  radiusKm: 25,
  extractSellerUserId: (item) => String(item.ownerId ?? ''),
});

assert(feed != null, 'buildDiscoveryFeed returns payload');
assert(feed?.version === 1, 'contract version 1');
assert((feed?.sections.length ?? 0) > 0, 'has sections');
assert(discoveryFeedActive(feed), 'discoveryFeedActive');
assert(
  feed?.orderedListingIds.length === items.filter((i) => isMarketplaceSaleItem(i)).length,
  'ordered ids cover marketplace pool',
);
assert(
  feed?.futureSlots.some(
    (s) =>
      s.kind === 'activity_cards' &&
      !s.enabled &&
      s.specVersion === 1,
  ),
  'activity cards slot reserved with spec',
);

const idsInSections = new Set(feed?.sections.flatMap((s) => s.listingIds) ?? []);
const dupAcross = feed?.sections.some((s, i, arr) => {
  for (let j = i + 1; j < arr.length; j++) {
    const overlap = s.listingIds.filter((id) => arr[j]!.listingIds.includes(id));
    if (overlap.length > 0) return true;
  }
  return false;
});
assert(!dupAcross, 'cross-section dedup — no listing in multiple sections');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
