import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DELIVERY_ONBOARDING_CANONICAL_HREF,
  DELIVERY_PROFILE_EDITOR_HREF,
  evaluateDeliveryProfileCompletion,
  isDeliveryProfileComplete,
} from '@/lib/delivery/delivery-profile-completion';
import { ACTIVITY_CARD_TYPE_REGISTRY } from '@/lib/discovery/activity-cards/activity-card-type-registry';
import { ACTIVITY_CARD_REGISTRY } from '@/lib/discovery/activity-cards/activity-card-taxonomy';
import { buildUserActionItems } from '@/lib/user/user-action-center';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';

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

  it('shows Bezorgprofiel afronden → /delivery/settings when activation incomplete', () => {
    const items = buildUserActionItems({
      ...base,
      deliveryProfile: {
        id: 'dp1',
        isVerified: false,
        activationComplete: false,
        activationMessage: 'Stel je werkgebied in (locatie + straal).',
      },
    });

    const incomplete = items.find((i) => i.id === 'delivery-profile-incomplete');
    assert.ok(incomplete);
    assert.equal(incomplete?.actionLabel, 'Bezorgprofiel afronden');
    assert.equal(incomplete?.actionHref, '/delivery/settings');
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
});
