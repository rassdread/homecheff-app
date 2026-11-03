import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  courierMayExecuteDelivery,
  courierPaymentDisplayKind,
  courierPaymentStatusCopyNl,
  remapCalendarJobForCourierDisplay,
} from '@/lib/delivery/courier-payment-display';
import { evaluateCheckoutFloor } from '@/lib/marketplace/checkout-floor';
import { calculateStripeFeeForBuyer } from '@/lib/fees';

describe('courier payment display separates accept from paid', () => {
  it('maps accepted unpaid booking to awaiting payment', () => {
    const kind = courierPaymentDisplayKind({
      bookingStatus: 'ACCEPTED',
      calendarStatus: 'CONFIRMED',
      deliveryOrderId: null,
      paymentDeadline: new Date(Date.now() + 60_000),
    });
    assert.equal(kind, 'ACCEPTED_AWAITING_PAYMENT');
    const copy = courierPaymentStatusCopyNl(kind);
    assert.match(copy.body, /Wachten op betaling door de koper/);
    assert.equal(courierMayExecuteDelivery({ deliveryOrderId: null, bookingStatus: 'ACCEPTED' }), false);
  });

  it('maps CONSUMED / linked order to payment confirmed', () => {
    assert.equal(
      courierPaymentDisplayKind({
        bookingStatus: 'CONSUMED',
        deliveryOrderId: 'del_1',
      }),
      'PAYMENT_CONFIRMED',
    );
    assert.match(
      courierPaymentStatusCopyNl('PAYMENT_CONFIRMED').body,
      /definitief bevestigd/,
    );
    assert.equal(
      courierMayExecuteDelivery({ deliveryOrderId: 'del_1', bookingStatus: 'CONSUMED' }),
      true,
    );
  });

  it('maps expired payment window', () => {
    assert.equal(
      courierPaymentDisplayKind({
        bookingStatus: 'ACCEPTED',
        paymentDeadline: new Date(Date.now() - 1000),
      }),
      'PAYMENT_EXPIRED',
    );
    assert.match(
      courierPaymentStatusCopyNl('PAYMENT_EXPIRED').body,
      /Betaaltermijn verstreken/,
    );
  });

  it('remaps calendar CONFIRMED without order away from financial confirmation', () => {
    const remapped = remapCalendarJobForCourierDisplay({
      status: 'CONFIRMED',
      bookingRequestId: 'bk_1',
      deliveryOrderId: null,
      bookingStatus: 'ACCEPTED',
      paymentDeadline: new Date(Date.now() + 120_000),
    });
    assert.equal(remapped.status, 'AWAITING_PAYMENT');
    assert.equal(remapped.kind, 'ACCEPTED_AWAITING_PAYMENT');
  });

  it('does not invent a paid order before payment (checkout floor still independent)', () => {
    const floor = evaluateCheckoutFloor({
      lineItems: [{ productId: 'p', quantity: 1, unitPriceCents: 450 }],
      deliveryFeeCents: 258,
    });
    assert.equal(floor.eligible, true);
    assert.equal(floor.eligibleBaseCents, 708);
    const { buyerTotalCents } = calculateStripeFeeForBuyer(708);
    assert.equal(buyerTotalCents, 744);
    // Courier still awaiting payment until CONSUMED / deliveryOrderId.
    assert.equal(
      courierPaymentDisplayKind({ bookingStatus: 'ACCEPTED', deliveryOrderId: null }),
      'ACCEPTED_AWAITING_PAYMENT',
    );
  });
});
