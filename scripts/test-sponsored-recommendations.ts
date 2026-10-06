/**
 * Sponsored relevance, seller-level distribution, and rollout safety.
 * Run: npx tsx scripts/test-sponsored-recommendations.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SPONSORED_DISTRIBUTION_WEIGHT,
  isSponsoredCandidateEligible,
  selectSponsoredRecommendation,
  shouldRevealSponsoredCard,
  shouldStoreSponsoredImpression,
  sponsoredClickBlocksNavigation,
  sponsoredImpressionQualified,
  sponsoredRecommendationsEnabled,
  type SponsoredCandidateInput,
  type SponsoredContext,
  type SponsoredPlan,
} from '../lib/sponsored/recommendation';
import { resolveHomeMobileInsert } from '../lib/home/resolve-home-mobile-insert';
import { growthBenefitKeysForPlan } from '../lib/business/subscription-comparison';
import { getBusinessVisibilityProfile } from '../lib/business/visibility-profile';
import {
  presentContactChannelsForViewer,
  whatsappInternationalDigits,
  whatsappWaMeUrl,
} from '../lib/profile/maker-contact-preferences';

function candidate(
  partial: Partial<SponsoredCandidateInput> & Pick<SponsoredCandidateInput, 'listingId' | 'title' | 'plan'>,
): SponsoredCandidateInput {
  return {
    sellerUserId: partial.sellerUserId ?? `seller-${partial.plan}-${partial.listingId}`,
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
  query: 'taart',
  category: null,
  radiusKm: 5,
  country: 'NL',
  viewerUserId: null,
  excludeListingIds: [],
  seenSellerIds: [],
};

assert.equal(sponsoredRecommendationsEnabled({}), false);
assert.equal(sponsoredRecommendationsEnabled({ SPONSORED_RECOMMENDATIONS_ENABLED: '0' }), false);
assert.equal(sponsoredRecommendationsEnabled({ SPONSORED_RECOMMENDATIONS_ENABLED: 'false' }), false);
assert.equal(sponsoredRecommendationsEnabled({ SPONSORED_RECOMMENDATIONS_ENABLED: '1' }), true);
assert.equal(sponsoredRecommendationsEnabled({ SPONSORED_RECOMMENDATIONS_ENABLED: 'true' }), true);
assert.equal(
  sponsoredRecommendationsEnabled({ NEXT_PUBLIC_SPONSORED_RECOMMENDATIONS_ENABLED: '1' }),
  false,
);

assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'hair', title: 'Nagelstylist', plan: 'premium', category: 'service', marketplaceCategory: 'PRACTICAL_SERVICE' }),
    { ...base, query: 'appeltaart' },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'cake', title: 'Verjaardagstaart', plan: 'premium', category: 'CHEFF' }),
    { ...base, query: 'hovenier', category: null },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'food', title: 'Verse soep', plan: 'premium', category: 'CHEFF', marketplaceCategory: 'CREATE' }),
    { ...base, query: 'logo ontwerpen' },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'plumb', title: 'Loodgieter', plan: 'premium', category: 'service', marketplaceCategory: 'PRACTICAL_SERVICE' }),
    { ...base, query: 'catering' },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'salon', title: 'Nagelstylist', plan: 'premium', marketplaceCategory: 'PRACTICAL_SERVICE', category: 'service' }),
    { ...base, query: null, category: 'tuin' },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'cake2', title: 'Taart', plan: 'premium', category: 'CHEFF' }),
    { ...base, query: null, category: 'design' },
  ),
  null,
);
assert.equal(
  isSponsoredCandidateEligible(
    candidate({ listingId: 'far', title: 'Hovenier in de tuin', plan: 'premium', category: 'GROWN', marketplaceCategory: 'GROW', distanceKm: 40 }),
    { ...base, query: 'hovenier', radiusKm: 5 },
  ),
  null,
);
assert.ok(
  isSponsoredCandidateEligible(
    candidate({
      listingId: 'ship',
      title: 'Taart per post',
      plan: 'basic',
      delivery: 'SHIPPING',
      distanceKm: 180,
    }),
    { ...base, query: 'taart', radiusKm: 5 },
  ),
);
assert.ok(
  isSponsoredCandidateEligible(
    candidate({
      listingId: 'course',
      title: 'Online taartles',
      plan: 'pro',
      marketplaceCategory: 'KNOWLEDGE',
      distanceKm: 400,
    }),
    { ...base, query: 'taartles', radiusKm: 5 },
  ),
);
assert.ok(isSponsoredCandidateEligible(candidate({ listingId: 'b', title: 'Taart basic', plan: 'basic' }), base));
assert.ok(isSponsoredCandidateEligible(candidate({ listingId: 'p', title: 'Taart pro', plan: 'pro' }), base));
assert.ok(isSponsoredCandidateEligible(candidate({ listingId: 'r', title: 'Taart premium', plan: 'premium' }), base));

assert.equal(sponsoredImpressionQualified(0.49, 5000), false);
assert.equal(sponsoredImpressionQualified(0.5, 500), false);
assert.equal(sponsoredImpressionQualified(0.5, 1000), true);
assert.deepEqual(
  shouldStoreSponsoredImpression({ ratio: 0.5, visibleMs: 1000, alreadyStored: true, analyticsConsent: true }),
  { count: false, store: false },
);
assert.deepEqual(
  shouldStoreSponsoredImpression({ ratio: 0.5, visibleMs: 1000, alreadyStored: false, analyticsConsent: false }),
  { count: true, store: false },
);
assert.equal(sponsoredClickBlocksNavigation(), false);
assert.equal(shouldRevealSponsoredCard({ hasItem: false, scrollY: 0, anchorTop: 900, viewportHeight: 800 }), false);
assert.equal(shouldRevealSponsoredCard({ hasItem: true, scrollY: 40, anchorTop: 100, viewportHeight: 800 }), false);
assert.equal(shouldRevealSponsoredCard({ hasItem: true, scrollY: 0, anchorTop: 900, viewportHeight: 800 }), true);

const loggedIn = [1, 3, 4, 7, 8, 11, 12, 15].map((index) => resolveHomeMobileInsert(index, true));
assert.deepEqual(loggedIn, [
  'verticals',
  'pulse',
  'promo:android-beta',
  'reputation',
  'promo:affiliate-12-12',
  'share',
  'promo:werken-bij',
  'sponsored',
]);
assert.equal(resolveHomeMobileInsert(15, false), 'sponsored');
assert.notEqual(resolveHomeMobileInsert(3, true), 'sponsored');

const many = Array.from({ length: 25 }, (_, index) =>
  candidate({ listingId: `many-${index}`, sellerUserId: 'many', title: `Taart ${index}`, plan: 'basic' }),
);
const one = candidate({ listingId: 'one', sellerUserId: 'one', title: 'Taart een', plan: 'basic' });
let manyWins = 0;
for (let i = 0; i < 400; i += 1) {
  const picked = selectSponsoredRecommendation([...many, one], base, `multi-${i}`);
  if (picked?.candidate.sellerUserId === 'many') manyWins += 1;
}
const multiRatio = manyWins / (400 - manyWins);
assert.ok(multiRatio < 1.35, `multi listing ratio ${multiRatio}`);

function business(
  plan: SponsoredPlan,
  index: number,
  listings = 1,
): SponsoredCandidateInput[] {
  return Array.from({ length: listings }, (_, listing) =>
    candidate({
      listingId: `${plan}-${index}-${listing}`,
      sellerUserId: `${plan}-${index}`,
      title: `Taart ${plan} ${index}`,
      plan,
    }),
  );
}

function population(basic: number, pro: number, premium: number) {
  return [
    ...Array.from({ length: basic }, (_, index) => business('basic', index)).flat(),
    ...Array.from({ length: pro }, (_, index) => business('pro', index)).flat(),
    ...Array.from({ length: premium }, (_, index) => business('premium', index)).flat(),
  ];
}

function runMix(basic: number, pro: number, premium: number, runs = 2000) {
  const rows = population(basic, pro, premium);
  const wins = { basic: 0, pro: 0, premium: 0, none: 0 };
  const perSeller = new Map<string, number>();
  for (let i = 0; i < runs; i += 1) {
    const picked = selectSponsoredRecommendation(rows, base, `mix-${basic}-${pro}-${premium}-${i}`);
    if (!picked) {
      wins.none += 1;
      continue;
    }
    wins[picked.candidate.plan] += 1;
    perSeller.set(
      picked.candidate.sellerUserId,
      (perSeller.get(picked.candidate.sellerUserId) ?? 0) + 1,
    );
  }
  const avg = (plan: SponsoredPlan, count: number) => {
    if (count === 0) return 0;
    let total = 0;
    for (let index = 0; index < count; index += 1) total += perSeller.get(`${plan}-${index}`) ?? 0;
    return total / count;
  };
  const series = (plan: SponsoredPlan, count: number) =>
    Array.from({ length: count }, (_, index) => perSeller.get(`${plan}-${index}`) ?? 0).sort((a, b) => a - b);
  const pct = (values: number[], ratio: number) =>
    values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * ratio))] : 0;
  const basicAvg = avg('basic', basic);
  return {
    population: { basic, pro, premium },
    eligible: basic + pro + premium,
    share: {
      basic: wins.basic / runs,
      pro: wins.pro / runs,
      premium: wins.premium / runs,
    },
    perBusiness: {
      basic: basicAvg,
      pro: avg('pro', pro),
      premium: avg('premium', premium),
    },
    basicP: { p10: pct(series('basic', basic), 0.1), p50: pct(series('basic', basic), 0.5), p90: pct(series('basic', basic), 0.9) },
    noAd: wins.none / runs,
    repeat: 0,
  };
}

const original = { ...SPONSORED_DISTRIBUTION_WEIGHT };
function withWeights(weights: Record<SponsoredPlan, number>, basic: number, pro: number, premium: number) {
  Object.assign(SPONSORED_DISTRIBUTION_WEIGHT, weights);
  const result = runMix(basic, pro, premium, 1500);
  Object.assign(SPONSORED_DISTRIBUTION_WEIGHT, original);
  return result;
}

const scenarioA = runMix(80, 15, 5);
const scenarioB = runMix(60, 30, 10);
const scenarioC = runMix(40, 40, 20);
const scenarioD = runMix(33, 33, 34);
const scenarioE = runMix(20, 30, 50);
const scenarioF = runMix(10, 20, 70);
const scenarioG = runMix(20, 0, 0);
const scenarioH = runMix(0, 20, 0);
const scenarioI = runMix(0, 0, 20);
const modelA = withWeights({ basic: 1, pro: 1.05, premium: 1.15 }, 60, 30, 10);
const modelC = withWeights({ basic: 1, pro: 1.5, premium: 2 }, 60, 30, 10);
const modelB = scenarioB;

const proVsBasic = scenarioA.perBusiness.pro / scenarioA.perBusiness.basic;
const premiumVsBasic = scenarioA.perBusiness.premium / scenarioA.perBusiness.basic;
assert.ok(proVsBasic > 1.6 && proVsBasic < 2.4, `pro advantage ${proVsBasic}`);
assert.ok(premiumVsBasic > 2.4 && premiumVsBasic < 3.6, `premium advantage ${premiumVsBasic}`);
assert.equal(scenarioG.share.basic, 1);
assert.equal(scenarioH.share.pro, 1);
assert.equal(scenarioI.share.premium, 1);
assert.equal(selectSponsoredRecommendation([], base, 'empty'), null);

assert.equal(getBusinessVisibilityProfile('basic').monthlyPriceCents, 3900);
assert.equal(getBusinessVisibilityProfile('pro').monthlyPriceCents, 9900);
assert.equal(getBusinessVisibilityProfile('premium').monthlyPriceCents, 19900);
assert.equal(getBusinessVisibilityProfile('basic').feePercent, 9);
assert.equal(growthBenefitKeysForPlan('individual').some((key) => key.includes('sponsored')), false);
assert.ok(growthBenefitKeysForPlan('basic').includes('business.dna.benefit.sponsoredBasic'));
assert.ok(growthBenefitKeysForPlan('premium').includes('business.dna.benefit.sponsoredPremium'));

assert.equal(whatsappInternationalDigits('0612345678'), '31612345678');
assert.equal(whatsappWaMeUrl('0612345678'), 'https://wa.me/31612345678');
const anonymous = presentContactChannelsForViewer(
  [{ id: 'whatsapp', href: 'https://wa.me/31612345678' }],
  { authenticated: false, isOwner: false },
);
assert.equal(anonymous[0]?.href, '');

const route = readFileSync(new URL('../app/api/home/sponsored-recommendation/route.ts', import.meta.url), 'utf8');
assert.equal(route.split('findMany(').length - 1, 1);
assert.equal(route.includes('gtag'), false);
const insert = readFileSync(new URL('../components/home/SponsoredRecommendationInsert.tsx', import.meta.url), 'utf8');
assert.equal(insert.includes('preventDefault'), false);
const nl = JSON.parse(readFileSync(new URL('../public/i18n/nl.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../public/i18n/en.json', import.meta.url), 'utf8'));
assert.equal(nl.sponsoredRecommendation.label, 'Gesponsord');
assert.equal(en.sponsoredRecommendation.label, 'Sponsored');
assert.equal(nl.business.dna.benefit.sponsoredBasic.includes('%'), false);

console.log(JSON.stringify({
  scenarioA,
  scenarioB,
  scenarioC,
  scenarioD,
  scenarioE,
  scenarioF,
  scenarioG,
  scenarioH,
  scenarioI,
  modelAPerBusiness: modelA.perBusiness,
  modelBPerBusiness: modelB.perBusiness,
  modelCPerBusiness: modelC.perBusiness,
  proVsBasic,
  premiumVsBasic,
  premiumVsPro: scenarioA.perBusiness.premium / scenarioA.perBusiness.pro,
  multiRatio,
}, null, 2));
console.log('sponsored recommendation v1.1 checks passed');
