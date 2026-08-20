/**
 * Isolated in-memory HC seller payout engine for certification (no Prisma/Stripe).
 */
import { randomUUID } from 'node:crypto';

import {
  evaluateHcSellerPayoutEligibility,
  hcSellerPayoutIdempotencyKey,
  resolvePayableAmountCents,
} from './eligibility';
import { createInMemoryHcTreasuryTransferAdapter, executeHcTreasurySellerTransfer } from './treasury-transfer-adapter';
import {
  HC_SELLER_PAYOUT_CALCULATION_VERSION,
  type HcSellerPayoutExposureStatus,
  type HcSellerPayoutEligibilityResult,
} from './types';

export type IsolatedExposure = {
  id: string;
  orderId: string;
  sellerUserId: string;
  buyerCentralUserId: string;
  status: HcSellerPayoutExposureStatus;
  grossOrderCents: number;
  theoreticalPlatformFeeCents: number;
  sellerNetExposureCents: number;
  payableAmountCents: number | null;
  settlementSource: 'HOMECHEFF_TREASURY' | 'ORGANIZATION_PROGRAM';
  payoutReference: string | null;
  payoutIdempotencyKey: string | null;
  paidAt: Date | null;
  calculationVersion: string | null;
  feeSourceType: string | null;
  effectiveSellerFeeBps: number | null;
  lastPayoutErrorCode: string | null;
};

export type IsolatedOrder = {
  id: string;
  status: string;
  paymentMethod: string;
  hcPaymentPhase: string;
  hcCapturedHc: number;
  stripeSessionId: string | null;
  sellerUserId: string;
};

export type IsolatedSeller = {
  id: string;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
};

export type IsolatedAttempt = {
  id: string;
  exposureId: string;
  attemptNumber: number;
  amountCents: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  idempotencyKey: string;
  providerTransferRef: string | null;
  errorCode: string | null;
};

export function createIsolatedHcSellerPayoutStore() {
  const exposures = new Map<string, IsolatedExposure>();
  const orders = new Map<string, IsolatedOrder>();
  const sellers = new Map<string, IsolatedSeller>();
  const attempts = new Map<string, IsolatedAttempt>();
  const adapter = createInMemoryHcTreasuryTransferAdapter();
  let engineEnabled = true;
  let productionMutationEnabled = true;
  const buyerWalletHc = new Map<string, number>();
  const payoutLocks = new Set<string>();

  function evaluate(exposureId: string): HcSellerPayoutEligibilityResult | null {
    const exposure = exposures.get(exposureId);
    if (!exposure) return null;
    const order = orders.get(exposure.orderId);
    const seller = sellers.get(exposure.sellerUserId);
    if (!order || !seller) return null;
    return evaluateHcSellerPayoutEligibility({
      exposure,
      order,
      seller,
      engineEnabled,
      productionMutationEnabled,
      isProductionDatabase: false,
    });
  }

  async function executePayout(exposureId: string): Promise<{
    ok: boolean;
    duplicate?: boolean;
    transferId?: string;
    code?: string;
    status?: HcSellerPayoutExposureStatus;
  }> {
    const exposure = exposures.get(exposureId);
    if (!exposure) return { ok: false, code: 'EXPOSURE_NOT_FOUND' };
    if (exposure.status === 'PAID' || exposure.payoutReference) {
      return { ok: true, duplicate: true, transferId: exposure.payoutReference ?? 'paid', status: 'PAID' };
    }

    const eligibility = evaluate(exposureId);
    if (!eligibility) return { ok: false, code: 'EXPOSURE_NOT_FOUND' };
    if (!eligibility.eligible) return { ok: false, code: eligibility.code };
    if (exposure.status === 'PAYOUT_PENDING') {
      return { ok: false, code: 'PAYOUT_IN_PROGRESS', status: 'PAYOUT_PENDING' };
    }
    if (payoutLocks.has(exposureId)) {
      return { ok: false, code: 'PAYOUT_IN_PROGRESS', status: 'PAYOUT_PENDING' };
    }
    payoutLocks.add(exposureId);

    const idempotencyKey = hcSellerPayoutIdempotencyKey(exposureId);
    const amountCents = eligibility.payableAmountCents;
    const attemptNumber = [...attempts.values()].filter((a) => a.exposureId === exposureId).length + 1;
    const attemptId = randomUUID();

    exposure.status = 'PAYOUT_PENDING';
    exposure.payoutIdempotencyKey = idempotencyKey;
    attempts.set(attemptId, {
      id: attemptId,
      exposureId,
      attemptNumber,
      amountCents,
      status: 'PENDING',
      idempotencyKey,
      providerTransferRef: null,
      errorCode: null,
    });

    const transfer = await executeHcTreasurySellerTransfer(adapter, {
      exposureId,
      orderId: exposure.orderId,
      sellerUserId: exposure.sellerUserId,
      amountCents,
      destinationAccountId: eligibility.destinationAccountId!,
      idempotencyKey,
      calculationVersion: HC_SELLER_PAYOUT_CALCULATION_VERSION,
      settlementSource: exposure.settlementSource,
    });

    const attempt = attempts.get(attemptId)!;
    if (!transfer.ok) {
      attempt.status = 'FAILED';
      attempt.errorCode = transfer.errorCode;
      exposure.status = transfer.retryable ? 'PAYOUT_FAILED_RETRYABLE' : 'PAYOUT_BLOCKED';
      exposure.lastPayoutErrorCode = transfer.errorCode;
      payoutLocks.delete(exposureId);
      return { ok: false, code: transfer.errorCode, status: exposure.status };
    }

    attempt.status = 'SUCCEEDED';
    attempt.providerTransferRef = transfer.transferId;
    exposure.status = 'PAID';
    exposure.payoutReference = transfer.transferId;
    exposure.paidAt = new Date();
    exposure.payableAmountCents = amountCents;
    payoutLocks.delete(exposureId);
    return { ok: true, duplicate: false, transferId: transfer.transferId, status: 'PAID' };
  }

  return {
    exposures,
    orders,
    sellers,
    attempts,
    adapter,
    buyerWalletHc,
    setEngineEnabled(v: boolean) {
      engineEnabled = v;
    },
    setProductionMutationEnabled(v: boolean) {
      productionMutationEnabled = v;
    },
    evaluate,
    executePayout,
    seedCertifiedExposure427() {
      const sellerId = 'seller-keksi';
      const orderId = 'e6a4daac-46d3-4eac-98ad-81826d949761';
      const exposureId = 'exp-427-certified';
      sellers.set(sellerId, {
        id: sellerId,
        stripeConnectAccountId: 'acct_ready_sim',
        stripeConnectOnboardingCompleted: true,
      });
      orders.set(orderId, {
        id: orderId,
        status: 'DELIVERED',
        paymentMethod: 'HC_ONLY',
        hcPaymentPhase: 'SETTLEMENT_EARNED',
        hcCapturedHc: 450,
        stripeSessionId: null,
        sellerUserId: sellerId,
      });
      exposures.set(exposureId, {
        id: exposureId,
        orderId,
        sellerUserId: sellerId,
        buyerCentralUserId: 'buyer-sergio',
        status: 'EARNED',
        grossOrderCents: 450,
        theoreticalPlatformFeeCents: 23,
        sellerNetExposureCents: 427,
        payableAmountCents: null,
        settlementSource: 'HOMECHEFF_TREASURY',
        payoutReference: null,
        payoutIdempotencyKey: null,
        paidAt: null,
        calculationVersion: 'seller_fee_v1_20260820',
        feeSourceType: 'PARTNER_PROGRAM',
        effectiveSellerFeeBps: 500,
        lastPayoutErrorCode: null,
      });
      buyerWalletHc.set('buyer-sergio', 2977);
      return { exposureId, orderId, sellerId };
    },
  };
}
