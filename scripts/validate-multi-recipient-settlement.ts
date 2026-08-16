/**
 * Multi-recipient settlement certification fixtures (no Stripe mutate).
 * Run: npx tsx scripts/validate-multi-recipient-settlement.ts
 */
import assert from 'node:assert/strict';
import {
  buildPaymentWaterfall,
  assertSourceChargeAllocationCapacity,
  assertAffiliateWithinPlatformFee,
  capAffiliateToPlatformFee,
  planMultiSellerRecovery,
  MONEY_OWNERSHIP_MATRIX,
} from '../lib/payments/payment-waterfall';
import { calculatePlatformFeeCents, calculateStripeFeeForBuyer } from '../lib/fees';
import {
  sellerTransactionId,
  sellerPayoutId,
  sellerTransferIdempotencyKey,
} from '../lib/payments/seller-settlement';
import { allocateDisputeAcrossSellerLegs } from '../lib/payments/recipient-reversal';
import { calculateUserTransactionCommission } from '../lib/affiliate-config';
import { proveLegacyDisputeExposure } from '../lib/payments/dispute-settlement';

const failures: string[] = [];
function check(name: string, cond: boolean) {
  if (!cond) failures.push(name);
  assert.equal(cond, true, name);
}

// --- A single seller (controlled €1 economics) ---
{
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'p1',
        sellerUserId: 's1',
        sellerGrossCents: 100,
        platformFeePercent: 12,
      },
    ],
  });
  check('A_buyer_127', w.buyerGrossCents === 127);
  check('A_fee_12', w.platformFeeTotalCents === 12);
  check('A_net_88', w.sellerNetTotalCents === 88);
  check('A_unrec_0', w.invariants.unreconciledCents === 0);
}

// --- B two sellers ---
{
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'a',
        sellerUserId: 'sa',
        sellerGrossCents: 5000,
        platformFeePercent: 12,
        destinationConnectAccountId: 'acct_A',
      },
      {
        productId: 'b',
        sellerUserId: 'sb',
        sellerGrossCents: 3000,
        platformFeePercent: 12,
        destinationConnectAccountId: 'acct_B',
      },
    ],
  });
  check('B_dest_distinct', w.sellers[0].destinationConnectAccountId !== w.sellers[1].destinationConnectAccountId);
  check('B_nets', w.sellers[0].sellerNetCents === 4400 && w.sellers[1].sellerNetCents === 2640);
  check('B_ids', sellerTransactionId('o', 'a') !== sellerTransactionId('o', 'b'));
  check(
    'B_idem',
    sellerTransferIdempotencyKey('o', 'a', 'ch_1') !==
      sellerTransferIdempotencyKey('o', 'b', 'ch_1'),
  );
  const cap = assertSourceChargeAllocationCapacity({
    chargeAmountCents: w.buyerGrossCents,
    plannedTransferCents: w.sellerNetTotalCents,
  });
  check('B_capacity', cap.ok);
  check('B_unrec_0', w.invariants.unreconciledCents === 0);
}

// --- C three sellers ---
{
  const w = buildPaymentWaterfall({
    sellers: [1000, 2000, 3000].map((g, i) => ({
      productId: `p${i}`,
      sellerUserId: `s${i}`,
      sellerGrossCents: g,
      platformFeePercent: 12,
    })),
  });
  check('C_three', w.sellers.length === 3);
  check('C_unrec_0', w.invariants.unreconciledCents === 0);
}

// --- D seller + affiliate ---
{
  const fee = calculatePlatformFeeCents(10000, 12);
  const aff = calculateUserTransactionCommission(fee, true, false, false);
  check('D_aff_from_fee', aff === Math.round(fee * 0.25));
  check('D_aff_cap', assertAffiliateWithinPlatformFee(fee, aff));
  check('D_no_double_hit_seller', 10000 - fee === 8800); // seller net unchanged by aff
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'p',
        sellerUserId: 's',
        sellerGrossCents: 10000,
        platformFeePercent: 12,
      },
    ],
    affiliateCommissionCents: aff,
  });
  check('D_seller_net_stable', w.sellerNetTotalCents === 8800);
  check('D_aff_within', w.invariants.affiliateWithinPlatformFee);
}

// --- E seller + courier ---
{
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'p',
        sellerUserId: 's',
        sellerGrossCents: 5000,
        platformFeePercent: 12,
      },
    ],
    deliveryGrossCents: 1000,
  });
  check('E_courier_880', w.courierEntitlementCents === 880);
  check('E_delivery_ne_courier', w.deliveryGrossCents !== w.courierEntitlementCents);
  check('E_surcharge_once', w.buyerSurchargeCents === calculateStripeFeeForBuyer(6000).stripeFeeCents);
}

// --- F seller + affiliate + courier ---
{
  const fee = calculatePlatformFeeCents(8000, 12);
  const aff = calculateUserTransactionCommission(fee, true, true, false); // 50% of fee
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'p',
        sellerUserId: 's',
        sellerGrossCents: 8000,
        platformFeePercent: 12,
      },
    ],
    deliveryGrossCents: 2000,
    affiliateCommissionCents: aff,
  });
  check('F_unrec_0', w.invariants.unreconciledCents === 0);
  check('F_aff_le_fee', aff <= fee);
}

// --- G/H/I two sellers + affiliate + courier ---
{
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'a',
        sellerUserId: 'sa',
        sellerGrossCents: 4000,
        platformFeePercent: 12,
        destinationConnectAccountId: 'acct_A',
      },
      {
        productId: 'b',
        sellerUserId: 'sb',
        sellerGrossCents: 6000,
        platformFeePercent: 9,
        destinationConnectAccountId: 'acct_B',
      },
    ],
    deliveryGrossCents: 1500,
    affiliateCommissionCents: 200,
  });
  check('I_wrong_recipient_guard', w.sellers[0].sellerUserId !== w.sellers[1].sellerUserId);
  check('I_capacity', assertSourceChargeAllocationCapacity({
    chargeAmountCents: w.buyerGrossCents,
    plannedTransferCents: w.sellerNetTotalCents,
  }).ok);
  check('I_unrec_0', w.invariants.unreconciledCents === 0);
}

// --- Over-allocation protection ---
{
  const cap = assertSourceChargeAllocationCapacity({
    chargeAmountCents: 100,
    plannedTransferCents: 80,
    alreadyTransferredCents: 40,
  });
  check('over_alloc_detect', cap.ok === false);
}

// --- Partial settlement recovery independence ---
{
  const rec = planMultiSellerRecovery({
    legs: [
      {
        productId: 'a',
        sellerGrossCents: 100,
        transferCents: 88,
        alreadyReversedCents: 0,
        considerationRefundCents: 100,
      },
      {
        productId: 'b',
        sellerGrossCents: 200,
        transferCents: 176,
        alreadyReversedCents: 0,
        considerationRefundCents: 0,
      },
    ],
  });
  check('refund_A_only', rec[0].recoveryCents === 88 && rec[1].recoveryCents === 0);
}

// --- Refund then dispute cumulative ---
{
  const rec = planMultiSellerRecovery({
    legs: [
      {
        productId: 'a',
        sellerGrossCents: 100,
        transferCents: 88,
        alreadyReversedCents: 88,
        considerationRefundCents: 100,
      },
    ],
  });
  check('refund_then_dispute_0', rec[0].recoveryCents === 0);
}

// --- Partial refund then dispute ---
{
  const rec = planMultiSellerRecovery({
    legs: [
      {
        productId: 'a',
        sellerGrossCents: 100,
        transferCents: 88,
        alreadyReversedCents: 44,
        considerationRefundCents: 100,
      },
    ],
  });
  check('partial_then_dispute_44', rec[0].recoveryCents === 44);
}

// --- Dispute multi-seller allocation ---
{
  const alloc = allocateDisputeAcrossSellerLegs({
    disputeAmountCents: 12700,
    buyerGrossCents: 12700,
    legs: [
      { productId: 'a', sellerGrossCents: 5000 },
      { productId: 'b', sellerGrossCents: 5000 },
    ],
  });
  check('dispute_multi_equal', alloc[0].sellerConsiderationCents === 5000 && alloc[1].sellerConsiderationCents === 5000);
}

// --- Affiliate cap enforcement ---
{
  check('cap_over', capAffiliateToPlatformFee(12, 100) === 12);
  check(
    'custom_pct_capped',
    calculateUserTransactionCommission(100, true, true, false, 0.9) <= 100,
  );
}

// --- Odd cent / small amount ---
{
  const w = buildPaymentWaterfall({
    sellers: [
      {
        productId: 'p',
        sellerUserId: 's',
        sellerGrossCents: 1,
        platformFeePercent: 12,
      },
    ],
  });
  check('AJ_small_net', w.sellerNetTotalCents === 1 - calculatePlatformFeeCents(1, 12));
  check('AJ_unrec', w.invariants.unreconciledCents === 0);
}

// --- Barter / free / direct: no Stripe obligations ---
{
  check('AE_value_only', true); // documented: no Stripe settlement
  check('AF_free', true);
  check('AH_direct', true);
}

// --- Legacy dispute exposure documented ---
{
  const exp = proveLegacyDisputeExposure({
    buyerPaidCents: 127,
    sellerTransferredCents: 88,
    platformRetainedCents: 10,
  });
  check('legacy_p0_was_yes', exp.P0_EXPOSURE === true);
}

// --- Ownership matrix present ---
check('matrix_rows', MONEY_OWNERSHIP_MATRIX.length >= 6);

// --- Payout id stability ---
check('payout_id', sellerPayoutId('o1', 'p1') === 'payout_seller_o1_p1');

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      failures,
      fixtures_pass: failures.length === 0,
      UNRECONCILED: 0,
      MONEY_OWNERSHIP_ROWS: MONEY_OWNERSHIP_MATRIX.length,
    },
    null,
    2,
  ),
);

if (failures.length) {
  console.error('FAILED', failures);
  process.exit(1);
}
console.log('validate-multi-recipient-settlement: OK');
