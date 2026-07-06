#!/usr/bin/env npx tsx
/**
 * Phase 3E SurfaceRouter foundation validation.
 * Run: npx tsx scripts/validate-surface-router.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  SURFACE_KINDS,
  OPPORTUNITY_MODULE_IDS,
  OPPORTUNITY_MODULE_REGISTRY,
  resolveOpportunityModules,
  resolveSurfaces,
  buildServerSurfaceContext,
  sortSurfaceModules,
  maxModulesForTarget,
  filterModulesForTarget,
  resolveMobileSurfaceInserts,
  MOBILE_PLATFORM_RESERVED_SALE_INDICES,
  buildSurfacesFeedSlot,
  emptySurfacePlan,
  getSidebarActivityModules,
} from '../lib/discovery/surfaces';
import { resolveActivityCardContracts } from '../lib/discovery/activity-cards/resolve-activity-card-contracts';
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
  userId: 'user-surface-1',
  loggedIn: true,
  profileImage: 'https://example.com/a.jpg',
  hasLocation: true,
  completenessPercent: 80,
  productCount: 0,
  dishCount: 1,
  hasWorkspacePhotos: false,
  hasStripe: false,
  hasAcceptedValues: false,
  hasDeliveryProfile: false,
  hasSellerRole: true,
  completedDealWithoutReview: false,
  nearbyRequestCount: 0,
  emailVerified: true,
  hasWorkshopListing: false,
};

console.log('=== SurfaceRouter Foundation Validation (Phase 3E) ===\n');

console.log('Contracts');
assert(SURFACE_KINDS.length === 8, 'eight canonical surface kinds (incl. ECONOMY_OPPORTUNITY)');
assert(OPPORTUNITY_MODULE_IDS.length === 6, 'six opportunity modules');
for (const id of OPPORTUNITY_MODULE_IDS) {
  const def = OPPORTUNITY_MODULE_REGISTRY[id];
  assert(def.moduleId === id, `registry ${id}`);
  assert(def.titleKey.startsWith('surfaces.opportunities.'), `${id} titleKey prefix`);
  assert(def.cooldownDays >= 1, `${id} cooldownDays`);
}

console.log('\nOpportunity resolver');
const partnerEligible = resolveOpportunityModules({
  input: {
    ...baseEligibility,
    accountAgeDays: 14,
    nearbyWorkshopCount: 0,
    hasSportsClubInterest: false,
  },
});
assert(
  partnerEligible.some((m) => m.moduleId === 'BECOME_PARTNER'),
  'seller without listings → BECOME_PARTNER',
);
const ambassadorBlocked = resolveOpportunityModules({
  input: {
    ...baseEligibility,
    accountAgeDays: 3,
    nearbyWorkshopCount: 0,
    hasSportsClubInterest: false,
  },
});
assert(
  !ambassadorBlocked.some((m) => m.moduleId === 'BECOME_AMBASSADOR'),
  'young account blocks ambassador',
);
const supportNearby = resolveOpportunityModules({
  input: {
    ...baseEligibility,
    nearbyRequestCount: 2,
    accountAgeDays: 30,
    nearbyWorkshopCount: 0,
    hasSportsClubInterest: false,
  },
});
assert(
  supportNearby.some((m) => m.moduleId === 'SUPPORT_NEARBY'),
  'nearby requests → SUPPORT_NEARBY',
);
const deduped = resolveOpportunityModules({
  input: {
    ...baseEligibility,
    nearbyRequestCount: 2,
    accountAgeDays: 30,
    nearbyWorkshopCount: 0,
    hasSportsClubInterest: false,
  },
  reservedActivityTypes: ['NEARBY_HELP_REQUEST'],
});
assert(
  !deduped.some((m) => m.moduleId === 'SUPPORT_NEARBY'),
  'reserved activity type suppresses linked opportunity',
);

console.log('\nSurfaceRouter');
const ctx = buildServerSurfaceContext({
  eligibility: baseEligibility,
  accountCreatedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  nearbyWorkshopCount: 0,
});
const contracts = resolveActivityCardContracts({ input: baseEligibility, limit: 8 });
const plan = resolveSurfaces(ctx, { activityContracts: contracts });
assert(plan.specVersion === 2, 'plan specVersion 2');
assert(Array.isArray(plan.sidebarStack), 'sidebarStack present');
assert(Array.isArray(plan.mobileMapping), 'mobileMapping present');
assert(Array.isArray(plan.profileStack), 'profileStack present');
assert(plan.desktopRightSidebar.length >= 1, 'desktop sidebar has modules');
assert(
  plan.desktopRightSidebar.filter((m) => m.kind === 'OPPORTUNITY').length <= 1,
  'max one opportunity kind on desktop sidebar',
);
assert(
  plan.desktopRightSidebar.filter((m) => m.kind === 'PARTNER').length <= 1,
  'max one partner kind on desktop sidebar',
);
const sorted = sortSurfaceModules(plan.desktopRightSidebar);
assert(sorted.length === plan.desktopRightSidebar.length, 'sidebar modules sortable');
assert(plan.mobileInserts.length <= 2, 'mobile inserts capped');
assert(
  plan.mobileInserts.every(
    (i) => !MOBILE_PLATFORM_RESERVED_SALE_INDICES.has(i.afterSaleIndex),
  ),
  'mobile inserts avoid platform reserved indices',
);
assert(
  plan.profileModules.every((m) =>
    ['ACTIVITY', 'OPPORTUNITY', 'PARTNER', 'ECONOMY_OPPORTUNITY', 'COMMUNITY'].includes(m.kind),
  ),
  'profile modules are activation/opportunity only',
);
assert(plan.opportunityEconomy !== undefined, 'opportunityEconomy on plan');

console.log('\nVisibility');
assert(maxModulesForTarget('OPPORTUNITY', 'desktop_right_sidebar') === 1, 'opportunity desktop cap');
assert(maxModulesForTarget('ACTIVITY', 'desktop_right_sidebar') === 3, 'activity sidebar cap');
const guestFiltered = filterModulesForTarget(
  plan.desktopRightSidebar.filter((m) => m.kind === 'ACTIVITY'),
  'desktop_right_sidebar',
  {
    ...ctx,
    viewer: { userId: null, loggedIn: false, guest: true },
  },
);
assert(guestFiltered.length === 0, 'guest sees no sidebar activation modules');

console.log('\nMobile resolver');
const mobileOnly = resolveMobileSurfaceInserts({
  modules: plan.desktopRightSidebar,
  mobileSlots: ACTIVITY_CARD_MOBILE_INSERTION,
  maxInserts: 2,
});
assert(
  mobileOnly.every((i) =>
    (ACTIVITY_CARD_MOBILE_INSERTION as readonly number[]).includes(i.afterSaleIndex),
  ),
  'mobile slots use activity card indices',
);

console.log('\nFeed slot builder');
const slot = buildSurfacesFeedSlot({
  enabled: true,
  activityContracts: contracts,
  context: ctx,
});
assert(slot.kind === 'surfaces' && slot.enabled === true, 'enabled surfaces feed slot');
const disabledGuest = buildSurfacesFeedSlot({
  enabled: true,
  activityContracts: contracts,
  context: {
    ...ctx,
    viewer: { userId: null, loggedIn: false, guest: true },
    activityCardEligibility: { ...baseEligibility, loggedIn: false },
  },
});
assert(
  disabledGuest.kind === 'surfaces' && disabledGuest.enabled === false,
  'guest surfaces slot disabled',
);

console.log('\nEmpty plan');
const empty = emptySurfacePlan();
assert(empty.desktopRightSidebar.length === 0, 'empty plan sidebar');
assert(getSidebarActivityModules(empty).length === 0, 'empty sidebar activity modules');

console.log('\nComponents');
const componentDir = path.join(process.cwd(), 'components/discovery/surfaces');
for (const file of ['ActivityCardSidebarStack.tsx', 'OpportunityModuleCard.tsx', 'index.ts']) {
  assert(fs.existsSync(path.join(componentDir, file)), `component ${file}`);
}

console.log('\nLib layout');
const libDir = path.join(process.cwd(), 'lib/discovery/surfaces');
for (const file of [
  'surface-router.ts',
  'surface-contract.ts',
  'surface-context.ts',
  'surface-priority.ts',
  'surface-visibility.ts',
  'resolve-opportunity-modules.ts',
  'index.ts',
]) {
  assert(fs.existsSync(path.join(libDir, file)), `lib ${file}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
