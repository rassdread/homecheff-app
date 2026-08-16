/**
 * Unit checks for seller settlement helpers (no Stripe network).
 * Run: npx tsx scripts/validate-seller-settlement-unit.ts
 */
import assert from 'node:assert/strict';
import {
  sellerTransactionId,
  sellerPayoutId,
  sellerTransferIdempotencyKey,
  isSuccessfulTransferRef,
  isFailedTransferRef,
} from '../lib/payments/seller-settlement';
import { calculatePlatformFeeCents, calculateStripeFeeForBuyer } from '../lib/fees';

assert.equal(sellerTransactionId('o1', 'p1'), 'txn_o1_p1');
assert.equal(sellerPayoutId('o1', 'p1'), 'payout_seller_o1_p1');
assert.equal(
  sellerTransferIdempotencyKey('o1', 'p1'),
  'hc_seller_xfer_o1_p1',
);

assert.equal(isSuccessfulTransferRef('tr_abc'), true);
assert.equal(isSuccessfulTransferRef('pending_transfer'), false);
assert.equal(isSuccessfulTransferRef('failed_123'), false);
assert.equal(isSuccessfulTransferRef(null), false);
assert.equal(isFailedTransferRef('failed_123'), true);

// Controlled €1
assert.equal(calculatePlatformFeeCents(100, 12), 12);
const buyer = calculateStripeFeeForBuyer(100);
assert.equal(buyer.stripeFeeCents, 27);
assert.equal(buyer.buyerTotalCents, 127);

console.log('validate-seller-settlement-unit: OK');
