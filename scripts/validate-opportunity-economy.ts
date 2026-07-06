#!/usr/bin/env npx tsx
/**
 * Phase 3I Opportunity Economy validation.
 * Run: npx tsx scripts/validate-opportunity-economy.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_LIFECYCLE_STATES,
  OPPORTUNITY_REWARD_TYPES,
  FORBIDDEN_OPPORTUNITY_SIGNALS,
  ALL_OPPORTUNITY_DEFINITIONS,
  OPPORTUNITY_REGISTRY,
  resolveOpportunityContracts,
  resolveOpportunitySurfaceBundle,
  buildOpportunityEligibilityFromSurface,
  isOpportunityEligible,
  isOpportunityInCooldown,
  suppressDuplicateOpportunities,
  canTransitionOpportunityLifecycle,
  transitionOpportunityLifecycle,
  lifecycleAllowsSurface,
  resolveOpportunityLifecycleState,
  validateOpportunityRewards,
  allowedRewardsForOpportunityCategory,
  futureRewardsAreContractOnly,
  opportunityRewardsAfterCompletionOnly,
  FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS,
} from '../lib/discovery/opportunities';

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

const baseInput = buildOpportunityEligibilityFromSurface({
  userId: 'user-opp-1',
  loggedIn: true,
  profileImage: 'https://example.com/a.jpg',
  hasLocation: true,
  completenessPercent: 80,
  productCount: 0,
  dishCount: 0,
  hasWorkspacePhotos: false,
  hasStripe: false,
  hasAcceptedValues: false,
  hasDeliveryProfile: false,
  hasSellerRole: false,
  completedDealWithoutReview: false,
  nearbyRequestCount: 2,
  emailVerified: true,
  hasWorkshopListing: false,
});

console.log('=== Opportunity Economy Validation (Phase 3I) ===\n');

console.log('Canonical types');
assert(OPPORTUNITY_TYPES.length === 10, 'ten canonical opportunity types');
assert(
  OPPORTUNITY_TYPES.includes('PARTNER'),
  'PARTNER type defined',
);
assert(
  OPPORTUNITY_TYPES.includes('MUNICIPALITY_INVITER'),
  'MUNICIPALITY_INVITER type defined',
);
assert(
  OPPORTUNITY_TYPES.includes('EVENT_ORGANIZER'),
  'EVENT_ORGANIZER type defined',
);

console.log('\nCategories');
assert(OPPORTUNITY_CATEGORIES.length === 6, 'six opportunity categories');
for (const cat of OPPORTUNITY_CATEGORIES) {
  const rewards = allowedRewardsForOpportunityCategory(cat);
  assert(rewards.length >= 1, `${cat} has default rewards`);
}

console.log('\nContracts');
for (const def of ALL_OPPORTUNITY_DEFINITIONS) {
  assert(def.titleKey.startsWith('opportunities.economy.'), `${def.type} i18n prefix`);
  assert(def.benefits.length >= 1, `${def.type} benefits defined`);
  assert(def.requirements.length >= 1, `${def.type} requirements defined`);
  assert(def.rewardTypes.length >= 1, `${def.type} rewardTypes defined`);
  assert(def.cooldowns.showCooldownDays >= 1, `${def.type} show cooldown`);
  assert(def.surfaceTargets.length >= 1, `${def.type} surface targets`);
  const rewardCheck = validateOpportunityRewards(def.rewardTypes);
  assert(rewardCheck.valid, `${def.type} rewards valid`);
}

console.log('\nForbidden signals');
for (const signal of FORBIDDEN_OPPORTUNITY_SIGNALS) {
  assert(
  !JSON.stringify(ALL_OPPORTUNITY_DEFINITIONS).includes(signal),
    `no ${signal} in registry`,
  );
}

console.log('\nEligibility');
const partnerEligible = isOpportunityEligible(
  'PARTNER',
  OPPORTUNITY_REGISTRY.PARTNER.eligibility,
  baseInput,
);
assert(partnerEligible.eligible, 'new user eligible for PARTNER');

const courierInput = buildOpportunityEligibilityFromSurface(baseInput, {
  hasDeliveryProfile: true,
});
const courierEligible = isOpportunityEligible(
  'COURIER',
  OPPORTUNITY_REGISTRY.COURIER.eligibility,
  courierInput,
);
assert(!courierEligible.eligible, 'existing courier blocked');

const municipalityInput = buildOpportunityEligibilityFromSurface(baseInput, {
  hasSellerRole: true,
  sellerTier: 3,
  completedDeals: 6,
  productCount: 5,
});
const municipalityEligible = isOpportunityEligible(
  'MUNICIPALITY_INVITER',
  OPPORTUNITY_REGISTRY.MUNICIPALITY_INVITER.eligibility,
  municipalityInput,
);
assert(municipalityEligible.eligible, 'established seller eligible for municipality');

const guestInput = buildOpportunityEligibilityFromSurface({
  ...baseInput,
  loggedIn: false,
  userId: 'guest',
});
assert(
  resolveOpportunityContracts({ input: guestInput }).length === 0,
  'guest gets no opportunities',
);

console.log('\nResolver');
const resolved = resolveOpportunityContracts({ input: baseInput });
assert(resolved.length >= 1, 'logged-in user gets opportunities');
const types = resolved.map((r) => r.type);
assert(new Set(types).size === types.length, 'no duplicate types in resolver');

const bundle = resolveOpportunitySurfaceBundle({ input: baseInput });
assert(bundle.desktopSidebar.length <= 1, 'desktop sidebar cap');
assert(bundle.mobileInserts.length <= 1, 'mobile insert cap');
assert(bundle.profileModules.length <= 3, 'profile module cap');

console.log('\nCooldowns');
const cooled = isOpportunityInCooldown(
  'PARTNER',
  {
    PARTNER: {
      dismissedAt: new Date().toISOString(),
      lastShownAt: null,
      acceptedAt: null,
      completedAt: null,
      lifecycle: 'archived',
    },
  },
  OPPORTUNITY_REGISTRY.PARTNER.cooldowns,
  Date.now(),
);
assert(cooled, 'dismissed opportunity in cooldown');

console.log('\nDuplicate suppression');
const dupCandidates = [
  { type: 'PARTNER' as const, category: 'GROW' },
  { type: 'PARTNER' as const, category: 'GROW' },
  { type: 'AMBASSADOR' as const, category: 'GROW' },
];
const deduped = suppressDuplicateOpportunities(dupCandidates);
assert(deduped.length === 1, 'duplicate type suppressed');
assert(
  suppressDuplicateOpportunities([
    { type: 'PARTNER', category: 'GROW' },
    { type: 'AMBASSADOR', category: 'GROW' },
  ]).length === 1,
  'one per category cap in session',
);

console.log('\nLifecycle');
assert(OPPORTUNITY_LIFECYCLE_STATES.length === 6, 'six lifecycle states');
assert(
  canTransitionOpportunityLifecycle('eligible', 'shown'),
  'eligible → shown allowed',
);
assert(
  !canTransitionOpportunityLifecycle('eligible', 'completed'),
  'eligible → completed blocked',
);
const transition = transitionOpportunityLifecycle('shown', 'accepted');
assert(transition.ok && transition.state === 'accepted', 'shown → accepted');
assert(lifecycleAllowsSurface('eligible'), 'eligible allows surface');
assert(!lifecycleAllowsSurface('completed'), 'completed hides surface');
assert(
  resolveOpportunityLifecycleState('PARTNER', {
    PARTNER: {
      dismissedAt: null,
      lastShownAt: new Date().toISOString(),
      acceptedAt: null,
      completedAt: null,
      lifecycle: 'shown',
    },
  }) === 'shown',
  'lifecycle state from cooldown',
);

console.log('\nRewards framework');
assert(futureRewardsAreContractOnly(), 'future rewards contract-only');
assert(opportunityRewardsAfterCompletionOnly(), 'rewards after completion only');
assert(
  FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS.includes('pay_to_win'),
  'pay_to_win forbidden',
);
for (const rt of OPPORTUNITY_REWARD_TYPES) {
  assert(
    validateOpportunityRewards([rt]).valid,
    `reward type ${rt} allowed`,
  );
}

console.log('\nLib files');
const libFiles = [
  'opportunity-contract.ts',
  'opportunity-eligibility.ts',
  'opportunity-rewards.ts',
  'opportunity-lifecycle.ts',
  'opportunity-anti-spam.ts',
  'opportunity-registry.ts',
  'resolve-opportunity-contracts.ts',
  'index.ts',
];
for (const file of libFiles) {
  const full = path.join(process.cwd(), 'lib/discovery/opportunities', file);
  assert(fs.existsSync(full), `lib ${file}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
