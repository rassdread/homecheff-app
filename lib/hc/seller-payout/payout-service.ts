import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { createHash } from 'node:crypto';

import {
  evaluateHcSellerPayoutEligibility,
  hcSellerPayoutIdempotencyKey,
  resolvePayableAmountCents,
} from './eligibility';
import { getHcSellerPayoutFlags } from './flags';
import {
  createStripeHcTreasuryTransferAdapter,
  executeHcTreasurySellerTransfer,
  type HcTreasuryTransferAdapter,
} from './treasury-transfer-adapter';
import {
  HC_SELLER_PAYOUT_CALCULATION_VERSION,
  type HcSellerPayoutEligibilityResult,
  type HcSellerPayoutExecuteResult,
  type HcSellerPayoutExposureStatus,
} from './types';

function maskId(id: string): string {
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

function isProductionDb(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.includes('neon.tech') || url.includes('neondb');
}

async function loadPayoutContext(exposureId: string) {
  const exposure = await prisma.marketplaceHcSettlementExposure.findUnique({
    where: { id: exposureId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          hcPaymentPhase: true,
          hcCapturedHc: true,
          stripeSessionId: true,
          items: {
            select: {
              Product: {
                select: { seller: { select: { userId: true } } },
              },
            },
            take: 1,
          },
        },
      },
      payoutAttempts: { orderBy: { attemptNumber: 'desc' }, take: 5 },
    },
  });
  if (!exposure) return null;

  const seller = await prisma.user.findUnique({
    where: { id: exposure.sellerUserId },
    select: {
      id: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
    },
  });
  if (!seller) return null;

  return { exposure, seller };
}

export async function evaluateHcSellerPayoutEligibilityById(
  exposureId: string,
  opts?: { expectedSellerUserId?: string; expectedAmountCents?: number },
): Promise<(HcSellerPayoutEligibilityResult & { exposureId: string; orderId: string }) | null> {
  const ctx = await loadPayoutContext(exposureId);
  if (!ctx) return null;
  const flags = getHcSellerPayoutFlags();
  const result = evaluateHcSellerPayoutEligibility({
    exposure: {
      id: ctx.exposure.id,
      orderId: ctx.exposure.orderId,
      sellerUserId: ctx.exposure.sellerUserId,
      buyerCentralUserId: ctx.exposure.buyerCentralUserId,
      status: ctx.exposure.status as HcSellerPayoutExposureStatus,
      grossOrderCents: ctx.exposure.grossOrderCents,
      theoreticalPlatformFeeCents: ctx.exposure.theoreticalPlatformFeeCents,
      sellerNetExposureCents: ctx.exposure.sellerNetExposureCents,
      payableAmountCents: ctx.exposure.payableAmountCents,
      settlementSource: ctx.exposure.settlementSource,
      payoutReference: ctx.exposure.payoutReference,
      payoutIdempotencyKey: ctx.exposure.payoutIdempotencyKey,
      paidAt: ctx.exposure.paidAt,
      calculationVersion: ctx.exposure.calculationVersion,
      feeSourceType: ctx.exposure.feeSourceType,
      effectiveSellerFeeBps: ctx.exposure.effectiveSellerFeeBps,
    },
    order: {
      id: ctx.exposure.order.id,
      status: ctx.exposure.order.status,
      paymentMethod: ctx.exposure.order.paymentMethod,
      hcPaymentPhase: ctx.exposure.order.hcPaymentPhase,
      hcCapturedHc: ctx.exposure.order.hcCapturedHc,
      stripeSessionId: ctx.exposure.order.stripeSessionId,
      sellerUserId:
        ctx.exposure.order.items[0]?.Product?.seller?.userId ?? ctx.exposure.sellerUserId,
    },
    seller: ctx.seller,
    engineEnabled: flags.HC_SELLER_PAYOUT_ENABLED,
    productionMutationEnabled: flags.HC_SELLER_PAYOUT_PRODUCTION_MUTATION,
    isProductionDatabase: isProductionDb(),
    expectedSellerUserId: opts?.expectedSellerUserId,
    expectedAmountCents: opts?.expectedAmountCents,
  });
  return { ...result, exposureId: ctx.exposure.id, orderId: ctx.exposure.orderId };
}

export async function executeHcSellerPayout(input: {
  exposureId: string;
  adminUserId?: string;
  adapter?: HcTreasuryTransferAdapter;
  dryRun?: boolean;
}): Promise<HcSellerPayoutExecuteResult> {
  const eligibility = await evaluateHcSellerPayoutEligibilityById(input.exposureId);
  if (!eligibility) {
    return { ok: false, code: 'EXPOSURE_NOT_FOUND' };
  }
  if (!eligibility.eligible) {
    return { ok: false, code: eligibility.code, exposureId: input.exposureId };
  }

  if (input.dryRun) {
    return {
      ok: true,
      duplicate: false,
      exposureId: input.exposureId,
      amountCents: eligibility.payableAmountCents,
      transferId: 'dry_run',
      status: 'PAID',
    };
  }

  const ctx = await loadPayoutContext(input.exposureId);
  if (!ctx) return { ok: false, code: 'EXPOSURE_NOT_FOUND' };

  if (ctx.exposure.status === 'PAID' || ctx.exposure.payoutReference) {
    return {
      ok: true,
      duplicate: true,
      exposureId: input.exposureId,
      amountCents: resolvePayableAmountCents(ctx.exposure),
      transferId: ctx.exposure.payoutReference ?? 'already_paid',
      status: 'PAID',
    };
  }

  const idempotencyKey = hcSellerPayoutIdempotencyKey(input.exposureId);
  const amountCents = eligibility.payableAmountCents;
  const destinationAccountId = eligibility.destinationAccountId!;

  const attemptCount = ctx.exposure.payoutAttempts.length;
  const attemptNumber = attemptCount + 1;
  const attemptId = crypto.randomUUID();
  const now = new Date();

  const locked = await prisma.$transaction(async (tx) => {
    const fresh = await tx.marketplaceHcSettlementExposure.findUnique({
      where: { id: input.exposureId },
    });
    if (!fresh) return { kind: 'missing' as const };
    if (fresh.status === 'PAID' || fresh.payoutReference) {
      return {
        kind: 'duplicate' as const,
        transferId: fresh.payoutReference ?? 'already_paid',
        amountCents: resolvePayableAmountCents(fresh),
      };
    }
    if (fresh.status === 'PAYOUT_PENDING') {
      return { kind: 'in_progress' as const };
    }
    if (!['EARNED', 'PAYOUT_FAILED_RETRYABLE'].includes(fresh.status)) {
      return { kind: 'bad_status' as const, status: fresh.status };
    }

    await tx.marketplaceHcSettlementExposure.update({
      where: { id: input.exposureId },
      data: {
        status: 'PAYOUT_PENDING',
        payoutAttemptedAt: now,
        payoutIdempotencyKey: idempotencyKey,
        lastPayoutErrorCode: null,
      },
    });

    await tx.marketplaceHcSellerPayoutAttempt.create({
      data: {
        id: attemptId,
        exposureId: input.exposureId,
        attemptNumber,
        amountCents,
        status: 'PENDING',
        idempotencyKey,
        provider: 'STRIPE_CONNECT',
        destinationAccountId,
        metadata: {
          adminUserId: input.adminUserId ?? null,
          orderId: fresh.orderId,
          calculationVersion: HC_SELLER_PAYOUT_CALCULATION_VERSION,
        } as Prisma.InputJsonValue,
      },
    });

    return { kind: 'ready' as const };
  });

  if (locked.kind === 'missing') return { ok: false, code: 'EXPOSURE_NOT_FOUND' };
  if (locked.kind === 'duplicate') {
    return {
      ok: true,
      duplicate: true,
      exposureId: input.exposureId,
      amountCents: locked.amountCents,
      transferId: locked.transferId,
      status: 'PAID',
    };
  }
  if (locked.kind === 'in_progress') {
    return { ok: false, code: 'PAYOUT_IN_PROGRESS', exposureId: input.exposureId, status: 'PAYOUT_PENDING' };
  }
  if (locked.kind === 'bad_status') {
    return {
      ok: false,
      code: 'EXPOSURE_STATUS_NOT_PAYABLE',
      exposureId: input.exposureId,
      status: locked.status as HcSellerPayoutExposureStatus,
    };
  }

  let transferAdapter = input.adapter;
  if (!transferAdapter) {
    const { stripe } = await import('@/lib/stripe');
    if (!stripe) {
      await markPayoutFailed(input.exposureId, attemptId, 'STRIPE_NOT_CONFIGURED', false);
      return { ok: false, code: 'STRIPE_NOT_CONFIGURED', exposureId: input.exposureId, retryable: false };
    }
    transferAdapter = createStripeHcTreasuryTransferAdapter(stripe);
  }

  let transferResult;
  try {
    transferResult = await executeHcTreasurySellerTransfer(transferAdapter, {
      exposureId: input.exposureId,
      orderId: ctx.exposure.orderId,
      sellerUserId: ctx.exposure.sellerUserId,
      amountCents,
      destinationAccountId,
      idempotencyKey,
      calculationVersion: HC_SELLER_PAYOUT_CALCULATION_VERSION,
      settlementSource: ctx.exposure.settlementSource,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markPayoutFailed(input.exposureId, attemptId, msg, true);
    return { ok: false, code: msg, exposureId: input.exposureId, retryable: true, status: 'PAYOUT_FAILED_RETRYABLE' };
  }

  if (!transferResult.ok) {
    await markPayoutFailed(
      input.exposureId,
      attemptId,
      transferResult.errorCode,
      transferResult.retryable,
    );
    return {
      ok: false,
      code: transferResult.errorCode,
      exposureId: input.exposureId,
      retryable: transferResult.retryable,
      status: transferResult.retryable ? 'PAYOUT_FAILED_RETRYABLE' : 'PAYOUT_BLOCKED',
    };
  }

  const paidAt = new Date();
  await prisma.$transaction([
    prisma.marketplaceHcSellerPayoutAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUCCEEDED',
        providerTransferRef: transferResult.transferId,
        completedAt: paidAt,
      },
    }),
    prisma.marketplaceHcSettlementExposure.update({
      where: { id: input.exposureId },
      data: {
        status: 'PAID',
        paidAt,
        payoutReference: transferResult.transferId,
        payoutProvider: 'STRIPE_CONNECT',
        payoutIdempotencyKey: idempotencyKey,
        payoutCalculationVersion: HC_SELLER_PAYOUT_CALCULATION_VERSION,
        payableAmountCents: amountCents,
        lastPayoutErrorCode: null,
      },
    }),
  ]);

  console.info(
    JSON.stringify({
      event: 'hc_seller_payout_paid',
      exposureIdMask: maskId(input.exposureId),
      orderIdMask: maskId(ctx.exposure.orderId),
      sellerIdMask: maskId(ctx.exposure.sellerUserId),
      amountCents,
      settlementSource: ctx.exposure.settlementSource,
      destinationReady: true,
      attemptNumber,
      providerTransferRef: transferResult.transferId,
      stateTransition: 'PAYOUT_PENDING→PAID',
    }),
  );

  return {
    ok: true,
    duplicate: false,
    exposureId: input.exposureId,
    amountCents,
    transferId: transferResult.transferId,
    status: 'PAID',
  };
}

async function markPayoutFailed(
  exposureId: string,
  attemptId: string,
  errorCode: string,
  retryable: boolean,
) {
  const status = retryable ? 'PAYOUT_FAILED_RETRYABLE' : 'PAYOUT_BLOCKED';
  await prisma.$transaction([
    prisma.marketplaceHcSellerPayoutAttempt.update({
      where: { id: attemptId },
      data: { status: 'FAILED', errorCode, completedAt: new Date() },
    }),
    prisma.marketplaceHcSettlementExposure.update({
      where: { id: exposureId },
      data: { status, lastPayoutErrorCode: errorCode },
    }),
  ]);
}

export function buildHcSellerTreasuryReadModel(exposure: {
  grossOrderCents: number;
  theoreticalPlatformFeeCents: number;
  sellerNetExposureCents: number;
  payableAmountCents: number | null;
  status: string;
  paidAt: Date | null;
  payoutReference: string | null;
}) {
  const payable = resolvePayableAmountCents(exposure);
  const paid = exposure.status === 'PAID' ? payable : 0;
  return {
    grossHcFundedGmvCents: exposure.grossOrderCents,
    platformFeeCents: exposure.theoreticalPlatformFeeCents,
    sellerPayableCents: payable,
    paidAmountCents: paid,
    unpaidLiabilityCents: Math.max(0, payable - paid),
    failedPayoutLiabilityCents: ['PAYOUT_FAILED_RETRYABLE', 'PAYOUT_BLOCKED'].includes(exposure.status)
      ? payable
      : 0,
    accountingNote: 'PRODUCT_ECONOMIC_LEDGER_NOT_ACCOUNTANT_APPROVED',
  };
}
