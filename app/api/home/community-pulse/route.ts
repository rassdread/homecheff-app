import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDisplayName } from '@/lib/displayName';
import {
  andPublicListingWhere,
} from '@/lib/marketplace/public-listing-eligibility';
import { buildProductDetailPath } from '@/lib/seo/productSlug';
import { toPublicPlaceLabel } from '@/lib/geo/public-place';

export const dynamic = 'force-dynamic';

/**
 * Lightweight, cacheable snapshot of real platform activity (no polling client-side).
 */
function samePlace(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return left.localeCompare(right, 'nl', { sensitivity: 'base' }) === 0;
}

export async function GET(request: NextRequest) {
  const viewerPlace = toPublicPlaceLabel(new URL(request.url).searchParams.get('place'));
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
      topSavedProductGroup,
      topSavedDishGroup,
    ] = await Promise.all([
      prisma.product.count({
        where: andPublicListingWhere({ createdAt: { gte: dayAgo } }),
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.recipe.count({
        where: {
          createdAt: { gte: weekAgo },
          workspaceContent: { isPublic: true },
        },
      }),
      prisma.userHcpStats.findFirst({
        orderBy: { totalHcp: 'desc' },
        select: {
          totalHcp: true,
          user: {
            select: {
              username: true,
              name: true,
              displayFullName: true,
              displayNameOption: true,
            },
          },
        },
      }),
      prisma.follow.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.favorite.count({
        where: {
          createdAt: { gte: weekAgo },
          OR: [
            { productId: { not: null } },
            { dishId: { not: null } },
            { listingId: { not: null } },
          ],
        },
      }),
      prisma.workspaceContentComment.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.productReview.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.product
        .findMany({
          where: andPublicListingWhere({ createdAt: { gte: weekAgo } }),
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
      prisma.favorite
        .groupBy({
          by: ['dishId'],
          where: {
            dishId: { not: null },
            createdAt: { gte: weekAgo },
          },
          _count: { dishId: true },
          orderBy: { _count: { dishId: 'desc' } },
          take: 1,
        })
        .catch(() => [] as { dishId: string | null; _count: { dishId: number } }[]),
    ]);

    const topHcpUsername = topHcp?.user
      ? getDisplayName(topHcp.user)
      : null;

    let mostSavedProductTitle: string | null = null;
    let mostSavedProductCount = 0;
    const topPid = topSavedProductGroup[0]?.productId;
    const pCount = topPid ? topSavedProductGroup[0]._count.productId : 0;
    const topDid = topSavedDishGroup[0]?.dishId;
    const dCount = topDid ? topSavedDishGroup[0]._count.dishId : 0;

    if (pCount >= dCount && topPid) {
      mostSavedProductCount = pCount;
      const prod = await prisma.product.findUnique({
        where: { id: topPid },
        select: { title: true },
      });
      mostSavedProductTitle = prod?.title?.trim()?.slice(0, 72) || null;
    } else if (topDid && dCount > 0) {
      mostSavedProductCount = dCount;
      const dish = await prisma.dish.findUnique({
        where: { id: topDid },
        select: { title: true },
      });
      mostSavedProductTitle = dish?.title?.trim()?.slice(0, 72) || null;
    }

    const recentListings = await prisma.product
      .findMany({
        where: andPublicListingWhere({ createdAt: { gte: weekAgo } }),
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          title: true,
          placeName: true,
          sellerId: true,
          seller: {
            select: {
              User: {
                select: {
                  username: true,
                  name: true,
                  displayFullName: true,
                  displayNameOption: true,
                  place: true,
                  city: true,
                },
              },
            },
          },
        },
      });
    const localListings = viewerPlace
      ? recentListings.filter((row) => {
          const city =
            toPublicPlaceLabel(row.seller?.User?.city) ||
            toPublicPlaceLabel(row.seller?.User?.place) ||
            toPublicPlaceLabel(row.placeName);
          return samePlace(city, viewerPlace);
        })
      : recentListings;
    const risingPool = localListings;
    const risingCounts = new Map<string, number>();
    for (const row of risingPool) {
      if (!row.sellerId) continue;
      risingCounts.set(row.sellerId, (risingCounts.get(row.sellerId) ?? 0) + 1);
    }
    const topSellerIdFromPool = [...risingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const risingGroup = topSellerIdFromPool
      ? [{ sellerId: topSellerIdFromPool[0], _count: { sellerId: topSellerIdFromPool[1] } }]
      : [];

    let risingSellerUsername: string | null = null;
    let risingSellerListings = 0;
    let risingSellerPath: string | null = null;
    let risingListingPath: string | null = null;
    let risingListingId: string | null = null;
    const topSellerId = risingGroup[0]?.sellerId;
    if (topSellerId) {
      risingSellerListings = risingGroup[0]._count.sellerId;
      const sample = risingPool.find((row) => row.sellerId === topSellerId);
      const person = sample?.seller?.User;
      const username = person?.username?.trim() || null;
      risingSellerUsername = person ? getDisplayName(person) : null;
      risingSellerPath = username ? `/user/${encodeURIComponent(username)}` : null;
      if (risingSellerListings === 1 && sample) {
        risingListingId = sample.id;
        risingListingPath = buildProductDetailPath(sample.title, sample.placeName, sample.id);
      }
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
      risingSellerPath,
      risingListingPath,
      risingListingId,
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
        risingSellerPath: null,
        risingListingPath: null,
        risingListingId: null,
        generatedAt: new Date().toISOString(),
        error: true,
      },
      { status: 200 }
    );
  }
}
