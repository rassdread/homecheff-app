/**
 * Gate F → main integration: pay-gate helpers for expired / mismatched reservations.
 * Server checkout still owns expireStaleBookingRequests + booking status checks;
 * these helpers must stay aligned with that client/server contract.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkoutCanPayAcceptedBooking,
  namedCheckoutAvailable,
  shouldApplyMatchGeneration,
} from '@/lib/delivery/checkout-courier-consistency';
import { unpaidHoldExpiredWhere } from '@/lib/products/courier-stock-hold';

describe('expired or unavailable courier reservation cannot pay', () => {
  it('blocks ACCEPTED after payment window elapses', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'ACCEPTED', paymentRemainingMs: 0 }),
      false,
    );
  });

  it('blocks AUTO_CONFIRMED with null remaining window', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'AUTO_CONFIRMED', paymentRemainingMs: null }),
      false,
    );
  });

  it('blocks PENDING even with remaining ms', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'PENDING', paymentRemainingMs: 120_000 }),
      false,
    );
  });

  it('blocks EXPIRED status via non-accepted status', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'EXPIRED', paymentRemainingMs: 120_000 }),
      false,
    );
  });
});

describe('named checkout availability stays consistent with match', () => {
  it('keeps option closed when open match is empty', () => {
    assert.equal(
      namedCheckoutAvailable({
        namedSelection: true,
        regionalAvailable: true,
        match: { kind: 'list', count: 0 },
        acceptedPayable: false,
        selectionOpen: true,
      }),
      false,
    );
  });

  it('allows reopen after empty match once selection is closed', () => {
    assert.equal(
      namedCheckoutAvailable({
        namedSelection: true,
        regionalAvailable: true,
        match: { kind: 'list', count: 0 },
        acceptedPayable: false,
        selectionOpen: false,
      }),
      true,
    );
  });

  it('keeps accepted payable booking available regardless of empty match', () => {
    assert.equal(
      namedCheckoutAvailable({
        namedSelection: true,
        regionalAvailable: false,
        match: { kind: 'list', count: 0 },
        acceptedPayable: true,
        selectionOpen: true,
      }),
      true,
    );
  });
});

describe('stale match responses cannot overwrite newer courier lists', () => {
  it('drops older generation', () => {
    assert.equal(shouldApplyMatchGeneration(3, 5), false);
    assert.equal(shouldApplyMatchGeneration(5, 5), true);
  });
});

describe('unpaid hold expiry predicate remains fail-closed', () => {
  it('includes paymentDeadline branch', () => {
    const now = new Date('2026-11-03T19:00:00.000Z');
    const where = unpaidHoldExpiredWhere(now);
    assert.equal(where.status, 'PENDING');
    assert.ok(Array.isArray(where.OR));
    assert.ok(where.OR.some((clause: { paymentDeadline?: { lt: Date } }) => clause.paymentDeadline?.lt instanceof Date));
  });
});

/** Mirrors app/api/checkout named-provider booking gates (status + profile match). */
function checkoutAllowsNamedBooking(input: {
  bookingStatus: string;
  bookingProfileId: string;
  selectedProviderId: string;
  paymentRemainingMs: number | null;
}) {
  if (input.bookingProfileId !== input.selectedProviderId) return false;
  return checkoutCanPayAcceptedBooking({
    status: input.bookingStatus,
    paymentRemainingMs: input.paymentRemainingMs,
  });
}

describe('mismatched or consumed courier reservation cannot checkout', () => {
  it('rejects provider mismatch even when ACCEPTED and payable', () => {
    assert.equal(
      checkoutAllowsNamedBooking({
        bookingStatus: 'ACCEPTED',
        bookingProfileId: 'courier-a',
        selectedProviderId: 'courier-b',
        paymentRemainingMs: 60_000,
      }),
      false,
    );
  });

  it('rejects CONSUMED booking (already paid / assigned)', () => {
    assert.equal(
      checkoutAllowsNamedBooking({
        bookingStatus: 'CONSUMED',
        bookingProfileId: 'courier-a',
        selectedProviderId: 'courier-a',
        paymentRemainingMs: 60_000,
      }),
      false,
    );
  });

  it('allows matching ACCEPTED booking inside payment window', () => {
    assert.equal(
      checkoutAllowsNamedBooking({
        bookingStatus: 'ACCEPTED',
        bookingProfileId: 'courier-a',
        selectedProviderId: 'courier-a',
        paymentRemainingMs: 60_000,
      }),
      true,
    );
  });
});
