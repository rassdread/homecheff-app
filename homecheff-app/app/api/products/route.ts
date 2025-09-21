import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache voor 5 minuten voor betere performance
export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 24);

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
          where: { sortOrder: 0 },
          take: 1,
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
      image: p.Image?.[0]?.fileUrl ?? null,
      createdAt: p.createdAt,
      category: p.category,
      subcategory: null, // Could be added to Product schema if needed
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

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
