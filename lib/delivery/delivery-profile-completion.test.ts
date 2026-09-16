import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DELIVERY_ONBOARDING_CANONICAL_HREF,
  DELIVERY_PROFILE_EDITOR_HREF,
  evaluateDeliveryProfileCompletion,
  getDeliveryProfileCompletion,
  getDeliveryProfileCompletionFromRow,
  isDeliveryProfileComplete,
} from '@/lib/delivery/delivery-profile-completion';
import { ACTIVITY_CARD_TYPE_REGISTRY } from '@/lib/discovery/activity-cards/activity-card-type-registry';
import { ACTIVITY_CARD_REGISTRY } from '@/lib/discovery/activity-cards/activity-card-taxonomy';
import { buildUserActionItems } from '@/lib/user/user-action-center';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';

const adultDob = new Date(Date.UTC(1990, 5, 15, 12, 0, 0));

const incompleteProfile = {
  providerType: 'INDEPENDENT',
  isActive: false,
  isOnline: false,
  homeLat: null,
  homeLng: null,
  maxDistance: null,
  nationalCoverage: false,
  pricingEnabled: false,
  baseFeeCents: null,
  pricePerKmCents: null,
  minimumFeeCents: null,
  freeDeliveryRadiusKm: null,
  companyDisplayName: null,
  dateOfBirth: adultDob,
};

const completeProfile = {
  providerType: 'INDEPENDENT',
  isActive: true,
  isOnline: false,
  homeLat: 51.91,
  homeLng: 4.34,
  maxDistance: 10,
  nationalCoverage: false,
  pricingEnabled: true,
  baseFeeCents: 350,
  pricePerKmCents: 80,
  minimumFeeCents: 495,
  freeDeliveryRadiusKm: 0,
  companyDisplayName: null,
  availableDays: ['maandag', 'dinsdag'],
  availableTimeSlots: ['morning', 'afternoon'],
  workStartTime: '09:00',
  workEndTime: '21:00',
  dateOfBirth: adultDob,
};

describe('delivery profile completion source of truth', () => {
  it('marks incomplete profiles as not complete', () => {
    const r = evaluateDeliveryProfileCompletion(incompleteProfile);
    assert.equal(r.isComplete, false);
    assert.equal(isDeliveryProfileComplete(incompleteProfile), false);
    if (!r.ok) {
      assert.ok(r.missing.includes('serviceArea'));
    }
  });

  it('marks complete profiles as complete without Stripe', () => {
    const r = evaluateDeliveryProfileCompletion(completeProfile);
    assert.equal(r.isComplete, true);
    assert.equal(r.ok, true);
  });

  it('requires availability even when area and pricing are set', () => {
    const r = evaluateDeliveryProfileCompletion({
      ...completeProfile,
      availableDays: [],
      availableTimeSlots: [],
      workStartTime: null,
      workEndTime: null,
    });
    assert.equal(r.isComplete, false);
    if (!r.ok) {
      assert.ok(r.missing.includes('availability'));
    }
  });

  it('treats User lat/lng as service-area fallback until home* is persisted', () => {
    const r = getDeliveryProfileCompletionFromRow(
      {
        ...completeProfile,
        homeLat: null,
        homeLng: null,
      },
      { lat: 51.91, lng: 4.34, place: 'Vlaardingen', dateOfBirth: adultDob },
    );
    assert.equal(r.isComplete, true);
  });

  it('getDeliveryProfileCompletion matches evaluateDeliveryProfileCompletion', () => {
    assert.equal(
      getDeliveryProfileCompletion(completeProfile).isComplete,
      evaluateDeliveryProfileCompletion(completeProfile).isComplete,
    );
  });

  it('blocks complete operational profile when DOB is missing', () => {
    const r = evaluateDeliveryProfileCompletion({
      ...completeProfile,
      dateOfBirth: null,
    });
    assert.equal(r.isComplete, false);
    if (!r.ok) {
      assert.ok(r.missing.includes('dateOfBirth'));
      assert.match(r.message, /leeftijd/i);
    }
  });

  it('does not treat a known under-18 DOB as missing DOB', () => {
    const r = evaluateDeliveryProfileCompletion({
      ...completeProfile,
      dateOfBirth: new Date(Date.UTC(2010, 0, 1, 12, 0, 0)),
    });
    assert.equal(r.isComplete, false);
    if (!r.ok) {
      assert.ok(r.missing.includes('under18'));
      assert.equal(r.missing.includes('dateOfBirth'), false);
      assert.match(r.message, /18 jaar/i);
    }
  });

  it('keeps 18+ complete when User.dateOfBirth is present even if a legacy profile age is absent', () => {
    const r = getDeliveryProfileCompletionFromRow(
      completeProfile,
      { lat: 51.91, lng: 4.34, place: 'Vlaardingen', dateOfBirth: adultDob },
    );
    assert.equal(r.isComplete, true);
    assert.equal(r.ok, true);
  });

  it('fails closed to UNKNOWN when the user location omits canonical DOB', () => {
    const r = getDeliveryProfileCompletionFromRow(completeProfile, {
      lat: 51.91,
      lng: 4.34,
      place: 'Vlaardingen',
      dateOfBirth: null,
    });
    assert.equal(r.isComplete, false);
    if (!r.ok) {
      assert.ok(r.missing.includes('dateOfBirth'));
    }
  });

  it('exposes canonical routes', () => {
    assert.equal(DELIVERY_ONBOARDING_CANONICAL_HREF, '/delivery/start');
    assert.equal(DELIVERY_PROFILE_EDITOR_HREF, '/delivery/settings');
  });
});

describe('delivery profile CTA targets', () => {
  it('BECOME_COURIER points at canonical start (not dead /delivery/onboarding)', () => {
    assert.equal(
      ACTIVITY_CARD_TYPE_REGISTRY.BECOME_COURIER.actionHref,
      '/delivery/start',
    );
    assert.notEqual(
      ACTIVITY_CARD_TYPE_REGISTRY.BECOME_COURIER.actionHref,
      '/delivery/onboarding',
    );
  });

  it('taxonomy complete_delivery_profile points at settings', () => {
    assert.equal(
      ACTIVITY_CARD_REGISTRY.complete_delivery_profile.ctaHref,
      '/delivery/settings',
    );
    assert.ok(
      ACTIVITY_CARD_REGISTRY.complete_delivery_profile.requiredTriggers.includes(
        'delivery_profile_incomplete',
      ),
    );
  });

  it('taxonomy offer_delivery points at start', () => {
    assert.equal(ACTIVITY_CARD_REGISTRY.offer_delivery.ctaHref, '/delivery/start');
  });
});

describe('action center delivery incomplete CTA', () => {
  const emptyStripe: SellerStripeSnapshot = {
    stripeConnectAccountId: null,
    stripeConnectOnboardingCompleted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  };

  const base = {
    user: {
      id: 'u1',
      name: 'Test',
      image: 'x',
      place: 'Rotterdam',
      lat: 51.9,
      lng: 4.4,
      emailVerified: new Date(),
      username: 'test',
      termsAccepted: true,
      passwordHash: 'x',
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
      Account: [],
    },
    roles: {
      hasSellerProfile: false,
      hasDeliveryProfile: true,
      hasAffiliate: false,
    },
    stripeSnapshot: emptyStripe,
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    affiliate: null,
    pendingHcpRewards: [],
  };

  it('shows exact missing delivery reason → /delivery/settings when activation incomplete', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: false,
        activationComplete: false,
        activationMessage: 'Stel je werkgebied in (locatie + straal).',
        providerType: 'INDEPENDENT',
        isActive: false,
        isOnline: false,
        homeLat: 51.91,
        homeLng: 4.34,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: false,
        baseFeeCents: null,
        pricePerKmCents: null,
        minimumFeeCents: null,
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '21:00',
        dateOfBirth: adultDob,
      },
    });

    const incomplete = items.find((i) => i.id === 'delivery-profile-incomplete');
    assert.ok(incomplete);
    assert.equal(incomplete?.title, 'Vul je bezorgtarief in voordat je bezorgopdrachten kunt aannemen.');
    assert.equal(incomplete?.actionLabel, 'Bezorgtarief instellen');
    assert.equal(incomplete?.actionHref, '/delivery/settings');
    assert.equal(/Bezorgprofiel afronden|Rond je bezorgprofiel af|Profiel bijwerken/.test(incomplete?.title || ''), false);
  });

  it('hides incomplete CTA when activation is complete and verified', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: true,
        activationComplete: true,
      },
    });

    assert.equal(
      items.some((i) => i.id === 'delivery-profile-incomplete'),
      false,
    );
    assert.equal(items.some((i) => i.id === 'delivery-verification'), false);
  });

  it('does not ask 18+ delivery users to confirm age when User.dateOfBirth is present', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: true,
        activationComplete: false,
        providerType: 'INDEPENDENT',
        isActive: true,
        isOnline: false,
        homeLat: 51.91,
        homeLng: 4.34,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: false,
        baseFeeCents: null,
        pricePerKmCents: null,
        minimumFeeCents: null,
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '21:00',
        dateOfBirth: adultDob,
        activationMissing: ['pricing'],
      },
    });
    const incomplete = items.find((i) => i.id === 'delivery-profile-incomplete');
    assert.ok(incomplete);
    assert.equal(incomplete?.actionLabel === 'Leeftijd bevestigen', false);
    assert.match(incomplete?.title || '', /tarief/i);
  });

  it('shows leeftijd bevestigen only when canonical DOB is unknown', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: false,
        activationComplete: false,
        providerType: 'INDEPENDENT',
        isActive: true,
        isOnline: false,
        homeLat: 51.91,
        homeLng: 4.34,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: true,
        baseFeeCents: 350,
        pricePerKmCents: 80,
        minimumFeeCents: 495,
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '21:00',
        dateOfBirth: null,
        activationMissing: ['dateOfBirth'],
      },
    });
    const incomplete = items.find((i) => i.id === 'delivery-profile-incomplete');
    assert.equal(incomplete?.title, 'Bevestig je leeftijd om te kunnen bezorgen.');
    assert.equal(incomplete?.actionLabel, 'Leeftijd bevestigen');
  });

  it('does not classify known under-18 as missing DOB on the feed', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: false,
        activationComplete: false,
        providerType: 'INDEPENDENT',
        isActive: true,
        isOnline: false,
        homeLat: 51.91,
        homeLng: 4.34,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: true,
        baseFeeCents: 350,
        pricePerKmCents: 80,
        minimumFeeCents: 495,
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '21:00',
        dateOfBirth: new Date(Date.UTC(2010, 0, 1, 12, 0, 0)),
        activationMissing: ['under18'],
      },
    });
    const incomplete = items.find((i) => i.id === 'delivery-profile-incomplete');
    assert.equal(
      incomplete?.title,
      'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar.',
    );
    assert.equal(incomplete?.actionLabel === 'Leeftijd bevestigen', false);
  });

  it('does not show a delivery age banner when the user has no delivery profile', () => {
    const items = buildUserActionItems({
      ...base,
      roles: {
        hasSellerProfile: false,
        hasDeliveryProfile: false,
        hasAffiliate: false,
      },
      deliveryProfile: null,
    });
    assert.equal(items.some((i) => i.actionLabel === 'Leeftijd bevestigen'), false);
    assert.equal(
      items.some((i) => /leeftijd om te kunnen bezorgen/i.test(i.title)),
      false,
    );
  });
});
