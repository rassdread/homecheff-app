/**
 * Sponsored relevance, distribution simulation, and organic separation.
 * Run: npx tsx scripts/test-sponsored-recommendations.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SPONSORED_DISTRIBUTION_WEIGHT,
  isSponsoredCandidateEligible,
  selectSponsoredRecommendation,
  sponsoredRecommendationsEnabled,
  type SponsoredCandidateInput,
  type SponsoredContext,
  type SponsoredPlan,
} from '../lib/sponsored/recommendation';

function candidate(partial: Partial<SponsoredCandidateInput> & Pick<SponsoredCandidateInput, 'listingId' | 'title' | 'plan'>): SponsoredCandidateInput {
  return {
    sellerUserId: partial.sellerUserId ?? `seller-${partial.plan}`,
    businessName: partial.businessName ?? partial.title,
    category: partial.category ?? 'CHEFF',
    marketplaceCategory: partial.marketplaceCategory ?? 'CREATE',
    delivery: partial.delivery ?? 'PICKUP',
    distanceKm: partial.distanceKm ?? 2,
    country: partial.country ?? 'NL',
    active: partial.active ?? true,
    publicListing: partial.publicListing ?? true,
    ...partial,
  };
}

const base: SponsoredContext = {
  query: null,
  category: null,
  radiusKm: 5,
  country: 'NL',
  viewerUserId: null,
  excludeListingIds: [],
  seenSellerIds: [],
};

assert.equal(isSponsoredCandidateEligible(candidate({ listingId: '1', title: 'Taart', plan: 'premium' }), base), null);

const cake = isSponsoredCandidateEligible(
  candidate({ listingId: 'cake', title: 'Verjaardagstaart op maat', plan: 'basic', category: 'CHEFF' }),
  { ...base, query: 'taart' },
);
assert.ok(cake);
assert.equal(cake?.why, 'query');
assert.ok((cake?.relevanceScore ?? 0) >= 35);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'hair', title: 'Nagelstylist', plan: 'premium', category: 'DESIGNER', marketplaceCategory: 'PRACTICAL_SERVICE' }),
    { ...base, query: 'appeltaart' },
  ),
  null,
);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'salon', title: 'Nagelstylist', plan: 'premium', marketplaceCategory: 'PRACTICAL_SERVICE', category: 'service' }),
    { ...base, category: 'tuin' },
  ),
  null,
);

assert.ok(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'plant', title: 'Tomatentuin', plan: 'basic', category: 'GROWN', marketplaceCategory: 'GROW' }),
    { ...base, category: 'tuin' },
  ),
);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'far', title: 'Taart', plan: 'premium', distanceKm: 40 }),
    { ...base, query: 'taart', radiusKm: 5 },
  ),
  null,
);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'self', title: 'Taart', plan: 'pro', sellerUserId: 'me' }),
    { ...base, query: 'taart', viewerUserId: 'me' },
  ),
  null,
);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'dup', title: 'Taart', plan: 'pro' }),
    { ...base, query: 'taart', excludeListingIds: ['dup'] },
  ),
  null,
);

const online = isSponsoredCandidateEligible(
  candidate({
    listingId: 'course',
    title: 'Online taartles',
    plan: 'pro',
    marketplaceCategory: 'KNOWLEDGE',
    delivery: 'SHIPPING',
    distanceKm: 400,
  }),
  { ...base, query: 'taartles', radiusKm: 5 },
);
assert.ok(online);

const source = readFileSync(new URL('../lib/sponsored/recommendation.ts', import.meta.url), 'utf8');
assert.equal(source.includes('relevanceScore') && source.includes('weight: SPONSORED_DISTRIBUTION_WEIGHT'), true);
assert.equal(/race|religion|health|ethnicity/i.test(source), false);
assert.equal(source.includes('visibilityMultiplier'), false);

const previous = process.env.SPONSORED_RECOMMENDATIONS_ENABLED;
process.env.SPONSORED_RECOMMENDATIONS_ENABLED = '0';
assert.equal(sponsoredRecommendationsEnabled(), false);
process.env.SPONSORED_RECOMMENDATIONS_ENABLED = '1';
assert.equal(sponsoredRecommendationsEnabled(), true);
if (previous == null) delete process.env.SPONSORED_RECOMMENDATIONS_ENABLED;
else process.env.SPONSORED_RECOMMENDATIONS_ENABLED = previous;

function pool(plan: SponsoredPlan, count: number): SponsoredCandidateInput[] {
  return Array.from({ length: count }, (_, index) =>
    candidate({
      listingId: `${plan}-${index}`,
      sellerUserId: `${plan}-seller-${index}`,
      title: `Taart ${plan} ${index}`,
      plan,
      distanceKm: 1 + (index % 4),
    }),
  );
}

function share(weight: Record<SponsoredPlan, number>, counts: Record<SponsoredPlan, number>) {
  const original = { ...SPONSORED_DISTRIBUTION_WEIGHT };
  Object.assign(SPONSORED_DISTRIBUTION_WEIGHT, weight);
  const tally = { basic: 0, pro: 0, premium: 0, none: 0 };
  const candidates = [
    ...pool('basic', counts.basic),
    ...pool('pro', counts.pro),
    ...pool('premium', counts.premium),
  ];
  for (let i = 0; i < 300; i += 1) {
    const picked = selectSponsoredRecommendation(candidates, { ...base, query: 'taart', radiusKm: 10 }, `seed-${i}`);
    if (!picked) tally.none += 1;
    else tally[picked.candidate.plan] += 1;
  }
  Object.assign(SPONSORED_DISTRIBUTION_WEIGHT, original);
  return tally;
}

const equal = { basic: 10, pro: 10, premium: 10 };
const modelA = share({ basic: 105, pro: 110, premium: 115 }, equal);
const modelC = share({ basic: 1, pro: 2, premium: 3 }, equal);
const nonePaid = selectSponsoredRecommendation([], { ...base, query: 'taart' }, 'empty');
assert.equal(nonePaid, null);
const irrelevant = selectSponsoredRecommendation(
  [candidate({ listingId: 'p', title: 'Kapper', plan: 'premium', category: 'service', marketplaceCategory: 'PRACTICAL_SERVICE' })],
  { ...base, query: 'appeltaart' },
  'bad',
);
assert.equal(irrelevant, null);

const modelAPremium = modelA.premium / 300;
const modelCPremium = modelC.premium / 300;
assert.ok(modelCPremium > modelAPremium);
assert.ok(modelCPremium < 0.7);
assert.ok(modelC.basic > 0 && modelC.pro > 0);

console.log(JSON.stringify({
  modelA: modelA,
  modelC: modelC,
  noAd: nonePaid == null,
  irrelevantRejected: irrelevant == null,
  thresholdPassesNearbyCategory: true,
}));
console.log('sponsored recommendation checks passed');
