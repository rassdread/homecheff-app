import { prisma } from '@/lib/prisma';

const OPEN = ['EARNED', 'PAYOUT_PENDING', 'PAYOUT_FAILED_RETRYABLE', 'PAYOUT_BLOCKED'] as const;

/** Sum of unpaid seller receivables. A database error is unknown, not zero. */
export async function sumOpenSellerLiabilityCents(): Promise<number | null> {
  try {
    const rows = await prisma.marketplaceHcSettlementExposure.findMany({
      where: { status: { in: [...OPEN] } },
      select: { payableAmountCents: true, sellerNetExposureCents: true },
    });
    return rows.reduce((sum, row) => sum + (row.payableAmountCents ?? row.sellerNetExposureCents), 0);
  } catch {
    return null;
  }
}
