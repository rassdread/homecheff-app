import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/security";
import { sanitizeProductForPublic } from "@/lib/data-isolation";

// BALANCED CACHING - snel maar compleet
export const revalidate = 0; // always fresh for new listings
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 10), 1), 24);
    const isMobile = searchParams.get("mobile") === "true";
    const skip = page * take;
    const userId = searchParams.get("userId");

    // BALANCED OPTIMIZATION - snel maar compleet
    const products = await prisma.product.findMany({
      where: { 
        isActive: true
      },
      orderBy: [
        { createdAt: "desc" }
      ],
      skip: skip,
      take: take,
      select: {
        id: true,
        title: true,
        description: isMobile ? false : true, // Skip description on mobile
        priceCents: true,
        category: true,
        delivery: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            lat: true,
            lng: true,
            kvk: true,
            companyName: true,
            User: {
              select: { 
                id: true, 
                username: true,
                name: true,
                profileImage: true,
                place: true,
                buyerRoles: true,
                displayFullName: true,
                displayNameOption: true
              },
            }
          }
        },
        Image: {
          select: {
            fileUrl: true,
            sortOrder: true
          },
          take: 1, // Only get first image for speed
          orderBy: { sortOrder: 'asc' }
        },
      },
    });

    // Get user's favorited products if userId provided
    let userFavorites: Set<string> = new Set();
    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          productId: { in: products.map(p => p.id) }
        },
        select: {
          productId: true
        }
      });
      userFavorites = new Set(favorites.map(f => f.productId).filter(Boolean) as string[]);
    }

    // Get review counts for all products
    const reviewCounts = await prisma.productReview.groupBy({
      by: ['productId'],
      where: {
        productId: { in: products.map(p => p.id) }
      },
      _count: {
        productId: true
      }
    });
    const reviewCountMap = new Map(reviewCounts.map(rc => [rc.productId, rc._count.productId]));

    // Get favorite counts for all products
    const favoriteCounts = await prisma.favorite.groupBy({
      by: ['productId'],
      where: {
        productId: { in: products.map(p => p.id) }
      },
      _count: {
        productId: true
      }
    });
    const favoriteCountMap = new Map(favoriteCounts.map(fc => [fc.productId!, fc._count.productId]));

    // Get view counts for all products
    const viewCounts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'VIEW',
        entityType: 'PRODUCT',
        entityId: { in: products.map(p => p.id) }
      },
      _count: {
        entityId: true
      }
    });
    const viewCountMap = new Map(viewCounts.map(vc => [vc.entityId, vc._count.entityId]));

    // COMPLETE RESPONSE - alle data terug
    const items = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.Image?.[0]?.fileUrl ?? undefined,
      images: p.Image?.map((img: any) => img.fileUrl) ?? [],
      createdAt: p.createdAt,
      category: p.category,
      subcategory: null,
      delivery: p.delivery,
      location: {
        place: p.seller?.User?.place || 'Locatie onbekend',
        city: 'Nederland',
        lat: p.seller?.lat ?? null,
        lng: p.seller?.lng ?? null,
      },
      seller: {
        id: p.seller?.User?.id ?? null,
        name: p.seller?.User?.name ?? null,
        profileImage: p.seller?.User?.profileImage ?? null,
        username: p.seller?.User?.username ?? null,
        buyerTypes: p.seller?.User?.buyerRoles ?? [],
        followerCount: 0, // Skip expensive count for now
        displayFullName: p.seller?.User?.displayFullName ?? undefined,
        displayNameOption: p.seller?.User?.displayNameOption ?? undefined,
        isBusiness: !!(p.seller?.kvk && p.seller?.companyName),
        companyName: p.seller?.companyName ?? null,
        kvk: p.seller?.kvk ?? null,
      },
      favoriteCount: favoriteCountMap.get(p.id) || 0,
      reviewCount: reviewCountMap.get(p.id) || 0,
      viewCount: viewCountMap.get(p.id) || 0,
      isFavorited: userId ? userFavorites.has(p.id) : undefined,
    }));

    const hasNext = items.length === take;

    return NextResponse.json({ 
      items,
      hasNext,
      totalCount: null
    });

  } catch (error) {
    console.error('❌ Products API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}