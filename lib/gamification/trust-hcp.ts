import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

/** One HCP award per user per completed community deal (as buyer or seller). */
export async function tryAwardCommunityDealCompletedHcp(
  userId: string,
  communityOrderId: string,
): Promise<void> {
  await awardHcp({
    userId,
    action: 'COMMUNITY_DEAL_COMPLETED',
    points: HCP_ACTION_POINTS.COMMUNITY_DEAL_COMPLETED,
    sourceType: 'COMMUNITY_ORDER',
    sourceId: communityOrderId,
  });
}

/** Reviewee HCP when deal review rating ≥ 4 (idempotent per review id). */
export async function tryAwardCommunityDealReviewReceivedHcp(
  revieweeId: string,
  reviewId: string,
  rating: number,
): Promise<void> {
  if (rating < 4) return;
  await awardHcp({
    userId: revieweeId,
    action: 'COMMUNITY_DEAL_REVIEW_RECEIVED',
    points: HCP_ACTION_POINTS.COMMUNITY_DEAL_REVIEW_RECEIVED,
    sourceType: 'DEAL_REVIEW',
    sourceId: reviewId,
  });
}

/** Courier HCP when community delivery assignment completes. */
export async function tryAwardCommunityDeliveryCompletedHcp(
  courierId: string,
  courierAssignmentId: string,
): Promise<void> {
  await awardHcp({
    userId: courierId,
    action: 'COMMUNITY_DELIVERY_COMPLETED',
    points: HCP_ACTION_POINTS.COMMUNITY_DELIVERY_COMPLETED,
    sourceType: 'COURIER_ASSIGNMENT',
    sourceId: courierAssignmentId,
  });
}
