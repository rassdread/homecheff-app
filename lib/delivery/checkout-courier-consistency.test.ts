import assert from 'node:assert/strict';
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
  courierDashboardKeepsBooking,
  deliveryFeeForCheckout,
  interpretMatchResponse,
  marketplaceSlotNotes,
  namedCheckoutAvailable,
  namedCheckoutCourierHeadline,
  readMarketplaceSlot,
  shouldApplyMatchGeneration,
} from '@/lib/delivery/checkout-courier-consistency';
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
    assert.equal(headline, 'Geen bezorger gevonden voor dit adres en dit product.');
    assert.equal(headline?.includes('beschikbaar'), false);
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
  });

  it('expires a hold when only the payment deadline has passed', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');
    const where = unpaidHoldExpiredWhere(now);
    assert.equal(where.status, 'PENDING');
    assert.equal(where.OR[1].paymentDeadline.lt.getTime(), now.getTime());
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
    assert.ok(scheduled[0].getTime() > sundayMorning.getTime());
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
