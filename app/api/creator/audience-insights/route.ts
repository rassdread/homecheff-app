import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

/**
 * Creator-facing audience aggregates (authenticated, owner only).
 * Counts and cohort sizes only — never individual saver identities.
 */
export async function GET(req: Request) {
  const cors = getCorsHeaders(req as Request);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        place: true,
        profileViews: true,
        SellerProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
    }

    const sellerProfileId = user.SellerProfile?.id ?? null;

    const [
      totalFollowers,
      newFollowersWeek,
      productSavesWeek,
      distinctSaversWeek,
      recurringSupportersMonth,
      activeProductListings,
    ] = await Promise.all([
      prisma.follow.count({ where: { sellerId: user.id } }),
      prisma.follow.count({
        where: { sellerId: user.id, createdAt: { gte: weekAgo } },
      }),
      sellerProfileId
        ? prisma.favorite.count({
            where: {
              productId: { not: null },
              createdAt: { gte: weekAgo },
              Product: { sellerId: sellerProfileId },
            },
          })
        : Promise.resolve(0),
      sellerProfileId
        ? prisma.favorite
            .groupBy({
              by: ['userId'],
              where: {
                productId: { not: null },
                createdAt: { gte: weekAgo },
                Product: { sellerId: sellerProfileId },
              },
            })
            .then((rows) => rows.length)
        : Promise.resolve(0),
      sellerProfileId
        ? prisma.favorite
            .groupBy({
              by: ['userId'],
              where: {
                productId: { not: null },
                createdAt: { gte: monthAgo },
                Product: { sellerId: sellerProfileId },
              },
              _count: { userId: true },
            })
            .then((rows) => rows.filter((r) => r._count.userId >= 2).length)
        : Promise.resolve(0),
      sellerProfileId
        ? prisma.product.count({
            where: { isActive: true, sellerId: sellerProfileId },
          })
        : Promise.resolve(0),
    ]);

    const hints: Array<'growing' | 'discovery' | 'returning' | 'breadth'> = [];
    if (newFollowersWeek >= 1) hints.push('growing');
    if (productSavesWeek >= 4) hints.push('discovery');
    if (recurringSupportersMonth >= 1) hints.push('returning');
    if (distinctSaversWeek >= 3) hints.push('breadth');

    const body = {
      hasSellerProfile: Boolean(sellerProfileId),
      place: user.place?.trim() || null,
      profileViews: user.profileViews ?? 0,
      totalFollowers,
      newFollowersWeek,
      productSavesWeek,
      distinctSaversWeek,
      recurringSupportersMonth,
      activeProductListings,
      hints,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        ...cors,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (e) {
    console.error('[creator/audience-insights]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
