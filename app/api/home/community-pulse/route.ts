import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Lightweight, cacheable snapshot of real platform activity (no polling client-side).
 */
export async function GET() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      newProducts24h,
      newMembers7d,
      newRecipes7d,
      topHcp,
      followsWeek,
      savesWeek,
      commentsWeek,
      reviewsWeek,
      listingCreatorsWeek,
      topSavedGroup,
    ] = await Promise.all([
      prisma.product.count({
        where: { isActive: true, createdAt: { gte: dayAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.recipe.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.userHcpStats.findFirst({
        orderBy: { totalHcp: 'desc' },
        select: {
          totalHcp: true,
          user: { select: { username: true, name: true } },
        },
      }),
      prisma.follow.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.favorite.count({
        where: { createdAt: { gte: weekAgo }, productId: { not: null } },
      }),
      prisma.workspaceContentComment.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.productReview.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.product
        .findMany({
          where: { isActive: true, createdAt: { gte: weekAgo } },
          select: { sellerId: true },
          distinct: ['sellerId'],
        })
        .then((rows) => rows.length),
      prisma.favorite
        .groupBy({
          by: ['productId'],
          where: {
            productId: { not: null },
            createdAt: { gte: weekAgo },
          },
          _count: { productId: true },
          orderBy: { _count: { productId: 'desc' } },
          take: 1,
        })
        .catch(() => [] as { productId: string | null; _count: { productId: number } }[]),
    ]);

    const topHcpUsername =
      topHcp?.user?.username?.trim() ||
      topHcp?.user?.name?.trim()?.split(/\s+/)[0] ||
      null;

    let mostSavedProductTitle: string | null = null;
    let mostSavedProductCount = 0;
    const topPid = topSavedGroup[0]?.productId;
    if (topPid) {
      mostSavedProductCount = topSavedGroup[0]._count.productId;
      const prod = await prisma.product.findUnique({
        where: { id: topPid },
        select: { title: true },
      });
      mostSavedProductTitle = prod?.title?.trim()?.slice(0, 72) || null;
    }

    const risingGroup = await prisma.product
      .groupBy({
        by: ['sellerId'],
        where: { isActive: true, createdAt: { gte: weekAgo } },
        _count: { sellerId: true },
        orderBy: { _count: { sellerId: 'desc' } },
        take: 1,
      })
      .catch(() => [] as { sellerId: string; _count: { sellerId: number } }[]);

    let risingSellerUsername: string | null = null;
    let risingSellerListings = 0;
    const topSellerId = risingGroup[0]?.sellerId;
    if (topSellerId) {
      risingSellerListings = risingGroup[0]._count.sellerId;
      const sp = await prisma.sellerProfile.findUnique({
        where: { id: topSellerId },
        select: { User: { select: { username: true, name: true } } },
      });
      risingSellerUsername =
        sp?.User?.username?.trim() ||
        sp?.User?.name?.trim()?.split(/\s+/)[0] ||
        null;
    }

    const body = {
      newProducts24h,
      newMembers7d,
      newRecipes7d,
      topHcpUsername,
      topHcpTotal: topHcp?.totalHcp ?? null,
      followsWeek,
      savesWeek,
      commentsWeek,
      reviewsWeek,
      listingCreatorsWeek,
      mostSavedProductTitle,
      mostSavedProductCount,
      risingSellerUsername,
      risingSellerListings,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    console.error('[community-pulse]', e);
    return NextResponse.json(
      {
        newProducts24h: 0,
        newMembers7d: 0,
        newRecipes7d: 0,
        topHcpUsername: null,
        topHcpTotal: null,
        followsWeek: 0,
        savesWeek: 0,
        commentsWeek: 0,
        reviewsWeek: 0,
        listingCreatorsWeek: 0,
        mostSavedProductTitle: null,
        mostSavedProductCount: 0,
        risingSellerUsername: null,
        risingSellerListings: 0,
        generatedAt: new Date().toISOString(),
        error: true,
      },
      { status: 200 }
    );
  }
}
