import { prisma } from '@/lib/prisma';
import { resolvePlatformFeeBps } from '@/lib/payments/seller-settlement';
import {
  exposureFromLegacyBps,
  exposureFromSnapshot,
  parseStoredHcFeeSnapshot,
  type MarketplaceOrderFeeSnapshotDto,
} from '@/lib/hc/marketplace-order-fee-snapshot';

export { parseStoredHcFeeSnapshot };

export type SettlementExposureInput = {
  orderId: string;
  sellerUserId: string;
  buyerCentralUserId: string;
  hcCaptured: number;
  grossOrderCents: number;
  feeSnapshot?: MarketplaceOrderFeeSnapshotDto | null;
};

export async function computeTheoreticalSettlementExposure(input: SettlementExposureInput) {
  if (input.feeSnapshot) {
    return exposureFromSnapshot({
      hcCaptured: input.hcCaptured,
      grossOrderCents: input.grossOrderCents,
      snapshot: input.feeSnapshot,
    });
  }
  const platformFeeBps = await resolvePlatformFeeBps(input.sellerUserId);
  return exposureFromLegacyBps({
    hcCaptured: input.hcCaptured,
    grossOrderCents: input.grossOrderCents,
    platformFeeBps,
  });
}

export async function createSettlementExposurePending(input: SettlementExposureInput) {
  const calc = await computeTheoreticalSettlementExposure(input);
  return prisma.marketplaceHcSettlementExposure.upsert({
    where: { orderId: input.orderId },
    create: {
      orderId: input.orderId,
      sellerUserId: input.sellerUserId,
      buyerCentralUserId: input.buyerCentralUserId,
      hcCaptured: input.hcCaptured,
      hcFaceValueCents: calc.hcFaceValueCents,
      grossOrderCents: input.grossOrderCents,
      sellerTier: 'individual',
      theoreticalPlatformFeeCents: calc.theoreticalPlatformFeeCents,
      platformFeePolicy: calc.platformFeePolicy,
      sellerGrossEntitlementCents: calc.sellerGrossEntitlementCents,
      sellerNetExposureCents: calc.sellerNetExposureCents,
      settlementSource: calc.settlementSource,
      status: 'PENDING',
      feeSourceType: calc.feeSourceType,
      programId: calc.programId,
      calculationVersion: calc.calculationVersion,
      effectiveSellerFeeBps: calc.platformFeeBps,
    },
    update: {},
  });
}

export async function markSettlementExposureEarned(orderId: string) {
  return prisma.marketplaceHcSettlementExposure.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'EARNED' },
  });
}

export async function voidSettlementExposure(orderId: string) {
  return prisma.marketplaceHcSettlementExposure.updateMany({
    where: { orderId, status: { in: ['PENDING', 'EARNED'] } },
    data: { status: 'VOID' },
  });
}

export async function reverseSettlementExposure(orderId: string) {
  return prisma.marketplaceHcSettlementExposure.updateMany({
    where: { orderId, status: 'EARNED' },
    data: { status: 'REVERSED' },
  });
}

export function isHcOnlyOrder(paymentMethod: string | null | undefined): boolean {
  return paymentMethod === 'HC_ONLY';
}
