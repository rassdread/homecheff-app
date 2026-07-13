/**
 * Feed media proxy — DB visibility gates (server-only).
 */

import { prisma } from '@/lib/prisma';
import type { FeedMediaEntityType } from '@/lib/feed/feed-media-access';

/**
 * Same visibility semantics as /api/feed candidate queries.
 */
export async function isFeedMediaEntityVisible(
  type: FeedMediaEntityType,
  id: string,
): Promise<boolean> {
  if (type === 'product') {
    const row = await prisma.product.findFirst({
      where: {
        id,
        OR: [
          { isActive: true },
          {
            isActive: false,
            orderItems: {
              some: {
                Order: { stripeSessionId: { not: null } },
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    return !!row;
  }

  if (type === 'dish') {
    const row = await prisma.dish.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: { id: true },
    });
    return !!row;
  }

  const row = await prisma.listing.findFirst({
    where: { id, isPublic: true },
    select: { id: true },
  });
  return !!row;
}

export async function loadVisibleFeedMediaUrl(
  type: FeedMediaEntityType,
  id: string,
  index: number,
): Promise<string | null> {
  const visible = await isFeedMediaEntityVisible(type, id);
  if (!visible) return null;

  if (type === 'product') {
    const rows = await prisma.image.findMany({
      where: { productId: id },
      select: { fileUrl: true },
      orderBy: { sortOrder: 'asc' },
      take: index + 1,
    });
    return rows[index]?.fileUrl ?? null;
  }

  if (type === 'dish') {
    const rows = await prisma.dishPhoto.findMany({
      where: { dishId: id },
      select: { url: true },
      orderBy: { idx: 'asc' },
      take: index + 1,
    });
    return rows[index]?.url ?? null;
  }

  const rows = await prisma.listingMedia.findMany({
    where: { listingId: id },
    select: { url: true },
    orderBy: { order: 'asc' },
    take: index + 1,
  });
  return rows[index]?.url ?? null;
}
