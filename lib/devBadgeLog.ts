export type BadgeDebugPayload = {
  messagesUnreadCount?: number;
  notificationsUnreadCount?: number;
  sellerOrderBadgeCount?: number;
  source?: string;
};

/** Alleen in development; geen tokens of gebruikersgegevens loggen. */
export function devBadgeLog(payload: BadgeDebugPayload): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.debug('[HomeCheff badges]', payload);
}
