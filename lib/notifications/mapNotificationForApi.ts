/**
 * Maps DB notification rows to API list items (same rules as GET /api/notifications).
 * Exported for a single source of truth with unread counts.
 */

import {
  extractNotificationMetadata,
  notificationVisibleToSellerAndBuyer,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';
import { logNotificationDiag } from '@/lib/notifications/fetch-diagnostics';

export type NotificationRowForApi = {
  id: string;
  type: unknown;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
  orderId: string | null;
};

function asPayloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

export function prismaTypeString(t: unknown): string {
  return typeof t === 'string' ? t : String(t ?? 'UNKNOWN');
}

function getNotificationTitle(type: string, payload: Record<string, unknown>): string {
  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }
  switch (type) {
    case 'ADMIN_NOTICE':
      return 'HomeCheff melding';
    case 'FAN_REQUEST':
      return 'Nieuwe Fan';
    case 'PROP_RECEIVED':
      return 'Prop Ontvangen';
    case 'FOLLOW_RECEIVED':
      return 'Nieuwe Follower';
    case 'FAVORITE_RECEIVED':
      return 'Product Favoriet';
    case 'REVIEW_RECEIVED':
      return 'Nieuwe Review';
    case 'ORDER_RECEIVED':
      return 'Nieuwe Bestelling';
    case 'ORDER_UPDATE':
      return 'Bestelling Update';
    case 'MESSAGE_RECEIVED':
      return 'Nieuw Bericht';
    case 'NEW_CONVERSATION':
      return 'Nieuw Gesprek';
    case 'PROPOSAL_RECEIVED':
      return 'Nieuw voorstel ontvangen';
    case 'PROPOSAL_ACCEPTED':
      return 'Afspraak bevestigd';
    case 'PROPOSAL_REJECTED':
      return 'Voorstel afgewezen';
    case 'PROPOSAL_COUNTERED':
      return 'Tegenvoorstel ontvangen';
    case 'PROPOSAL_ALTERNATIVE_VALUE':
      return 'Voorstel met ruil ontvangen';
    case 'PROPOSAL_MIXED_ACCEPTED':
      return 'Afspraak bevestigd';
    case 'COMMUNITY_ORDER_CREATED':
      return 'Afspraak bevestigd';
    case 'DELIVERY_REQUEST_CREATED':
      return 'Bezorging kan worden geregeld';
    case 'DELIVERY_REQUEST_ASSIGNED':
      return 'Bezorging toegewezen';
    case 'DELIVERY_REQUEST_ACCEPTED':
      return 'Bezorger heeft bezorging geaccepteerd';
    case 'DELIVERY_REQUEST_COMPLETED':
      return 'Bezorging afgerond';
    default:
      return 'Notificatie';
  }
}

/**
 * Returns the API list object or null when the row must not appear in the user’s list
 * (same visibility + payload rules as before).
 */
export function mapNotificationRow(
  notification: NotificationRowForApi,
  isSeller: boolean,
): Record<string, unknown> | null {
  try {
    const payload = asPayloadRecord(notification.payload);
    const data = asPayloadRecord(payload.data);
    const dataType = String(data.type || '');
    const prismaType = prismaTypeString(notification.type);
    const resolvedLink =
      resolveNotificationTargetUrl(prismaType, payload) ||
      (typeof payload.link === 'string' ? payload.link : undefined) ||
      (typeof payload.actionUrl === 'string' ? payload.actionUrl : undefined);
    const meta = extractNotificationMetadata(
      prismaType,
      payload,
      notification.orderId,
    );

    const typeLower = prismaType.toLowerCase();
    const fromVal = payload.from;
    const fromName = typeof fromVal === 'string' ? fromVal : undefined;

    const mapped = {
      id: notification.id,
      type: typeLower,
      prismaType,
      dataType,
      title: getNotificationTitle(prismaType, payload),
      message:
        (typeof payload.body === 'string' && payload.body) ||
        (typeof payload.message === 'string' && payload.message) ||
        'Nieuwe notificatie',
      link: resolvedLink,
      ...meta,
      isRead: !!notification.readAt,
      createdAt: notification.createdAt.toISOString(),
      from: fromName
        ? {
            id:
              typeof payload.fromId === 'string' && payload.fromId
                ? payload.fromId
                : 'admin',
            name: fromName,
            username:
              typeof payload.fromUsername === 'string'
                ? payload.fromUsername
                : undefined,
            image:
              typeof payload.fromImage === 'string'
                ? payload.fromImage
                : undefined,
          }
        : undefined,
      metadata: {
        productId:
          typeof payload.productId === 'string' ? payload.productId : undefined,
        orderId:
          (typeof payload.orderId === 'string' && payload.orderId) ||
          notification.orderId ||
          undefined,
        conversationId:
          (typeof payload.conversationId === 'string' &&
            payload.conversationId) ||
          (typeof data.conversationId === 'string' && data.conversationId) ||
          undefined,
        senderId:
          (typeof payload.senderId === 'string' && payload.senderId) ||
          (typeof data.senderId === 'string' && data.senderId) ||
          undefined,
      },
      payload,
    };

    if (
      !notificationVisibleToSellerAndBuyer(
        mapped.prismaType as string,
        mapped.payload as Record<string, unknown>,
        isSeller,
      )
    ) {
      return null;
    }
    return mapped;
  } catch (e) {
    logNotificationDiag('notifications_payload_fallback', {
      reason: e instanceof Error ? e.message.slice(0, 80) : 'map_error',
    });
    return null;
  }
}

/** Unread rows that would appear in GET /api/notifications (same map filter). */
export function countVisibleUnreadFromRows(
  rows: NotificationRowForApi[],
  isSeller: boolean,
): number {
  return rows.filter(
    (row) => row.readAt == null && mapNotificationRow(row, isSeller) != null,
  ).length;
}
