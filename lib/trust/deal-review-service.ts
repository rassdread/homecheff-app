import { prisma } from '@/lib/prisma';
import { notifyDealReviewReceived } from './notify-trust-events';
import { tryAwardCommunityDealReviewReceivedHcp } from '@/lib/gamification/trust-hcp';
import { unlockBadgesForUser } from '@/lib/gamification/unlock-badges';

export class DealReviewServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorKey?: string,
  ) {
    super(message);
    this.name = 'DealReviewServiceError';
  }
}

export type DealReviewDTO = {
  id: string;
  communityOrderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  title: string | null;
  message: string | null;
  createdAt: string;
};

function serializeDealReview(row: {
  id: string;
  communityOrderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  title: string | null;
  message: string | null;
  createdAt: Date;
}): DealReviewDTO {
  return {
    id: row.id,
    communityOrderId: row.communityOrderId,
    reviewerId: row.reviewerId,
    revieweeId: row.revieweeId,
    rating: row.rating,
    title: row.title,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

function clampRating(rating: number): number {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

export async function createDealReview(
  reviewerId: string,
  communityOrderId: string,
  input: { rating: number; title?: string | null; message?: string | null },
): Promise<DealReviewDTO> {
  const order = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: { Proposal: { select: { title: true } } },
  });

  if (!order) {
    throw new DealReviewServiceError(
      'Community order not found',
      404,
      'trust.errors.communityOrderNotFound',
    );
  }

  if (order.buyerId !== reviewerId && order.sellerId !== reviewerId) {
    throw new DealReviewServiceError(
      'Access denied',
      403,
      'trust.errors.accessDenied',
    );
  }

  if (order.status !== 'COMPLETED') {
    throw new DealReviewServiceError(
      'Deal not completed',
      409,
      'trust.errors.dealNotCompleted',
    );
  }

  const revieweeId =
    order.buyerId === reviewerId ? order.sellerId : order.buyerId;

  if (revieweeId === reviewerId) {
    throw new DealReviewServiceError(
      'Cannot review yourself',
      400,
      'trust.errors.cannotReviewSelf',
    );
  }

  const existing = await prisma.dealReview.findUnique({
    where: {
      communityOrderId_reviewerId: {
        communityOrderId,
        reviewerId,
      },
    },
  });
  if (existing) {
    return serializeDealReview(existing);
  }

  const rating = clampRating(input.rating);
  const review = await prisma.dealReview.create({
    data: {
      communityOrderId,
      reviewerId,
      revieweeId,
      rating,
      title: input.title?.trim() || null,
      message: input.message?.trim() || null,
    },
  });

  await tryAwardCommunityDealReviewReceivedHcp(revieweeId, review.id, rating);
  void unlockBadgesForUser(revieweeId).catch(() => undefined);
  void unlockBadgesForUser(reviewerId).catch(() => undefined);

  await notifyDealReviewReceived(
    revieweeId,
    reviewerId,
    serializeDealReview(review),
    order.conversationId,
    order.Proposal.title,
  );

  return serializeDealReview(review);
}

export async function getDealReviewStatus(
  userId: string,
  communityOrderId: string,
): Promise<{
  canReview: boolean;
  revieweeId: string | null;
  myReview: DealReviewDTO | null;
}> {
  const order = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    select: {
      status: true,
      buyerId: true,
      sellerId: true,
    },
  });

  if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
    return { canReview: false, revieweeId: null, myReview: null };
  }

  const revieweeId =
    order.buyerId === userId ? order.sellerId : order.buyerId;

  const myReview = await prisma.dealReview.findUnique({
    where: {
      communityOrderId_reviewerId: {
        communityOrderId,
        reviewerId: userId,
      },
    },
  });

  return {
    canReview: order.status === 'COMPLETED' && !myReview,
    revieweeId,
    myReview: myReview ? serializeDealReview(myReview) : null,
  };
}
