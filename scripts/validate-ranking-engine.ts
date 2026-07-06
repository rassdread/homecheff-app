#!/usr/bin/env npx tsx
/**
 * Phase 2C ranking engine validation — sample fixtures through all profiles.
 * Run: npx tsx scripts/validate-ranking-engine.ts
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
} from '../lib/discovery/contracts/discovery-trust-contract';
import {
  rankDiscoveryReadModels,
  scoreDiscoveryItem,
  toDiscoveryRankingInput,
  assertRankingInputPurity,
} from '../lib/discovery/ranking';

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
    availabilityDate: null,
    isActive: true,
    capability: { ...EMPTY_DISCOVERY_CAPABILITY },
    ...overrides,
  };
}

const fixtures: DiscoveryReadModel[] = [
  baseReadModel('near-new', {
    distanceKm: 2,
    createdAt: daysAgo(1),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_REVIEWED,
      product: { reviewCount: 2, tier: TRUST_TIER_REVIEWED },
    },
    social: { favoriteCount: 3, fansCount: 0, workspacePropsCount: 0 },
  }),
  baseReadModel('far-established', {
    distanceKm: 40,
    createdAt: daysAgo(30),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 8, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 4, tier: TRUST_TIER_REVIEWED },
      completedDeals: 12,
      repeatCustomers: 3,
      trustBadges: [
        { key: 'betrouwbare-verkoper', name: 'Betrouwbare verkoper', icon: '⭐' },
      ],
    },
    social: { favoriteCount: 1, fansCount: 0, workspacePropsCount: 0 },
  }),
  baseReadModel('trending-hot', {
    distanceKm: 8,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0.5),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_REVIEWED,
      completedDeals: 2,
    },
    social: { favoriteCount: 8, fansCount: 0, workspacePropsCount: 0 },
  }),
  baseReadModel('top-rated-deal', {
    distanceKm: 15,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_EXPERT,
      product: { reviewCount: 6, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 12, tier: TRUST_TIER_EXPERT },
      completedDeals: 20,
    },
    social: { favoriteCount: 0, fansCount: 0, workspacePropsCount: 0 },
  }),
  baseReadModel('inactive', {
    isActive: false,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 10, tier: TRUST_TIER_ESTABLISHED },
    },
  }),
  baseReadModel('inspiration-dish', {
    entityType: 'dish',
    listingKind: 'INSPIRATION',
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ESTABLISHED,
      product: { reviewCount: 10, tier: TRUST_TIER_ESTABLISHED },
      deal: { reviewCount: 5, tier: TRUST_TIER_ESTABLISHED },
    },
  }),
  baseReadModel('new-creator', {
    createdAt: daysAgo(5),
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_ACTIVE,
    },
  }),
  baseReadModel('nearby-close', {
    distanceKm: 3,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
  baseReadModel('nearby-far', {
    distanceKm: 35,
    trust: {
      ...EMPTY_DISCOVERY_TRUST_CONTRACT,
      sellerTier: TRUST_TIER_PRESENT,
    },
  }),
];

const profiles = [
  'baseline',
  'trusted_maker',
  'top_rated',
  'trending',
  'nearby',
  'new_creators',
] as const;

console.log('=== Discovery Ranking Engine Validation (Phase 2C) ===\n');

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

// Anti-gaming: forbidden legacy field rejection
try {
  const badInput = {
    ...toDiscoveryRankingInput(fixtures[0]!),
    viewCount: 9999,
  } as ReturnType<typeof toDiscoveryRankingInput> & { viewCount: number };
  assertRankingInputPurity(badInput);
  assert(false, 'assertRankingInputPurity rejects viewCount');
} catch {
  assert(true, 'assertRankingInputPurity rejects viewCount');
}

for (const profileId of profiles) {
  console.log(`\n--- Profile: ${profileId} ---`);
  const ranked = rankDiscoveryReadModels(fixtures, { profileId });
  const order = ranked.map((r) => r.input.readModel.id);
  const scores = ranked.map((r) => ({
    id: r.input.readModel.id,
    score: r.score.toFixed(4),
    eligible: r.eligible,
  }));
  console.log('Order:', order.join(' → '));
  console.log('Scores:', JSON.stringify(scores, null, 2));

  if (profileId === 'baseline') {
    const nearIdx = order.indexOf('near-new');
    const farIdx = order.indexOf('far-established');
    assert(nearIdx >= 0 && farIdx >= 0 && nearIdx < farIdx, 'baseline ranks closer listing above distant one');
    assert(!order.includes('inactive'), 'baseline excludes inactive');
  }

  if (profileId === 'trusted_maker') {
    assert(
      order.includes('far-established') || order.includes('top-rated-deal'),
      'trusted_maker includes established sellers',
    );
    assert(!order.includes('inspiration-dish'), 'trusted_maker excludes inspiration');
    assert(!order.includes('near-new'), 'trusted_maker excludes low-tier sellers');
  }

  if (profileId === 'top_rated') {
    assert(order[0] === 'top-rated-deal', 'top_rated leads with highest channel reviews');
    assert(!order.includes('inspiration-dish'), 'top_rated excludes inspiration');
  }

  if (profileId === 'trending') {
    assert(order.includes('trending-hot'), 'trending includes recent high-favorite listing');
    assert(!order.includes('far-established'), 'trending excludes stale listings');
  }

  if (profileId === 'nearby') {
    assert(order.includes('nearby-close'), 'nearby includes in-radius listing');
    assert(!order.includes('nearby-far'), 'nearby excludes out-of-radius listing');
    assert(!order.includes('inspiration-dish'), 'nearby excludes inspiration');
  }

  if (profileId === 'new_creators') {
    assert(order.includes('new-creator'), 'new_creators includes recent quality listing');
    assert(!order.includes('far-established'), 'new_creators excludes established sellers');
  }
}

// Favorites cap: extra favorites should not change score beyond cap
const cappedA = baseReadModel('cap-a', {
  social: { favoriteCount: 5, fansCount: 0, workspacePropsCount: 0 },
  trust: { ...EMPTY_DISCOVERY_TRUST_CONTRACT, sellerTier: TRUST_TIER_REVIEWED },
  createdAt: daysAgo(2),
  updatedAt: daysAgo(1),
});
const cappedB = baseReadModel('cap-b', {
  social: { favoriteCount: 100, fansCount: 0, workspacePropsCount: 0 },
  trust: { ...EMPTY_DISCOVERY_TRUST_CONTRACT, sellerTier: TRUST_TIER_REVIEWED },
  createdAt: daysAgo(2),
  updatedAt: daysAgo(1),
});
const scoreA = scoreDiscoveryItem(toDiscoveryRankingInput(cappedA), 'trending').score;
const scoreB = scoreDiscoveryItem(toDiscoveryRankingInput(cappedB), 'trending').score;
assert(
  scoreA === scoreB,
  'trending favorites capped — 5 vs 100 favorites same score',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
