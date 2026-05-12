import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export type ReturnSignalKey =
  | 'followedCreatorsPosted'
  | 'yourAudienceGrowing'
  | 'communitySavesActive';

/**
 * Max two calm “reasons to return” lines, derived from aggregates — no names of savers/viewers.
 */
export async function GET(req: Request) {
  const cors = getCorsHeaders(req as Request);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, SellerProfile: { select: { id: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
    }

    const followed = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { sellerId: true },
      take: 200,
    });
    const followedSellerUserIds = followed.map((f) => f.sellerId).filter(Boolean);

    let followedCreatorsPosted = false;
    if (followedSellerUserIds.length > 0) {
      const [recentProducts, recentDishes] = await Promise.all([
        prisma.product.count({
          where: {
            isActive: true,
            createdAt: { gte: dayAgo },
            seller: { userId: { in: followedSellerUserIds } },
          },
        }),
        prisma.dish.count({
          where: {
            status: 'PUBLISHED',
            createdAt: { gte: dayAgo },
            userId: { in: followedSellerUserIds },
          },
        }),
      ]);
      followedCreatorsPosted = recentProducts + recentDishes > 0;
    }

    let yourAudienceGrowing = false;
    if (user.SellerProfile) {
      const nf = await prisma.follow.count({
        where: { sellerId: user.id, createdAt: { gte: weekAgo } },
      });
      yourAudienceGrowing = nf >= 1;
    }

    const savesWeek = await prisma.favorite.count({
      where: {
        createdAt: { gte: weekAgo },
        OR: [
          { productId: { not: null } },
          { dishId: { not: null } },
          { listingId: { not: null } },
        ],
      },
    });
    const communitySavesActive = savesWeek >= 8;

    const signals: { key: ReturnSignalKey; meta?: Record<string, number> }[] = [];
    if (followedCreatorsPosted) {
      signals.push({ key: 'followedCreatorsPosted' });
    }
    if (yourAudienceGrowing) {
      signals.push({ key: 'yourAudienceGrowing' });
    }
    if (communitySavesActive) {
      signals.push({ key: 'communitySavesActive', meta: { savesWeek } });
    }

    return NextResponse.json(
      {
        signals: signals.slice(0, 2),
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          ...cors,
          'Cache-Control': 'private, no-store, max-age=0',
        },
      },
    );
  } catch (e) {
    console.error('[user/return-signals]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
