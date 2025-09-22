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
    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 24), 1), 100); // Limit max results

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
      include: {
        seller: {
          include: {
            User: {
              select: { 
                id: true, 
                name: true, 
                profileImage: true, 
                username: true,
                buyerRoles: true
              },
            }
          }
        },
        Image: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Get follow and favorite counts for each product
    const productIds = products.map((p: any) => p.id);
    const sellerIds = products.map((p: any) => p.seller?.User?.id).filter(Boolean);
    
    // Get follow counts for sellers
    const followCounts = await prisma.follow.groupBy({
      by: ['sellerId'],
      where: {
        sellerId: { in: sellerIds }
      },
      _count: {
        sellerId: true
      }
    });
    
    // Get favorite counts for products
    const favoriteCounts = await prisma.favorite.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds }
      },
      _count: {
        productId: true
      }
    });
    
    const followCountMap = new Map(followCounts.map(fc => [fc.sellerId, fc._count.sellerId]));
    const favoriteCountMap = new Map(favoriteCounts.map(fc => [fc.productId, fc._count.productId]));

    const items = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.Image?.[0]?.fileUrl ?? undefined,
      images: p.Image?.map((img: any) => img.fileUrl) ?? [], // All images for slider
      createdAt: p.createdAt,
      category: p.category,
      subcategory: null, // Could be added to Product schema if needed
      location: {
        place: p.seller?.User?.name ? `${p.seller.User.name}'s locatie` : 'Onbekende locatie',
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
      },
      favoriteCount: favoriteCountMap.get(p.id) ?? 0,
    }));

    // Return items directly without sanitization for now
    return NextResponse.json({ items: items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
