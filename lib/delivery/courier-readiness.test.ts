import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCourierReadiness } from './courier-readiness';
import { classifyCourierStripeIdentity } from './courier-identity';
import { paidIdentityDenial } from './courier-paid-identity';
import { assertDelivererCanAccept, assertCommercialCourierCanReceivePayout } from './delivery-eligibility';

const adult = {
  id: 'p1',
  userId: 'u1',
  isVerified: true,
  isActive: true,
  isBlocked: false,
  age: 30,
  user: { dateOfBirth: new Date('1990-01-01T00:00:00Z') },
};

describe('courier readiness stages', () => {
  it('keeps a registered user without a profile off assignment', () => {
    const stage = resolveCourierReadiness({ hasProfile: false });
    assert.equal(stage.stage, 'REGISTERED');
    assert.equal(stage.canAcceptAssignments, false);
  });

  it('blocks underage, incomplete, and suspended couriers', () => {
    assert.equal(
      resolveCourierReadiness({
        hasProfile: true,
        profileComplete: true,
        ageEligible: false,
        isActive: true,
      }).stage,
      'VERIFICATION_PENDING',
    );
    const underage = assertDelivererCanAccept(
      { ...adult, user: { dateOfBirth: new Date('2015-01-01T00:00:00Z') } },
      { dateOfBirth: new Date('2015-01-01T00:00:00Z'), now: new Date('2026-10-24T00:00:00Z') },
    );
    assert.equal(underage.ok, false);
    if (!underage.ok) assert.equal(underage.code, 'DELIVERY_UNDERAGE');

    const suspended = assertCommercialCourierCanReceivePayout({
      profile: { ...adult, isBlocked: true },
      dateOfBirth: adult.user.dateOfBirth,
    });
    assert.equal(suspended.ok, false);
    assert.equal(
      resolveCourierReadiness({
        hasProfile: true,
        isBlocked: true,
        profileComplete: true,
        ageEligible: true,
        isActive: true,
        transfersActive: true,
        payoutsEnabled: true,
      }).stage,
      'SUSPENDED',
    );
  });

  it('separates assignment, transfer, and external payout', () => {
    assert.equal(
      resolveCourierReadiness({
        hasProfile: true,
        profileComplete: true,
        ageEligible: true,
        isActive: true,
      }).stage,
      'ELIGIBLE_TO_ACCEPT',
    );
    assert.equal(
      resolveCourierReadiness({
        hasProfile: true,
        profileComplete: true,
        ageEligible: true,
        isActive: true,
        transfersActive: true,
        payoutsEnabled: false,
      }).canReceiveExternalPayout,
      false,
    );
    const ready = resolveCourierReadiness({
      hasProfile: true,
      profileComplete: true,
      ageEligible: true,
      isActive: true,
      transfersActive: true,
      payoutsEnabled: true,
    });
    assert.equal(ready.stage, 'ELIGIBLE_FOR_EXTERNAL_PAYOUT');
    assert.equal(ready.identitySource, 'STRIPE_CONNECT');
    assert.equal(assertDelivererCanAccept(adult, { dateOfBirth: adult.user.dateOfBirth }).ok, true);
    const restricted = resolveCourierReadiness({
      hasProfile: true,
      profileComplete: true,
      ageEligible: true,
      isActive: true,
      transfersActive: true,
      payoutsEnabled: true,
      stripeIdentity: 'RESTRICTED',
    });
    assert.equal(restricted.canAcceptAssignments, true);
    assert.equal(restricted.canReceiveTransfer, false);
    assert.equal(restricted.canReceiveExternalPayout, false);
  });

  it('does not let a caller-supplied age or Stripe verified status bypass the server gate', () => {
    const underage = assertDelivererCanAccept(
      { ...adult, age: 30, user: { dateOfBirth: new Date('2015-01-01T00:00:00Z') } },
      { dateOfBirth: new Date('2015-01-01T00:00:00Z'), now: new Date('2026-10-24T00:00:00Z') },
    );
    assert.equal(underage.ok, false);
    if (!underage.ok) assert.equal(underage.code, 'DELIVERY_UNDERAGE');

    const incomplete = assertDelivererCanAccept(
      { ...adult, isVerified: false },
      { dateOfBirth: adult.user.dateOfBirth, now: new Date('2026-10-24T00:00:00Z') },
    );
    assert.equal(incomplete.ok, false);
    if (!incomplete.ok) assert.equal(incomplete.code, 'DELIVERY_NOT_VERIFIED');

    const identity = classifyCourierStripeIdentity({
      id: 'acct_123',
      payouts_enabled: true,
      individual: { verification: { status: 'verified' } },
    });
    assert.equal(identity.state, 'VERIFIED');
    assert.equal(identity.governmentDocumentStoredByHomeCheff, false);
    assert.equal(identity.explicitDocumentVerified, false);
    const payoutsOnly = paidIdentityDenial({
      state: 'NOT_STARTED',
      checkedAt: new Date('2026-10-26T12:00:00Z'),
      now: new Date('2026-10-26T12:00:00Z'),
    });
    assert.equal(payoutsOnly.ok, false);
    const verifiedWithoutTransfers = resolveCourierReadiness({
      hasProfile: true,
      profileComplete: true,
      ageEligible: true,
      isActive: true,
      transfersActive: false,
      payoutsEnabled: true,
    });
    assert.equal(verifiedWithoutTransfers.canReceiveTransfer, false);
    assert.equal(verifiedWithoutTransfers.canReceiveExternalPayout, false);
  });
});
