/**
 * PHASE 8B — canonical seller financial year (pure core).
 *
 * WHAT ACTUALLY HAPPENED FINANCIALLY ON HOMECHEFF, per seller, per calendar year.
 *
 * This module contains NO tax logic, NO deductibility, NO DAC7 thresholds and NO
 * reportability conclusions. It reports transaction facts only. Fiscal
 * classification is a separate, later concern (VerdienCheck rule packs).
 *
 * Recognition: a sale exists when payment succeeded, evidenced by a settlement
 * Transaction row. Order creation, order status and payouts are NOT recognition
 * events. See SELLER_FINANCIAL_SEMANTICS below.
 *
 * Pure by design: no Prisma, no clock, no env, no subscription lookup. The same
 * input always produces the same output, including event ids.
 */

export const SELLER_FINANCIAL_SCHEMA_VERSION = '8b.1';

/**
 * HomeCheff commerce is single-currency today: Stripe transfers are hardcoded
 * 'eur' and neither Order nor Transaction carries a currency column. We assert
 * rather than assume — any contrary evidence downgrades completeness.
 */
export const SELLER_FINANCIAL_CURRENCY = 'EUR';

/**
 * Canonical semantics. Names are deliberately explicit: "revenue", "earnings"
 * and "income" are banned here because they mean different things to buyers,
 * sellers, couriers and tax authorities.
 */
export const SELLER_FINANCIAL_SEMANTICS = {
  SELLER_GROSS_SALES:
    'Sum of seller consideration for settled marketplace sales recognised in the year. ' +
    'Per order line: OrderItem.priceCents x quantity, snapshotted as Transaction.amountCents. ' +
    'Excludes buyer shipping charge and the buyer-borne Stripe surcharge.',
  REFUNDS:
    'Sum of refunds recorded against this seller in the year, by refund date. ' +
    'A refund never deletes the original sale event.',
  NET_SALES:
    'SELLER_GROSS_SALES minus REFUNDS. Not clamped at zero: a year can be net ' +
    'negative when refunds exceed sales. Clamping is a fiscal decision, not a fact.',
  PLATFORM_FEES:
    'HomeCheff commission actually charged, from the settlement-time ' +
    'Transaction.platformFeeBps snapshot. Never recomputed from the current ' +
    'subscription tier. Reduced proportionally when a sale is refunded.',
  SELLER_NET_PROCEEDS:
    'NET_SALES minus net PLATFORM_FEES. What the seller economically earned ' +
    'before any of their own costs. Not the same as money transferred.',
  SHIPPING:
    'Buyer shipping charge is collected by the platform and funds the carrier ' +
    'label; it is not seller consideration and is not included.',
  STRIPE_FEE:
    'Borne by the buyer via checkout gross-up (lib/fees.ts). Neither seller ' +
    'revenue nor seller cost. Excluded.',
  PAYOUTS:
    'Transfers to the seller Connect account are cash movement, not revenue, ' +
    'and are deliberately absent from this model.',
  COURIER_DELIVERY:
    'Delivery fee earned by a courier is a different activity from selling. ' +
    'Reported separately and never summed into seller sales.',
} as const;

export type SellerFinancialEventType =
  | 'SALE'
  | 'REFUND'
  | 'PLATFORM_FEE'
  | 'PLATFORM_FEE_RELEASED';

export type SellerFinancialSource =
  | 'STRIPE_TRANSACTION'
  | 'STRIPE_REFUND'
  | 'HC_SETTLEMENT';

/** Direction is carried here so amounts can stay positive everywhere. */
export type SellerFinancialDirection = 'INCREASES_RESULT' | 'DECREASES_RESULT';

export type SellerFinancialCompleteness =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'UNSUPPORTED_SOURCE'
  | 'DATA_INCONSISTENCY';

export type SellerFinancialWarningCode =
  | 'REFUNDED_WITHOUT_REFUND_ROWS'
  | 'REFUND_EXCEEDS_SALE'
  | 'UNSETTLED_TRANSACTION_STATE'
  | 'MISSING_PLATFORM_FEE_SNAPSHOT'
  | 'NON_EUR_CURRENCY'
  | 'HC_SETTLEMENT_NOT_EARNED'
  | 'REFUND_ON_UNKNOWN_SALE_YEAR';

export type SellerFinancialWarning = {
  code: SellerFinancialWarningCode;
  transactionId: string | null;
  detail: string;
};

export type SellerFinancialEvent = {
  /** Deterministic. Same source rows always yield the same id. */
  eventId: string;
  type: SellerFinancialEventType;
  direction: SellerFinancialDirection;
  effectiveAt: Date;
  /** Calendar year of effectiveAt. */
  fiscalYear: number;
  /**
   * For refund-side events, the year the original sale was recognised.
   * Lets year-end logic choose transaction-year or sale-year treatment later
   * without this module hard-coding a tax answer.
   */
  saleYear: number | null;
  orderId: string | null;
  transactionId: string | null;
  amountCents: number;
  currency: string;
  source: SellerFinancialSource;
  provenance: 'PLATFORM_TRANSACTION';
};

export type SellerRefundInput = {
  refundId: string;
  amountCents: number;
  occurredAt: Date;
};

export type SellerSaleLegInput = {
  transactionId: string;
  orderId: string | null;
  sellerGrossCents: number;
  /** Settlement-time snapshot. Never the seller's current subscription tier. */
  platformFeeBps: number;
  status: string;
  /** Payment success moment. */
  occurredAt: Date;
  source: SellerFinancialSource;
  currency?: string | null;
  refunds: SellerRefundInput[];
};

export type CourierDeliveryLegInput = {
  transactionId: string;
  grossFeeCents: number;
  platformFeeBps: number;
  occurredAt: Date;
};

export type SellerFinancialYear = {
  schemaVersion: string;
  sellerUserId: string;
  year: number;
  currency: string;

  sellerGrossSalesCents: number;
  refundCents: number;
  netSalesCents: number;

  platformFeesChargedCents: number;
  platformFeeReleasedCents: number;
  netPlatformFeesCents: number;

  sellerNetProceedsCents: number;

  /** Refund split by the year the refunded sale was originally recognised. */
  refundOnSameYearSalesCents: number;
  refundOnPriorYearSalesCents: number;
  /** Refunds recorded in later years against sales recognised in this year. */
  laterYearRefundOnThisYearSalesCents: number;

  transactionCount: number;
  refundCount: number;

  courierDeliveryGrossCents: number;
  courierDeliveryCount: number;

  events: SellerFinancialEvent[];
  completeness: SellerFinancialCompleteness;
  warnings: SellerFinancialWarning[];
  provenance: 'PLATFORM_TRANSACTION';
};

export type BuildSellerFinancialYearInput = {
  sellerUserId: string;
  year: number;
  /**
   * Every leg that could affect this year: sales recognised in the year AND
   * sales from other years that carry a refund dated in the year.
   */
  legs: readonly SellerSaleLegInput[];
  courierLegs?: readonly CourierDeliveryLegInput[];
};

/** Calendar year in UTC, matching the existing DAC7 year bounds convention. */
export function utcYearOf(date: Date): number {
  return date.getUTCFullYear();
}

export function utcYearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
}

/** Same basis-point maths as lib/compliance/dac7-threshold.ts. */
export function platformFeeCentsFor(input: {
  amountCents: number;
  platformFeeBps: number;
}): number {
  const bps = Math.max(0, input.platformFeeBps);
  return Math.round((Math.max(0, input.amountCents) * bps) / 10_000);
}

/**
 * Proportional fee release on refund. Floor matches the reconciliation maths in
 * lib/payments/refund-settlement.ts so the derivation agrees with what the
 * refund engine actually released.
 */
export function platformFeeReleaseCentsFor(input: {
  refundCents: number;
  saleGrossCents: number;
  saleFeeCents: number;
}): number {
  if (input.refundCents <= 0 || input.saleGrossCents <= 0) return 0;
  const capped = Math.min(input.refundCents, input.saleGrossCents);
  return Math.floor((capped * input.saleFeeCents) / input.saleGrossCents);
}

const RECOGNISED_STATUSES = new Set(['CAPTURED', 'REFUNDED']);
const NON_CONSIDERATION_STATUSES = new Set(['CANCELLED', 'FAILED']);

function isNonEur(currency: string | null | undefined): boolean {
  if (currency == null) return false;
  const c = currency.trim();
  if (c === '') return false;
  return c.toUpperCase() !== SELLER_FINANCIAL_CURRENCY;
}

/**
 * Deterministic, complete, clock-free. Calling twice on unchanged data returns
 * an identical result including event ids and ordering.
 */
export function buildSellerFinancialYear(
  input: BuildSellerFinancialYearInput,
): SellerFinancialYear {
  const { sellerUserId, year } = input;
  const events: SellerFinancialEvent[] = [];
  const warnings: SellerFinancialWarning[] = [];

  let sellerGrossSalesCents = 0;
  let platformFeesChargedCents = 0;
  let transactionCount = 0;

  let refundCents = 0;
  let refundCount = 0;
  let platformFeeReleasedCents = 0;
  let refundOnSameYearSalesCents = 0;
  let refundOnPriorYearSalesCents = 0;
  let laterYearRefundOnThisYearSalesCents = 0;

  let sawNonEur = false;
  let sawInconsistency = false;
  let sawPartial = false;

  for (const leg of input.legs) {
    const status = (leg.status || '').toUpperCase();
    if (isNonEur(leg.currency)) {
      sawNonEur = true;
      warnings.push({
        code: 'NON_EUR_CURRENCY',
        transactionId: leg.transactionId,
        detail: `Transaction currency ${leg.currency} is not ${SELLER_FINANCIAL_CURRENCY}; amounts are not summable.`,
      });
    }

    if (!RECOGNISED_STATUSES.has(status)) {
      if (leg.source === 'HC_SETTLEMENT' && status === 'PENDING') {
        // HC value is captured but the seller has not earned it yet. Like a
        // pending checkout, it is not revenue — but it is worth disclosing.
        sawPartial = true;
        warnings.push({
          code: 'HC_SETTLEMENT_NOT_EARNED',
          transactionId: leg.transactionId,
          detail:
            'HC settlement exposure is still PENDING; seller entitlement is not yet earned.',
        });
      } else if (!NON_CONSIDERATION_STATUSES.has(status)) {
        // CREATED / AUTHORIZED: money state is unresolved, so a confident total
        // would be a lie. Mirrors reconcileRefundState's REVIEW_REQUIRED.
        sawInconsistency = true;
        warnings.push({
          code: 'UNSETTLED_TRANSACTION_STATE',
          transactionId: leg.transactionId,
          detail: `Transaction status ${status} is neither settled nor cancelled.`,
        });
      }
      continue;
    }

    const saleYear = utcYearOf(leg.occurredAt);
    const gross = Math.max(0, leg.sellerGrossCents);
    const saleFeeCents = platformFeeCentsFor({
      amountCents: gross,
      platformFeeBps: leg.platformFeeBps,
    });

    if (saleYear === year) {
      sellerGrossSalesCents += gross;
      transactionCount += 1;
      platformFeesChargedCents += saleFeeCents;

      events.push({
        eventId: `sale:${leg.transactionId}`,
        type: 'SALE',
        direction: 'INCREASES_RESULT',
        effectiveAt: leg.occurredAt,
        fiscalYear: saleYear,
        saleYear,
        orderId: leg.orderId,
        transactionId: leg.transactionId,
        amountCents: gross,
        currency: SELLER_FINANCIAL_CURRENCY,
        source: leg.source,
        provenance: 'PLATFORM_TRANSACTION',
      });

      if (saleFeeCents > 0) {
        events.push({
          eventId: `fee:${leg.transactionId}`,
          type: 'PLATFORM_FEE',
          direction: 'DECREASES_RESULT',
          effectiveAt: leg.occurredAt,
          fiscalYear: saleYear,
          saleYear,
          orderId: leg.orderId,
          transactionId: leg.transactionId,
          amountCents: saleFeeCents,
          currency: SELLER_FINANCIAL_CURRENCY,
          source: leg.source,
          provenance: 'PLATFORM_TRANSACTION',
        });
      } else if (leg.source !== 'HC_SETTLEMENT' && gross > 0) {
        sawPartial = true;
        warnings.push({
          code: 'MISSING_PLATFORM_FEE_SNAPSHOT',
          transactionId: leg.transactionId,
          detail:
            'Settled sale has no platform fee snapshot; commission cannot be stated for this leg.',
        });
      }
    }

    const linkedRefundCents = leg.refunds.reduce(
      (sum, r) => sum + Math.max(0, r.amountCents),
      0,
    );
    if (status === 'REFUNDED' && linkedRefundCents <= 0) {
      sawPartial = true;
      warnings.push({
        code: 'REFUNDED_WITHOUT_REFUND_ROWS',
        transactionId: leg.transactionId,
        detail: 'Transaction is marked REFUNDED but carries no Refund rows.',
      });
    }
    if (linkedRefundCents > gross + 1) {
      sawInconsistency = true;
      warnings.push({
        code: 'REFUND_EXCEEDS_SALE',
        transactionId: leg.transactionId,
        detail: `Linked refunds ${linkedRefundCents} exceed sale ${gross}.`,
      });
    }

    // A sale can carry several refund rows. Each release is capped against the
    // sale, but the releases together must also not exceed the fee that was
    // charged in the first place, so track what this leg has given back across
    // all its refunds — in date order, so the cap falls deterministically on
    // the later ones regardless of which year is being reported.
    let legFeeReleased = 0;
    const orderedRefunds = [...leg.refunds].sort((a, b) => {
      const t = a.occurredAt.getTime() - b.occurredAt.getTime();
      return t !== 0 ? t : a.refundId < b.refundId ? -1 : 1;
    });

    for (const refund of orderedRefunds) {
      const amount = Math.max(0, refund.amountCents);
      if (amount <= 0) continue;
      const refundYear = utcYearOf(refund.occurredAt);

      const release = Math.min(
        platformFeeReleaseCentsFor({
          refundCents: amount,
          saleGrossCents: gross,
          saleFeeCents,
        }),
        Math.max(0, saleFeeCents - legFeeReleased),
      );
      legFeeReleased += release;

      if (refundYear === year) {
        refundCents += amount;
        refundCount += 1;
        if (saleYear === year) {
          refundOnSameYearSalesCents += amount;
        } else {
          refundOnPriorYearSalesCents += amount;
        }

        platformFeeReleasedCents += release;

        events.push({
          eventId: `refund:${refund.refundId}`,
          type: 'REFUND',
          direction: 'DECREASES_RESULT',
          effectiveAt: refund.occurredAt,
          fiscalYear: refundYear,
          saleYear,
          orderId: leg.orderId,
          transactionId: leg.transactionId,
          amountCents: amount,
          currency: SELLER_FINANCIAL_CURRENCY,
          source: 'STRIPE_REFUND',
          provenance: 'PLATFORM_TRANSACTION',
        });

        if (release > 0) {
          events.push({
            eventId: `feerelease:${refund.refundId}`,
            type: 'PLATFORM_FEE_RELEASED',
            direction: 'INCREASES_RESULT',
            effectiveAt: refund.occurredAt,
            fiscalYear: refundYear,
            saleYear,
            orderId: leg.orderId,
            transactionId: leg.transactionId,
            amountCents: release,
            currency: SELLER_FINANCIAL_CURRENCY,
            source: 'STRIPE_REFUND',
            provenance: 'PLATFORM_TRANSACTION',
          });
        }
      } else if (saleYear === year && refundYear > year) {
        // Visible so a later year-end close can reconcile on a sale-year basis.
        // Deliberately NOT subtracted from this year's factual totals.
        laterYearRefundOnThisYearSalesCents += amount;
      }
    }
  }

  let courierDeliveryGrossCents = 0;
  let courierDeliveryCount = 0;
  for (const leg of input.courierLegs ?? []) {
    if (utcYearOf(leg.occurredAt) !== year) continue;
    courierDeliveryGrossCents += Math.max(0, leg.grossFeeCents);
    courierDeliveryCount += 1;
  }

  const netSalesCents = sellerGrossSalesCents - refundCents;
  const netPlatformFeesCents =
    platformFeesChargedCents - platformFeeReleasedCents;
  const sellerNetProceedsCents = netSalesCents - netPlatformFeesCents;

  let completeness: SellerFinancialCompleteness = 'COMPLETE';
  if (sawNonEur) completeness = 'UNSUPPORTED_SOURCE';
  else if (sawInconsistency) completeness = 'DATA_INCONSISTENCY';
  else if (sawPartial) completeness = 'PARTIAL';

  events.sort((a, b) => {
    const t = a.effectiveAt.getTime() - b.effectiveAt.getTime();
    if (t !== 0) return t;
    return a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0;
  });

  return {
    schemaVersion: SELLER_FINANCIAL_SCHEMA_VERSION,
    sellerUserId,
    year,
    currency: SELLER_FINANCIAL_CURRENCY,
    sellerGrossSalesCents,
    refundCents,
    netSalesCents,
    platformFeesChargedCents,
    platformFeeReleasedCents,
    netPlatformFeesCents,
    sellerNetProceedsCents,
    refundOnSameYearSalesCents,
    refundOnPriorYearSalesCents,
    laterYearRefundOnThisYearSalesCents,
    transactionCount,
    refundCount,
    courierDeliveryGrossCents,
    courierDeliveryCount,
    events,
    completeness,
    warnings,
    provenance: 'PLATFORM_TRANSACTION',
  };
}

/**
 * Settlement ids are `txn_{orderId}_{productId}` (lib/payments/seller-settlement.ts),
 * where both ids are uuids and therefore contain no underscore. Returns null
 * rather than guessing when the shape does not match — a wrong order id on a
 * financial event is worse than an absent one.
 */
export function orderIdFromTransactionId(transactionId: string): string | null {
  if (!transactionId.startsWith('txn_')) return null;
  const parts = transactionId.slice('txn_'.length).split('_');
  if (parts.length !== 2) return null;
  return UUID_RE.test(parts[0]) ? parts[0] : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a total may be shown to a seller as a factual figure. */
export function financialYearIsDisplayable(
  result: SellerFinancialYear,
): boolean {
  return (
    result.completeness === 'COMPLETE' || result.completeness === 'PARTIAL'
  );
}
