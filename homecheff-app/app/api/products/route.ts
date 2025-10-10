import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/security";
import { sanitizeProductForPublic } from "@/lib/data-isolation";

// BALANCED CACHING - snel maar compleet
export const revalidate = 3600; // 1 hour cache
export const dynamic = "force-static";

export async function GET(req: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 10), 1), 24);
    const isMobile = searchParams.get("mobile") === "true";
    const skip = page * take;
    const userId = searchParams.get("userId");

    console.log(`📦 Products API: page=${page}, take=${take}, userId=${userId}`);

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

    console.log(`⏱️  Query took: ${Date.now() - startTime}ms, got ${products.length} products`);

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
        avatar: p.seller?.User?.profileImage ?? null,
        username: p.seller?.User?.username ?? null,
        buyerTypes: p.seller?.User?.buyerRoles ?? [],
        followerCount: 0, // Skip expensive count for now
        displayFullName: p.seller?.User?.displayFullName ?? undefined,
        displayNameOption: p.seller?.User?.displayNameOption ?? undefined,
      },
      favoriteCount: 0, // Skip expensive count for now
      isFavorited: userId ? userFavorites.has(p.id) : undefined,
    }));

    const hasNext = items.length === take;

    console.log(`✅ Total API time: ${Date.now() - startTime}ms`);

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