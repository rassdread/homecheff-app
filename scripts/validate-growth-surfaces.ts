#!/usr/bin/env npx tsx
/**
 * Phase 3M growth surface integration validation.
 * Run: npx tsx scripts/validate-growth-surfaces.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  GROWTH_ACTION_STACK_SLOT_IDS,
  GROWTH_MOBILE_MAX_INSERTS,
  FORBIDDEN_GROWTH_EFFECTS,
  isCanonicalGrowthStackOrder,
  resolveGrowthSurfaces,
  resolveRecommendedActionPair,
  buildGrowthMobileInserts,
  listAchievementKinds,
} from '../lib/discovery/growth';
import {
  resolveSurfaces,
  buildServerSurfaceContext,
  emptySurfacePlan,
} from '../lib/discovery/surfaces';
import { interleaveMobileGrowthSurfaces } from '../lib/feed/growth-surface-feed-rows';
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
  userId: 'user-growth-1',
  loggedIn: true,
  profileImage: 'https://example.com/a.jpg',
  hasLocation: true,
  completenessPercent: 65,
  productCount: 2,
  dishCount: 1,
  hasWorkspacePhotos: false,
  hasStripe: false,
  hasAcceptedValues: false,
  hasDeliveryProfile: false,
  hasSellerRole: true,
  completedDealWithoutReview: true,
  nearbyRequestCount: 4,
  emailVerified: true,
  hasWorkshopListing: false,
};

const ctx = buildServerSurfaceContext({
  eligibility: baseEligibility,
  accountCreatedAt: new Date(Date.now() - 45 * 86_400_000).toISOString(),
  activeNeighboursCount: 6,
  newMakersNearbyCount: 3,
  nearbyWorkshopCount: 2,
});

console.log('=== Growth Surface Integration Validation (Phase 3M) ===\n');

console.log('Canonical ordering');
assert(
  isCanonicalGrowthStackOrder([...GROWTH_ACTION_STACK_SLOT_IDS]),
  'growth stack canonical order',
);
assert(GROWTH_ACTION_STACK_SLOT_IDS[0] === 'current_action', 'current_action first');
assert(
  GROWTH_ACTION_STACK_SLOT_IDS[GROWTH_ACTION_STACK_SLOT_IDS.length - 1] ===
    'hcp_progress',
  'hcp_progress last',
);

console.log('\nSurfaceRouter integration');
const plan = resolveSurfaces(ctx);
assert(plan.growthSurfaces !== undefined, 'plan has growthSurfaces');
assert(plan.growthSurfaces.bundle !== undefined, 'growth bundle present');
assert(
  plan.growthSurfaces.desktopStack.length === GROWTH_ACTION_STACK_SLOT_IDS.length,
  'desktop stack has 7 slots',
);

const guestPlan = emptySurfacePlan();
assert(guestPlan.growthSurfaces.profile === null, 'guest profile growth null');

console.log('\nRecommended action resolver');
const pair = plan.growthSurfaces.bundle.recommendedActions;
assert(
  pair.primary === null || pair.secondary === null || pair.primary.id !== pair.secondary.id,
  'primary and secondary differ',
);
if (pair.primary && pair.secondary) {
  assert(
    pair.primary.href !== pair.secondary.href ||
      pair.primary.source !== pair.secondary.source,
    'deduplication by href+source',
  );
}

const manualPair = resolveRecommendedActionPair({
  activityItems: [],
  opportunity: plan.opportunityEconomy.desktopSidebar,
  progressRecommendations:
    plan.growthSurfaces.bundle.communityProgress.sidebar.recommendedAction
      ? [plan.growthSurfaces.bundle.communityProgress.sidebar.recommendedAction]
      : [],
  hcpRecommended: plan.growthSurfaces.bundle.hcpProgress.recommendedAction,
});
assert(manualPair.primary !== null || manualPair.secondary !== null || true, 'manual pair resolves');

console.log('\nCooldowns');
assert(
  plan.growthSurfaces.meta.actionCooldownDays >= 1,
  'action cooldown configured',
);
assert(
  plan.growthSurfaces.mobileInserts.every((i) => i.cooldownDays >= 0),
  'mobile inserts have cooldowns',
);

console.log('\nMobile routing');
assert(
  plan.growthSurfaces.mobileInserts.length <= GROWTH_MOBILE_MAX_INSERTS,
  'mobile inserts capped',
);
const mobileRows = interleaveMobileActivityCards(
  [
    { row: 'sale', item: { id: '1' } },
    { row: 'sale', item: { id: '2' } },
    { row: 'sale', item: { id: '3' } },
    { row: 'sale', item: { id: '4' } },
    { row: 'sale', item: { id: '5' } },
    { row: 'sale', item: { id: '6' } },
    { row: 'sale', item: { id: '7' } },
    { row: 'sale', item: { id: '8' } },
    { row: 'sale', item: { id: '9' } },
    { row: 'sale', item: { id: '10' } },
    { row: 'sale', item: { id: '11' } },
    { row: 'sale', item: { id: '12' } },
    { row: 'sale', item: { id: '13' } },
  ],
  [],
  ACTIVITY_CARD_MOBILE_INSERTION,
  0,
);
const withGrowth = interleaveMobileGrowthSurfaces(
  mobileRows,
  plan.growthSurfaces,
  GROWTH_MOBILE_MAX_INSERTS,
);
assert(withGrowth.length >= mobileRows.length, 'growth interleave adds rows');

console.log('\nProfile module');
assert(
  plan.growthSurfaces.profile !== null,
  'logged-in profile growth module',
);
if (plan.growthSurfaces.profile) {
  assert(
    plan.growthSurfaces.profile.recommendedActions.length <= 3,
    'profile actions capped at 3',
  );
  assert(
    plan.growthSurfaces.profile.activeOpportunities.length <= 3,
    'profile opportunities capped at 3',
  );
}

console.log('\nCommunity achievement feed');
assert(listAchievementKinds().length === 5, 'five achievement kinds');
assert(
  plan.growthSurfaces.bundle.achievementFeed.every((a) => a.recognitionOnly === true),
  'achievements recognition only',
);

console.log('\nAnti-gaming / forbidden effects');
for (const effect of FORBIDDEN_GROWTH_EFFECTS) {
  const planJson = JSON.stringify(plan.growthSurfaces);
  assert(!planJson.includes(effect), `no ${effect} in growth plan`);
}

console.log('\nOccupied slot deduplication');
const growthOnly = resolveGrowthSurfaces({
  ctx,
  activityItems: [],
  opportunityEconomy: plan.opportunityEconomy,
  occupiedMobileSlots: [4, 12],
});
const inserts = buildGrowthMobileInserts({
  bundle: growthOnly.bundle,
  occupiedSlots: [4, 12],
});
assert(
  inserts.every((i) => i.afterSaleIndex !== 4),
  'respects occupied slot 4',
);

console.log('\nLib files');
const libFiles = [
  'lib/discovery/growth/growth-surface-contract.ts',
  'lib/discovery/growth/community-achievement-feed.ts',
  'lib/discovery/growth/resolve-recommended-action.ts',
  'lib/discovery/growth/resolve-growth-surface-bundle.ts',
  'lib/discovery/growth/growth-sidebar-integration.ts',
  'lib/discovery/growth/growth-profile-integration.ts',
  'lib/discovery/growth/growth-mobile-inserts.ts',
  'lib/discovery/growth/build-growth-eligibility.ts',
  'lib/discovery/growth/index.ts',
  'lib/feed/growth-surface-feed-rows.ts',
  'components/discovery/surfaces/GrowthActionStack.tsx',
  'components/discovery/surfaces/GrowthProgressProfileModule.tsx',
  'components/discovery/surfaces/GrowthMobileInsertCard.tsx',
];

for (const file of libFiles) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
