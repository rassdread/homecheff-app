#!/usr/bin/env npx tsx
/**
 * Phase 3F sidebar stack validation.
 * Run: npx tsx scripts/validate-sidebar-stack.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CANONICAL_SIDEBAR_STACK_ORDER,
  COMMUNITY_MODULE_IDS,
  COMMUNITY_MODULE_REGISTRY,
  OPPORTUNITY_STACK_COOLDOWN_DAYS,
  OPPORTUNITY_STACK_MODULE_IDS,
  WORKSHOP_MODULE_IDS,
  WORKSHOP_MODULE_REGISTRY,
  buildServerSurfaceContext,
  isCanonicalStackOrder,
  isSidebarSlotRenderable,
  resolveCommunityModules,
  resolveOpportunityStackModule,
  resolvePartnerStackModule,
  resolveSurfaces,
  resolveWorkshopModules,
  buildMobileSurfaceMapping,
  buildProfileStack,
  resolveSidebarSlotVisibility,
} from '../lib/discovery/surfaces';
import { resolveActivityCardContracts } from '../lib/discovery/activity-cards/resolve-activity-card-contracts';

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
  userId: 'user-stack-1',
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

console.log('=== Sidebar Stack Validation (Phase 3F) ===\n');

console.log('Canonical order');
assert(
  isCanonicalStackOrder([...CANONICAL_SIDEBAR_STACK_ORDER]),
  'canonical stack order matches SIDEBAR_STACK_SLOT_IDS',
);
assert(
  CANONICAL_SIDEBAR_STACK_ORDER[0] === 'community_pulse',
  'community pulse first',
);
assert(
  CANONICAL_SIDEBAR_STACK_ORDER[CANONICAL_SIDEBAR_STACK_ORDER.length - 1] ===
    'sponsored_placeholder',
  'sponsored placeholder last',
);

console.log('\nModule registries');
assert(COMMUNITY_MODULE_IDS.length === 5, 'five community modules');
assert(WORKSHOP_MODULE_IDS.length === 4, 'four workshop modules');
for (const id of COMMUNITY_MODULE_IDS) {
  assert(
    COMMUNITY_MODULE_REGISTRY[id].titleKey.startsWith('surfaces.community.'),
    `community ${id} i18n`,
  );
}
for (const id of WORKSHOP_MODULE_IDS) {
  assert(
    WORKSHOP_MODULE_REGISTRY[id].titleKey.startsWith('surfaces.workshops.'),
    `workshop ${id} i18n`,
  );
}

console.log('\nOpportunity stack');
assert(OPPORTUNITY_STACK_MODULE_IDS.length === 3, 'three opportunity stack ids');
assert(OPPORTUNITY_STACK_COOLDOWN_DAYS === 14, '14 day opportunity cooldown');

const ctx = buildServerSurfaceContext({
  eligibility: baseEligibility,
  accountCreatedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  nearbyWorkshopCount: 2,
  newMakersNearbyCount: 1,
  activeNeighboursCount: 4,
  upcomingWorkshopCount: 1,
});

const opp = resolveOpportunityStackModule({
  input: ctx.opportunityEligibility,
  reservedActivityTypes: [],
});
assert(opp?.moduleId === 'BECOME_PARTNER', 'opportunity stack picks BECOME_PARTNER');

const hostInWorkshop = resolveWorkshopModules({
  input: {
    ...baseEligibility,
    productCount: 3,
    hasSellerRole: true,
    hasWorkshopListing: false,
    nearbyWorkshopCount: 0,
    upcomingWorkshopCount: 0,
    workshopWaitlistCount: 0,
  },
  limit: 2,
});
assert(
  hostInWorkshop.some((m) => m.moduleId === 'HOST_WORKSHOP'),
  'workshop resolver includes HOST_WORKSHOP',
);

console.log('\nSurface plan stack');
const contracts = resolveActivityCardContracts({ input: baseEligibility, limit: 8 });
const plan = resolveSurfaces(ctx, { activityContracts: contracts });
assert(plan.sidebarStack.length === CANONICAL_SIDEBAR_STACK_ORDER.length, 'full sidebar stack');
assert(
  plan.sidebarStack.filter((s) => s.slotId === 'opportunity_module').length === 1,
  'one opportunity slot',
);
const oppSlot = plan.sidebarStack.find((s) => s.slotId === 'opportunity_module');
assert(
  !oppSlot?.module ||
    oppSlot.module.kind === 'OPPORTUNITY' ||
    oppSlot.module.kind === 'ECONOMY_OPPORTUNITY',
  'opportunity slot is opportunity kind',
);
const partnerSlot = plan.sidebarStack.find((s) => s.slotId === 'partner_module');
assert(
  !partnerSlot?.module || partnerSlot.module.kind === 'PARTNER',
  'partner slot is PARTNER kind',
);
const workshopSlot = plan.sidebarStack.find((s) => s.slotId === 'workshop_module');
assert(
  !workshopSlot?.module || workshopSlot.module.kind === 'WORKSHOP',
  'workshop slot is WORKSHOP kind',
);

console.log('\nVisibility');
const guestHide = resolveSidebarSlotVisibility({
  ctx: {
    ...ctx,
    viewer: { userId: null, loggedIn: false, guest: true },
  },
  slotId: 'activity_module',
  hasModule: true,
  moduleCount: 2,
});
assert(guestHide === 'hide', 'guest hides activity module');
const guestPulse = resolveSidebarSlotVisibility({
  ctx: {
    ...ctx,
    viewer: { userId: null, loggedIn: false, guest: true },
  },
  slotId: 'community_pulse',
  hasModule: false,
});
assert(isSidebarSlotRenderable(guestPulse), 'guest sees community pulse slot');

console.log('\nMobile mapping');
assert(plan.mobileMapping.length >= 1, 'mobile mapping entries');
assert(
  plan.mobileMapping.every((m) =>
    ['feed_insert', 'activity_card', 'profile_module', 'bottom_sheet'].includes(
      m.mobileTarget,
    ),
  ),
  'valid mobile targets',
);
const mapping = buildMobileSurfaceMapping({
  sidebarStack: plan.sidebarStack,
  profileModules: plan.profileModules,
});
assert(mapping.length >= plan.mobileInserts.length, 'mapping covers inserts');

console.log('\nProfile stack');
const profileStack = buildProfileStack({
  ctx,
  activityItems: contracts.map((c) => ({
    id: c.id,
    type: c.type,
    category: 'profile_completion' as const,
    titleKey: c.titleKey,
    descriptionKey: c.descriptionKey,
    ctaKey: c.actionLabelKey,
    ctaKind: c.ctaKind,
    ctaHref: c.actionHref,
    priority: 'high' as const,
    icon: c.icon,
    dismissible: c.dismissible,
    cooldownDays: c.cooldownDays,
  })),
  opportunities: opp ? [opp] : [],
  communityModules: resolveCommunityModules({
    input: {
      ...baseEligibility,
      accountAgeDays: 30,
      activeNeighboursCount: 4,
      newMakersNearbyCount: 1,
      nearbyWorkshopCount: 2,
      completedDealCount: 0,
    },
  }),
});
assert(profileStack.length >= 1, 'profile stack sections');

console.log('\nComponents');
const componentDir = path.join(process.cwd(), 'components/discovery/surfaces');
for (const file of [
  'DesktopRightSidebarSurfaceStack.tsx',
  'OpportunityModuleStack.tsx',
  'CommunityModuleCard.tsx',
  'WorkshopModuleCard.tsx',
  'ProfileSurfaceStack.tsx',
]) {
  assert(fs.existsSync(path.join(componentDir, file)), `component ${file}`);
}

console.log('\nLib modules');
const libDir = path.join(process.cwd(), 'lib/discovery/surfaces');
for (const file of [
  'sidebar-stack-order.ts',
  'resolve-sidebar-visibility.ts',
  'resolve-community-modules.ts',
  'resolve-workshop-modules.ts',
  'build-sidebar-stack.ts',
  'resolve-mobile-surface-mapping.ts',
  'resolve-profile-stack.ts',
]) {
  assert(fs.existsSync(path.join(libDir, file)), `lib ${file}`);
}

const partnerOnly = resolvePartnerStackModule({
  input: {
    ...ctx.opportunityEligibility,
    productCount: 5,
    hasSellerRole: true,
  },
});
assert(
  partnerOnly === null || partnerOnly.moduleId === 'INVITE_LOCAL_BUSINESS',
  'partner stack seller with listings',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
