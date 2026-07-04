/**
 * Deep-link builders — zelfde URL-vorm als notificationRouting.
 */

export function messagesConversationHref(conversationId: string): string {
  return `/messages?conversation=${encodeURIComponent(conversationId)}`;
}

export function sellerOrderHighlightHref(orderId: string): string {
  return `/verkoper/orders?highlight=${encodeURIComponent(orderId)}`;
}

export function blockedProductEditHref(productId: string): string {
  return `/product/${productId}/edit`;
}
