/**
 * Canonical marketplace refund + Connect transfer-reversal engine.
 *
 * Buyer refund (PaymentIntent/Charge) and connected-account transfer reversal
 * are SEPARATE financial operations. SCT refunds do NOT auto-reverse transfers.
 *
 * Official Stripe (Separate Charges and Transfers):
 * https://docs.stripe.com/connect/separate-charges-and-transfers#issue-refunds
 * https://docs.stripe.com/api/transfer_reversals/create
 * https://docs.stripe.com/refunds (Stripe processing fees are NOT returned)
 *
 * Operation order (OPTION C):
 *   persist plan → reverse recipient transfers → buyer refund → finalize ledger
 *
 * dryRun / plan-only never mutates Stripe.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  isSuccessfulTransferRef,
  sellerPayoutId,
  sellerTransactionId,
} from '@/lib/payments/seller-settlement';
import { calculatePlatformFeeCents, calculateStripeFeeForBuyer } from '@/lib/fees';

export const REFUND_SETTLEMENT_SCHEMA_VERSION = 1;

export type RefundMode =
  | 'FULL_BUYER_GROSS'
  | 'SELLER_CONSIDERATION'
  | 'EXPLICIT_ALLOCATION';

export type RefundSettlementStatus =
  | 'PLANNED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'NEEDS_ATTENTION'
  | 'FAILED';

export type SellerLegSnapshot = {
  productId: string;
  sellerUserId: string;
  transactionId: string;
  payoutId: string;
  sellerGrossCents: number;
  platformFeeCents: number;
  sellerNetCents: number;
  transferId: string | null;
  alreadyReversedCents: number;
  remainingReversibleCents: number;
};

export type SellerAllocationInput = {
  productId: string;
  /** Seller consideration (item price × qty) portion being refunded this request */
  sellerConsiderationCents: number;
};

export type RefundPlanRequest = {
  orderId: string;
  mode: RefundMode;
  /**
   * For SELLER_CONSIDERATION / EXPLICIT_ALLOCATION:
   * per-product seller consideration to refund this request.
   * For FULL_BUYER_GROSS: ignored (all remaining seller consideration).
   */
  allocations?: SellerAllocationInput[];
  /**
   * Optional override of buyer refund cents.
   * When omitted:
   * - FULL_BUYER_GROSS → remaining refundable buyer gross
   * - SELLER_CONSIDERATION → sum(allocations) only (surcharge NOT included)
   */
  buyerRefundCentsOverride?: number | null;
  /** Include buyer payment surcharge in buyer refund (FULL only when true explicitly) */
  includeBuyerSurcharge?: boolean | null;
  /** Include courier/delivery consideration in this refund allocation */
  includeCourierCents?: number | null;
  reason?: string | null;
  createdByAdminId?: string | null;
  /**
   * Prior cumulative seller-consideration refunded per product (from ledger).
   * When omitted, derived from RefundSettlement history.
   */
  priorSellerConsiderationRefundedByProduct?: Record<string, number>;
  priorBuyerRefundedCents?: number;
  priorCourierReversedCents?: number;
};

export type SellerReversalLegPlan = {
  kind: 'SELLER';
  productId: string;
  sellerUserId: string;
  transactionId: string;
  payoutId: string;
  transferId: string | null;
  sellerGrossCents: number;
  platformFeeCents: number;
  sellerNetCents: number;
  sellerConsiderationRefundCents: number;
  transferReversalCents: number;
  alreadyReversedCents: number;
  remainingAfterCents: number;
  idempotencyKey: string;
  status: 'PLANNED' | 'SKIPPED_NO_TRANSFER' | 'SKIPPED_ZERO';
};

export type CourierReversalLegPlan = {
  kind: 'COURIER';
  transactionId: string | null;
  payoutId: string | null;
  transferId: string | null;
  courierConsiderationRefundCents: number;
  transferReversalCents: number;
  note: string;
  idempotencyKey: string;
  status: 'PLANNED' | 'LEDGER_ONLY' | 'SKIPPED_ZERO' | 'POLICY_REQUIRED';
};

export type AffiliateReversalLegPlan = {
  kind: 'AFFILIATE';
  /** Ledger-only when commission funded from platform fee and unpaid via Connect transfer */
  treatment: 'LEDGER_PROPORTIONAL' | 'NONE';
  estimatedReversalCents: number;
  note: string;
  status: 'PLANNED' | 'SKIPPED_ZERO';
};

export type RefundPlan = {
  schemaVersion: number;
  orderId: string;
  mode: RefundMode;
  currency: 'eur';
  originalBuyerGrossCents: number;
  originalBuyerSurchargeCents: number;
  originalStripeFeeEstimatedCents: number;
  stripeFeeRefundTreatment:
    | 'NOT_RETURNED_PER_STRIPE_DOCS'
    | 'UNKNOWN_ACCOUNT_SPECIFIC';
  priorBuyerRefundedCents: number;
  remainingBuyerRefundableCents: number;
  buyerRefundCents: number;
  buyerRefundIdempotencyKey: string;
  sellerLegs: SellerReversalLegPlan[];
  courierLeg: CourierReversalLegPlan | null;
  affiliateLeg: AffiliateReversalLegPlan;
  totals: {
    sellerReversalCents: number;
    courierReversalCents: number;
    affiliateReversalCents: number;
    /** Platform cash impact estimate: buyer refund − recovered reversals (Stripe fee retained by Stripe) */
    platformEconomicImpactCents: number;
  };
  policyFlags: string[];
  reconciliation: {
    ORIGINAL_BUYER_GROSS: number;
    ORIGINAL_STRIPE_FEE_EST: number;
    ORIGINAL_SELLER_GROSS: number;
    ORIGINAL_PLATFORM_FEE: number;
    ORIGINAL_SELLER_TRANSFER: number;
    ORIGINAL_AFFILIATE: number;
    ORIGINAL_COURIER: number;
    BUYER_REFUND: number;
    SELLER_REVERSAL: number;
    AFFILIATE_REVERSAL: number;
    COURIER_REVERSAL: number;
    PLATFORM_REFUND_COST: number;
    REMAINING_SELLER_ENTITLEMENT: number;
    UNRECONCILED: number;
  };
  warnings: string[];
};

export type ExecuteRefundOptions = {
  stripe: Stripe;
  plan: RefundPlan;
  /** Must be true to call Stripe.mutate APIs */
  confirmLiveMutation: boolean;
  /** Persist durable RefundSettlement row */
  persist?: boolean;
  settlementId?: string;
  reason?: string | null;
  createdByAdminId?: string | null;
};

export type ExecuteRefundResult = {
  settlementId: string;
  status: RefundSettlementStatus;
  plan: RefundPlan;
  stripeRefundId: string | null;
  sellerReversals: Array<{
    productId: string;
    transferId: string | null;
    reversalId: string | null;
    amountCents: number;
    status: string;
    error?: string;
  }>;
  courierReversal: {
    status: string;
    reversalId: string | null;
    amountCents: number;
    error?: string;
  } | null;
  affiliate: { status: string; reversedCount?: number; error?: string };
  errors: string[];
};

/**
 * Deterministic floor proportional share.
 * cumulativeDesired = floor(cumConsiderationRefunded * transfer / gross)
 * thisLeg = cumulativeDesired - alreadyReversed
 */
export function cumulativeProportionalReversalCents(args: {
  sellerGrossCents: number;
  transferCents: number;
  priorConsiderationRefundedCents: number;
  thisConsiderationRefundCents: number;
  alreadyReversedCents: number;
}): number {
  const {
    sellerGrossCents,
    transferCents,
    priorConsiderationRefundedCents,
    thisConsiderationRefundCents,
    alreadyReversedCents,
  } = args;

  if (
    sellerGrossCents <= 0 ||
    transferCents <= 0 ||
    thisConsiderationRefundCents <= 0
  ) {
    return 0;
  }

  const cumConsideration = Math.min(
    sellerGrossCents,
    priorConsiderationRefundedCents + thisConsiderationRefundCents,
  );
  const cumulativeDesired = Math.floor(
    (cumConsideration * transferCents) / sellerGrossCents,
  );
  const cappedDesired = Math.min(transferCents, cumulativeDesired);
  const remaining = Math.max(0, transferCents - alreadyReversedCents);
  return Math.max(0, Math.min(remaining, cappedDesired - alreadyReversedCents));
}

export function buyerRefundIdempotencyKey(
  orderId: string,
  buyerRefundCents: number,
  sequenceHint: string,
): string {
  return `hc_buyer_refund_${orderId}_${buyerRefundCents}_${sequenceHint}`;
}

export function sellerReversalIdempotencyKey(
  orderId: string,
  productId: string,
  transferId: string,
  reversalCents: number,
  sequenceHint: string,
): string {
  return `hc_tr_rev_${orderId}_${productId}_${transferId}_${reversalCents}_${sequenceHint}`;
}

export function courierReversalIdempotencyKey(
  orderId: string,
  payoutId: string,
  reversalCents: number,
  sequenceHint: string,
): string {
  return `hc_courier_rev_${orderId}_${payoutId}_${reversalCents}_${sequenceHint}`;
}

function sequenceHintFromPrior(priorBuyerRefundedCents: number): string {
  return `p${priorBuyerRefundedCents}`;
}

async function loadOrderSettlementContext(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: { select: { id: true, stripeConnectAccountId: true } },
                },
              },
            },
          },
        },
      },
      deliveryOrder: {
        select: {
          id: true,
          quotedFeeCents: true,
          deliveryFee: true,
          deliveryProfileId: true,
        },
      },
    },
  });
  if (!order) return null;

  const sellerLegs: SellerLegSnapshot[] = [];
  for (const item of order.items) {
    const sellerUserId = item.Product?.seller?.User?.id;
    if (!sellerUserId) continue;
    const productId = item.productId;
    const sellerGrossCents = item.priceCents * item.quantity;
    const transactionId = sellerTransactionId(orderId, productId);
    const payoutId = sellerPayoutId(orderId, productId);
    const [transaction, payout] = await Promise.all([
      prisma.transaction.findUnique({ where: { id: transactionId } }),
      prisma.payout.findUnique({ where: { id: payoutId } }),
    ]);

    const platformFeeBps = transaction?.platformFeeBps ?? 1200;
    const platformFeeCents =
      transaction != null
        ? calculatePlatformFeeCents(sellerGrossCents, platformFeeBps / 100)
        : calculatePlatformFeeCents(sellerGrossCents, 12);
    const sellerNetCents = Math.max(0, sellerGrossCents - platformFeeCents);
    const transferId = isSuccessfulTransferRef(payout?.providerRef)
      ? payout!.providerRef!
      : null;

    let alreadyReversedCents = 0;
    if (transferId) {
      const priorSettlements = await prisma.refundSettlement.findMany({
        where: {
          orderId,
          status: { in: ['COMPLETED', 'NEEDS_ATTENTION', 'EXECUTING'] },
        },
        select: { resultJson: true, planJson: true },
      });
      for (const row of priorSettlements) {
        try {
          const result = row.resultJson ? JSON.parse(row.resultJson) : null;
          const fromResult = result?.sellerReversals?.find(
            (r: { productId: string; amountCents?: number; status?: string }) =>
              r.productId === productId &&
              (r.status === 'SUCCEEDED' || r.status === 'ALREADY_DONE'),
          );
          if (fromResult?.amountCents) {
            alreadyReversedCents += Number(fromResult.amountCents) || 0;
          }
        } catch {
          /* ignore corrupt */
        }
      }
      // Also count Refund rows that store transfer reversal ids (webhook path)
      if (transaction) {
        const reversalRefunds = await prisma.refund.findMany({
          where: {
            transactionId: transaction.id,
            providerRef: { startsWith: 'trr_' },
          },
          select: { amountCents: true },
        });
        const fromWebhook = reversalRefunds.reduce(
          (s, r) => s + r.amountCents,
          0,
        );
        alreadyReversedCents = Math.max(alreadyReversedCents, fromWebhook);
      }
    }

    const transferAmount = payout?.amountCents ?? sellerNetCents;
    sellerLegs.push({
      productId,
      sellerUserId,
      transactionId,
      payoutId,
      sellerGrossCents,
      platformFeeCents,
      sellerNetCents: transferId
        ? transferAmount
        : sellerNetCents,
      transferId,
      alreadyReversedCents: Math.min(
        alreadyReversedCents,
        transferId ? transferAmount : 0,
      ),
      remainingReversibleCents: Math.max(
        0,
        (transferId ? transferAmount : 0) - alreadyReversedCents,
      ),
    });
  }

  // Prior buyer refunds: Refund rows on seller txns + RefundSettlement
  let priorBuyerRefundedCents = 0;
  const buyerRefundRows = await prisma.refundSettlement.findMany({
    where: {
      orderId,
      status: { in: ['COMPLETED', 'NEEDS_ATTENTION'] },
    },
    select: { buyerRefundCents: true, stripeRefundId: true },
  });
  for (const row of buyerRefundRows) {
    if (row.stripeRefundId) priorBuyerRefundedCents += row.buyerRefundCents;
  }
  // Fallback: sum Refund providerRef re_* on order transactions
  if (priorBuyerRefundedCents === 0) {
    const txnIds = sellerLegs.map((l) => l.transactionId);
    if (txnIds.length) {
      const refunds = await prisma.refund.findMany({
        where: {
          transactionId: { in: txnIds },
          OR: [
            { providerRef: { startsWith: 're_' } },
            { providerRef: { startsWith: 'pyr_' } },
          ],
        },
        select: { amountCents: true },
      });
      priorBuyerRefundedCents = refunds.reduce((s, r) => s + r.amountCents, 0);
    }
  }

  // Courier payout (ledger; usually no Stripe transfer)
  let courier: {
    transactionId: string | null;
    payoutId: string | null;
    transferId: string | null;
    amountCents: number;
  } | null = null;
  if (order.deliveryOrder?.id) {
    const deliveryTxnId = `txn_delivery_${order.deliveryOrder.id}`;
    const deliveryPayoutId = `payout_delivery_${order.deliveryOrder.id}`;
    const payout = await prisma.payout.findFirst({
      where: {
        OR: [{ id: deliveryPayoutId }, { transactionId: deliveryTxnId }],
      },
    });
    if (payout) {
      courier = {
        transactionId: payout.transactionId,
        payoutId: payout.id,
        transferId: isSuccessfulTransferRef(payout.providerRef)
          ? payout.providerRef!
          : null,
        amountCents: payout.amountCents,
      };
    }
  }

  // Affiliate accrued (ORDER_PAID positive)
  const affiliateLedgers = await prisma.commissionLedger.findMany({
    where: {
      eventType: 'ORDER_PAID',
      status: { in: ['PENDING', 'AVAILABLE', 'PAID', 'REVERSED'] },
      meta: { path: ['orderId'], equals: orderId },
    },
    select: { amountCents: true, status: true },
  });
  const affiliateAccruedCents = affiliateLedgers
    .filter((l) => l.status !== 'REVERSED' && l.amountCents > 0)
    .reduce((s, l) => s + l.amountCents, 0);

  const sellerGrossTotal = sellerLegs.reduce(
    (s, l) => s + l.sellerGrossCents,
    0,
  );
  const surchargeCalc = calculateStripeFeeForBuyer(sellerGrossTotal);
  const originalBuyerSurchargeCents = Math.max(
    0,
    order.totalAmount - sellerGrossTotal - (order.shippingCostCents ?? 0),
  );

  return {
    order,
    sellerLegs,
    courier,
    affiliateAccruedCents,
    priorBuyerRefundedCents,
    sellerGrossTotal,
    estimatedStripeFeeFromBuyerFormula: surchargeCalc.stripeFeeCents,
    originalBuyerSurchargeCents,
  };
}

async function priorConsiderationByProduct(
  orderId: string,
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const rows = await prisma.refundSettlement.findMany({
    where: {
      orderId,
      status: { in: ['COMPLETED', 'NEEDS_ATTENTION', 'EXECUTING'] },
    },
    select: { planJson: true },
  });
  for (const row of rows) {
    try {
      const plan = JSON.parse(row.planJson) as RefundPlan;
      for (const leg of plan.sellerLegs || []) {
        out[leg.productId] =
          (out[leg.productId] || 0) +
          (leg.sellerConsiderationRefundCents || 0);
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

/**
 * Build a read-only refund/reversal plan for an order.
 * Never calls Stripe mutate APIs.
 */
export async function planRefundSettlement(
  request: RefundPlanRequest,
): Promise<RefundPlan> {
  const ctx = await loadOrderSettlementContext(request.orderId);
  if (!ctx) {
    throw new Error(`Order not found: ${request.orderId}`);
  }

  const priorByProduct =
    request.priorSellerConsiderationRefundedByProduct ??
    (await priorConsiderationByProduct(request.orderId));
  const priorBuyer =
    request.priorBuyerRefundedCents ?? ctx.priorBuyerRefundedCents;
  const remainingBuyer = Math.max(0, ctx.order.totalAmount - priorBuyer);

  const policyFlags: string[] = [
    'BUYER_SURCHARGE_POLICY_FROM_CODE: admin/mode-driven; FULL_BUYER_GROSS refunds remaining buyer gross including surcharge; SELLER_CONSIDERATION excludes surcharge unless override',
    'BUYER_SURCHARGE_POLICY_FROM_TERMS: POLICY_REQUIRED / AMBIGUOUS',
    'STRIPE_PROCESSING_FEE: NOT_RETURNED_PER_STRIPE_DOCS (docs.stripe.com/refunds)',
    'PLATFORM_FEE_ON_SELLER: retained by platform unless buyer refund exceeds recovered reversals',
    'AFFILIATE: funded from platform fee share; ledger proportional reversal via processCommissionReversal',
    'COURIER: POLICY_REQUIRED for performed vs not-performed delivery; engine supports allocation when includeCourierCents set',
    'INVENTORY: not auto-restored by refund engine',
    'DISPUTES: chargeback after transfer remains open P0 — same economic exposure; not solved by this engine alone',
  ];
  const warnings: string[] = [];

  // Resolve per-product consideration refunds this request
  const considerationThis: Record<string, number> = {};
  if (request.mode === 'FULL_BUYER_GROSS') {
    for (const leg of ctx.sellerLegs) {
      const prior = priorByProduct[leg.productId] || 0;
      considerationThis[leg.productId] = Math.max(
        0,
        leg.sellerGrossCents - prior,
      );
    }
  } else if (
    request.mode === 'SELLER_CONSIDERATION' ||
    request.mode === 'EXPLICIT_ALLOCATION'
  ) {
    if (!request.allocations?.length) {
      throw new Error(
        `${request.mode} requires allocations[{ productId, sellerConsiderationCents }]`,
      );
    }
    for (const a of request.allocations) {
      const leg = ctx.sellerLegs.find((l) => l.productId === a.productId);
      if (!leg) {
        throw new Error(`Unknown productId in allocation: ${a.productId}`);
      }
      const prior = priorByProduct[a.productId] || 0;
      const maxRemaining = Math.max(0, leg.sellerGrossCents - prior);
      if (a.sellerConsiderationCents > maxRemaining) {
        throw new Error(
          `Allocation ${a.productId} exceeds remaining seller consideration (${a.sellerConsiderationCents} > ${maxRemaining})`,
        );
      }
      if (a.sellerConsiderationCents < 0) {
        throw new Error('sellerConsiderationCents must be >= 0');
      }
      considerationThis[a.productId] = a.sellerConsiderationCents;
    }
  }

  const sellerPlanLegs: SellerReversalLegPlan[] = [];
  let totalSellerReversal = 0;
  let totalConsiderationThis = 0;
  let originalSellerTransfer = 0;
  let originalPlatformFee = 0;
  let remainingSellerEntitlement = 0;

  const seq = sequenceHintFromPrior(priorBuyer);

  for (const leg of ctx.sellerLegs) {
    const thisConsideration = considerationThis[leg.productId] || 0;
    totalConsiderationThis += thisConsideration;
    originalSellerTransfer += leg.transferId ? leg.sellerNetCents : 0;
    originalPlatformFee += leg.platformFeeCents;

    const transferCents = leg.transferId ? leg.sellerNetCents : 0;
    const reversalCents = cumulativeProportionalReversalCents({
      sellerGrossCents: leg.sellerGrossCents,
      transferCents,
      priorConsiderationRefundedCents: priorByProduct[leg.productId] || 0,
      thisConsiderationRefundCents: thisConsideration,
      alreadyReversedCents: leg.alreadyReversedCents,
    });

    totalSellerReversal += reversalCents;
    const remainingAfter = Math.max(
      0,
      transferCents - leg.alreadyReversedCents - reversalCents,
    );
    remainingSellerEntitlement += remainingAfter;

    let status: SellerReversalLegPlan['status'] = 'PLANNED';
    if (!leg.transferId) status = 'SKIPPED_NO_TRANSFER';
    else if (reversalCents <= 0) status = 'SKIPPED_ZERO';

    sellerPlanLegs.push({
      kind: 'SELLER',
      productId: leg.productId,
      sellerUserId: leg.sellerUserId,
      transactionId: leg.transactionId,
      payoutId: leg.payoutId,
      transferId: leg.transferId,
      sellerGrossCents: leg.sellerGrossCents,
      platformFeeCents: leg.platformFeeCents,
      sellerNetCents: leg.sellerNetCents,
      sellerConsiderationRefundCents: thisConsideration,
      transferReversalCents: reversalCents,
      alreadyReversedCents: leg.alreadyReversedCents,
      remainingAfterCents: remainingAfter,
      idempotencyKey: leg.transferId
        ? sellerReversalIdempotencyKey(
            request.orderId,
            leg.productId,
            leg.transferId,
            reversalCents,
            seq,
          )
        : `hc_tr_rev_skip_${request.orderId}_${leg.productId}`,
      status,
    });
  }

  // Buyer refund amount
  let buyerRefundCents: number;
  if (
    typeof request.buyerRefundCentsOverride === 'number' &&
    Number.isFinite(request.buyerRefundCentsOverride)
  ) {
    buyerRefundCents = Math.round(request.buyerRefundCentsOverride);
  } else if (request.mode === 'FULL_BUYER_GROSS') {
    buyerRefundCents = remainingBuyer;
  } else {
    // Seller consideration only — surcharge excluded (policy-safe default)
    buyerRefundCents = totalConsiderationThis;
    if (request.includeBuyerSurcharge === true) {
      policyFlags.push(
        'POLICY_GAP: includeBuyerSurcharge=true without Terms clarity',
      );
      const surchargeRemaining = Math.max(
        0,
        ctx.originalBuyerSurchargeCents -
          Math.max(0, priorBuyer - ctx.sellerGrossTotal),
      );
      buyerRefundCents = Math.min(
        remainingBuyer,
        totalConsiderationThis + surchargeRemaining,
      );
    }
  }

  if (buyerRefundCents < 0) {
    throw new Error('buyerRefundCents must be >= 0');
  }
  if (buyerRefundCents > remainingBuyer) {
    throw new Error(
      `Buyer refund ${buyerRefundCents} exceeds remaining refundable ${remainingBuyer}`,
    );
  }

  // Courier
  let courierLeg: CourierReversalLegPlan | null = null;
  const includeCourier = request.includeCourierCents ?? 0;
  if (includeCourier > 0) {
    if (!ctx.courier) {
      courierLeg = {
        kind: 'COURIER',
        transactionId: null,
        payoutId: null,
        transferId: null,
        courierConsiderationRefundCents: includeCourier,
        transferReversalCents: 0,
        note: 'Courier allocation requested but no delivery payout found',
        idempotencyKey: `hc_courier_rev_missing_${request.orderId}`,
        status: 'POLICY_REQUIRED',
      };
      warnings.push('Courier refund requested without delivery payout');
    } else {
      const rev = Math.min(includeCourier, ctx.courier.amountCents);
      courierLeg = {
        kind: 'COURIER',
        transactionId: ctx.courier.transactionId,
        payoutId: ctx.courier.payoutId,
        transferId: ctx.courier.transferId,
        courierConsiderationRefundCents: rev,
        transferReversalCents: ctx.courier.transferId ? rev : 0,
        note: ctx.courier.transferId
          ? 'Stripe transfer reversal planned'
          : 'Courier payout is ledger-only (no Stripe transfer) — POLICY_REQUIRED for clawback mechanism',
        idempotencyKey: courierReversalIdempotencyKey(
          request.orderId,
          ctx.courier.payoutId || 'none',
          rev,
          seq,
        ),
        status: ctx.courier.transferId
          ? 'PLANNED'
          : rev > 0
            ? 'LEDGER_ONLY'
            : 'SKIPPED_ZERO',
      };
    }
  }

  // Affiliate: proportional to buyer refund / buyer gross (matches webhook)
  const affiliateEstimated =
    ctx.order.totalAmount > 0 && ctx.affiliateAccruedCents > 0
      ? Math.round(
          (ctx.affiliateAccruedCents * buyerRefundCents) /
            ctx.order.totalAmount,
        )
      : 0;
  const affiliateLeg: AffiliateReversalLegPlan = {
    kind: 'AFFILIATE',
    treatment:
      affiliateEstimated > 0 ? 'LEDGER_PROPORTIONAL' : 'NONE',
    estimatedReversalCents: affiliateEstimated,
    note:
      'Affiliate commission is funded from HomeCheff platform fee (not seller net). Reversal is ledger-only unless a separate Connect transfer exists.',
    status: affiliateEstimated > 0 ? 'PLANNED' : 'SKIPPED_ZERO',
  };

  const courierReversalCents = courierLeg?.transferReversalCents ?? 0;
  const recovered = totalSellerReversal + courierReversalCents;
  // Platform funds buyer refund; recovers seller/courier reversals; Stripe fee not returned
  const platformEconomicImpactCents = buyerRefundCents - recovered;

  if (
    request.mode === 'FULL_BUYER_GROSS' &&
    ctx.sellerLegs.some((l) => l.transferId) &&
    totalSellerReversal === 0 &&
    buyerRefundCents > 0
  ) {
    warnings.push(
      'P0_EXPOSURE_IF_EXECUTED_WITHOUT_REVERSAL: buyer refund with no seller clawback',
    );
  }

  // Component reconciliation for THIS request relative to seller economics
  const ORIGINAL_SELLER_GROSS = ctx.sellerGrossTotal;
  const ORIGINAL_SELLER_TRANSFER = originalSellerTransfer;
  const PLATFORM_REFUND_COST = platformEconomicImpactCents;

  // Unreconciled: for seller-consideration economics,
  // consideration_refund should map to reversal + platform_fee_share_released
  // We report cents that don't explain within integer floor rounding of this request.
  let unexplained = 0;
  for (const leg of sellerPlanLegs) {
    if (leg.sellerConsiderationRefundCents <= 0) continue;
    if (!leg.transferId) continue;
    const expectedPlatformFeeShare = Math.floor(
      (leg.sellerConsiderationRefundCents * leg.platformFeeCents) /
        Math.max(1, leg.sellerGrossCents),
    );
    const sum = leg.transferReversalCents + expectedPlatformFeeShare;
    // Floor rounding may leave 0–1¢ gap vs consideration; track remainder
    const gap = leg.sellerConsiderationRefundCents - sum;
    if (gap < 0 || gap > 1) {
      // Allow 1¢ floor dust; larger gaps are unexplained
      if (Math.abs(gap) > 1) unexplained += Math.abs(gap);
    }
  }

  const plan: RefundPlan = {
    schemaVersion: REFUND_SETTLEMENT_SCHEMA_VERSION,
    orderId: request.orderId,
    mode: request.mode,
    currency: 'eur',
    originalBuyerGrossCents: ctx.order.totalAmount,
    originalBuyerSurchargeCents: ctx.originalBuyerSurchargeCents,
    originalStripeFeeEstimatedCents: ctx.estimatedStripeFeeFromBuyerFormula,
    stripeFeeRefundTreatment: 'NOT_RETURNED_PER_STRIPE_DOCS',
    priorBuyerRefundedCents: priorBuyer,
    remainingBuyerRefundableCents: remainingBuyer,
    buyerRefundCents,
    buyerRefundIdempotencyKey: buyerRefundIdempotencyKey(
      request.orderId,
      buyerRefundCents,
      seq,
    ),
    sellerLegs: sellerPlanLegs,
    courierLeg,
    affiliateLeg,
    totals: {
      sellerReversalCents: totalSellerReversal,
      courierReversalCents,
      affiliateReversalCents: affiliateEstimated,
      platformEconomicImpactCents,
    },
    policyFlags,
    reconciliation: {
      ORIGINAL_BUYER_GROSS: ctx.order.totalAmount,
      ORIGINAL_STRIPE_FEE_EST: ctx.estimatedStripeFeeFromBuyerFormula,
      ORIGINAL_SELLER_GROSS,
      ORIGINAL_PLATFORM_FEE: originalPlatformFee,
      ORIGINAL_SELLER_TRANSFER,
      ORIGINAL_AFFILIATE: ctx.affiliateAccruedCents,
      ORIGINAL_COURIER: ctx.courier?.amountCents ?? 0,
      BUYER_REFUND: buyerRefundCents,
      SELLER_REVERSAL: totalSellerReversal,
      AFFILIATE_REVERSAL: affiliateEstimated,
      COURIER_REVERSAL: courierReversalCents,
      PLATFORM_REFUND_COST,
      REMAINING_SELLER_ENTITLEMENT: remainingSellerEntitlement,
      UNRECONCILED: unexplained,
    },
    warnings,
  };

  return plan;
}

/**
 * Persist plan as RefundSettlement PLANNED (idempotent on idempotencyKey).
 */
export async function persistRefundPlan(args: {
  plan: RefundPlan;
  idempotencyKey: string;
  createdByAdminId?: string | null;
  reason?: string | null;
}): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.refundSettlement.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });
  if (existing) {
    return { id: existing.id, created: false };
  }
  const id = `rset_${args.plan.orderId}_${Date.now()}`;
  await prisma.refundSettlement.create({
    data: {
      id,
      orderId: args.plan.orderId,
      idempotencyKey: args.idempotencyKey,
      status: 'PLANNED',
      mode: args.plan.mode,
      buyerRefundCents: args.plan.buyerRefundCents,
      planJson: JSON.stringify(args.plan),
      createdByAdminId: args.createdByAdminId ?? null,
      reason: args.reason ?? null,
    },
  });
  return { id, created: true };
}

/**
 * Execute persisted plan: reverse transfers then refund buyer.
 * Requires confirmLiveMutation=true.
 */
export async function executeRefundSettlement(
  opts: ExecuteRefundOptions,
): Promise<ExecuteRefundResult> {
  if (!opts.confirmLiveMutation) {
    throw new Error(
      'executeRefundSettlement refused: confirmLiveMutation must be true',
    );
  }

  const { stripe, plan } = opts;
  const errors: string[] = [];
  let settlementId = opts.settlementId || '';

  if (opts.persist !== false) {
    const settlementIdem = `hc_rset_${plan.orderId}_${plan.buyerRefundIdempotencyKey}`;
    const persisted = await persistRefundPlan({
      plan,
      idempotencyKey: settlementIdem,
      createdByAdminId: opts.createdByAdminId,
      reason: opts.reason,
    });
    settlementId = persisted.id;
  }

  if (!settlementId) {
    settlementId = `rset_ephemeral_${plan.orderId}_${Date.now()}`;
  } else {
    await prisma.refundSettlement.update({
      where: { id: settlementId },
      data: { status: 'EXECUTING', updatedAt: new Date() },
    });
  }

  const sellerReversals: ExecuteRefundResult['sellerReversals'] = [];

  // 1) Seller transfer reversals
  for (const leg of plan.sellerLegs) {
    if (
      leg.status === 'SKIPPED_NO_TRANSFER' ||
      leg.status === 'SKIPPED_ZERO' ||
      !leg.transferId ||
      leg.transferReversalCents <= 0
    ) {
      sellerReversals.push({
        productId: leg.productId,
        transferId: leg.transferId,
        reversalId: null,
        amountCents: 0,
        status: leg.status,
      });
      continue;
    }

    try {
      const reversal = await stripe.transfers.createReversal(
        leg.transferId,
        {
          amount: leg.transferReversalCents,
          description: `HomeCheff refund clawback order=${plan.orderId} product=${leg.productId}`,
          metadata: {
            orderId: plan.orderId,
            productId: leg.productId,
            homecheff_app: 'true',
            refund_settlement: settlementId,
          },
        },
        { idempotencyKey: leg.idempotencyKey },
      );

      await prisma.refund.create({
        data: {
          id: `refund_trr_${leg.productId}_${reversal.id}`,
          transactionId: leg.transactionId,
          amountCents: leg.transferReversalCents,
          providerRef: reversal.id,
        },
      });

      sellerReversals.push({
        productId: leg.productId,
        transferId: leg.transferId,
        reversalId: reversal.id,
        amountCents: leg.transferReversalCents,
        status: 'SUCCEEDED',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Idempotent replay: already reversed under same key
      if (
        message.includes('idempoten') ||
        message.includes('already been reversed')
      ) {
        sellerReversals.push({
          productId: leg.productId,
          transferId: leg.transferId,
          reversalId: null,
          amountCents: leg.transferReversalCents,
          status: 'ALREADY_DONE',
          error: message,
        });
      } else {
        errors.push(
          `Seller reversal failed product=${leg.productId}: ${message}`,
        );
        sellerReversals.push({
          productId: leg.productId,
          transferId: leg.transferId,
          reversalId: null,
          amountCents: leg.transferReversalCents,
          status: 'FAILED',
          error: message,
        });
      }
    }
  }

  // 2) Courier (Stripe transfer only when present)
  let courierReversal: ExecuteRefundResult['courierReversal'] = null;
  if (plan.courierLeg && plan.courierLeg.transferReversalCents > 0) {
    const c = plan.courierLeg;
    if (c.transferId && c.status === 'PLANNED') {
      try {
        const reversal = await stripe.transfers.createReversal(
          c.transferId,
          {
            amount: c.transferReversalCents,
            metadata: {
              orderId: plan.orderId,
              kind: 'COURIER',
              refund_settlement: settlementId,
            },
          },
          { idempotencyKey: c.idempotencyKey },
        );
        courierReversal = {
          status: 'SUCCEEDED',
          reversalId: reversal.id,
          amountCents: c.transferReversalCents,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Courier reversal failed: ${message}`);
        courierReversal = {
          status: 'FAILED',
          reversalId: null,
          amountCents: c.transferReversalCents,
          error: message,
        };
      }
    } else {
      courierReversal = {
        status: c.status,
        reversalId: null,
        amountCents: c.transferReversalCents,
      };
      if (c.status === 'LEDGER_ONLY') {
        warningsPushPolicy(errors, 'Courier ledger-only clawback not auto-applied');
      }
    }
  }

  // 3) Buyer refund — only if seller reversals that were required succeeded
  const requiredSellerFailed = sellerReversals.some(
    (r) => r.status === 'FAILED',
  );
  let stripeRefundId: string | null = null;

  if (requiredSellerFailed) {
    errors.push(
      'Buyer refund skipped: one or more required seller reversals failed (NEEDS_ATTENTION)',
    );
  } else if (plan.buyerRefundCents > 0) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: plan.orderId },
        select: { stripeSessionId: true },
      });
      if (!order?.stripeSessionId) {
        throw new Error('Order missing stripeSessionId');
      }
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );
      const pi = session.payment_intent;
      const paymentIntentId =
        typeof pi === 'string' ? pi : pi?.id;
      if (!paymentIntentId) {
        throw new Error('Checkout session missing payment_intent');
      }

      const refund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: plan.buyerRefundCents,
          reason: 'requested_by_customer',
          metadata: {
            orderId: plan.orderId,
            refund_settlement: settlementId,
            mode: plan.mode,
          },
        },
        { idempotencyKey: plan.buyerRefundIdempotencyKey },
      );
      stripeRefundId = refund.id;

      // Persist Refund rows on seller transactions (compatibility)
      for (const leg of plan.sellerLegs) {
        await prisma.refund.create({
          data: {
            id: `refund_buyer_${leg.productId}_${refund.id}`,
            transactionId: leg.transactionId,
            amountCents:
              plan.sellerLegs.length === 1
                ? plan.buyerRefundCents
                : leg.sellerConsiderationRefundCents,
            providerRef: refund.id,
          },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Buyer refund failed: ${message}`);
    }
  }

  // 4) Affiliate ledger (idempotent; also fired by charge.refunded webhook)
  let affiliate: ExecuteRefundResult['affiliate'] = {
    status: 'SKIPPED',
  };
  if (
    plan.affiliateLeg.status === 'PLANNED' &&
    stripeRefundId &&
    plan.buyerRefundCents > 0
  ) {
    try {
      const { processCommissionReversal } = await import(
        '@/lib/affiliate-commission'
      );
      const result = await processCommissionReversal({
        reversalEventId: stripeRefundId,
        eventType: 'REFUND',
        refundedAmountCents: plan.buyerRefundCents,
        chargeAmountCents: plan.originalBuyerGrossCents,
        orderId: plan.orderId,
      });
      affiliate = { status: 'SUCCEEDED', reversedCount: result.reversedCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Affiliate reversal failed: ${message}`);
      affiliate = { status: 'FAILED', error: message };
    }
  }

  // 5) Order / transaction status — partial must NOT become REFUNDED
  try {
    if (stripeRefundId) {
      const fullyRefunded =
        plan.priorBuyerRefundedCents + plan.buyerRefundCents >=
        plan.originalBuyerGrossCents;
      if (fullyRefunded) {
        await prisma.order.update({
          where: { id: plan.orderId },
          data: { status: 'REFUNDED', updatedAt: new Date() },
        });
        for (const leg of plan.sellerLegs) {
          await prisma.transaction.updateMany({
            where: { id: leg.transactionId },
            data: { status: 'REFUNDED', updatedAt: new Date() },
          });
        }
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Order status update failed: ${message}`);
  }

  const status: RefundSettlementStatus =
    errors.length === 0
      ? 'COMPLETED'
      : stripeRefundId ||
          sellerReversals.some((r) => r.status === 'SUCCEEDED')
        ? 'NEEDS_ATTENTION'
        : 'FAILED';

  const resultPayload = {
    sellerReversals,
    courierReversal,
    affiliate,
    stripeRefundId,
    errors,
  };

  if (opts.persist !== false && settlementId.startsWith('rset_')) {
    try {
      await prisma.refundSettlement.update({
        where: { id: settlementId },
        data: {
          status,
          resultJson: JSON.stringify(resultPayload),
          stripeRefundId,
          executedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch {
      /* ephemeral / race */
    }
  }

  return {
    settlementId,
    status,
    plan,
    stripeRefundId,
    sellerReversals,
    courierReversal,
    affiliate,
    errors,
  };
}

function warningsPushPolicy(errors: string[], msg: string) {
  errors.push(msg);
}

/**
 * Seller-facing payout state label (NL).
 * Transfer reversal ≠ proven bank debit.
 */
export function sellerPayoutRefundUiState(args: {
  transferId: string | null;
  transferSucceeded: boolean;
  reversedCents: number;
  transferCents: number;
  buyerRefundInProgress: boolean;
  needsAttention: boolean;
}): string {
  if (args.needsAttention) return 'Terugbetaling vereist aandacht';
  if (args.buyerRefundInProgress && args.reversedCents === 0) {
    return 'Terugbetaling gestart';
  }
  if (args.transferCents > 0 && args.reversedCents >= args.transferCents) {
    return 'Uitbetaling teruggedraaid';
  }
  if (args.reversedCents > 0) {
    return 'Uitbetaling deels teruggedraaid';
  }
  if (args.transferSucceeded && args.transferId) {
    return 'Uitbetaling verwerkt';
  }
  return 'Betaling ontvangen';
}

/**
 * Dry-run helper: plan only, no Stripe, optional persist=false.
 */
export async function dryRunRefundSettlement(
  request: RefundPlanRequest,
): Promise<RefundPlan> {
  return planRefundSettlement(request);
}
