import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { sellerId } = params;

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        User: {
          select: { id: true }
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const userId = sellerProfile.User.id;

    // Get statistics for this seller
    const [
      totalProducts,
      activeProducts,
      totalFollowers,
      totalFollowing,
      totalOrders,
      averageRating
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { 
          seller: {
            id: sellerId
          }
        }
      }),
      // Active products
      prisma.product.count({
        where: { 
          seller: {
            id: sellerId
          },
          isActive: true
        }
      }),
      // Followers count (users who follow this seller)
      prisma.follow.count({
        where: { sellerId: userId }
      }),
      // Following count (users this seller follows)
      prisma.follow.count({
        where: { followerId: userId }
      }),
      // Orders count (orders that contain products from this seller)
      prisma.order.count({
        where: { 
          items: {
            some: {
              Product: {
                seller: {
                  id: sellerId
                }
              }
            }
          }
        }
      }),
      // Average rating (placeholder - would need reviews system)
      Promise.resolve(4.5)
    ]);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalFollowers,
      totalFollowing,
      totalOrders,
      averageRating,
      responseTime: 'Binnen 2 uur' // Placeholder
    });

  } catch (error) {
    console.error('Seller stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller stats' }, { status: 500 });
  }
}
