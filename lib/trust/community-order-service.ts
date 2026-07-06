import { prisma } from '@/lib/prisma';
import { serializeCommunityOrder } from '@/lib/proposals/serialize-proposal';
import type { CommunityOrderDTO } from '@/lib/proposals/proposal-types';
import { notifyCommunityOrderCompleted } from './notify-trust-events';
import { tryAwardCommunityDealCompletedHcp } from '@/lib/gamification/trust-hcp';
import { unlockBadgesForUser } from '@/lib/gamification/unlock-badges';

export class CommunityOrderServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorKey?: string,
  ) {
    super(message);
    this.name = 'CommunityOrderServiceError';
  }
}

async function loadOrderForParty(communityOrderId: string, userId: string) {
  const row = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: {
      Proposal: { select: { title: true } },
    },
  });
  if (!row) {
    throw new CommunityOrderServiceError(
      'Community order not found',
      404,
      'trust.errors.communityOrderNotFound',
    );
  }
  if (row.buyerId !== userId && row.sellerId !== userId) {
    throw new CommunityOrderServiceError(
      'Access denied',
      403,
      'trust.errors.accessDenied',
    );
  }
  return row;
}

export type CompleteCommunityOrderResult = {
  communityOrder: CommunityOrderDTO;
  alreadyCompleted: boolean;
};

/**
 * Mark a community order COMPLETED. Idempotent — returns existing state if already done.
 */
export async function completeCommunityOrder(
  userId: string,
  communityOrderId: string,
): Promise<CompleteCommunityOrderResult> {
  const existing = await loadOrderForParty(communityOrderId, userId);

  if (existing.status === 'COMPLETED') {
    return {
      communityOrder: serializeCommunityOrder(existing),
      alreadyCompleted: true,
    };
  }

  if (existing.status === 'CANCELLED') {
    throw new CommunityOrderServiceError(
      'Order is cancelled',
      409,
      'trust.errors.orderCancelled',
    );
  }

  const now = new Date();
  const updated = await prisma.communityOrder.update({
    where: { id: communityOrderId },
    data: {
      status: 'COMPLETED',
      completedAt: now,
    },
  });

  const dto = serializeCommunityOrder(updated);

  await notifyCommunityOrderCompleted(
    existing.buyerId,
    existing.sellerId,
    userId,
    dto,
    existing.conversationId,
    existing.Proposal.title,
  );

  for (const uid of [existing.buyerId, existing.sellerId]) {
    await tryAwardCommunityDealCompletedHcp(uid, communityOrderId);
    void unlockBadgesForUser(uid).catch(() => undefined);
  }

  return { communityOrder: dto, alreadyCompleted: false };
}

export async function listCommunityOrdersForUser(
  userId: string,
  status?: 'OPEN' | 'COMPLETED' | 'CANCELLED',
): Promise<
  Array<
    CommunityOrderDTO & {
      proposalTitle: string;
      counterpartName: string | null;
      myReviewSubmitted: boolean;
      canReview: boolean;
    }
  >
> {
  const rows = await prisma.communityOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      Proposal: { select: { title: true } },
      Buyer: { select: { name: true, username: true } },
      Seller: { select: { name: true, username: true } },
      DealReviews: {
        where: { reviewerId: userId },
        select: { id: true },
      },
    },
  });

  return rows.map((row) => {
    const isBuyer = row.buyerId === userId;
    const counterpart = isBuyer ? row.Seller : row.Buyer;
    const canReview =
      row.status === 'COMPLETED' && row.DealReviews.length === 0;
    return {
      ...serializeCommunityOrder(row),
      proposalTitle: row.Proposal.title,
      counterpartName: counterpart.name ?? counterpart.username,
      myReviewSubmitted: row.DealReviews.length > 0,
      canReview,
    };
  });
}
