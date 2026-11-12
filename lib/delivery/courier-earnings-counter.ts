import type { PrismaClient } from '@prisma/client';
import {
  deliveryOrderIdFromLedgerId,
  nextCourierEarningsCounter,
  summarizeCourierLedger,
} from '@/lib/delivery/courier-earnings';

/**
 * Sets the stored earnings counter to the delivered, not-refunded payout ledger.
 * Repeating the call does not add or remove that sum again. Payout rows stay.
 */
export async function syncCourierEarningsCounter(prisma: PrismaClient, userId: string) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    select: { id: true, totalEarnings: true },
  });
  if (!profile) return { storedCents: 0, earnedCents: 0, changed: false };

  const payouts = await prisma.payout.findMany({
    where: { toUserId: userId, id: { startsWith: 'payout_delivery_' } },
    select: { id: true, transactionId: true, amountCents: true, providerRef: true },
  });
  const transactionIds = payouts.map((payout) => payout.transactionId);
  const refunded = new Set(
    transactionIds.length
      ? (
          await prisma.transaction.findMany({
            where: { id: { in: transactionIds }, status: 'REFUNDED' },
            select: { id: true },
          })
        ).map((row) => row.id)
      : [],
  );
  const active = payouts.filter((payout) => !refunded.has(payout.transactionId));
  const deliveryIds = [
    ...new Set(
      active
        .map(
          (payout) =>
            deliveryOrderIdFromLedgerId(payout.id) ||
            deliveryOrderIdFromLedgerId(payout.transactionId),
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const orders = deliveryIds.length
    ? await prisma.deliveryOrder.findMany({
        where: { id: { in: deliveryIds } },
        select: { id: true, status: true, orderId: true },
      })
    : [];
  const summary = summarizeCourierLedger(active, orders);
  const next = nextCourierEarningsCounter(profile.totalEarnings, summary);
  if (profile.totalEarnings !== next.nextStoredCents) {
    await prisma.deliveryProfile.update({
      where: { id: profile.id },
      data: { totalEarnings: next.nextStoredCents },
    });
  }
  return {
    storedCents: profile.totalEarnings,
    earnedCents: summary.earnedCents,
    unresolvedTransferCents: summary.unresolvedTransferCents,
    keptCents: next.keptCents,
    reviewCents: next.reviewCents,
    reviewRequired: next.reviewRequired,
    changed: profile.totalEarnings !== next.nextStoredCents,
  };
}
