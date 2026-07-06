#!/usr/bin/env npx tsx
/**
 * Phase 2D discovery section validation — registry + ranking engine wiring.
 * Run: npx tsx scripts/validate-discovery-sections.ts
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
  TRUST_TIER_EXPERT,
  TRUST_TIER_PRESENT,
  TRUST_TIER_REVIEWED,
  TRUST_TIER_UNKNOWN,
} from '../lib/discovery/contracts/discovery-trust-contract';
import {
  buildAllDiscoverySections,
  buildDiscoverySection,
  auditAllDiscoverySections,
  DISCOVERY_SECTION_IDS,
  getDiscoverySectionDefinition,
  listDiscoverySectionDefinitions,
} from '../lib/discovery/sections';

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

function baseReadModel(
  id: string,
  overrides: Partial<DiscoveryReadModel> = {},
): DiscoveryReadModel {
  return {
    id,
    entityType: 'product',
    listingKind: 'PRODUCT',
    listingIntent: 'OFFER',
    title: `Listing ${id}`,
    slug: `/product/${id}`,
    description: 'Fresh organic vegetables from local garden plot.',
    coverImage: 'https://example.com/img.jpg',
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
    trust: { ...EMPTY_DISCOVERY_TRUST_CONTRACT },
    social: { ...EMPTY_DISCOVERY_SOCIAL },
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    isActive: true,
    capability: { ...EMPTY_DISCOVERY_CAPABILITY },
    ...overrides,
  };
}

const fixtures: DiscoveryReadModel[] = [
  baseReadModel('nearby-close', {
    distanceKm: 3,
    listingKind: 'PRODUCT',
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
  baseReadModel('nearby-far', {
    distanceKm: 30,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
  baseReadModel('trusted-established', {
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 6, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 4, tier: TRUST_TIER_REVIEWED },
      completedDeals: 10,
      repeatCustomers: 2,
    },
  }),
  baseReadModel('top-rated-deal', {
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_EXPERT,
      product: { reviewCount: 6, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 12, tier: TRUST_TIER_EXPERT },
    },
  }),
  baseReadModel('trending-hot', {
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0.5),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_REVIEWED,
    },
    social: { favoriteCount: 8, fansCount: 0, workspacePropsCount: 0 },
  }),
  baseReadModel('new-creator', {
    createdAt: daysAgo(5),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ACTIVE,
    },
  }),
  baseReadModel('new-creator-old', {
    createdAt: daysAgo(45),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ACTIVE,
    },
  }),
  baseReadModel('inspiration', {
    entityType: 'dish',
    listingKind: 'INSPIRATION',
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 10, tier: TRUST_TIER_ESTABLISHED },
    },
  }),
  baseReadModel('service-nearby', {
    listingKind: 'SERVICE',
    entityType: 'product',
    distanceKm: 8,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
  baseReadModel('task-nearby', {
    listingKind: 'TASK',
    entityType: 'product',
    distanceKm: 12,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
  baseReadModel('low-trust-spam', {
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_UNKNOWN,
    },
  }),
];

const viewer = { radiusKm: 25 };

console.log('=== Discovery Section Registry Validation (Phase 2D) ===\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

assert(
  listDiscoverySectionDefinitions().length === 5,
  'registry defines 5 sections',
);
assert(
  DISCOVERY_SECTION_IDS.every(
    (id) => getDiscoverySectionDefinition(id).rankingProfileId,
  ),
  'every section maps to a ranking profile',
);

const nearby = buildDiscoverySection('nearby', fixtures, {
  viewer,
  includeAudit: true,
});
assert(
  nearby.items.some((i) => i.id === 'nearby-close'),
  'nearby includes close listing',
);
assert(
  !nearby.items.some((i) => i.id === 'nearby-far'),
  'nearby excludes outside radius',
);
assert(
  nearby.items.some((i) => i.listingKind === 'SERVICE'),
  'nearby supports SERVICE',
);
assert(
  nearby.items.some((i) => i.listingKind === 'TASK'),
  'nearby supports TASK',
);
assert(!nearby.items.some((i) => i.listingKind === 'INSPIRATION'), 'nearby excludes inspiration');

const trusted = buildDiscoverySection('trusted_makers', fixtures, {
  includeAudit: true,
});
assert(
  trusted.items.some((i) => i.id === 'trusted-established'),
  'trusted_makers includes established seller',
);
assert(
  !trusted.items.some((i) => i.listingKind === 'INSPIRATION'),
  'trusted_makers excludes inspiration',
);
assert(trusted.audit?.trustedMakers != null, 'trusted_makers audit present');
assert(
  (trusted.audit?.trustedMakers?.eligibleSellerIds.length ?? 0) >= 1,
  'trusted_makers audit lists eligible listings',
);

const topRated = buildDiscoverySection('top_rated', fixtures);
assert(
  topRated.items[0]?.id === 'top-rated-deal',
  'top_rated leads with highest channel reviews',
);

const trending = buildDiscoverySection('trending', fixtures);
assert(
  trending.items.some((i) => i.id === 'trending-hot'),
  'trending includes recent favorites listing',
);

const newCreators = buildDiscoverySection('new_creators', fixtures);
assert(
  newCreators.items.some((i) => i.id === 'new-creator'),
  'new_creators includes recent quality listing',
);
assert(
  !newCreators.items.some((i) => i.id === 'new-creator-old'),
  'new_creators excludes listings older than 30 days',
);

const allSections = buildAllDiscoverySections(fixtures, { viewer });
assert(allSections.length === 5, 'buildAllDiscoverySections returns 5 sections');

const audits = auditAllDiscoverySections(fixtures, viewer);
assert(audits.length === 5, 'auditAllDiscoverySections covers all sections');
for (const a of audits) {
  assert(a.counts.total > 0, `${a.sectionId} audit has candidates`);
}

console.log('\n--- Section audit summary ---');
for (const a of audits) {
  console.log(
    `${a.sectionId}: ${a.counts.eligible}/${a.counts.total} eligible`,
    a.counts.ineligible > 0
      ? `(ineligible: ${JSON.stringify(a.counts.byReason)})`
      : '',
  );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
