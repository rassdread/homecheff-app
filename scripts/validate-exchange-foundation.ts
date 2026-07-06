#!/usr/bin/env npx tsx
/**
 * Phase 4D exchange matching foundation validation.
 * Run: npx tsx scripts/validate-exchange-foundation.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  EXCHANGE_MATCH_TYPES,
  EXCHANGE_SIGNAL_KINDS,
  FORBIDDEN_EXCHANGE_SCORE_SIGNALS,
  EXCHANGE_GRAPH_MAX_CHAIN_LENGTH,
  buildExchangeListingProfile,
  buildExchangeGraphFromMatches,
  computeExchangeOverlap,
  computeExchangeMatchScore,
  buildExchangeScoreSignals,
  evaluateExchangeEligibility,
  findExchangeChainPaths,
  findExchangeMatchesForListing,
  resolveExchangeMatch,
  resolvePrimaryMatchType,
  scorePayloadIsClean,
  validateExchangeGraphIntegrity,
  dedupeGraphEdges,
  shouldSuppressMatchPair,
} from '../lib/marketplace/exchange';

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

const now = Date.now();

const repairOffer = buildExchangeListingProfile({
  listingId: 'listing-repair-1',
  userId: 'user-a',
  listingKind: 'SERVICE',
  listingIntent: 'OFFER',
  marketplaceCategory: 'PRACTICAL_SERVICE',
  specializationIds: ['practical.repair'],
  acceptedTaxonomyIds: ['create.meal', 'grow.basil', 'grow.oregano'],
  barterOpenness: 'MONEY_AND_BARTER',
  priceModel: 'ON_REQUEST',
  createdAt: new Date(now - 2 * 86_400_000).toISOString(),
  distanceKm: 3,
});

const herbOffer = buildExchangeListingProfile({
  listingId: 'listing-herbs-1',
  userId: 'user-c',
  listingKind: 'PRODUCT',
  listingIntent: 'OFFER',
  marketplaceCategory: 'GROW',
  specializationIds: ['grow.basil', 'grow.oregano'],
  acceptedTaxonomyIds: ['practical.repair'],
  barterOpenness: 'MONEY_AND_BARTER',
  priceModel: 'FIXED',
  createdAt: new Date(now - 3 * 86_400_000).toISOString(),
  distanceKm: 2,
});

const gardenRequest = buildExchangeListingProfile({
  listingId: 'listing-garden-req-1',
  userId: 'user-b',
  listingIntent: 'REQUEST',
  listingKind: 'REQUEST',
  marketplaceCategory: 'GROW',
  specializationIds: [],
  acceptedTaxonomyIds: [],
  barterOpenness: 'MONEY',
  desiredExchanges: [
    {
      mainCategory: 'HOME_GARDEN',
      subcategoryId: 'grow.basil',
      subcategoryLabelKey: 'marketplace.taxonomy.grow.basil.label',
      description: 'Fresh basil and oregano.',
    },
    {
      mainCategory: 'HOME_GARDEN',
      subcategoryId: 'grow.oregano',
      subcategoryLabelKey: 'marketplace.taxonomy.grow.oregano.label',
      description: 'Fresh herbs.',
    },
  ],
  createdAt: new Date(now - 1 * 86_400_000).toISOString(),
  distanceKm: 3,
});

console.log('=== Exchange Matching Foundation Validation (Phase 4D) ===\n');

console.log('Match types');
assert(EXCHANGE_MATCH_TYPES.length === 5, 'five match types');
assert(
  resolvePrimaryMatchType(['direct_offer_wants', 'category_overlap']) ===
    'MULTI_MATCH',
  'multi match when 2+ dimensions',
);
assert(
  resolvePrimaryMatchType(['direct_offer_wants']) === 'DIRECT_MATCH',
  'direct match type',
);

console.log('\nCanonical exchange model');
assert(repairOffer.offer.primarySubcategoryId === 'practical.repair', 'offer subcategory');
assert(
  (repairOffer.acceptance?.mainCategories.length ?? 0) >= 2,
  'accepts multiple categories',
);
assert(gardenRequest.desiredExchanges.length === 2, 'desired exchanges');

console.log('\nOverlap');
const overlap = computeExchangeOverlap(herbOffer, gardenRequest);
assert(overlap.offerMatchesDesired.length > 0, 'offer matches desired herbs');
assert(overlap.sharedSubcategoryIds.includes('grow.basil'), 'basil overlap');

console.log('\nExchange score');
const scoreSignals = buildExchangeScoreSignals({
  overlap,
  a: herbOffer,
  b: gardenRequest,
  distanceKm: 3,
});
const score = computeExchangeMatchScore(scoreSignals);
assert(score > 0 && score <= 100, `score in range (${score})`);
assert(
  scorePayloadIsClean(scoreSignals as unknown as Record<string, unknown>).clean,
  'score signals clean',
);

console.log('\nForbidden score signals');
for (const sig of FORBIDDEN_EXCHANGE_SCORE_SIGNALS) {
  assert(
    !JSON.stringify(scoreSignals).includes(sig),
    `no ${sig} in score signals`,
  );
}

console.log('\nEligibility');
const eligible = evaluateExchangeEligibility({
  isActive: true,
  isDiscoverable: true,
  isBlocked: false,
  expiresAt: null,
  barterOpenness: 'MONEY_AND_BARTER',
  acceptedTaxonomyIds: ['grow.basil'],
});
assert(eligible.eligible, 'valid barter config eligible');
const bad = evaluateExchangeEligibility({
  isActive: false,
  isDiscoverable: true,
  isBlocked: false,
  expiresAt: null,
});
assert(!bad.eligible, 'inactive ineligible');

console.log('\nDuplicate suppression');
const self = shouldSuppressMatchPair(repairOffer, repairOffer);
assert(self.suppress && self.reason === 'same_listing', 'suppress same listing');
const sameUser = shouldSuppressMatchPair(repairOffer, {
  ...gardenRequest,
  userId: repairOffer.userId,
});
assert(sameUser.suppress && sameUser.reason === 'same_user', 'suppress same user');

console.log('\nResolver');
const resolved = resolveExchangeMatch({ a: herbOffer, b: gardenRequest });
assert(resolved !== null, 'match resolves');
assert(resolved!.match.score > 0, 'match has score');
assert(resolved!.signals.length > 0, 'signals derived');

const matches = findExchangeMatchesForListing(herbOffer, [gardenRequest], {
  minScore: 1,
});
assert(matches.length === 1, 'find matches for listing');

console.log('\nGraph integrity');
const graph = buildExchangeGraphFromMatches(
  [herbOffer, gardenRequest, repairOffer],
  matches,
);
const integrity = validateExchangeGraphIntegrity(graph);
assert(integrity.valid, 'graph integrity valid');
assert(graph.meta.chainMatchingEnabled === false, 'chain matching disabled');
assert(
  findExchangeChainPaths(graph).length === 0,
  'no chain paths in 4D',
);
assert(
  graph.meta.maxChainLength === EXCHANGE_GRAPH_MAX_CHAIN_LENGTH,
  'max chain length 4',
);

const dupEdges = dedupeGraphEdges([
  ...graph.edges,
  { ...graph.edges[0]!, id: 'dup' },
]);
assert(dupEdges.length === graph.edges.length, 'edge deduplication');

console.log('\nSignals');
assert(EXCHANGE_SIGNAL_KINDS.length === 5, 'five signal kinds');
assert(
  resolved!.signals.some((s) => s.kind === 'EXACT_DESIRED_MATCH'),
  'exact desired signal',
);

console.log('\nDocs');
const docs = [
  'docs/architecture/MARKETPLACE_EXCHANGE_MATCHING.md',
  'docs/audits/EXCHANGE_MATCH_TYPES.md',
  'docs/audits/EXCHANGE_GRAPH_READINESS.md',
  'docs/audits/EXCHANGE_SIGNAL_MATRIX.md',
  'docs/progress/MARKETPLACE_EXCHANGE_PHASE4D.md',
];
for (const doc of docs) {
  assert(fs.existsSync(path.join(process.cwd(), doc)), doc);
}

console.log('\nLib files');
const libFiles = [
  'lib/marketplace/exchange/exchange-contract.ts',
  'lib/marketplace/exchange/exchange-match-types.ts',
  'lib/marketplace/exchange/exchange-match-score.ts',
  'lib/marketplace/exchange/exchange-overlap.ts',
  'lib/marketplace/exchange/exchange-graph.ts',
  'lib/marketplace/exchange/exchange-eligibility.ts',
  'lib/marketplace/exchange/exchange-signals.ts',
  'lib/marketplace/exchange/exchange-resolver.ts',
  'lib/marketplace/exchange/index.ts',
];
for (const file of libFiles) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
