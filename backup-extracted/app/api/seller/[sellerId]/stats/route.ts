import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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
      reviews,
      totalViews,
      totalProps
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
      // Orders count (orders that contain products from this seller with Stripe payment)
      prisma.order.count({
        where: { 
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
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
      // Get all reviews for this seller's products
      prisma.productReview.findMany({
        where: {
          product: {
            seller: {
              id: sellerId
            }
          }
        },
        select: { rating: true }
      }),
      // Get total views for seller's products
      prisma.product.findMany({
        where: { sellerId },
        select: { id: true }
      }).then(async (products) => {
        const productIds = products.map(p => p.id);
        if (productIds.length === 0) return 0;
        return prisma.analyticsEvent.count({
          where: {
            eventType: 'VIEW',
            entityType: 'PRODUCT',
            entityId: { in: productIds }
          }
        });
      }),
      // Get total props (favorites) for seller's products
      prisma.product.findMany({
        where: { sellerId },
        select: { id: true }
      }).then(async (products) => {
        const productIds = products.map(p => p.id);
        if (productIds.length === 0) return 0;
        return prisma.favorite.count({
          where: {
            productId: { in: productIds }
          }
        });
      })
    ]);

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalFollowers,
      totalFollowing,
      totalOrders,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalViews,
      totalProps,
      totalReviews: reviews.length,
      responseTime: 'Binnen 2 uur' // Placeholder
    });

  } catch (error) {
    console.error('Seller stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller stats' }, { status: 500 });
  }
}
