/**
 * Centrale routing voor meldingen (API + clients).
 * Zorgt dat chat-links hetzelfde formaat gebruiken als /messages (?conversation=).
 */

export function normalizeNotificationPath(path: string): string {
  const raw = path.trim();
  if (!raw) return raw;
  const withoutDomain = raw.replace(/^https?:\/\/[^/]+/i, '');
  const pathOnly = withoutDomain.startsWith('/') ? withoutDomain : `/${withoutDomain}`;
  const messagesThread = pathOnly.match(/^\/messages\/([^/?#]+)\/?(?:\?|#|$)/);
  if (messagesThread?.[1]) {
    const id = decodeURIComponent(messagesThread[1]);
    return `/messages?conversation=${encodeURIComponent(id)}`;
  }
  return pathOnly.split('#')[0];
}

export function resolveNotificationTargetUrl(
  prismaType: string,
  payload: Record<string, unknown> | null | undefined
): string | undefined {
  const p = (payload || {}) as Record<string, unknown>;
  const data = (p.data as Record<string, unknown> | undefined) || {};

  const directRaw =
    (typeof p.link === 'string' && p.link) ||
    (typeof p.actionUrl === 'string' && p.actionUrl) ||
    (typeof data.link === 'string' && data.link) ||
    (typeof data.route === 'string' && data.route) ||
    (typeof data.actionUrl === 'string' && data.actionUrl);
  const direct =
    typeof directRaw === 'string' ? directRaw.trim() : '';

  if (direct) {
    return normalizeNotificationPath(direct);
  }

  const typeUpper = prismaType.toUpperCase();
  const dataType = String(data.type || p.type || '');
  const orderId =
    (typeof p.orderId === 'string' && p.orderId) ||
    (typeof data.orderId === 'string' && data.orderId);
  const conversationId =
    (typeof p.conversationId === 'string' && p.conversationId) ||
    (typeof data.conversationId === 'string' && data.conversationId);

  if (
    typeUpper === 'MESSAGE_RECEIVED' ||
    typeUpper === 'NEW_CONVERSATION' ||
    typeUpper === 'PROPOSAL_RECEIVED' ||
    typeUpper === 'PROPOSAL_ACCEPTED' ||
    typeUpper === 'PROPOSAL_REJECTED' ||
    typeUpper === 'PROPOSAL_COUNTERED'
  ) {
    return conversationId
      ? `/messages?conversation=${encodeURIComponent(conversationId)}`
      : '/messages';
  }

  if (typeUpper === 'FAVORITE_RECEIVED' || typeUpper === 'REVIEW_RECEIVED') {
    const productId =
      (typeof p.productId === 'string' && p.productId) ||
      (typeof data.productId === 'string' && data.productId);
    return productId ? `/product/${productId}` : undefined;
  }

  if (typeUpper === 'ORDER_RECEIVED' || typeUpper === 'ORDER_UPDATE') {
    const isSellerFacing =
      dataType === 'NEW_ORDER' ||
      dataType === 'PAYMENT_RECEIVED' ||
      dataType === 'ORDER_READY' ||
      dataType === 'SHIPPING_LABEL_READY';

    if (isSellerFacing) {
      return orderId
        ? `/verkoper/orders?highlight=${encodeURIComponent(orderId)}`
        : '/verkoper/orders';
    }

    if (orderId) return `/orders/${orderId}`;
    return '/orders';
  }

  if (
    typeUpper === 'FAN_REQUEST' ||
    typeUpper === 'FOLLOW_RECEIVED'
  ) {
    const fromUsername =
      (typeof p.fromUsername === 'string' && p.fromUsername) ||
      (typeof data.fromUsername === 'string' && data.fromUsername);
    const fromId =
      (typeof p.fromId === 'string' && p.fromId) ||
      (typeof data.fromId === 'string' && data.fromId);
    if (fromUsername) return `/user/${encodeURIComponent(fromUsername)}`;
    if (fromId) return `/user/${encodeURIComponent(fromId)}`;
    return undefined;
  }

  if (typeUpper === 'ADMIN_NOTICE') {
    if (typeof data.route === 'string' && data.route) {
      return normalizeNotificationPath(data.route);
    }
    return '/notifications';
  }

  return undefined;
}

export function extractNotificationMetadata(
  prismaType: string,
  payload: Record<string, unknown> | null | undefined,
  rowOrderId: string | null | undefined
): {
  targetRoute?: string;
  targetConversationId?: string;
  targetOrderId?: string;
} {
  const p = (payload || {}) as Record<string, unknown>;
  const data = (p.data as Record<string, unknown> | undefined) || {};
  const targetRoute = resolveNotificationTargetUrl(prismaType, payload);
  const conversationId =
    (typeof p.conversationId === 'string' && p.conversationId) ||
    (typeof data.conversationId === 'string' && data.conversationId);
  const orderId =
    rowOrderId ||
    (typeof p.orderId === 'string' && p.orderId) ||
    (typeof data.orderId === 'string' && data.orderId);

  return {
    ...(targetRoute ? { targetRoute } : {}),
    ...(conversationId ? { targetConversationId: conversationId } : {}),
    ...(orderId ? { targetOrderId: orderId } : {}),
  };
}

/** Nav badge: alleen ordermeldingen die naar het verkoper-orderoverzicht routeren. */
export function isSellerDashboardOrderBadgeNotification(
  prismaType: string,
  payload: Record<string, unknown> | null | undefined
): boolean {
  const typeUpper = prismaType.toUpperCase();
  if (typeUpper !== 'ORDER_RECEIVED' && typeUpper !== 'ORDER_UPDATE') {
    return false;
  }
  const link =
    resolveNotificationTargetUrl(typeUpper, payload || {}) || '';
  return link.includes('/verkoper/orders');
}

/** Zelfde filter als GET /api/notifications (buyer vs seller ordermeldingen). */
export function notificationVisibleToSellerAndBuyer(
  prismaType: string,
  payload: Record<string, unknown> | null | undefined,
  isSeller: boolean
): boolean {
  const typeLower = prismaType.toLowerCase();
  const p = payload || {};
  const data = ((p as any).data || {}) as Record<string, unknown>;
  const dataType = String(data.type || '');
  const link =
    resolveNotificationTargetUrl(prismaType, p as Record<string, unknown>) ||
    (typeof (p as any).link === 'string' ? (p as any).link : '') ||
    '';

  if (typeLower === 'order_received' || typeLower === 'order_update') {
    const isBuyerNotification =
      dataType === 'ORDER_PLACED' ||
      dataType === 'ORDER_PAID' ||
      dataType === 'ORDER_READY_FOR_PICKUP' ||
      dataType === 'ORDER_READY_FOR_DELIVERY' ||
      dataType === 'ORDER_DELIVERED' ||
      dataType === 'ORDER_CANCELLED' ||
      (dataType === 'ORDER_STATUS_UPDATE' &&
        link.startsWith('/orders/') &&
        !link.startsWith('/verkoper/')) ||
      (link.startsWith('/orders/') && !link.startsWith('/verkoper/'));

    const isSellerNotification =
      dataType === 'NEW_ORDER' ||
      dataType === 'PAYMENT_RECEIVED' ||
      dataType === 'ORDER_READY' ||
      dataType === 'SHIPPING_LABEL_READY' ||
      (dataType === 'ORDER_STATUS_UPDATE' &&
        link.includes('/verkoper/')) ||
      link.startsWith('/verkoper/');

    if (isSeller) return isBuyerNotification || isSellerNotification;
    return isBuyerNotification;
  }

  return true;
}
