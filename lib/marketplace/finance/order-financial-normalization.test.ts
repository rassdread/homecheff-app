import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeMarketplaceOrderFinance,
  normalizeFromStripeMetadata,
  platformFeeFromBps,
  toFinanceExportRow,
  MARKETPLACE_VAT_STATUS,
} from './order-financial-normalization';

describe('marketplace order financial normalization', () => {
  it('computes platform fee from bps snapshot (12/9/7/5 tiers)', () => {
    assert.equal(platformFeeFromBps(1000, 1200), 120);
    assert.equal(platformFeeFromBps(1000, 900), 90);
    assert.equal(platformFeeFromBps(1000, 700), 70);
    assert.equal(platformFeeFromBps(1000, 500), 50);
  });

  it('parses stripe checkout metadata slice', () => {
    const meta = normalizeFromStripeMetadata({
      productsTotalCents: '1500',
      deliveryFeeCents: '400',
      smsNotificationCostCents: '6',
      stripeFeeCents: '52',
      amountPaidCents: '1958',
      checkoutEligibleBaseCents: '1900',
    });
    assert.equal(meta.itemsGrossCents, 1500);
    assert.equal(meta.deliveryCents, 400);
    assert.equal(meta.checkoutEligibleBaseCents, 1900);
    assert.equal(meta.deliverySeparatelyReconcilable, true);
  });

  it('preserves historical platform fee bps on seller legs', () => {
    const record = normalizeMarketplaceOrderFinance({
      orderId: 'ord-1',
      orderNumber: 'HC-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      stripeSessionId: 'cs_test',
      totalAmount: 1958,
      metadata: {
        productsTotalCents: '1500',
        deliveryFeeCents: '400',
        amountPaidCents: '1958',
        stripeFeeCents: '52',
      },
      sellerLegs: [
        {
          transactionId: 'txn_1',
          sellerId: 'seller-a',
          amountCents: 1500,
          platformFeeBps: 500,
          platformFeeCents: 75,
          sellerPayoutCents: 1425,
          status: 'CAPTURED',
        },
      ],
    });
    assert.equal(record.platformFeeBpsSnapshot, 500);
    assert.equal(record.platformFeeCents, 75);
    assert.equal(record.sellerPayoutCents, 1425);
    assert.equal(record.vatStatus, MARKETPLACE_VAT_STATUS);
  });

  it('export row minimizes sensitive fields', () => {
    const row = toFinanceExportRow(
      normalizeMarketplaceOrderFinance({
        orderId: 'ord-2',
        orderNumber: 'HC-2',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        stripeSessionId: 'cs_live',
        totalAmount: 1000,
        sellerLegs: [],
      }),
    );
    assert.equal(row.currency, 'EUR');
    assert.equal(row.vatStatus, MARKETPLACE_VAT_STATUS);
    assert.ok(!('buyerEmail' in row));
  });
});
