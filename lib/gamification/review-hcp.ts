import { prisma } from '@/lib/prisma';
import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

const REVIEW_HCP_DAILY_CAP = 5;

function utcDayStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Alleen positieve reviews (≥4) geven verkoper-HCP; max per dag (spamrem). */
export async function tryAwardReviewReceivedHcp(
  sellerUserId: string | null | undefined,
  reviewId: string,
): Promise<void> {
  if (!sellerUserId) return;

  const review = await prisma.productReview.findUnique({
    where: { id: reviewId },
    select: { rating: true },
  });
  if (!review || review.rating < 4) return;

  const todayCount = await prisma.hcpEvent.count({
    where: {
      userId: sellerUserId,
      action: 'REVIEW_RECEIVED',
      createdAt: { gte: utcDayStart() },
    },
  });
  if (todayCount >= REVIEW_HCP_DAILY_CAP) return;

  await awardHcp({
    userId: sellerUserId,
    action: 'REVIEW_RECEIVED',
    points: HCP_ACTION_POINTS.REVIEW_RECEIVED,
    sourceType: 'REVIEW',
    sourceId: reviewId,
  });
}
