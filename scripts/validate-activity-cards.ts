#!/usr/bin/env npx tsx
/**
 * Phase 3B activity cards foundation validation.
 * Run: npx tsx scripts/validate-activity-cards.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ACTIVITY_CARD_TYPES,
  ACTIVITY_CARD_TYPE_REGISTRY,
  ACTIVITY_CARD_MOBILE_INSERTION,
  ACTIVITY_CARD_SESSION_MAX,
  ACTIVITY_CARD_VISIBLE_MAX,
  evaluateActivityCardTypeEligibility,
  resolveActivityCardContracts,
  buildActivityCardsFeedSlot,
  FORBIDDEN_ACTIVITY_CARD_SIGNALS,
} from '../lib/discovery/activity-cards';
import {
  interleaveDesktopActivityCards,
  interleaveMobileActivityCards,
} from '../lib/feed/activity-card-feed-rows';

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

const baseInput = {
  userId: 'user-1',
  loggedIn: true,
  profileImage: null,
  hasLocation: true,
  completenessPercent: 40,
  productCount: 0,
  dishCount: 0,
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

console.log('=== Activity Cards Foundation Validation (Phase 3B) ===\n');

console.log('Contract + registry');
assert(ACTIVITY_CARD_TYPES.length === 11, 'eleven supported activity types');
for (const type of ACTIVITY_CARD_TYPES) {
  const def = ACTIVITY_CARD_TYPE_REGISTRY[type];
  assert(def.type === type, `registry ${type}`);
  assert(def.titleKey.startsWith('activityCards.types.'), `${type} i18n titleKey`);
  assert(def.cooldownDays >= 1, `${type} cooldownDays`);
}

console.log('\nEligibility engine');
const noListings = resolveActivityCardContracts({ input: baseInput });
assert(
  noListings.some((c) => c.type === 'UPLOAD_FIRST_LISTING'),
  'no listings → UPLOAD_FIRST_LISTING',
);
const noPhoto = resolveActivityCardContracts({
  input: { ...baseInput, profileImage: null, completenessPercent: 20 },
});
assert(
  noPhoto.some((c) => c.type === 'PROFILE_COMPLETION'),
  'incomplete profile → PROFILE_COMPLETION',
);
const reviewDue = resolveActivityCardContracts({
  input: { ...baseInput, completedDealWithoutReview: true, productCount: 2 },
});
assert(
  reviewDue.some((c) => c.type === 'REQUEST_REVIEW'),
  'completed deal without review → REQUEST_REVIEW',
);
const courier = resolveActivityCardContracts({
  input: { ...baseInput, hasDeliveryProfile: false },
});
assert(
  courier.some((c) => c.type === 'BECOME_COURIER'),
  'no delivery profile → BECOME_COURIER',
);
const guest = resolveActivityCardContracts({
  input: { ...baseInput, loggedIn: false },
});
assert(guest.length === 0, 'guest sees no cards');

const repeatBlocked = resolveActivityCardContracts({
  input: baseInput,
  cooldownState: {
    UPLOAD_FIRST_LISTING: {
      dismissedAt: null,
      lastShownAt: new Date().toISOString(),
    },
  },
});
assert(
  !repeatBlocked.some((c) => c.type === 'UPLOAD_FIRST_LISTING'),
  '7-day repeat cooldown suppresses card',
);

console.log('\nSession caps');
assert(ACTIVITY_CARD_SESSION_MAX === 2, 'max 2 cards per session');
assert(ACTIVITY_CARD_VISIBLE_MAX === 1, '1 visible at a time');

console.log('\nInsertion architecture');
assert(
  ACTIVITY_CARD_MOBILE_INSERTION.join(',') === '4,12,24',
  'mobile slots after rows 4, 12, 24',
);
const mobileRows = interleaveMobileActivityCards(
  [
    { row: 'sale', item: { id: '1' } },
    { row: 'sale', item: { id: '2' } },
    { row: 'sale', item: { id: '3' } },
    { row: 'sale', item: { id: '4' } },
  ],
  [
    {
      id: 'c1',
      type: 'INVITE_FRIEND',
      category: 'social_activation',
      titleKey: 'a',
      descriptionKey: 'b',
      ctaKey: 'c',
      ctaKind: 'navigate',
      priority: 'normal',
    },
  ],
  ACTIVITY_CARD_MOBILE_INSERTION,
  2,
);
assert(
  mobileRows.some((r) => r.row === 'activity_card'),
  'mobile interleaves activity_card row',
);
const desktopRows = interleaveDesktopActivityCards(
  [
    { row: 'section', sectionId: 'nearby', titleKey: 'k' },
    { row: 'sale', item: { id: '1' } },
    { row: 'section', sectionId: 'trending', titleKey: 'k2' },
  ],
  [
    {
      id: 'c2',
      type: 'SHARE_QR',
      category: 'social_activation',
      titleKey: 'a',
      descriptionKey: 'b',
      ctaKey: 'c',
      ctaKind: 'navigate',
      priority: 'normal',
    },
  ],
  2,
);
assert(
  desktopRows.filter((r) => r.row === 'activity_card').length >= 1,
  'desktop inserts between sections',
);

console.log('\nFeed slot + deduplication');
const slot = buildActivityCardsFeedSlot({ eligibility: baseInput, enabled: true });
assert(slot.kind === 'activity_cards' && slot.enabled === true, 'enabled feed slot');
if (slot.enabled) {
  const ids = slot.cards.map((c) => c.id);
  assert(new Set(ids).size === ids.length, 'dedupe card ids in slot');
}

console.log('\nComponent files');
const uiRoot = path.join(process.cwd(), 'components/discovery/activity-cards');
for (const file of ['ActivityCard.tsx', 'ActivityCardFeedBand.tsx', 'index.ts']) {
  assert(fs.existsSync(path.join(uiRoot, file)), `${file} exists`);
}

console.log('\nForbidden signals');
assert(
  FORBIDDEN_ACTIVITY_CARD_SIGNALS.includes('gamification.hcp_points'),
  'HCP forbidden',
);

const eligibility = evaluateActivityCardTypeEligibility(
  'UPLOAD_FIRST_LISTING',
  baseInput,
);
assert(eligibility.eligible, 'evaluateActivityCardTypeEligibility');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
