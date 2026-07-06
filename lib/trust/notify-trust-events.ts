import { NotificationService } from '@/lib/notifications/notification-service';
import type { CommunityOrderDTO } from '@/lib/proposals/proposal-types';
import type { DealReviewDTO } from './deal-review-service';

export async function notifyCommunityOrderCompleted(
  buyerId: string,
  sellerId: string,
  actorId: string,
  communityOrder: CommunityOrderDTO,
  conversationId: string,
  proposalTitle: string,
): Promise<void> {
  for (const uid of [buyerId, sellerId]) {
    await NotificationService.sendProposalNotification(
      uid,
      actorId,
      'PROPOSAL_ACCEPTED',
      'Beoordeel jullie afspraak',
      `"${proposalTitle}" is afgerond. Laat een beoordeling achter.`,
      {
        id: communityOrder.proposalId,
        conversationId,
        title: proposalTitle,
        titleKey: 'trust.notifications.reviewDeal.title',
        bodyKey: 'trust.notifications.reviewDeal.body',
        communityOrderId: communityOrder.id,
      },
    );
  }
}

export async function notifyDealReviewReceived(
  revieweeId: string,
  reviewerId: string,
  review: DealReviewDTO,
  conversationId: string,
  proposalTitle: string,
): Promise<void> {
  if (revieweeId === reviewerId) return;
  await NotificationService.sendProposalNotification(
    revieweeId,
    reviewerId,
    'PROPOSAL_ACCEPTED',
    'Nieuwe beoordeling ontvangen',
    `Je ontving een beoordeling voor "${proposalTitle}".`,
    {
      id: review.communityOrderId,
      conversationId,
      title: proposalTitle,
      titleKey: 'trust.notifications.dealReviewReceived.title',
      bodyKey: 'trust.notifications.dealReviewReceived.body',
      communityOrderId: review.communityOrderId,
    },
  );
}

export async function notifyDeliveryReviewPrompt(
  buyerId: string,
  sellerId: string,
  courierId: string,
  deliveryRequestId: string,
  conversationId: string,
): Promise<void> {
  for (const uid of [buyerId, sellerId]) {
    await NotificationService.sendDeliveryRequestNotification(
      uid,
      courierId,
      'DELIVERY_REQUEST_COMPLETED',
      'Beoordeel de bezorging',
      'De bezorging is afgerond. Laat een beoordeling achter voor de bezorger.',
      {
        id: deliveryRequestId,
        communityOrderId: '',
        conversationId,
        titleKey: 'trust.notifications.reviewDelivery.title',
        bodyKey: 'trust.notifications.reviewDelivery.body',
      },
    );
  }
}
