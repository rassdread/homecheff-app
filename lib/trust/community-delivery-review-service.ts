import { prisma } from '@/lib/prisma';
import { notifyDeliveryReviewPrompt } from './notify-trust-events';

export class CommunityDeliveryReviewServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorKey?: string,
  ) {
    super(message);
    this.name = 'CommunityDeliveryReviewServiceError';
  }
}

export type CommunityDeliveryReviewDTO = {
  id: string;
  deliveryProfileId: string;
  reviewerId: string;
  courierAssignmentId: string;
  deliveryRequestId: string;
  communityOrderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

function clampRating(rating: number): number {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

async function loadEligibleAssignment(
  deliveryRequestId: string,
  userId: string,
) {
  const request = await prisma.deliveryRequest.findUnique({
    where: { id: deliveryRequestId },
    include: {
      CommunityOrder: {
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          conversationId: true,
        },
      },
      Assignments: {
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!request) {
    throw new CommunityDeliveryReviewServiceError(
      'Delivery request not found',
      404,
      'delivery.errors.requestNotFound',
    );
  }

  if (request.status !== 'COMPLETED') {
    throw new CommunityDeliveryReviewServiceError(
      'Delivery not completed',
      409,
      'trust.errors.deliveryNotCompleted',
    );
  }

  const order = request.CommunityOrder;
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new CommunityDeliveryReviewServiceError(
      'Access denied',
      403,
      'delivery.errors.accessDenied',
    );
  }

  const assignment = request.Assignments[0];
  if (!assignment) {
    throw new CommunityDeliveryReviewServiceError(
      'No completed courier assignment',
      409,
      'trust.errors.noCourierAssignment',
    );
  }

  return { request, order, assignment };
}

export async function createCommunityDeliveryReview(
  reviewerId: string,
  deliveryRequestId: string,
  input: { rating: number; comment?: string | null },
): Promise<CommunityDeliveryReviewDTO> {
  const { request, order, assignment } = await loadEligibleAssignment(
    deliveryRequestId,
    reviewerId,
  );

  const courierProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: assignment.courierId },
    select: { id: true },
  });

  if (!courierProfile) {
    throw new CommunityDeliveryReviewServiceError(
      'Courier profile not found',
      404,
      'trust.errors.courierProfileNotFound',
    );
  }

  const existing = await prisma.deliveryReview.findUnique({
    where: {
      courierAssignmentId_reviewerId: {
        courierAssignmentId: assignment.id,
        reviewerId,
      },
    },
  });

  if (existing) {
    return {
      id: existing.id,
      deliveryProfileId: existing.deliveryProfileId,
      reviewerId: existing.reviewerId,
      courierAssignmentId: existing.courierAssignmentId!,
      deliveryRequestId,
      communityOrderId: order.id,
      rating: existing.rating,
      comment: existing.comment,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const rating = clampRating(input.rating);

  const review = await prisma.deliveryReview.create({
    data: {
      deliveryProfileId: courierProfile.id,
      reviewerId,
      courierAssignmentId: assignment.id,
      deliveryRequestId,
      communityOrderId: order.id,
      rating,
      comment: input.comment?.trim() || null,
    },
  });

  const agg = await prisma.deliveryReview.aggregate({
    where: { deliveryProfileId: courierProfile.id },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.deliveryProfile.update({
    where: { id: courierProfile.id },
    data: {
      averageRating: agg._avg.rating ?? rating,
    },
  });

  const { unlockBadgesForUser } = await import('@/lib/gamification/unlock-badges');
  void unlockBadgesForUser(assignment.courierId).catch(() => undefined);

  return {
    id: review.id,
    deliveryProfileId: review.deliveryProfileId,
    reviewerId: review.reviewerId,
    courierAssignmentId: assignment.id,
    deliveryRequestId,
    communityOrderId: order.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getCommunityDeliveryReviewStatus(
  userId: string,
  deliveryRequestId: string,
): Promise<{ canReview: boolean; myReview: CommunityDeliveryReviewDTO | null }> {
  try {
    const { request, order, assignment } = await loadEligibleAssignment(
      deliveryRequestId,
      userId,
    );

    const existing = await prisma.deliveryReview.findUnique({
      where: {
        courierAssignmentId_reviewerId: {
          courierAssignmentId: assignment.id,
          reviewerId: userId,
        },
      },
    });

    return {
      canReview: request.status === 'COMPLETED' && !existing,
      myReview: existing
        ? {
            id: existing.id,
            deliveryProfileId: existing.deliveryProfileId,
            reviewerId: existing.reviewerId,
            courierAssignmentId: assignment.id,
            deliveryRequestId,
            communityOrderId: order.id,
            rating: existing.rating,
            comment: existing.comment,
            createdAt: existing.createdAt.toISOString(),
          }
        : null,
    };
  } catch {
    return { canReview: false, myReview: null };
  }
}

/** Called after delivery complete — prompt parties to review courier. */
export async function promptDeliveryReviewAfterComplete(
  deliveryRequestId: string,
  buyerId: string,
  sellerId: string,
  courierId: string,
  conversationId: string,
): Promise<void> {
  await notifyDeliveryReviewPrompt(
    buyerId,
    sellerId,
    courierId,
    deliveryRequestId,
    conversationId,
  );
}
