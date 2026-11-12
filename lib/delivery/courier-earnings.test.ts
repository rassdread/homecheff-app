import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  courierNetFromGrossCents,
  courierTransferIsPaid,
  deliveryOrderIdFromLedgerId,
  nextCourierEarningsCounter,
  summarizeCourierLedger,
} from '@/lib/delivery/courier-earnings';

describe('courier earnings stay reserved until delivery', () => {
  it('does not count a paid but undelivered marketplace fee as earned or paid out', () => {
    const orderId = 'cldeliveryorderid000000001';
    const summary = summarizeCourierLedger(
      [{
        id: `payout_delivery_${orderId}_1710000000000`,
        transactionId: `txn_delivery_${orderId}_1710000000000`,
        amountCents: 1646,
        providerRef: 'pi_test_not_a_transfer',
      }],
      [{ id: orderId, status: 'ACCEPTED', orderId: 'order-1' }],
    );
    assert.equal(summary.earnedCents, 0);
    assert.equal(summary.paidCents, 0);
    assert.equal(courierTransferIsPaid('pi_test_not_a_transfer'), false);
    assert.equal(courierTransferIsPaid('tr_test'), true);
    assert.equal(courierNetFromGrossCents(1870), 1646);
  });

  it('counts the fee once after delivery and only a transfer as paid out', () => {
    const orderId = 'cldeliveryorderid000000001';
    const payout = {
      id: `payout_delivery_${orderId}`,
      transactionId: `txn_delivery_${orderId}`,
      amountCents: 1646,
      providerRef: null as string | null,
    };
    const delivered = summarizeCourierLedger([payout], [{ id: orderId, status: 'DELIVERED', orderId: 'order-1' }]);
    assert.equal(delivered.earnedCents, 1646);
    assert.equal(delivered.paidCents, 0);
    const paid = summarizeCourierLedger(
      [{ ...payout, providerRef: 'tr_test' }],
      [{ id: orderId, status: 'DELIVERED', orderId: 'order-1' }],
    );
    assert.equal(paid.earnedCents, 1646);
    assert.equal(paid.paidCents, 1646);
    const again = summarizeCourierLedger(
      [{ ...payout, providerRef: 'tr_test' }, { ...payout, id: `${payout.id}_2`, providerRef: 'tr_test' }],
      [{ id: orderId, status: 'DELIVERED', orderId: 'order-1' }],
    );
    assert.equal(again.paidCents, 1646 * 2);
    assert.equal(deliveryOrderIdFromLedgerId(payout.id), orderId);
  });

  it('keeps a confirmed transfer when its delivery order is missing', () => {
    const missingId = 'clmissingorder000000000001';
    const deliveredId = 'cldeliveredorder0000000001';
    const summary = summarizeCourierLedger(
      [
        {
          id: `payout_delivery_${missingId}`,
          transactionId: `txn_delivery_${missingId}`,
          amountCents: 660,
          providerRef: 'tr_existing_not_repeated',
        },
        {
          id: `payout_delivery_${deliveredId}`,
          transactionId: `txn_delivery_${deliveredId}`,
          amountCents: 1320,
          providerRef: 'tr_delivered',
        },
      ],
      [{ id: deliveredId, status: 'DELIVERED', orderId: 'order-delivered' }],
    );
    assert.equal(summary.earnedCents, 1320);
    assert.equal(summary.unresolvedTransferCents, 660);
    assert.equal(summary.paidCents, 1980);
    const first = nextCourierEarningsCounter(1980, summary);
    const second = nextCourierEarningsCounter(first.nextStoredCents, summary);
    assert.equal(first.nextStoredCents, 1980);
    assert.equal(first.reviewRequired, true);
    assert.equal(first.reviewCents, 660);
    assert.equal(second.nextStoredCents, 1980);
    assert.equal(second.nextStoredCents - first.nextStoredCents, 0);
  });
});
