import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { countEffectiveUnreadNotifications } from '@/lib/notifications/effectiveUnreadCount';

export const dynamic = 'force-dynamic';

/**
 * Lightweight creator visibility snapshot (authenticated). Real counts only.
 */
export async function GET(req: Request) {
  const cors = getCorsHeaders(req as Request);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        profileViews: true,
        SellerProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
    }

    const sellerId = user.SellerProfile?.id ?? null;

    const isSeller = Boolean(sellerId);

    const [productSavesWeek, newFollowersWeek, unreadNotifications] = await Promise.all([
      sellerId
        ? prisma.favorite.count({
            where: {
              productId: { not: null },
              createdAt: { gte: weekAgo },
              Product: { sellerId },
            },
          })
        : Promise.resolve(0),
      prisma.follow.count({
        where: { sellerId: user.id, createdAt: { gte: weekAgo } },
      }),
      countEffectiveUnreadNotifications(user.id, isSeller),
    ]);

    const body = {
      profileViews: user.profileViews ?? 0,
      productSavesWeek,
      newFollowersWeek,
      unreadNotifications,
      hasSellerProfile: Boolean(sellerId),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        ...cors,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (e) {
    console.error('[creator/visibility-summary]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
