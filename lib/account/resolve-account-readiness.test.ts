/**
 * Unit tests for account readiness facade + stripe/delivery decoupling.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mapDeliveryProfileToLane,
  mapStripeSnapshotToLane,
  resolveAccountReadiness,
} from './resolve-account-readiness';
import type { ConnectAccountStatusSnapshot } from '@/lib/stripe/connect-account-status';

const emptySnap = (over: Partial<ConnectAccountStatusSnapshot>): ConnectAccountStatusSnapshot =>
  ({
    uiStatus: 'NOT_STARTED',
    paymentReady: false,
    payoutReady: false,
    hasAccount: false,
    accountId: null,
    connectTrack: null,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    transfersCapability: null,
    cardPaymentsCapability: null,
    currentlyDueCount: 0,
    pastDueCount: 0,
    pendingVerificationCount: 0,
    eventuallyDueCount: 0,
    currentlyDue: [],
    pastDue: [],
    pendingVerificationKeys: [],
    disabledReason: null,
    missingCategories: [],
    canCreateOnboardingLink: true,
    actionRequired: false,
    isPendingVerification: false,
    onboardingCompleted: false,
    ...over,
  }) as ConnectAccountStatusSnapshot;

describe('resolveAccountReadiness', () => {
  it('PENDING_VERIFICATION never shows Gegevens afronden CTA', () => {
    const lane = mapStripeSnapshotToLane(
      emptySnap({
        uiStatus: 'PENDING_VERIFICATION',
        hasAccount: true,
        canCreateOnboardingLink: false,
        detailsSubmitted: true,
      }),
    );
    assert.equal(lane.state, 'WAITING_FOR_STRIPE');
    assert.equal(lane.ctaLabelNl, null);
    assert.equal(lane.showActionWarning, false);
    assert.match(lane.bodyNl || '', /controleert/i);
  });

  it('PAYMENT_READY shows no stripe warning', () => {
    const lane = mapStripeSnapshotToLane(
      emptySnap({
        uiStatus: 'PAYMENT_READY',
        paymentReady: true,
        hasAccount: true,
        canCreateOnboardingLink: false,
      }),
    );
    assert.equal(lane.state, 'READY');
    assert.equal(lane.showActionWarning, false);
  });

  it('delivery incomplete pricing is independent of stripe ready', () => {
    const result = resolveAccountReadiness({
      user: {
        emailVerified: new Date(),
        username: 'x',
        termsAccepted: true,
        passwordHash: 'x',
        Account: [{ provider: 'credentials' }],
      },
      stripeSnapshot: emptySnap({
        uiStatus: 'PAYMENT_READY',
        paymentReady: true,
        hasAccount: true,
        canCreateOnboardingLink: false,
      }),
      hasDeliveryProfile: true,
      deliveryProfile: {
        providerType: 'PARTICULAR',
        isActive: false,
        isOnline: false,
        homeLat: 51.9,
        homeLng: 4.3,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: false,
        baseFeeCents: null,
        pricePerKmCents: null,
        minimumFeeCents: null,
        freeDeliveryRadiusKm: null,
        companyDisplayName: null,
      },
    });
    assert.equal(result.stripe.state, 'READY');
    assert.equal(result.stripe.showActionWarning, false);
    assert.equal(result.delivery.state, 'ACTION_REQUIRED');
    assert.equal(result.delivery.showActionWarning, true);
    assert.match(result.delivery.bodyNl || '', /[Pp]rijzen|[Tt]arief/);
  });

  it('delivery complete + stripe incomplete → only stripe warning', () => {
    const result = resolveAccountReadiness({
      user: {
        emailVerified: new Date(),
        username: 'x',
        termsAccepted: true,
        passwordHash: 'x',
        Account: [{ provider: 'credentials' }],
      },
      stripeSnapshot: emptySnap({
        uiStatus: 'INCOMPLETE',
        hasAccount: true,
        canCreateOnboardingLink: true,
      }),
      hasDeliveryProfile: true,
      deliveryProfile: {
        providerType: 'PARTICULAR',
        isActive: true,
        isOnline: true,
        homeLat: 51.9,
        homeLng: 4.3,
        maxDistance: 10,
        nationalCoverage: false,
        pricingEnabled: true,
        baseFeeCents: 250,
        pricePerKmCents: 75,
        minimumFeeCents: 250,
        freeDeliveryRadiusKm: 0,
        companyDisplayName: null,
      },
    });
    assert.equal(result.delivery.state, 'READY');
    assert.equal(result.delivery.showActionWarning, false);
    assert.equal(result.stripe.showActionWarning, true);
  });

  it('mapDeliveryProfileToLane NOT_APPLICABLE without profile', () => {
    const lane = mapDeliveryProfileToLane(null);
    assert.equal(lane.state, 'NOT_APPLICABLE');
    assert.equal(lane.showActionWarning, false);
  });
});
