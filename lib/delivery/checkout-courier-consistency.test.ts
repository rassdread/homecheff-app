import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import {
  calculatePlatformFeeCents,
  calculateStripeFeeForBuyer,
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import {
  checkoutCanPayAcceptedBooking,
  checkoutBuyerReservationUi,
  checkoutLocalProviderPayAllowed,
  checkoutShouldPollBooking,
  courierBookingExpiredAt,
  courierBookingIsActionableRequest,
  courierDashboardKeepsBooking,
  deliveryFeeForCheckout,
  interpretMatchResponse,
  marketplaceSlotNotes,
  namedCheckoutAvailable,
  namedCheckoutCourierHeadline,
  readMarketplaceSlot,
  shouldApplyMatchGeneration,
} from '@/lib/delivery/checkout-courier-consistency';
import {
  courierAcceptanceRemainingMs,
  courierCheckoutKind,
  courierStatusCopy,
  courierSwitchMayContinue,
  formatCourierCountdown,
} from '@/lib/delivery/checkout-courier-status';
import { realCourierSlotStarts } from '@/lib/delivery/delivery-time-availability';
import { unpaidHoldExpiredWhere } from '@/lib/products/courier-stock-hold';

const tesPricing = {
  pricingEnabled: true,
  baseFeeCents: 250,
  pricePerKmCents: 76,
  minimumFeeCents: 250,
  freeDeliveryRadiusKm: 5,
  maxDistanceKm: 25,
  currency: 'EUR',
  nationalCoverage: false,
};

describe('named checkout does not contradict the courier list', () => {
  it('does not call one regional courier a selectable match when the order match is empty', () => {
    const regionalCount = 1;
    const headline = namedCheckoutCourierHeadline({
      namedSelection: true,
      selectionOpen: true,
      match: { kind: 'list', count: 0 },
    });
    assert.equal(regionalCount, 1);
    assert.equal(headline, null);
    const selector = readFileSync(
      new URL('../../components/checkout/DelivererSelector.tsx', import.meta.url),
      'utf8',
    );
    const emptyCopy =
      'Er is momenteel geen geschikte bezorger beschikbaar. Probeer het later opnieuw.';
    assert.equal(selector.includes(emptyCopy), true);
    assert.equal(selector.includes('1 bezorger'), false);
  });

  it('shows the order match count only after that response is applied', () => {
    assert.equal(
      namedCheckoutCourierHeadline({
        namedSelection: true,
        selectionOpen: true,
        match: { kind: 'list', count: 1 },
      }),
      '1 bezorger voor deze bestelling.',
    );
  });

  it('ignores a slower match response from an earlier request', () => {
    assert.equal(shouldApplyMatchGeneration(1, 2), false);
    assert.equal(shouldApplyMatchGeneration(2, 2), true);
  });

  it('treats a success body without an array as an error, not an empty list', () => {
    const interpreted = interpretMatchResponse({ success: true, matchedDeliverers: undefined });
    assert.equal(interpreted.kind, 'error');
  });

  it('keeps an empty array as an empty list with a reason', () => {
    const interpreted = interpretMatchResponse({
      success: true,
      matchedDeliverers: [],
      emptyReason: 'NONE_IN_RANGE',
    });
    assert.deepEqual(interpreted, { kind: 'list', count: 0, code: 'NONE_IN_RANGE' });
  });
});

describe('checkout uses the order match', () => {
  it('does not close the option from a regional miss while the order match is still loading', () => {
    assert.equal(
      namedCheckoutAvailable({
        namedSelection: true,
        regionalAvailable: false,
        match: { kind: 'pending' },
        acceptedPayable: false,
      }),
      true,
    );
  });

  it('closes the option when the order match is empty while open', () => {
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

  it('does not soft-lock the card after a stale empty match once closed', () => {
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

  it('keeps an accepted unpaid job visible without a stock hold', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');
    assert.equal(
      courierDashboardKeepsBooking({
        status: 'ACCEPTED',
        expiresAt: new Date('2026-11-01T11:00:00.000Z'),
        respondedAt: new Date('2026-11-01T11:40:00.000Z'),
        now,
        paymentWindowMs: 30 * 60 * 1000,
        hold: null,
      }),
      true,
    );
  });

  it('hides an accepted job after the payment deadline', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');
    assert.equal(
      courierDashboardKeepsBooking({
        status: 'ACCEPTED',
        expiresAt: new Date('2026-11-01T13:00:00.000Z'),
        respondedAt: now,
        now,
        paymentWindowMs: 30 * 60 * 1000,
        hold: {
          status: 'PENDING',
          paymentDeadline: new Date('2026-11-01T11:00:00.000Z'),
          expiresAt: new Date('2026-11-01T13:00:00.000Z'),
        },
      }),
      false,
    );
    assert.equal(
      courierBookingIsActionableRequest({
        status: 'ACCEPTED',
        expiresAt: new Date('2026-11-01T13:00:00.000Z'),
        respondedAt: now,
        now,
        paymentWindowMs: 30 * 60 * 1000,
        hold: {
          status: 'PENDING',
          paymentDeadline: new Date('2026-11-01T11:00:00.000Z'),
          expiresAt: new Date('2026-11-01T13:00:00.000Z'),
        },
      }),
      false,
    );
    assert.equal(
      courierBookingIsActionableRequest({
        status: 'CONSUMED',
        expiresAt: new Date('2026-11-01T13:00:00.000Z'),
        respondedAt: now,
        now,
        paymentWindowMs: 30 * 60 * 1000,
        hold: null,
      }),
      false,
    );
    const expiredAt = courierBookingExpiredAt({
      status: 'ACCEPTED',
      expiresAt: new Date('2026-11-01T13:00:00.000Z'),
      respondedAt: now,
      paymentWindowMs: 30 * 60 * 1000,
      hold: {
        status: 'PENDING',
        paymentDeadline: new Date('2026-11-01T11:00:00.000Z'),
        expiresAt: new Date('2026-11-01T13:00:00.000Z'),
      },
    });
    assert.equal(expiredAt?.toISOString(), '2026-11-01T11:00:00.000Z');
  });

  it('expires a hold when only the payment deadline has passed', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');
    const where = unpaidHoldExpiredWhere(now);
    assert.equal(where.status, 'PENDING');
    const paymentDeadlineClause = where.OR[1];
    assert.ok(paymentDeadlineClause && 'paymentDeadline' in paymentDeadlineClause);
    const paymentDeadline = paymentDeadlineClause.paymentDeadline;
    assert.ok(paymentDeadline);
    assert.equal(paymentDeadline.lt.getTime(), now.getTime());
  });

  it('offers a later scheduled window and does not invent one without a schedule', () => {
    const sundayMorning = new Date('2026-11-01T10:00:00.000Z');
    const scheduled = realCourierSlotStarts(
      {
        availableDays: ['maandag'],
        availableTimeSlots: ['18:00-21:00'],
      },
      sundayMorning,
    );
    assert.ok(scheduled.length > 0);
    const first = scheduled[0];
    assert.ok(first);
    assert.ok(first.getTime() > sundayMorning.getTime());
    assert.deepEqual(realCourierSlotStarts({}, sundayMorning), []);
  });

  it('stores the chosen slot without a standalone booking', () => {
    const notes = marketplaceSlotNotes('2026-11-02T17:00:00.000Z');
    assert.equal(readMarketplaceSlot(notes), '2026-11-02T17:00:00.000Z');
    assert.equal(readMarketplaceSlot('vrije tekst'), null);
  });
});

describe('accepted booking payment window', () => {
  it('refuses payment when the window has elapsed', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'ACCEPTED', paymentRemainingMs: 0 }),
      false,
    );
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'ACCEPTED', paymentRemainingMs: -132_000 }),
      false,
    );
  });

  it('allows payment only for an accepted booking that is still inside the window', () => {
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'ACCEPTED', paymentRemainingMs: 60_000 }),
      true,
    );
    assert.equal(
      checkoutCanPayAcceptedBooking({ status: 'PENDING', paymentRemainingMs: 60_000 }),
      false,
    );
  });
});

describe('checkout buyer reservation UI is exclusive', () => {
  it('never shows accepted and expired together when the hold lapsed', () => {
    const ui = checkoutBuyerReservationUi({
      bookingStatus: 'ACCEPTED',
      reservationPhase: 'AWAITING_PAYMENT',
      reservationRemainingMs: 0,
      paymentRemainingMs: 0,
    });
    assert.equal(ui.kind, 'expired');
  });

  it('shows only the payment message for a payable acceptance', () => {
    const ui = checkoutBuyerReservationUi({
      bookingStatus: 'ACCEPTED',
      reservationPhase: 'AWAITING_PAYMENT',
      reservationRemainingMs: 0,
      paymentRemainingMs: 120_000,
      acceptedSlotAt: '2026-11-04T18:00:00.000Z',
    });
    assert.equal(ui.kind, 'accepted');
    if (ui.kind === 'accepted') {
      assert.equal(ui.paymentRemainingMs, 120_000);
    }
  });

  it('blocks local-provider pay when the booking expired', () => {
    assert.equal(
      checkoutLocalProviderPayAllowed({
        selectedDelivery: 'local_provider',
        isLocalProvider: true,
        bookingStatus: 'EXPIRED',
        paymentRemainingMs: 0,
        bookingRequestId: 'book_1',
      }),
      false,
    );
    assert.equal(
      checkoutLocalProviderPayAllowed({
        selectedDelivery: 'local_provider',
        isLocalProvider: true,
        bookingStatus: 'ACCEPTED',
        paymentRemainingMs: 60_000,
        bookingRequestId: 'book_1',
      }),
      true,
    );
    assert.equal(
      checkoutLocalProviderPayAllowed({
        selectedDelivery: 'pickup',
        isLocalProvider: false,
        bookingStatus: null,
        paymentRemainingMs: null,
        bookingRequestId: null,
      }),
      true,
    );
  });

  it('keeps polling through the payment window', () => {
    assert.equal(checkoutShouldPollBooking('PENDING'), true);
    assert.equal(checkoutShouldPollBooking('ACCEPTED'), true);
    assert.equal(checkoutShouldPollBooking('EXPIRED'), false);
  });
});

describe('delivery price is the selected quote', () => {
  it('keeps the delivery line at zero until a courier quote exists', () => {
    assert.equal(deliveryFeeForCheckout(null), 0);
    const productOnly = calculateStripeFeeForBuyer(450);
    assert.equal(productOnly.buyerTotalCents, 482);
  });

  it('uses the 5.1 km provider quote and the existing fee split', () => {
    const quote = calculateProviderDeliveryPrice({
      pricing: tesPricing,
      routeDistanceKm: 5.1,
      pickupCountryCode: 'NL',
      providerCountryCode: 'NL',
      dropoffCountryCode: 'NL',
    });
    assert.equal(quote.ok, true);
    if (!quote.ok) return;
    assert.equal(quote.deliveryFeeCents, 258);
    assert.equal(deliveryFeeForCheckout(quote.deliveryFeeCents), 258);

    const productCents = 450;
    const subtotal = productCents + quote.deliveryFeeCents;
    const buyer = calculateStripeFeeForBuyer(subtotal);
    assert.equal(buyer.buyerTotalCents, 744);
    assert.equal(buyer.stripeFeeCents, 36);
    assert.equal(calculatePlatformFeeCents(productCents), 54);
    assert.equal(Math.round((quote.deliveryFeeCents * DELIVERY_DELIVERER_PERCENT) / 100), 227);
    assert.equal(Math.round((quote.deliveryFeeCents * DELIVERY_PLATFORM_FEE_PERCENT) / 100), 31);
  });
});

describe('courier acceptance countdown uses the server deadline', () => {
  it('formats the five-minute window as 04:59 down to 00:00', () => {
    assert.equal(formatCourierCountdown(5 * 60 * 1000), '05:00');
    assert.equal(formatCourierCountdown(4 * 60 * 1000 + 59 * 1000), '04:59');
    assert.equal(formatCourierCountdown(0), '00:00');
    assert.equal(formatCourierCountdown(-2000), '00:00');
  });

  it('does not move the deadline when the client clock is ahead', () => {
    const expiresAt = '2026-11-04T12:05:00.000Z';
    const serverNow = '2026-11-04T12:00:01.000Z';
    const clientNowAtServerSync = Date.parse('2026-11-04T12:00:11.000Z');
    const remaining = courierAcceptanceRemainingMs({
      expiresAt,
      serverNow,
      clientNow: clientNowAtServerSync + 1000,
      clientNowAtServerSync,
    });
    assert.equal(remaining, 4 * 60 * 1000 + 58 * 1000);
    assert.equal(formatCourierCountdown(remaining), '04:58');
  });

  it('keeps waiting, accepted, rejected and the three expiries exclusive', () => {
    const copy = courierStatusCopy('nl');
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'PENDING',
        reservationRemainingMs: 34 * 60 * 1000,
        paymentRemainingMs: null,
      }),
      'waiting',
    );
    assert.equal(copy.waiting, 'Je bezorgverzoek is verstuurd. We wachten op bevestiging.');
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'ACCEPTED',
        reservationRemainingMs: 20 * 60 * 1000,
        paymentRemainingMs: 20 * 60 * 1000,
      }),
      'accepted',
    );
    assert.equal(
      copy.accepted,
      'Je bezorger heeft je bezorgverzoek geaccepteerd. Je kunt nu veilig betalen.',
    );
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'REJECTED',
        reservationRemainingMs: 20 * 60 * 1000,
        paymentRemainingMs: null,
      }),
      'rejected',
    );
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'EXPIRED',
        reservationRemainingMs: 10 * 60 * 1000,
        paymentRemainingMs: null,
      }),
      'courier_expired',
    );
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'ACCEPTED',
        reservationRemainingMs: 0,
        paymentRemainingMs: 0,
      }),
      'payment_expired',
    );
    assert.equal(
      courierCheckoutKind({
        bookingStatus: 'PENDING',
        reservationRemainingMs: 0,
        paymentRemainingMs: null,
      }),
      'stock_expired',
    );
  });

  it('opens a new courier list only after the server confirms the old request is inactive', () => {
    assert.equal(
      courierSwitchMayContinue({ httpOk: true, active: false, status: 'CANCELLED' }),
      true,
    );
    assert.equal(
      courierSwitchMayContinue({ httpOk: true, active: false, status: 'PENDING' }),
      false,
    );
    assert.equal(
      courierSwitchMayContinue({ httpOk: false, active: false, status: 'CANCELLED' }),
      false,
    );
    assert.equal(
      courierSwitchMayContinue({ httpOk: true, active: true, status: 'ACCEPTED' }),
      false,
    );
  });
});
