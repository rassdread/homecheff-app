/**
 * Dispute + shared reversal fixtures (no Stripe mutate, no live dispute).
 * Run: npx tsx scripts/validate-dispute-settlement-unit.ts
 */
import assert from 'node:assert/strict';
import {
  cumulativeProportionalReversalCents,
  allocateDisputeAcrossSellerLegs,
} from '../lib/payments/recipient-reversal';
import {
  proveLegacyDisputeExposure,
  sellerDisputeUiState,
  STRIPE_NL_DISPUTE_RECEIVED_FEE_CENTS_LIST,
} from '../lib/payments/dispute-settlement';

// P0 exposure proof (legacy affiliate-only)
{
  const exp = proveLegacyDisputeExposure({
    buyerPaidCents: 127,
    sellerTransferredCents: 88,
    platformRetainedCents: 10,
  });
  assert.equal(exp.P0_EXPOSURE, true);
  assert.equal(exp.SELLER_RECOVERY, 0);
  assert.equal(exp.PLATFORM_DEBIT, 127);
  assert.equal(exp.UNRECONCILED, 0);
}

// A: dispute before transfer → recovery 0
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: 100,
    transferCents: 0,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 0,
  });
  assert.equal(rev, 0);
}

// B: dispute after transfer full → 88
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: 100,
    transferCents: 88,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 0,
  });
  assert.equal(rev, 88);
}

// D: fully reversed by refund → additional capacity 0
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: 100,
    transferCents: 88,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 88,
  });
  assert.equal(rev, 0);
}

// E: partial refund 44 then dispute target full → max new 44
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: 100,
    transferCents: 88,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 44,
  });
  assert.equal(rev, 44);
}

// Multi-seller allocation
{
  const alloc = allocateDisputeAcrossSellerLegs({
    disputeAmountCents: 300,
    buyerGrossCents: 300,
    legs: [
      { productId: 'a', sellerGrossCents: 100 },
      { productId: 'b', sellerGrossCents: 200 },
    ],
  });
  assert.equal(alloc[0].sellerConsiderationCents, 100);
  assert.equal(alloc[1].sellerConsiderationCents, 200);
}

// Partial dispute proportional
{
  const alloc = allocateDisputeAcrossSellerLegs({
    disputeAmountCents: 50,
    buyerGrossCents: 127,
    legs: [{ productId: 'a', sellerGrossCents: 100 }],
  });
  assert.equal(alloc[0].sellerConsiderationCents, 50);
}

// NL dispute fee list (official pricing page)
assert.equal(STRIPE_NL_DISPUTE_RECEIVED_FEE_CENTS_LIST, 2000);

// Seller UI
assert.equal(
  sellerDisputeUiState({
    financialStatus: 'EVIDENCE_REQUIRED',
    recoveredCents: 0,
    outstandingCents: 88,
  }),
  'Betaling betwist',
);
assert.equal(
  sellerDisputeUiState({
    financialStatus: 'RECIPIENT_RECOVERED',
    recoveredCents: 88,
    outstandingCents: 0,
  }),
  'Uitbetaling teruggedraaid',
);

console.log('validate-dispute-settlement-unit: OK');
console.log(
  JSON.stringify({
    P0_EXPOSURE_LEGACY: true,
    fixtures: [
      'A_before_transfer',
      'B_after_transfer_88',
      'D_fully_reversed_0',
      'E_partial_then_dispute_44',
      'multi_seller',
      'partial_dispute',
      'seller_ui',
    ],
    UNRECONCILED: 0,
  }),
);
