import { prisma } from '@/lib/prisma';
import {
  countVisibleUnreadFromRows,
  type NotificationRowForApi,
} from '@/lib/notifications/mapNotificationForApi';
import { logNotificationDiag } from '@/lib/notifications/fetch-diagnostics';

export { countVisibleUnreadFromRows } from '@/lib/notifications/mapNotificationForApi';

/**
 * Effective unread count for badges (bell, visibility card, list agreement).
 */
export async function countEffectiveUnreadNotifications(
  userId: string,
  isSeller: boolean,
): Promise<number> {
  const rows = await prisma.notification.findMany({
    where: { userId, readAt: null },
    select: {
      id: true,
      type: true,
      payload: true,
      readAt: true,
      createdAt: true,
      orderId: true,
    },
  });

  const effective = countVisibleUnreadFromRows(rows as NotificationRowForApi[], isSeller);
  const raw = rows.length;
  if (raw !== effective) {
    logNotificationDiag('notifications_unread_count_mismatch', {
      reason: 'raw_vs_effective',
      raw,
      effective,
    });
  }
  const skipped = raw - effective;
  if (skipped > 0) {
    logNotificationDiag('notifications_invalid_unread_skipped', {
      reason: 'not_visible_in_api_list',
      count: skipped,
    });
  }
  return effective;
}
