/**
 * LEGAL-4A — derive DAC7 year money events from existing Order/Transaction/Refund.
 * CommunityOrder without payment is excluded.
 *
 * ARCHITECTURE BOUNDARY (Phase 8B)
 * DAC7 reportability is a platform *reporting* obligation. It does NOT
 * determine income-tax liability, entrepreneur status, VAT status or the
 * deductibility of any cost. This module therefore owns thresholds,
 * reportability and activity classification only; the underlying transaction
 * facts and money maths live in lib/finance/seller-financial-year.ts, which is
 * deliberately free of any fiscal conclusion.
 *
 * Refund attribution differs from the financial derivation on purpose. DAC7
 * reports consideration *for* a reporting year, so a refund reduces the year of
 * the original sale. The financial derivation books a refund in the year it
 * occurred and keeps the sale year as provenance. Both are correct for their
 * own question; neither may be substituted for the other.
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
import { utcYearBounds } from '@/lib/finance/seller-financial-year';

/** Shared with the canonical financial derivation so year edges cannot drift. */
const yearBounds = utcYearBounds;

/** Paged to completion: a truncated compliance total is a reporting defect. */
const PAGE_SIZE = 500;

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

  const orderItems: Array<{
    quantity: number;
    priceCents: number;
    Product: {
      marketplaceCategory: string | null;
      category: string;
      priceModel: string;
      barterOpenness: string | null;
    };
    Order: { id: string; status: string };
  }> = [];
  for (let cursor: string | null = null; ; ) {
    const page = await prisma.orderItem.findMany({
      where: {
        Product: { seller: { userId: sellerUserId } },
        Order: {
          createdAt: { gte: start, lt: end },
          stripeSessionId: { not: null },
          status: { notIn: ['CANCELLED', 'PENDING'] },
        },
      },
      select: {
        id: true,
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
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    orderItems.push(...(page as unknown as typeof orderItems));
    if (page.length < PAGE_SIZE) break;
    cursor = page[page.length - 1].id;
  }

  const transactions: Array<{
    id: string;
    amountCents: number;
    platformFeeBps: number;
    status: string;
    Refund: Array<{ amountCents: number }>;
  }> = [];
  for (let cursor: string | null = null; ; ) {
    const page = await prisma.transaction.findMany({
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
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    transactions.push(...page);
    if (page.length < PAGE_SIZE) break;
    cursor = page[page.length - 1].id;
  }

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
