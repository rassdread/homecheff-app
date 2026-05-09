import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { isSellerDashboardOrderBadgeNotification } from '@/lib/notifications/notificationRouting';

/**
 * Marks unread seller-facing order notifications read (same set as the verkoper-dashboard nav badge).
 */
export async function markSellerFacingOrderNotificationsRead(
  userId: string
): Promise<number> {
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      readAt: null,
      type: {
        in: [NotificationType.ORDER_RECEIVED, NotificationType.ORDER_UPDATE],
      },
    },
    select: { id: true, type: true, payload: true },
  });

  const ids = rows
    .filter(row =>
      isSellerDashboardOrderBadgeNotification(
        String(row.type),
        row.payload as Record<string, unknown>
      )
    )
    .map(row => row.id);

  if (ids.length === 0) return 0;

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { readAt: new Date() },
  });

  return ids.length;
}
