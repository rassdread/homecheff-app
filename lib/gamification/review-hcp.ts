import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

export async function tryAwardReviewReceivedHcp(
  sellerUserId: string | null | undefined,
  reviewId: string,
): Promise<void> {
  if (!sellerUserId) return;
  await awardHcp({
    userId: sellerUserId,
    action: 'REVIEW_RECEIVED',
    points: HCP_ACTION_POINTS.REVIEW_RECEIVED,
    sourceType: 'REVIEW',
    sourceId: reviewId,
  });
}
