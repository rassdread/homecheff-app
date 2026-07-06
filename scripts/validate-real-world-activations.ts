#!/usr/bin/env npx tsx
/**
 * Phase 3G real-world activation validation.
 * Run: npx tsx scripts/validate-real-world-activations.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  REAL_WORLD_ACTIVATION_CATEGORIES,
  ALL_REAL_WORLD_ACTIVATIONS,
  PRACTICAL_NEIGHBORHOOD_IDS,
  LOCAL_DISCOVERY_IDS,
  COMMUNITY_SUPPORT_IDS,
  FORBIDDEN_ACTIVATION_SIGNALS,
  assertActivationLibrarySafety,
  resolveRealWorldActivations,
  buildActivationEligibilityFromSurface,
  suppressDuplicateActivations,
  isActivationInCooldown,
  allowedRewardsForCategory,
  validateActivationRewards,
  VIRALITY_FRAMEWORK_RULES,
  rewardsAfterCompletionOnly,
} from '../lib/discovery/activations';

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

const baseInput = buildActivationEligibilityFromSurface({
  userId: 'user-rw-1',
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

console.log('=== Real-World Activation Validation (Phase 3G) ===\n');

console.log('Categories');
assert(REAL_WORLD_ACTIVATION_CATEGORIES.length === 3, 'three expansion categories');
assert(PRACTICAL_NEIGHBORHOOD_IDS.length === 12, 'twelve practical neighborhood activations');
assert(LOCAL_DISCOVERY_IDS.length === 8, 'eight local discovery activations');
assert(COMMUNITY_SUPPORT_IDS.length === 8, 'eight community support activations');
assert(
  ALL_REAL_WORLD_ACTIVATIONS.length === 28,
  'twenty-eight total real-world activations',
);

console.log('\nContracts');
for (const def of ALL_REAL_WORLD_ACTIVATIONS) {
  assert(def.titleKey.startsWith('activations.realWorld.'), `${def.id} i18n prefix`);
  assert(def.cooldownDays >= 1, `${def.id} cooldown`);
  assert(def.dismissible === true, `${def.id} dismissible`);
  assert(def.allowedRewards.length >= 1, `${def.id} rewards defined`);
  assert(
    REAL_WORLD_ACTIVATION_CATEGORIES.includes(def.category),
    `${def.id} valid category`,
  );
}

console.log('\nSafety');
const safety = assertActivationLibrarySafety(ALL_REAL_WORLD_ACTIVATIONS);
assert(safety.safe, `library safety (${safety.failures.length} failures)`);

console.log('\nRewards');
for (const cat of REAL_WORLD_ACTIVATION_CATEGORIES) {
  const rewards = allowedRewardsForCategory(cat);
  const check = validateActivationRewards(rewards);
  assert(check.valid, `rewards valid for ${cat}`);
}
assert(rewardsAfterCompletionOnly() === true, 'rewards after completion only');

console.log('\nVirality framework');
assert(VIRALITY_FRAMEWORK_RULES.optimizeScreenTime === false, 'no screen time optimization');
assert(VIRALITY_FRAMEWORK_RULES.encourageRealWorldActions === true, 'encourage real-world');

console.log('\nForbidden signals');
assert(FORBIDDEN_ACTIVATION_SIGNALS.includes('hcp_gate'), 'hcp_gate forbidden');
assert(FORBIDDEN_ACTIVATION_SIGNALS.includes('view_count'), 'view_count forbidden');

console.log('\nResolver');
const helpNearby = resolveRealWorldActivations({
  input: { ...baseInput, nearbyRequestCount: 3, practicalServiceRequestCount: 1 },
});
assert(helpNearby.length >= 1, 'nearby help resolves activations');
assert(
  helpNearby.some((a) => a.id === 'CS01' || a.id === 'PN03'),
  'support or practical help eligible',
);
const guest = resolveRealWorldActivations({
  input: { ...baseInput, loggedIn: false },
});
assert(guest.length === 0, 'guest gets no activations');

console.log('\nCooldowns');
const cooled = resolveRealWorldActivations({
  input: baseInput,
  cooldownState: {
    CS01: { dismissedAt: new Date().toISOString(), lastShownAt: null },
  },
});
assert(!cooled.some((a) => a.id === 'CS01'), 'dismissed activation suppressed');

assert(
  isActivationInCooldown(
    'CS01',
    { CS01: { dismissedAt: new Date().toISOString(), lastShownAt: null } },
    7,
    Date.now(),
  ),
  'cooldown helper works',
);

console.log('\nDuplicate suppression');
const dupes = suppressDuplicateActivations([
  { id: 'CS01', category: 'COMMUNITY_SUPPORT', libraryRef: 'H01' },
  { id: 'PN03', category: 'PRACTICAL_NEIGHBORHOOD', libraryRef: 'H01' },
  { id: 'CS02', category: 'COMMUNITY_SUPPORT' },
]);
assert(dupes.length === 1, 'libraryRef dedup + category cap');

console.log('\nLib layout');
const libDir = path.join(process.cwd(), 'lib/discovery/activations');
for (const file of [
  'activation-contract.ts',
  'activation-signals.ts',
  'activation-safety.ts',
  'activation-virality.ts',
  'activation-rewards.ts',
  'resolve-real-world-activations.ts',
  'index.ts',
]) {
  assert(fs.existsSync(path.join(libDir, file)), `lib ${file}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
