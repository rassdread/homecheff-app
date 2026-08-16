/**
 * Canonical multi-recipient payment waterfall (HomeCheff SCT).
 *
 * Documents ACTUAL economics — do not invent alternate fee models.
 *
 * BUYER_GROSS =
 *   Σ(sellerConsideration) + deliveryGross + smsFees + buyerSurcharge
 * where buyerSurcharge = calculateStripeFeeForBuyer(subtotal).stripeFeeCents
 *   (ceil formula in lib/fees.ts)
 *
 * SELLER_CONSIDERATION =
 *   sellerNet + platformFee
 *   platformFee = round(gross × feePercent/100)  // lib/fees.calculatePlatformFeeCents
 *   feePercent from SellerProfile visibility plan (12/9/7/5)
 *
 * AFFILIATE_COMMISSION =
 *   round(platformFee × commissionPct)  // funded FROM platform fee, not seller net
 *   MUST NOT reduce sellerNet a second time
 *   Cap: total affiliate on a fee basis ≤ platformFee
 *
 * COURIER_ENTITLEMENT =
 *   deliveryGross − round(deliveryGross × 12%)   // or splitDeliveryCommission
 *   Currently ledger-only (no Stripe Transfer in ensureDeliveryPayout)
 *
 * STRIPE_PROCESSING_FEE =
 *   actual BalanceTransaction fee on Charge (once per payment)
 *   Buyer surcharge is an estimate pass-through; may differ from actual fee
 *
 * Rounding SSOT:
 * - Buyer surcharge: ceil
 * - Platform / affiliate / delivery splits: round
 * - Transfer reversals: floor cumulative (recipient-reversal.ts)
 */

import { calculatePlatformFeeCents, calculateStripeFeeForBuyer } from '@/lib/fees';
import { cumulativeProportionalReversalCents } from '@/lib/payments/recipient-reversal';

export const PAYMENT_WATERFALL_VERSION = 1;

export type SellerLegInput = {
  productId: string;
  sellerUserId: string;
  sellerGrossCents: number;
  /** fee percent e.g. 12 */
  platformFeePercent: number;
  /** Snapshotted Connect destination if known */
  destinationConnectAccountId?: string | null;
};

export type WaterfallInput = {
  sellers: SellerLegInput[];
  deliveryGrossCents?: number;
  smsFeeCents?: number;
  /**
   * Affiliate commissions funded from platform fee (per seller leg or order).
   * Must not exceed funding platform fees in aggregate.
   */
  affiliateCommissionCents?: number;
  /** Courier net entitlement (usually 88% of delivery gross) */
  courierEntitlementCents?: number | null;
};

export type SellerWaterfallLeg = {
  productId: string;
  sellerUserId: string;
  sellerGrossCents: number;
  platformFeeCents: number;
  sellerNetCents: number;
  destinationConnectAccountId: string | null;
};

export type PaymentWaterfall = {
  version: number;
  sellers: SellerWaterfallLeg[];
  sellerGrossTotalCents: number;
  platformFeeTotalCents: number;
  sellerNetTotalCents: number;
  deliveryGrossCents: number;
  courierEntitlementCents: number;
  deliveryPlatformFeeCents: number;
  smsFeeCents: number;
  subtotalBeforeSurchargeCents: number;
  buyerSurchargeCents: number;
  buyerGrossCents: number;
  affiliateCommissionCents: number;
  platformRetainedFromSellerFeesCents: number;
  /** After funding affiliate from platform fee */
  platformRetainedAfterAffiliateCents: number;
  /** Estimated Stripe fee embedded in surcharge (may ≠ actual) */
  stripeFeeEstimatedCents: number;
  invariants: {
    sellerNetNonNegative: boolean;
    affiliateWithinPlatformFee: boolean;
    affiliateDoesNotReduceSellerNetTwice: boolean;
    courierWithinDeliveryGross: boolean;
    buyerGrossMatchesFormula: boolean;
    unreconciledCents: number;
  };
};

export function buildPaymentWaterfall(input: WaterfallInput): PaymentWaterfall {
  const sellers: SellerWaterfallLeg[] = input.sellers.map((s) => {
    const platformFeeCents = calculatePlatformFeeCents(
      s.sellerGrossCents,
      s.platformFeePercent,
    );
    const sellerNetCents = Math.max(0, s.sellerGrossCents - platformFeeCents);
    return {
      productId: s.productId,
      sellerUserId: s.sellerUserId,
      sellerGrossCents: s.sellerGrossCents,
      platformFeeCents,
      sellerNetCents,
      destinationConnectAccountId: s.destinationConnectAccountId ?? null,
    };
  });

  const sellerGrossTotalCents = sellers.reduce((a, s) => a + s.sellerGrossCents, 0);
  const platformFeeTotalCents = sellers.reduce((a, s) => a + s.platformFeeCents, 0);
  const sellerNetTotalCents = sellers.reduce((a, s) => a + s.sellerNetCents, 0);

  const deliveryGrossCents = Math.max(0, input.deliveryGrossCents ?? 0);
  const deliveryPlatformFeeCents =
    deliveryGrossCents > 0
      ? calculatePlatformFeeCents(deliveryGrossCents, 12)
      : 0;
  const defaultCourier = Math.max(0, deliveryGrossCents - deliveryPlatformFeeCents);
  const courierEntitlementCents =
    typeof input.courierEntitlementCents === 'number'
      ? Math.max(0, input.courierEntitlementCents)
      : defaultCourier;

  const smsFeeCents = Math.max(0, input.smsFeeCents ?? 0);
  const subtotalBeforeSurchargeCents =
    sellerGrossTotalCents + deliveryGrossCents + smsFeeCents;
  const surcharge = calculateStripeFeeForBuyer(subtotalBeforeSurchargeCents);
  const buyerSurchargeCents = surcharge.stripeFeeCents;
  const buyerGrossCents = surcharge.buyerTotalCents;

  const affiliateCommissionCents = Math.max(0, input.affiliateCommissionCents ?? 0);
  const platformRetainedFromSellerFeesCents = platformFeeTotalCents;
  const platformRetainedAfterAffiliateCents = Math.max(
    0,
    platformFeeTotalCents - affiliateCommissionCents,
  );

  const affiliateWithinPlatformFee =
    affiliateCommissionCents <= platformFeeTotalCents;
  const courierWithinDeliveryGross =
    courierEntitlementCents <= deliveryGrossCents;

  // Economic recon: buyerGross should equal products+delivery+sms+surcharge
  const reconstructed =
    sellerGrossTotalCents +
    deliveryGrossCents +
    smsFeeCents +
    buyerSurchargeCents;
  const unreconciledCents = Math.abs(reconstructed - buyerGrossCents);

  return {
    version: PAYMENT_WATERFALL_VERSION,
    sellers,
    sellerGrossTotalCents,
    platformFeeTotalCents,
    sellerNetTotalCents,
    deliveryGrossCents,
    courierEntitlementCents,
    deliveryPlatformFeeCents,
    smsFeeCents,
    subtotalBeforeSurchargeCents,
    buyerSurchargeCents,
    buyerGrossCents,
    affiliateCommissionCents,
    platformRetainedFromSellerFeesCents,
    platformRetainedAfterAffiliateCents,
    stripeFeeEstimatedCents: buyerSurchargeCents,
    invariants: {
      sellerNetNonNegative: sellers.every((s) => s.sellerNetCents >= 0),
      affiliateWithinPlatformFee,
      affiliateDoesNotReduceSellerNetTwice: true, // by construction: fee from gross, affiliate from fee
      courierWithinDeliveryGross,
      buyerGrossMatchesFormula: unreconciledCents === 0,
      unreconciledCents,
    },
  };
}

/**
 * SCT source_transaction capacity: cumulative Transfers against one Charge
 * must not exceed charge amount (Stripe). Soft economic check: nets ≤ charge − 0.
 */
export function assertSourceChargeAllocationCapacity(args: {
  chargeAmountCents: number;
  plannedTransferCents: number;
  alreadyTransferredCents?: number;
}): {
  ok: boolean;
  chargeAmountCents: number;
  plannedTransferCents: number;
  alreadyTransferredCents: number;
  remainingCapacityCents: number;
  error?: string;
} {
  const already = Math.max(0, args.alreadyTransferredCents ?? 0);
  const planned = Math.max(0, args.plannedTransferCents);
  const remaining = args.chargeAmountCents - already;
  const ok = planned <= remaining && planned >= 0;
  return {
    ok,
    chargeAmountCents: args.chargeAmountCents,
    plannedTransferCents: planned,
    alreadyTransferredCents: already,
    remainingCapacityCents: Math.max(0, remaining - (ok ? planned : 0)),
    error: ok
      ? undefined
      : `OVER_ALLOCATION: planned ${planned} + already ${already} > charge ${args.chargeAmountCents}`,
  };
}

export function assertAffiliateWithinPlatformFee(
  platformFeeCents: number,
  affiliateCommissionCents: number,
): boolean {
  return (
    affiliateCommissionCents >= 0 &&
    affiliateCommissionCents <= Math.max(0, platformFeeCents)
  );
}

/** Cap affiliate commission to funding platform fee (server safety). */
export function capAffiliateToPlatformFee(
  platformFeeCents: number,
  affiliateCommissionCents: number,
): number {
  return Math.max(
    0,
    Math.min(Math.max(0, platformFeeCents), Math.max(0, affiliateCommissionCents)),
  );
}

export type MoneyOwnershipRow = {
  leg: string;
  paidBy: string;
  economicOwner: string;
  stripeDestination: string;
  dbOwner: string;
  refundable: string;
  reversible: string;
  sourceTransaction: string;
};

export const MONEY_OWNERSHIP_MATRIX: MoneyOwnershipRow[] = [
  {
    leg: 'SELLER_NET',
    paidBy: 'Buyer (via platform Charge)',
    economicOwner: 'Seller',
    stripeDestination: 'Seller Connect (tr_)',
    dbOwner: 'Transaction + Payout',
    refundable: 'Via buyer refund + transfer reversal',
    reversible: 'Yes (createReversal)',
    sourceTransaction: 'Yes (marketplace non-shipping)',
  },
  {
    leg: 'PLATFORM_FEE',
    paidBy: 'Buyer (embedded in Charge)',
    economicOwner: 'HomeCheff',
    stripeDestination: 'Platform balance (retained)',
    dbOwner: 'Transaction.platformFeeBps / fee cents',
    refundable: 'Policy / full buyer refund impact',
    reversible: 'N/A (not a Connect transfer)',
    sourceTransaction: 'N/A',
  },
  {
    leg: 'AFFILIATE_COMMISSION',
    paidBy: 'HomeCheff (from platform fee)',
    economicOwner: 'Affiliate',
    stripeDestination: 'Affiliate Connect (batch) or ledger-only',
    dbOwner: 'CommissionLedger',
    refundable: 'Ledger proportional reversal',
    reversible: 'Ledger; Connect clawback if paid = gap',
    sourceTransaction: 'No on batch payout',
  },
  {
    leg: 'COURIER_ENTITLEMENT',
    paidBy: 'Buyer delivery line',
    economicOwner: 'Courier',
    stripeDestination: 'None today (ledger-only)',
    dbOwner: 'txn_delivery_* + Payout providerRef null',
    refundable: 'POLICY_REQUIRED / ledger',
    reversible: 'Only if tr_ exists',
    sourceTransaction: 'N/A',
  },
  {
    leg: 'BUYER_SURCHARGE',
    paidBy: 'Buyer',
    economicOwner: 'Platform (covers Stripe fee)',
    stripeDestination: 'Platform Charge',
    dbOwner: 'Order.totalAmount / session metadata',
    refundable: 'Included in FULL_BUYER_GROSS; POLICY_REQUIRED vs Terms',
    reversible: 'N/A',
    sourceTransaction: 'N/A',
  },
  {
    leg: 'STRIPE_PROCESSING_FEE',
    paidBy: 'Platform (from Charge)',
    economicOwner: 'Stripe',
    stripeDestination: 'Stripe',
    dbOwner: 'Estimate only; actual on BT',
    refundable: 'Not returned (Stripe docs)',
    reversible: 'N/A',
    sourceTransaction: 'N/A',
  },
];

/**
 * Multi-seller refund/dispute: independent proportional recovery per transfer.
 */
export function planMultiSellerRecovery(args: {
  legs: Array<{
    productId: string;
    sellerGrossCents: number;
    transferCents: number;
    alreadyReversedCents: number;
    considerationRefundCents: number;
  }>;
}): Array<{ productId: string; recoveryCents: number; remainingCents: number }> {
  return args.legs.map((leg) => {
    const recoveryCents = cumulativeProportionalReversalCents({
      sellerGrossCents: leg.sellerGrossCents,
      transferCents: leg.transferCents,
      priorConsiderationRefundedCents: 0,
      thisConsiderationRefundCents: leg.considerationRefundCents,
      alreadyReversedCents: leg.alreadyReversedCents,
    });
    return {
      productId: leg.productId,
      recoveryCents,
      remainingCents: Math.max(
        0,
        leg.transferCents - leg.alreadyReversedCents - recoveryCents,
      ),
    };
  });
}
