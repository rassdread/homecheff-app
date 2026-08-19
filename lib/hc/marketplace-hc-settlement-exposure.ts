import { prisma } from '@/lib/prisma';
import { resolvePlatformFeeBps } from '@/lib/payments/seller-settlement';

const HC_FACE_CENTS_PER_HC = 1;

export type SettlementExposureInput = {
  orderId: string;
  sellerUserId: string;
  buyerCentralUserId: string;
  hcCaptured: number;
  grossOrderCents: number;
};

export async function computeTheoreticalSettlementExposure(input: SettlementExposureInput) {
  const platformFeeBps = await resolvePlatformFeeBps(input.sellerUserId);
  const theoreticalPlatformFeeCents = Math.round((input.grossOrderCents * platformFeeBps) / 10_000);
  const sellerGrossEntitlementCents = Math.max(0, input.grossOrderCents - theoreticalPlatformFeeCents);
  const hcFaceValueCents = input.hcCaptured * HC_FACE_CENTS_PER_HC;
  const sellerNetExposureCents = Math.max(0, sellerGrossEntitlementCents);

  return {
    hcFaceValueCents,
    theoreticalPlatformFeeCents,
    sellerGrossEntitlementCents,
    sellerNetExposureCents,
    platformFeeBps,
    settlementSource: 'HOMECHEFF_TREASURY' as const,
    platformFeePolicy: 'THEORETICAL_POLICY_PENDING',
  };
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
