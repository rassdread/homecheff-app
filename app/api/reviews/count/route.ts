import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Count ProductReview (for products)
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: { userId },
      select: { id: true }
    });

    let productReviewsCount = 0;
    if (sellerProfiles.length > 0) {
      const sellerIds = sellerProfiles.map(sp => sp.id);
      productReviewsCount = await prisma.productReview.count({
        where: {
          product: {
            sellerId: { in: sellerIds }
          }
        }
      }).catch(() => 0);
    }

    // Count DishReview (for inspiration items)
    const dishReviewsCount = await prisma.dishReview.count({
      where: {
        dish: {
          userId: userId
        }
      }
    }).catch(() => 0);

    const totalCount = productReviewsCount + dishReviewsCount;

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    console.error('Error fetching reviews count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


