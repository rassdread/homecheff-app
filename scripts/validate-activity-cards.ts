#!/usr/bin/env npx tsx
/**
 * Phase 3A activity cards architecture validation.
 * Run: npx tsx scripts/validate-activity-cards.ts
 */

import {
  ACTIVITY_CARD_CATEGORIES,
  ACTIVITY_CARD_IDS,
  ACTIVITY_CARD_REGISTRY,
  ACTIVITY_CARD_TRIGGER_MATRIX,
  ACTIVITY_CARD_VISIBILITY_MATRIX,
  ACTIVITY_CARDS_PUBLIC_VISIBILITY,
  ACTIVITY_CARD_FEED_INTEGRATION,
  FORBIDDEN_ACTIVITY_CARD_SIGNALS,
  evaluateActivityCardEligibility,
  selectEligibleActivityCards,
} from '../lib/discovery/activity-cards';

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

console.log('=== Activity Cards Architecture Validation (Phase 3A) ===\n');

assert(ACTIVITY_CARD_IDS.length >= 20, 'taxonomy defines 20+ cards');
assert(
  Object.keys(ACTIVITY_CARD_CATEGORIES).length === 7,
  'seven activation categories',
);

for (const id of ACTIVITY_CARD_IDS) {
  const def = ACTIVITY_CARD_REGISTRY[id];
  assert(def.id === id, `registry entry ${id}`);
  assert(def.titleKey.startsWith('activityCards.'), `${id} has i18n titleKey`);
  assert(
    ACTIVITY_CARD_TRIGGER_MATRIX[id]?.required.length > 0,
    `${id} has triggers in matrix`,
  );
}

assert(
  !ACTIVITY_CARDS_PUBLIC_VISIBILITY,
  'no public card visibility',
);
assert(
  FORBIDDEN_ACTIVITY_CARD_SIGNALS.includes('gamification.hcp_points'),
  'HCP forbidden as signal',
);

for (const [surface, rule] of Object.entries(ACTIVITY_CARD_VISIBILITY_MATRIX)) {
  assert(rule.privateOnly === true, `${surface} is private`);
  assert(rule.indexable === false, `${surface} not indexable`);
  if (surface === 'profile_visitor') {
    assert(rule.maxVisible === 0, 'profile_visitor shows zero cards');
  }
}

assert(
  ACTIVITY_CARD_FEED_INTEGRATION.enabled === false,
  'feed integration disabled until 3B',
);
assert(
  ACTIVITY_CARD_FEED_INTEGRATION.dedupeByCardId,
  'feed dedup by card id',
);

const newSellerState = {
  logged_in: true,
  has_seller_role: true,
  no_listings: true,
  profile_incomplete: true,
} as const;

const publishFirst = evaluateActivityCardEligibility(
  'publish_first_offer',
  newSellerState,
  'home_feed',
);
assert(publishFirst.eligible, 'publish_first_offer eligible for new seller');

const guestBlocked = evaluateActivityCardEligibility(
  'complete_profile',
  {},
  'home_feed',
);
assert(!guestBlocked.eligible, 'guest cannot see profile card');

const selected = selectEligibleActivityCards(
  {
    logged_in: true,
    profile_incomplete: true,
    no_profile_photo: true,
    no_location: true,
    has_seller_role: true,
    no_listings: true,
  },
  'home_feed',
  3,
);
assert(selected.length <= 3, 'selection respects limit');
assert(
  selected.some((c) => c.id === 'complete_profile' || c.id === 'publish_first_offer'),
  'critical cards surface first',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
