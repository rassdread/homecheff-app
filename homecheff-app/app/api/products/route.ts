import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/security";
import { sanitizeProductForPublic } from "@/lib/data-isolation";

// Cache voor 5 minuten voor betere performance
export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 24), 1), 100); // Limit max results
    const skip = page * take;

    // Optimized query with better indexing
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        // Only get products with images for better UX
        Image: {
          some: {}
        }
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" } // Secondary sort for consistent pagination
      ],
      skip: skip,
      take: Math.min(take, 24), // Limit to 24 items max for performance
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        createdAt: true,
        category: true,
        delivery: true,
        seller: {
          select: {
            id: true,
            lat: true,
            lng: true,
            User: {
              select: { 
                id: true, 
                name: true, 
                profileImage: true, 
                username: true,
                buyerRoles: true,
                place: true,
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
          orderBy: { sortOrder: 'asc' },
          take: 3, // Limit images per product for performance
        },
      },
    });

    // Get follow and favorite counts for each product - optimized
    const productIds = products.map((p: any) => p.id);
    const sellerIds = products.map((p: any) => p.seller?.User?.id).filter(Boolean);
    
    // Execute follow and favorite counts in parallel - only if we have data
    const [followCounts, favoriteCounts] = await Promise.all([
      sellerIds.length > 0 ? prisma.follow.groupBy({
        by: ['sellerId'],
        where: {
          sellerId: { in: sellerIds }
        },
        _count: {
          sellerId: true
        }
      }) : [],
      productIds.length > 0 ? prisma.favorite.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds }
        },
        _count: {
          productId: true
        }
      }) : []
    ]);
    
    const followCountMap = new Map(followCounts.map((fc: any) => [fc.sellerId, fc._count.sellerId] as [string, number]));
    const favoriteCountMap = new Map(favoriteCounts.map((fc: any) => [fc.productId, fc._count.productId] as [string, number]));

    const items = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.Image?.[0]?.fileUrl ?? undefined,
      images: p.Image?.map((img: any) => img.fileUrl) ?? [], // All images for slider
      createdAt: p.createdAt,
      category: p.category,
      subcategory: null, // No subcategory field in Product model
      delivery: p.delivery,
      location: {
        place: p.seller?.User?.place || 'Locatie onbekend',
        city: 'Nederland', // Default city, could be enhanced with actual location data
        lat: p.seller?.lat ?? null,
        lng: p.seller?.lng ?? null,
      },
      seller: {
        id: p.seller?.User?.id ?? null,
        name: p.seller?.User?.name ?? null,
        avatar: p.seller?.User?.profileImage ?? null,
        username: p.seller?.User?.username ?? null,
        buyerTypes: p.seller?.User?.buyerRoles ?? [],
        followerCount: followCountMap.get(p.seller?.User?.id) ?? 0,
        displayFullName: p.seller?.User?.displayFullName ?? undefined,
        displayNameOption: p.seller?.User?.displayNameOption ?? undefined,
      },
      favoriteCount: favoriteCountMap.get(p.id) ?? 0,
    }));

    // Get total count for pagination - only on first page
    const totalCount = page === 0 ? await prisma.product.count({
      where: { 
        isActive: true,
        Image: {
          some: {}
        }
      }
    }) : 0;

    // Return items with pagination info
    return NextResponse.json({ 
      items: items,
      pagination: {
        page: page,
        take: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take),
        hasNext: (page + 1) * take < totalCount,
        hasPrev: page > 0
      }
    });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
