/**
 * NL 13–17 marketplace eligibility.
 * Run: npx tsx --test lib/age/nl-minor-eligibility.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { calendarDateToStoredUtc, calendarYmdInTimeZone } from '@/lib/delivery/delivery-age';
import { resolveAgeFromDob } from '@/lib/age/age-band';
import {
  evaluateMarketplaceEligibility,
  isCategoryCertifiedForMinors,
  LEGACY_SELLER_WITHOUT_DOB_CUTOFF,
} from '@/lib/age/marketplace-eligibility';
import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';
import { registrationDobFromBody } from '@/lib/age/registration-dob';
import {
  coarsenPublicCoordinate,
  redactMinorPublicListing,
  requiresMinorPublicPrivacy,
} from '@/lib/age/minor-privacy';
import { canonicalDobToStripeParts } from '@/lib/stripe/particular-dob';
import { deriveConnectAccountStatusFromStripe } from '@/lib/stripe/connect-account-status';
import type Stripe from 'stripe';

const NOW = new Date('2026-09-27T12:00:00+02:00');

function dobAged(years: number, dayOffset = 0): Date {
  const today = calendarYmdInTimeZone(NOW, 'Europe/Amsterdam');
  const stored = calendarDateToStoredUtc({
    year: today.year - years,
    month: today.month,
    day: today.day,
  });
  if (dayOffset === 0) return stored;
  return new Date(stored.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function minor(years: number, consent = true) {
  return evaluateMarketplaceEligibility({
    now: NOW,
    subject: { dateOfBirth: dobAged(years), country: 'NL' },
    activity: 'LIST_PRODUCT',
    category: 'GROW',
    parentalConsentActive: consent,
  });
}

describe('age bands and birthdays', () => {
  it('age 12, 13, 15, 16, 17, 18', () => {
    const bandOf = (dob: Date) => {
      const resolved = resolveAgeFromDob(dob, NOW);
      if (!resolved.ok) throw new Error(resolved.reason);
      return resolved.band;
    };
    assert.equal(bandOf(dobAged(12)), 'UNDER_13');
    assert.equal(bandOf(dobAged(13)), 'AGE_13_15');
    assert.equal(bandOf(dobAged(15)), 'AGE_13_15');
    assert.equal(bandOf(dobAged(16)), 'AGE_16_17');
    assert.equal(bandOf(dobAged(17)), 'AGE_16_17');
    assert.equal(bandOf(dobAged(18)), 'AGE_18_PLUS');
  });

  it('birthday is counted on the civil day and not the day before', () => {
    const turns13Tomorrow = dobAged(13, 1);
    const onBirthday = dobAged(13, 0);
    const bandOf = (dob: Date) => {
      const resolved = resolveAgeFromDob(dob, NOW);
      if (!resolved.ok) throw new Error(resolved.reason);
      return resolved.band;
    };
    assert.equal(bandOf(turns13Tomorrow), 'UNDER_13');
    assert.equal(bandOf(onBirthday), 'AGE_13_15');
    assert.equal(bandOf(dobAged(18, 1)), 'AGE_16_17');
    assert.equal(bandOf(dobAged(18, 0)), 'AGE_18_PLUS');
  });
});

describe('server eligibility does not trust a client adult flag', () => {
  it('age 12 cannot register, sell, or start Stripe', () => {
    const subject = { dateOfBirth: dobAged(12), country: 'NL' };
    for (const activity of ['REGISTER', 'LIST_PRODUCT', 'STRIPE_ONBOARDING', 'RECEIVE_ORDERS'] as const) {
      const decision = evaluateMarketplaceEligibility({
        now: NOW,
        subject,
        activity,
        category: 'GROW',
        parentalConsentActive: true,
      });
      assert.equal(decision.allowed, false, activity);
      assert.equal(decision.code, 'UNDER_13');
    }
    const today = calendarYmdInTimeZone(new Date(), 'Europe/Amsterdam');
    const under13Iso = `${today.year - 12}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
    const spoofed = registrationDobFromBody({ dateOfBirth: under13Iso });
    assert.equal(spoofed.ok, false);
    if (!spoofed.ok) assert.equal(spoofed.code, 'UNDER_13');
  });

  it('missing DOB blocks a new seller and Stripe account', () => {
    const decision = evaluateMarketplaceEligibility({
      subject: { country: 'NL' },
      activity: 'STRIPE_ONBOARDING',
      parentalConsentActive: true,
    });
    assert.equal(decision.code, 'DOB_REQUIRED');
    assert.equal(decision.allowed, false);
  });

  it('a new profile without a DOB cannot sell, including after Google signup', () => {
    const afterCutoff = new Date(LEGACY_SELLER_WITHOUT_DOB_CUTOFF.getTime() + 60_000);
    for (const activity of ['LIST_PRODUCT', 'STRIPE_ONBOARDING', 'RECEIVE_ORDERS'] as const) {
      const decision = evaluateMarketplaceEligibility({
        now: NOW,
        subject: {
          country: 'NL',
          hasSellerProfile: true,
          createdAt: afterCutoff,
        },
        activity,
        category: 'GROW',
        parentalConsentActive: true,
        stripePayoutReady: true,
      });
      assert.equal(decision.code, 'DOB_REQUIRED', activity);
      assert.equal(decision.allowed, false);
    }
  });

  it('a seller profile from before the DOB rule stays on the adult path', () => {
    const decision = evaluateMarketplaceEligibility({
      now: NOW,
      subject: {
        country: 'NL',
        hasSellerProfile: true,
        createdAt: new Date(LEGACY_SELLER_WITHOUT_DOB_CUTOFF.getTime() - 60_000),
      },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
    });
    assert.equal(decision.mode, 'LEGACY_ADULT');
    assert.equal(decision.allowed, true);
  });

  it('existing Stripe sellers without a DOB stay on the adult path', () => {
    const decision = evaluateMarketplaceEligibility({
      subject: { stripeConnectAccountId: 'acct_existing', country: 'NL' },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
    });
    assert.equal(decision.mode, 'LEGACY_ADULT');
    assert.equal(decision.allowed, true);
  });
});

describe('NL minors 13–17', () => {
  it('can sell a certified category with HomeCheff consent and a real DOB', () => {
    for (const age of [13, 15, 16, 17]) {
      const decision = minor(age, true);
      assert.equal(decision.allowed, true, String(age));
      assert.equal(decision.mode, 'MINOR');
    }
  });

  it('does not invent a guardian requirement when consent is recorded', () => {
    const decision = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(16), country: 'NL' },
      activity: 'STRIPE_ONBOARDING',
      connectTrack: 'PARTICULAR',
      parentalConsentActive: true,
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.code, 'OK');
  });

  it('requires HomeCheff consent before Stripe and blocks business accounts', () => {
    const noConsent = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(16), country: 'NL' },
      activity: 'STRIPE_ONBOARDING',
      connectTrack: 'PARTICULAR',
      parentalConsentActive: false,
    });
    assert.equal(noConsent.code, 'CONSENT_REQUIRED');
    const business = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(16), country: 'NL' },
      activity: 'STRIPE_ONBOARDING',
      connectTrack: 'BUSINESS',
      parentalConsentActive: true,
    });
    assert.equal(business.code, 'BUSINESS_18_PLUS');
  });

  it('fails closed for uncertified categories and keeps delivery and affiliate at 18+', () => {
    assert.equal(isCategoryCertifiedForMinors('CHEFF'), false);
    assert.equal(isCategoryCertifiedForMinors('CREATE'), false);
    assert.equal(isCategoryCertifiedForMinors('PRACTICAL_SERVICE'), false);
    assert.equal(isCategoryCertifiedForMinors('KNOWLEDGE'), false);
    assert.equal(isCategoryCertifiedForMinors('UNKNOWN_CATEGORY'), false);
    const food = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(17), country: 'NL' },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
      parentalConsentActive: true,
    });
    assert.equal(food.code, 'CATEGORY_NOT_CERTIFIED');
    const delivery = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(17), country: 'NL' },
      activity: 'DELIVERY',
      parentalConsentActive: true,
    });
    assert.equal(delivery.allowed, false);
    assert.equal(delivery.code, 'DELIVERY_18_PLUS');
    const affiliate = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(17), country: 'NL' },
      activity: 'AFFILIATE',
    });
    assert.equal(affiliate.allowed, false);
  });

  it('age 18 keeps adult category and delivery access', () => {
    const list = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(18), country: 'NL' },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
    });
    assert.equal(list.allowed, true);
    assert.equal(list.mode, 'ADULT');
    const delivery = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(18), country: 'NL' },
      activity: 'DELIVERY',
    });
    assert.equal(delivery.allowed, true);
  });

  it('does not mark payouts ready unless Stripe says so', () => {
    const notReady = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(16), country: 'NL' },
      activity: 'PAYOUTS',
      parentalConsentActive: true,
      stripePayoutReady: false,
    });
    assert.equal(notReady.allowed, false);
    const ready = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(16), country: 'NL' },
      activity: 'PAYOUTS',
      parentalConsentActive: true,
      stripePayoutReady: true,
    });
    assert.equal(ready.allowed, true);
  });

  it('requires both parental consent and Stripe readiness before a paid order', () => {
    const subject = { dateOfBirth: dobAged(16), country: 'NL' };
    const order = (consent: boolean, stripe: boolean) =>
      evaluateMarketplaceEligibility({
        now: NOW,
        subject,
        activity: 'RECEIVE_ORDERS',
        category: 'GROW',
        parentalConsentActive: consent,
        stripePayoutReady: stripe,
      });
    assert.equal(order(false, false).code, 'CONSENT_REQUIRED');
    assert.equal(order(true, false).code, 'STRIPE_NOT_READY');
    assert.equal(order(false, true).code, 'CONSENT_REQUIRED');
    assert.equal(order(true, true).allowed, true);
    const adult = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth: dobAged(18), country: 'NL' },
      activity: 'RECEIVE_ORDERS',
      category: 'CHEFF',
      stripePayoutReady: false,
    });
    assert.equal(adult.allowed, true);
    assert.equal(adult.mode, 'ADULT');
  });

  it('keeps delivery closed under 18 even when consent and Stripe are ready', () => {
    for (const age of [13, 15, 16, 17]) {
      const decision = evaluateMarketplaceEligibility({
        now: NOW,
        subject: { dateOfBirth: dobAged(age), country: 'NL' },
        activity: 'DELIVERY',
        parentalConsentActive: true,
        stripePayoutReady: true,
      });
      assert.equal(decision.code, 'DELIVERY_18_PLUS', String(age));
      assert.equal(
        isCommerciallyMatchableDeliverer({
          isActive: true,
          isVerified: true,
          dateOfBirth: dobAged(age),
          now: NOW,
          ageGateEnabled: true,
        }),
        false,
      );
    }
    assert.equal(
      isCommerciallyMatchableDeliverer({
        isActive: true,
        isVerified: false,
        dateOfBirth: dobAged(18),
        now: NOW,
        ageGateEnabled: true,
      }),
      false,
    );
  });

  it('keeps the same account when a 17-year-old turns 18', () => {
    const stripeConnectAccountId = 'acct_same_person';
    const dateOfBirth = dobAged(18, 1);
    const before = evaluateMarketplaceEligibility({
      now: NOW,
      subject: { dateOfBirth, country: 'NL', stripeConnectAccountId },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
      parentalConsentActive: false,
    });
    assert.equal(before.mode, 'MINOR');
    assert.equal(before.code, 'CONSENT_REQUIRED');
    const onBirthday = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    const after = evaluateMarketplaceEligibility({
      now: onBirthday,
      subject: { dateOfBirth, country: 'NL', stripeConnectAccountId },
      activity: 'LIST_PRODUCT',
      category: 'CHEFF',
      parentalConsentActive: false,
    });
    assert.equal(after.mode, 'ADULT');
    assert.equal(after.allowed, true);
    assert.equal(after.ageYears, 18);
    const delivery = evaluateMarketplaceEligibility({
      now: onBirthday,
      subject: { dateOfBirth, stripeConnectAccountId },
      activity: 'DELIVERY',
    });
    assert.equal(delivery.allowed, true);
  });
});

describe('privacy and Stripe DOB propagation', () => {
  it('hides a minor DOB, exact pickup address and precise coordinates', () => {
    const dob = dobAged(15);
    assert.equal(requiresMinorPublicPrivacy({ dateOfBirth: dob }, NOW), true);
    assert.equal(requiresMinorPublicPrivacy({ dateOfBirth: dobAged(30) }, NOW), false);
    const redacted = redactMinorPublicListing(
      {
        pickupAddress: 'Straat 1, 1234 AB',
        pickupLat: 52.123456,
        pickupLng: 4.987654,
        location: { lat: 52.123456, lng: 4.987654, place: 'Utrecht' },
        seller: { name: 'Voornaam Achternaam', username: 'maker', email: 'a@b.c' },
      },
      { dateOfBirth: dob },
      NOW,
    );
    assert.equal(redacted.pickupAddress, null);
    assert.equal(redacted.pickupLat, null);
    assert.equal((redacted.location as { lat: number }).lat, coarsenPublicCoordinate(52.123456));
    assert.equal((redacted.seller as { email?: string }).email, undefined);
    assert.equal((redacted.seller as { name: string }).name, 'maker');
  });

  it('sends the canonical civil DOB and does not create a guardian person', () => {
    const parts = canonicalDobToStripeParts(dobAged(16));
    const ymd = calendarYmdInTimeZone(dobAged(16), 'UTC');
    assert.deepEqual(parts, { day: ymd.day, month: ymd.month, year: ymd.year });
    const root = path.join(__dirname, '../..');
    const dobSource = fs.readFileSync(path.join(root, 'lib/stripe/particular-dob.ts'), 'utf8');
    const eligibility = fs.readFileSync(path.join(root, 'lib/age/marketplace-eligibility.ts'), 'utf8');
    assert.equal(dobSource.includes('legal_guardian'), false);
    assert.equal(dobSource.includes('persons.create'), false);
    assert.equal(eligibility.includes('legal_guardian'), false);
  });

  it('routes a future Stripe guardian requirement back into remediation', () => {
    const account = {
      id: 'acct_test',
      object: 'account',
      details_submitted: true,
      charges_enabled: false,
      payouts_enabled: false,
      requirements: {
        currently_due: ['legal_guardian.verification.document'],
        past_due: [],
        pending_verification: [],
        eventually_due: [],
        disabled_reason: null,
      },
    } as unknown as Stripe.Account;
    const status = deriveConnectAccountStatusFromStripe(account, { connectTrack: 'PARTICULAR' });
    assert.equal(status.uiStatus, 'ACTION_REQUIRED');
    assert.equal(status.canCreateOnboardingLink, true);
    assert.equal(status.paymentReady, false);
    assert.ok(status.missingCategories.includes('identity'));
    assert.equal(status.currentlyDue.includes('legal_guardian.verification.document'), true);
  });
});
