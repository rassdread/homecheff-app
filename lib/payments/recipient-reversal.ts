/**
 * Shared Connect recipient transfer-reversal primitives.
 * Used by refund-settlement and dispute-settlement — one createReversal path.
 *
 * Official Stripe:
 * https://docs.stripe.com/api/transfer_reversals/create
 * https://docs.stripe.com/connect/disputes (SCT: platform debited; reverse transfers to recover)
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  isSuccessfulTransferRef,
  sellerPayoutId,
  sellerTransactionId,
} from '@/lib/payments/seller-settlement';
import { calculatePlatformFeeCents } from '@/lib/fees';

export type ReversalSource = 'REFUND' | 'DISPUTE' | 'MANUAL';

/**
 * Deterministic floor proportional share with cumulative safety.
 * cumulativeDesired = floor(cumConsideration * transfer / gross)
 * thisLeg = cumulativeDesired - alreadyReversed (capped to remaining)
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

export function sellerReversalIdempotencyKey(args: {
  source: ReversalSource;
  orderId: string;
  productId: string;
  transferId: string;
  reversalCents: number;
  sequenceHint: string;
}): string {
  const prefix =
    args.source === 'DISPUTE'
      ? 'hc_dsp_tr_rev'
      : args.source === 'MANUAL'
        ? 'hc_man_tr_rev'
        : 'hc_tr_rev';
  return `${prefix}_${args.orderId}_${args.productId}_${args.transferId}_${args.reversalCents}_${args.sequenceHint}`;
}

export type SellerTransferLeg = {
  productId: string;
  sellerUserId: string;
  transactionId: string;
  payoutId: string;
  sellerGrossCents: number;
  platformFeeCents: number;
  transferCents: number;
  transferId: string | null;
  alreadyReversedCents: number;
  remainingReversibleCents: number;
};

async function sumSucceededReversalsFromJson(
  rows: Array<{ resultJson: string | null }>,
  productId: string,
): Promise<number> {
  let sum = 0;
  for (const row of rows) {
    try {
      const result = row.resultJson ? JSON.parse(row.resultJson) : null;
      const fromResult = result?.sellerReversals?.find(
        (r: { productId: string; amountCents?: number; status?: string }) =>
          r.productId === productId &&
          (r.status === 'SUCCEEDED' || r.status === 'ALREADY_DONE'),
      );
      if (fromResult?.amountCents) {
        sum += Number(fromResult.amountCents) || 0;
      }
    } catch {
      /* ignore */
    }
  }
  return sum;
}

/**
 * Sum already-reversed cents for a seller leg from durable ledgers + optional Stripe.
 * Prefer Stripe transfer.amount_reversed when provided (authoritative capacity).
 */
export async function loadAlreadyReversedCents(args: {
  orderId: string;
  productId: string;
  transactionId: string;
  transferId: string | null;
  transferCents: number;
  stripeTransferAmountReversed?: number | null;
}): Promise<number> {
  const refundSettlements = await prisma.refundSettlement.findMany({
    where: {
      orderId: args.orderId,
      status: { in: ['COMPLETED', 'NEEDS_ATTENTION', 'EXECUTING'] },
    },
    select: { resultJson: true },
  });
  const fromRefunds = await sumSucceededReversalsFromJson(
    refundSettlements,
    args.productId,
  );

  const disputeSettlements = await prisma.disputeSettlement.findMany({
    where: { orderId: args.orderId },
    select: { resultJson: true },
  });
  const fromDisputes = await sumSucceededReversalsFromJson(
    disputeSettlements,
    args.productId,
  );

  const reversalRefunds = await prisma.refund.findMany({
    where: {
      transactionId: args.transactionId,
      providerRef: { startsWith: 'trr_' },
    },
    select: { amountCents: true },
  });
  const fromTrrRows = reversalRefunds.reduce((s, r) => s + r.amountCents, 0);

  let already = Math.max(fromRefunds + fromDisputes, fromTrrRows);
  if (
    typeof args.stripeTransferAmountReversed === 'number' &&
    args.stripeTransferAmountReversed >= 0
  ) {
    already = Math.max(already, args.stripeTransferAmountReversed);
  }

  return Math.min(args.transferCents, Math.max(0, already));
}

export async function loadSellerTransferLegsForOrder(
  orderId: string,
  opts?: {
    stripeAmountReversedByTransferId?: Record<string, number>;
  },
): Promise<SellerTransferLeg[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: { select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return [];

  const legs: SellerTransferLeg[] = [];
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
    const platformFeeCents = calculatePlatformFeeCents(
      sellerGrossCents,
      platformFeeBps / 100,
    );
    const sellerNetCents = Math.max(0, sellerGrossCents - platformFeeCents);
    const transferId = isSuccessfulTransferRef(payout?.providerRef)
      ? payout!.providerRef!
      : null;
    const transferCents = transferId
      ? (payout?.amountCents ?? sellerNetCents)
      : 0;

    const alreadyReversedCents = await loadAlreadyReversedCents({
      orderId,
      productId,
      transactionId,
      transferId,
      transferCents,
      stripeTransferAmountReversed: transferId
        ? opts?.stripeAmountReversedByTransferId?.[transferId]
        : null,
    });

    legs.push({
      productId,
      sellerUserId,
      transactionId,
      payoutId,
      sellerGrossCents,
      platformFeeCents,
      transferCents,
      transferId,
      alreadyReversedCents,
      remainingReversibleCents: Math.max(
        0,
        transferCents - alreadyReversedCents,
      ),
    });
  }
  return legs;
}

export type ReverseTransferResult = {
  status: 'SUCCEEDED' | 'ALREADY_DONE' | 'FAILED' | 'SKIPPED_ZERO';
  reversalId: string | null;
  amountCents: number;
  error?: string;
};

/**
 * Idempotent Stripe transfer reversal.
 */
export async function reverseRecipientTransfer(args: {
  stripe: Stripe;
  transferId: string;
  amountCents: number;
  idempotencyKey: string;
  metadata: Record<string, string>;
  description?: string;
  transactionId?: string;
  persistRefundRow?: boolean;
}): Promise<ReverseTransferResult> {
  if (args.amountCents <= 0) {
    return { status: 'SKIPPED_ZERO', reversalId: null, amountCents: 0 };
  }

  try {
    const reversal = await args.stripe.transfers.createReversal(
      args.transferId,
      {
        amount: args.amountCents,
        description: args.description,
        metadata: args.metadata,
      },
      { idempotencyKey: args.idempotencyKey },
    );

    if (args.persistRefundRow !== false && args.transactionId) {
      await prisma.refund
        .create({
          data: {
            id: `refund_trr_${args.transactionId}_${reversal.id}`,
            transactionId: args.transactionId,
            amountCents: args.amountCents,
            providerRef: reversal.id,
          },
        })
        .catch(() => {
          /* duplicate row ok */
        });
    }

    return {
      status: 'SUCCEEDED',
      reversalId: reversal.id,
      amountCents: args.amountCents,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('idempoten') ||
      message.includes('already been reversed') ||
      message.includes('has already been reversed')
    ) {
      return {
        status: 'ALREADY_DONE',
        reversalId: null,
        amountCents: args.amountCents,
        error: message,
      };
    }
    return {
      status: 'FAILED',
      reversalId: null,
      amountCents: args.amountCents,
      error: message,
    };
  }
}

/**
 * Allocate dispute amount across seller legs by seller-gross share.
 * POLICY: proportional to item seller consideration; never cross-subsidize.
 * Flag: partial-dispute item mapping from Stripe alone is POLICY_REQUIRED —
 * this is HomeCheff's deterministic fallback.
 */
export function allocateDisputeAcrossSellerLegs(args: {
  disputeAmountCents: number;
  buyerGrossCents: number;
  legs: Array<{ productId: string; sellerGrossCents: number }>;
}): Array<{ productId: string; sellerConsiderationCents: number }> {
  const { disputeAmountCents, buyerGrossCents, legs } = args;
  if (disputeAmountCents <= 0 || legs.length === 0) return [];

  const totalGross = legs.reduce((s, l) => s + l.sellerGrossCents, 0);
  if (totalGross <= 0) return [];

  const fullDispute =
    buyerGrossCents > 0 && disputeAmountCents >= buyerGrossCents;
  const target = fullDispute
    ? totalGross
    : Math.min(disputeAmountCents, totalGross);

  let remaining = target;
  const result: Array<{ productId: string; sellerConsiderationCents: number }> =
    [];
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (i === legs.length - 1) {
      result.push({
        productId: leg.productId,
        sellerConsiderationCents: Math.min(leg.sellerGrossCents, remaining),
      });
    } else {
      const share = Math.floor((leg.sellerGrossCents * target) / totalGross);
      const capped = Math.min(leg.sellerGrossCents, share);
      result.push({
        productId: leg.productId,
        sellerConsiderationCents: capped,
      });
      remaining -= capped;
    }
  }
  return result;
}
