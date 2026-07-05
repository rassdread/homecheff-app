import { NotificationService } from '@/lib/notifications/notification-service';
import type { DeliveryRequestDTO } from './delivery-marketplace-types';

const TITLE_KEYS = {
  CREATED: 'notification.deliveryRequest.created.title',
  ASSIGNED: 'notification.deliveryRequest.assigned.title',
  ACCEPTED: 'notification.deliveryRequest.accepted.title',
  COMPLETED: 'notification.deliveryRequest.completed.title',
} as const;

const BODY_KEYS = {
  CREATED: 'notification.deliveryRequest.created.body',
  ASSIGNED: 'notification.deliveryRequest.assigned.body',
  ACCEPTED: 'notification.deliveryRequest.accepted.body',
  COMPLETED: 'notification.deliveryRequest.completed.body',
} as const;

async function notifyParty(
  recipientId: string,
  senderId: string,
  kind:
    | 'DELIVERY_REQUEST_CREATED'
    | 'DELIVERY_REQUEST_ASSIGNED'
    | 'DELIVERY_REQUEST_ACCEPTED'
    | 'DELIVERY_REQUEST_COMPLETED',
  titleKey: string,
  bodyKey: string,
  titleFallback: string,
  bodyFallback: string,
  deliveryRequest: DeliveryRequestDTO,
  conversationId: string,
) {
  if (recipientId === senderId) return;

  await NotificationService.sendDeliveryRequestNotification(
    recipientId,
    senderId,
    kind,
    titleFallback,
    bodyFallback,
    {
      id: deliveryRequest.id,
      communityOrderId: deliveryRequest.communityOrderId,
      conversationId,
      titleKey,
      bodyKey,
    },
  );
}

export async function notifyDeliveryRequestCreated(
  buyerId: string,
  sellerId: string,
  actorId: string,
  deliveryRequest: DeliveryRequestDTO,
  conversationId: string,
  proposalTitle: string,
) {
  const body = `Bezorgverzoek voor "${proposalTitle}" aangemaakt.`;
  for (const uid of [buyerId, sellerId]) {
    await notifyParty(
      uid,
      actorId,
      'DELIVERY_REQUEST_CREATED',
      TITLE_KEYS.CREATED,
      BODY_KEYS.CREATED,
      'Bezorgverzoek aangemaakt',
      body,
      deliveryRequest,
      conversationId,
    );
  }
}

export async function notifyDeliveryRequestAssigned(
  courierId: string,
  actorId: string,
  deliveryRequest: DeliveryRequestDTO,
  conversationId: string,
) {
  await notifyParty(
    courierId,
    actorId,
    'DELIVERY_REQUEST_ASSIGNED',
    TITLE_KEYS.ASSIGNED,
    BODY_KEYS.ASSIGNED,
    'Bezorgopdracht toegewezen',
    'Je bent uitgenodigd voor een bezorgopdracht.',
    deliveryRequest,
    conversationId,
  );
}

export async function notifyDeliveryRequestAccepted(
  buyerId: string,
  sellerId: string,
  courierId: string,
  deliveryRequest: DeliveryRequestDTO,
  conversationId: string,
) {
  const body = 'Bezorger heeft de opdracht geaccepteerd.';
  for (const uid of [buyerId, sellerId]) {
    await notifyParty(
      uid,
      courierId,
      'DELIVERY_REQUEST_ACCEPTED',
      TITLE_KEYS.ACCEPTED,
      BODY_KEYS.ACCEPTED,
      'Bezorger geaccepteerd',
      body,
      deliveryRequest,
      conversationId,
    );
  }
}

export async function notifyDeliveryRequestCompleted(
  buyerId: string,
  sellerId: string,
  courierId: string,
  actorId: string,
  deliveryRequest: DeliveryRequestDTO,
  conversationId: string,
) {
  const body = 'Bezorgopdracht afgerond.';
  for (const uid of [buyerId, sellerId, courierId]) {
    await notifyParty(
      uid,
      actorId,
      'DELIVERY_REQUEST_COMPLETED',
      TITLE_KEYS.COMPLETED,
      BODY_KEYS.COMPLETED,
      'Bezorging afgerond',
      body,
      deliveryRequest,
      conversationId,
    );
  }
}
