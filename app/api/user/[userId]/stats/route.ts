import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Security: Validate userId format (must be UUID)
    if (!userId || typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
      return NextResponse.json({
        fansCount: 0,
        totalFavorites: 0,
        totalReviews: 0,
        averageRating: 0,
        totalViews: 0,
        totalProps: 0
      }, { status: 400 });
    }

    // Get all product IDs for this user (via seller)
    const sellerProducts = await prisma.product.findMany({
      where: {
        seller: {
          userId: userId
        },
        isActive: true
      },
      select: {
        id: true
      }
    });

    // Get all dish IDs for this user
    const userDishes = await prisma.dish.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED'
      },
      select: {
        id: true
      }
    });

    const productIds = sellerProducts.map(p => p.id);
    const dishIds = userDishes.map(d => d.id);
    const allItemIds = [...productIds, ...dishIds];

    // Get stats in parallel
    const [
      fansCount,
      totalFavorites,
      productReviews,
      dishReviews,
      totalViews,
      totalProps
    ] = await Promise.all([
      // 1. Aantal fans (followers)
      prisma.follow.count({
        where: {
          sellerId: userId
        }
      }),

      // 2. Totaal favorieten (over alle producten en dishes)
      prisma.favorite.count({
        where: {
          OR: [
            { productId: { in: productIds } },
            { listingId: { in: dishIds } }
          ]
        }
      }),

      // 3 & 4. Product reviews
      productIds.length > 0 ? prisma.productReview.findMany({
        where: {
          productId: { in: productIds }
        },
        select: {
          rating: true
        }
      }) : Promise.resolve([]),

      // 3 & 4. Dish reviews
      dishIds.length > 0 ? prisma.dishReview.findMany({
        where: {
          dishId: { in: dishIds }
        },
        select: {
          rating: true
        }
      }) : Promise.resolve([]),

      // 5. Totaal views (van analytics events)
      allItemIds.length > 0 ? prisma.analyticsEvent.count({
        where: {
          entityId: { in: allItemIds },
          eventType: { in: ['VIEW', 'PRODUCT_VIEW'] },
          entityType: { in: ['PRODUCT', 'DISH'] }
        }
      }) : Promise.resolve(0),

      // 6. Totaal props (favorites over alle producten en dishes)
      (productIds.length > 0 || dishIds.length > 0) ? prisma.favorite.count({
        where: {
          OR: [
            ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
            ...(dishIds.length > 0 ? [{ dishId: { in: dishIds } }] : [])
          ]
        }
      }) : Promise.resolve(0)
    ]);

    // Calculate total reviews and average rating
    const allReviews = [...productReviews, ...dishReviews];
    const totalReviews = allReviews.length;
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length
      : 0;

    return NextResponse.json({
      fansCount: fansCount || 0,
      totalFavorites: totalFavorites || 0,
      totalReviews: totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalViews: totalViews || 0,
      totalProps: totalProps || 0
    });
  } catch (error) {
    console.error("Error in /api/user/[userId]/stats:", error);
    return NextResponse.json({
      fansCount: 0,
      totalFavorites: 0,
      totalReviews: 0,
      averageRating: 0,
      totalViews: 0,
      totalProps: 0
    });
  }
}

