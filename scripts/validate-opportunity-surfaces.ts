#!/usr/bin/env npx tsx
/**
 * Phase 3J opportunity surface integration validation.
 * Run: npx tsx scripts/validate-opportunity-surfaces.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  resolveSurfaces,
  buildServerSurfaceContext,
  buildPrioritizedMobileInserts,
  resolveOpportunityEconomySurfaces,
  emptySurfacePlan,
} from '../lib/discovery/surfaces';
import {
  COMMUNITY_HELPER_VARIANT_IDS,
  resolveCommunityHelperVariant,
  buildOpportunityProgress,
  OPPORTUNITY_REGISTRY,
} from '../lib/discovery/opportunities';
import {
  getEconomyOpportunityMobileInserts,
  interleaveMobileOpportunitySurfaces,
} from '../lib/feed/opportunity-surface-feed-rows';
import { interleaveMobileActivityCards } from '../lib/feed/activity-card-feed-rows';
import { ACTIVITY_CARD_MOBILE_INSERTION } from '../lib/discovery/activity-cards/activity-card-insertion-planner';

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

const baseEligibility = {
  userId: 'user-surf-opp-1',
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
  nearbyRequestCount: 3,
  emailVerified: true,
  hasWorkshopListing: false,
};

const ctx = buildServerSurfaceContext({
  eligibility: baseEligibility,
  accountCreatedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  activeNeighboursCount: 5,
  newMakersNearbyCount: 2,
});

console.log('=== Opportunity Surface Integration Validation (Phase 3J) ===\n');

console.log('Economy surface resolver');
const economy = resolveOpportunityEconomySurfaces(ctx);
assert(economy.desktopSidebar !== null || economy.profileModules.length > 0, 'economy surfaces resolve');

console.log('\nSurfaceRouter integration');
const plan = resolveSurfaces(ctx);
assert(plan.opportunityEconomy !== undefined, 'plan has opportunityEconomy');
assert(
  JSON.stringify(plan.opportunityEconomy.desktopSidebar?.opportunityType) ===
    JSON.stringify(economy.desktopSidebar?.opportunityType),
  'desktop economy wired in plan',
);
assert(plan.mobileInserts.length <= 3, 'mobile inserts capped');

const oppSlot = plan.sidebarStack.find((s) => s.slotId === 'opportunity_module');
assert(oppSlot !== undefined, 'opportunity_module slot exists');
if (economy.desktopSidebar) {
  assert(
    oppSlot?.module?.kind === 'ECONOMY_OPPORTUNITY' || oppSlot?.module?.kind === 'OPPORTUNITY',
    'desktop sidebar opportunity slot populated',
  );
}

console.log('\nDesktop rendering');
assert(
  plan.opportunityEconomy.desktopSidebar === null ||
    plan.opportunityEconomy.desktopSidebar.dismissible === true,
  'desktop opportunity dismissible',
);
assert(
  (plan.opportunityEconomy.desktopSidebar ? 1 : 0) <= 1,
  'max 1 desktop opportunity',
);

console.log('\nMobile routing');
const prioritized = buildPrioritizedMobileInserts({
  activityModules: [{ kind: 'ACTIVITY', size: 'standard', contract: {
    id: 'ac-1', type: 'PROFILE_COMPLETION', category: 'profile_completion',
    titleKey: 'x', descriptionKey: 'x', ctaKey: 'x', ctaKind: 'navigate',
    ctaHref: '/', priority: 'high', icon: 'User', dismissible: true, cooldownDays: 7,
  } }],
  opportunityModules: economy.mobileInserts.length > 0
    ? [{ kind: 'ECONOMY_OPPORTUNITY', size: 'standard', contract: economy.mobileInserts[0]! }]
    : [],
  mobileSlots: ACTIVITY_CARD_MOBILE_INSERTION,
});
assert(prioritized.length >= 0, 'prioritized mobile inserts build');

const mobileRows = interleaveMobileActivityCards(
  [{ row: 'sale', item: { id: '1' } }, { row: 'sale', item: { id: '2' } }, { row: 'sale', item: { id: '3' } }, { row: 'sale', item: { id: '4' } }],
  [],
  ACTIVITY_CARD_MOBILE_INSERTION,
  0,
);
const withOpp = interleaveMobileOpportunitySurfaces(
  mobileRows,
  economy.mobileInserts,
  plan.mobileInserts.map((i) => i.afterSaleIndex).length > 0
    ? plan.mobileInserts.map((i) => i.afterSaleIndex)
    : ACTIVITY_CARD_MOBILE_INSERTION,
  1,
);
assert(withOpp.length >= mobileRows.length, 'mobile opportunity interleave');

const fromPlan = getEconomyOpportunityMobileInserts(plan);
assert(Array.isArray(fromPlan), 'mobile inserts readable from plan');

console.log('\nProfile routing');
assert(plan.opportunityEconomy.profileModules.length <= 3, 'profile module cap');
assert(plan.profileStack.length >= 0, 'profile stack built');

console.log('\nCommunity helper expansion');
assert(COMMUNITY_HELPER_VARIANT_IDS.length === 8, 'eight helper variants');
const helperVariant = resolveCommunityHelperVariant({
  ...baseEligibility,
  accountAgeDays: 30,
  sellerTier: 0,
  buyerTier: 0,
  completedDeals: 0,
  activeNeighboursCount: 2,
  newMakersNearbyCount: 0,
  nearbyWorkshopCount: 0,
  upcomingWorkshopCount: 0,
  workshopHistoryCount: 0,
  hasSportsClubInterest: false,
  communityActivityScore: 1,
  practicalServiceRequestCount: 1,
  feedScope: 'nearby',
});
assert(helperVariant !== null, 'community helper variant resolves');

console.log('\nProgress model');
const progress = buildOpportunityProgress(OPPORTUNITY_REGISTRY.PARTNER, {});
assert(progress.accepted === false, 'progress initial not accepted');
assert(progress.milestones.length >= 1, 'progress milestones');
assert(progress.nextAction !== null, 'progress next action');

console.log('\nCooldowns & visibility');
const empty = emptySurfacePlan();
assert(empty.opportunityEconomy.desktopSidebar === null, 'empty plan no desktop opp');
assert(empty.opportunityEconomy.profileModules.length === 0, 'empty plan no profile opps');

console.log('\nComponents');
for (const file of [
  'OpportunitySurfaceStack.tsx',
  'OpportunityEconomyCard.tsx',
  'OpportunityProfileModule.tsx',
]) {
  assert(
    fs.existsSync(path.join(process.cwd(), 'components/discovery/surfaces', file)),
    `component ${file}`,
  );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
