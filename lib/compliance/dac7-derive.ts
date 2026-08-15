/**
 * LEGAL-4A — derive DAC7 year money events from existing Order/Transaction/Refund.
 * CommunityOrder without payment is excluded.
 */

import { prisma } from '@/lib/prisma';
import {
  classifyDac7ActivityFromMarketplaceCategory,
  type Dac7ActivityCategory,
} from '@/lib/compliance/dac7-activity';
import {
  buildGoodsYearTotals,
  computePlatformFeesCents,
  type Dac7GoodsYearTotals,
} from '@/lib/compliance/dac7-threshold';
import { reconcileRefundState } from '@/lib/compliance/refund-reconciliation';

function yearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
}

export type SellerDac7YearDerive = {
  sellerUserId: string;
  year: number;
  goods: Dac7GoodsYearTotals;
  personalService: {
    transactionCount: number;
    grossConsiderationCents: number;
    refundCents: number;
    netConsiderationCents: number;
    platformFeesCents: number;
  };
  ambiguousOrReviewGrossCents: number;
  primaryActivity: Dac7ActivityCategory;
  hasAmbiguousActivity: boolean;
  refundReconciliation: ReturnType<typeof reconcileRefundState>;
};

/**
 * Aggregate captured Stripe-backed OrderItems for a seller in a calendar year.
 * Uses Product taxonomy for activity class. Refunds from Refund rows on seller Transactions.
 */
export async function deriveSellerDac7Year(
  sellerUserId: string,
  year: number,
): Promise<SellerDac7YearDerive> {
  const { start, end } = yearBounds(year);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      Product: { seller: { userId: sellerUserId } },
      Order: {
        createdAt: { gte: start, lt: end },
        stripeSessionId: { not: null },
        status: { notIn: ['CANCELLED', 'PENDING'] },
      },
    },
    select: {
      quantity: true,
      priceCents: true,
      Product: {
        select: {
          marketplaceCategory: true,
          category: true,
          priceModel: true,
          barterOpenness: true,
        },
      },
      Order: { select: { id: true, status: true } },
    },
    take: 5000,
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      sellerId: sellerUserId,
      createdAt: { gte: start, lt: end },
      status: { in: ['CAPTURED', 'REFUNDED'] },
    },
    select: {
      id: true,
      amountCents: true,
      platformFeeBps: true,
      status: true,
      Refund: { select: { amountCents: true } },
    },
    take: 5000,
  });

  let goodsCount = 0;
  let goodsGross = 0;
  let goodsFees = 0;
  let serviceCount = 0;
  let serviceGross = 0;
  let serviceFees = 0;
  let ambiguousGross = 0;
  let hasAmbiguous = false;

  // Prefer OrderItem taxonomy for activity split; fee estimate uses default 12% (1200 bps)
  // when item-level fee unknown — Transaction.platformFeeBps used for fee totals below.
  const DEFAULT_FEE_BPS = 1200;

  for (const item of orderItems) {
    const line = item.priceCents * item.quantity;
    // Free / zero / non-captured monetary lines are not consideration.
    if (line <= 0) continue;
    const barter = (item.Product.barterOpenness || 'MONEY').toUpperCase();
    if (barter === 'BARTER_ONLY') {
      // Non-monetary — do not invent EUR; flag via ambiguous/review path for counsel valuation.
      hasAmbiguous = true;
      continue;
    }
    const cat = classifyDac7ActivityFromMarketplaceCategory(
      item.Product.marketplaceCategory,
      item.Product.category,
    );
    const fee = computePlatformFeesCents({
      amountCents: line,
      platformFeeBps: DEFAULT_FEE_BPS,
    });
    if (cat === 'GOODS') {
      goodsCount += 1;
      goodsGross += line;
      goodsFees += fee;
    } else if (cat === 'PERSONAL_SERVICE') {
      serviceCount += 1;
      serviceGross += line;
      serviceFees += fee;
    } else {
      hasAmbiguous = true;
      ambiguousGross += line;
    }
  }

  let refundCents = 0;
  const reconEvents = transactions.map((t) => {
    const linked = t.Refund.reduce((s, r) => s + r.amountCents, 0);
    refundCents += linked;
    return {
      amountCents: t.amountCents,
      status: t.status,
      refundCentsLinked: linked,
    };
  });

  // Allocate refunds proportionally across gross buckets when only seller-level refunds exist
  const totalGross = goodsGross + serviceGross + ambiguousGross;
  const goodsRefund =
    totalGross > 0 ? Math.round((refundCents * goodsGross) / totalGross) : 0;
  const serviceRefund =
    totalGross > 0 ? Math.round((refundCents * serviceGross) / totalGross) : 0;

  // Prefer Transaction fee sum when available
  const txFees = transactions.reduce(
    (s, t) =>
      s +
      computePlatformFeesCents({
        amountCents: t.amountCents,
        platformFeeBps: t.platformFeeBps,
      }),
    0,
  );
  if (txFees > 0 && totalGross > 0) {
    goodsFees = Math.round((txFees * goodsGross) / totalGross);
    serviceFees = Math.round((txFees * serviceGross) / totalGross);
  }

  const goods = buildGoodsYearTotals({
    year,
    transactionCount: goodsCount,
    grossConsiderationCents: goodsGross,
    refundCents: goodsRefund,
    platformFeesCents: goodsFees,
  });

  const personalService = {
    transactionCount: serviceCount,
    grossConsiderationCents: serviceGross,
    refundCents: serviceRefund,
    netConsiderationCents: Math.max(0, serviceGross - serviceRefund),
    platformFeesCents: serviceFees,
  };

  let primaryActivity: Dac7ActivityCategory = 'OTHER_NON_REPORTABLE_OR_REVIEW';
  if (goodsGross >= serviceGross && goodsGross >= ambiguousGross && goodsCount > 0) {
    primaryActivity = 'GOODS';
  } else if (serviceGross > goodsGross && serviceCount > 0) {
    primaryActivity = 'PERSONAL_SERVICE';
  } else if (hasAmbiguous || ambiguousGross > 0) {
    primaryActivity = 'OTHER_NON_REPORTABLE_OR_REVIEW';
  } else if (goodsCount > 0) {
    primaryActivity = 'GOODS';
  } else if (serviceCount > 0) {
    primaryActivity = 'PERSONAL_SERVICE';
  }

  return {
    sellerUserId,
    year,
    goods,
    personalService,
    ambiguousOrReviewGrossCents: ambiguousGross,
    primaryActivity,
    hasAmbiguousActivity: hasAmbiguous,
    refundReconciliation: reconcileRefundState(reconEvents),
  };
}
