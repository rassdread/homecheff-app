'use strict';

/**
 * Normalized EUR marketplace order finance record for internal export / DAC7 inputs.
 * VAT remains UNKNOWN until Q3 legal confirmation.
 */

export const MARKETPLACE_VAT_STATUS = 'UNKNOWN_PENDING_Q3' as const;

export type StripeCheckoutMetadataFinance = {
  productsTotalCents?: string | number | null;
  deliveryFeeCents?: string | number | null;
  smsNotificationCostCents?: string | number | null;
  stripeFeeCents?: string | number | null;
  amountPaidCents?: string | number | null;
  subtotalCents?: string | number | null;
  checkoutEligibleBaseCents?: string | number | null;
};

export type TransactionFinanceLeg = {
  transactionId: string;
  sellerId: string;
  amountCents: number;
  platformFeeBps: number;
  platformFeeCents: number;
  sellerPayoutCents: number;
  status: string;
};

export type RefundFinanceSummary = {
  refundedCents: number;
  chargebackCents: number;
};

export type NormalizedMarketplaceOrderFinance = {
  orderId: string;
  orderNumber: string | null;
  currency: 'EUR';
  paidAt: string | null;
  createdAt: string;
  stripeSessionId: string | null;
  stripePaymentReference: string | null;
  buyerGrossCents: number | 'UNKNOWN_HISTORICAL';
  itemsGrossCents: number | 'UNKNOWN_HISTORICAL';
  deliveryCents: number | 'UNKNOWN_HISTORICAL';
  smsCents: number | 'UNKNOWN_HISTORICAL';
  checkoutEligibleBaseCents: number | 'UNKNOWN_HISTORICAL';
  buyerProcessingSurchargeCents: number | 'UNKNOWN_HISTORICAL';
  platformFeeCents: number;
  platformFeeBpsSnapshot: number | 'UNKNOWN_HISTORICAL';
  stripeFeeCents: number | 'UNKNOWN_HISTORICAL';
  sellerGrossCents: number;
  sellerPayoutCents: number;
  refundCents: number;
  chargebackCents: number;
  vatStatus: typeof MARKETPLACE_VAT_STATUS;
  platformRevenueBeforeVatCents: number;
  contributionBeforeVatDecisionCents: number;
  sellerLegs: TransactionFinanceLeg[];
  dac7ConsiderationCents: number | 'UNKNOWN_HISTORICAL';
  deliverySeparatelyReconcilable: boolean;
};

function parseMetaInt(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export function platformFeeFromBps(amountCents: number, bps: number): number {
  if (amountCents <= 0 || bps <= 0) return 0;
  return Math.round((amountCents * bps) / 10_000);
}

export function normalizeFromStripeMetadata(
  metadata: StripeCheckoutMetadataFinance,
): Pick<
  NormalizedMarketplaceOrderFinance,
  | 'buyerGrossCents'
  | 'itemsGrossCents'
  | 'deliveryCents'
  | 'smsCents'
  | 'checkoutEligibleBaseCents'
  | 'buyerProcessingSurchargeCents'
  | 'dac7ConsiderationCents'
  | 'deliverySeparatelyReconcilable'
> {
  const itemsGross = parseMetaInt(metadata.productsTotalCents);
  const delivery = parseMetaInt(metadata.deliveryFeeCents);
  const sms = parseMetaInt(metadata.smsNotificationCostCents);
  const buyerGross = parseMetaInt(metadata.amountPaidCents);
  const surcharge = parseMetaInt(metadata.stripeFeeCents);
  const eligibleBase =
    parseMetaInt(metadata.checkoutEligibleBaseCents) ??
    (itemsGross != null && delivery != null ? itemsGross + delivery : null);

  return {
    buyerGrossCents: buyerGross ?? 'UNKNOWN_HISTORICAL',
    itemsGrossCents: itemsGross ?? 'UNKNOWN_HISTORICAL',
    deliveryCents: delivery ?? 'UNKNOWN_HISTORICAL',
    smsCents: sms ?? 'UNKNOWN_HISTORICAL',
    checkoutEligibleBaseCents: eligibleBase ?? 'UNKNOWN_HISTORICAL',
    buyerProcessingSurchargeCents: surcharge ?? 'UNKNOWN_HISTORICAL',
    dac7ConsiderationCents: itemsGross ?? 'UNKNOWN_HISTORICAL',
    deliverySeparatelyReconcilable: delivery != null,
  };
}

export function normalizeMarketplaceOrderFinance(input: {
  orderId: string;
  orderNumber: string | null;
  createdAt: Date;
  paidAt?: Date | null;
  stripeSessionId: string | null;
  totalAmount: number;
  metadata?: StripeCheckoutMetadataFinance | null;
  sellerLegs: TransactionFinanceLeg[];
  refundSummary?: RefundFinanceSummary;
}): NormalizedMarketplaceOrderFinance {
  const metaSlice = normalizeFromStripeMetadata(input.metadata ?? {});
  const productLegs = input.sellerLegs.filter((l) => !l.transactionId.includes('txn_delivery_'));
  const platformFeeCents = input.sellerLegs.reduce((sum, leg) => sum + leg.platformFeeCents, 0);
  const sellerPayoutCents = input.sellerLegs.reduce((sum, leg) => sum + leg.sellerPayoutCents, 0);
  const sellerGrossCents = input.sellerLegs.reduce((sum, leg) => sum + leg.amountCents, 0);
  const bpsValues = productLegs.map((l) => l.platformFeeBps).filter((b) => b > 0);
  const platformFeeBpsSnapshot =
    bpsValues.length === 1
      ? bpsValues[0]
      : bpsValues.length > 1
        ? bpsValues[0]
        : 'UNKNOWN_HISTORICAL';

  const refundCents = input.refundSummary?.refundedCents ?? 0;
  const chargebackCents = input.refundSummary?.chargebackCents ?? 0;

  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    currency: 'EUR',
    paidAt: input.paidAt?.toISOString() ?? null,
    createdAt: input.createdAt.toISOString(),
    stripeSessionId: input.stripeSessionId,
    stripePaymentReference: input.stripeSessionId,
    buyerGrossCents:
      metaSlice.buyerGrossCents !== 'UNKNOWN_HISTORICAL'
        ? metaSlice.buyerGrossCents
        : input.totalAmount,
    itemsGrossCents: metaSlice.itemsGrossCents,
    deliveryCents: metaSlice.deliveryCents,
    smsCents: metaSlice.smsCents,
    checkoutEligibleBaseCents: metaSlice.checkoutEligibleBaseCents,
    buyerProcessingSurchargeCents: metaSlice.buyerProcessingSurchargeCents,
    platformFeeCents,
    platformFeeBpsSnapshot,
    stripeFeeCents: metaSlice.buyerProcessingSurchargeCents,
    sellerGrossCents,
    sellerPayoutCents,
    refundCents,
    chargebackCents,
    vatStatus: MARKETPLACE_VAT_STATUS,
    platformRevenueBeforeVatCents: platformFeeCents,
    contributionBeforeVatDecisionCents: platformFeeCents,
    sellerLegs: input.sellerLegs,
    dac7ConsiderationCents: metaSlice.dac7ConsiderationCents,
    deliverySeparatelyReconcilable: metaSlice.deliverySeparatelyReconcilable,
  };
}

export type MarketplaceFinanceExportRow = {
  date: string;
  orderId: string;
  orderNumber: string | null;
  sellerIds: string;
  paymentReference: string | null;
  currency: 'EUR';
  buyerGrossCents: number | 'UNKNOWN_HISTORICAL';
  sellerGrossCents: number;
  platformFeeCents: number;
  stripeFeeCents: number | 'UNKNOWN_HISTORICAL';
  sellerPayoutCents: number;
  deliveryCents: number | 'UNKNOWN_HISTORICAL';
  refundCents: number;
  chargebackCents: number;
  vatStatus: typeof MARKETPLACE_VAT_STATUS;
};

export function toFinanceExportRow(record: NormalizedMarketplaceOrderFinance): MarketplaceFinanceExportRow {
  return {
    date: record.paidAt ?? record.createdAt,
    orderId: record.orderId,
    orderNumber: record.orderNumber,
    sellerIds: record.sellerLegs.map((l) => l.sellerId).join(';'),
    paymentReference: record.stripePaymentReference,
    currency: record.currency,
    buyerGrossCents: record.buyerGrossCents,
    sellerGrossCents: record.sellerGrossCents,
    platformFeeCents: record.platformFeeCents,
    stripeFeeCents: record.stripeFeeCents,
    sellerPayoutCents: record.sellerPayoutCents,
    deliveryCents: record.deliveryCents,
    refundCents: record.refundCents,
    chargebackCents: record.chargebackCents,
    vatStatus: record.vatStatus,
  };
}
