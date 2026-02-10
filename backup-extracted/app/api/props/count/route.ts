import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!productId && !userId) {
      return NextResponse.json({ error: 'Product ID or User ID is required' }, { status: 400 });
    }

    let propsCount = 0;

    if (productId) {
      // Get props count for a specific product
      propsCount = await prisma.favorite.count({
        where: {
          productId: productId,
        }
      });
    } else if (userId) {
      // Get total props count for all products of a user
      const userProducts = await prisma.product.findMany({
        where: {
          seller: {
            User: {
              id: userId
            }
          }
        },
        select: {
          id: true
        }
      });

      const productIds = userProducts.map(p => p.id);
      
      if (productIds.length > 0) {
        propsCount = await prisma.favorite.count({
          where: {
            productId: {
              in: productIds
            }
          }
        });
      }
    }

    return NextResponse.json({ 
      propsCount,
      productId,
      userId 
    });

  } catch (error) {
    console.error('Error getting props count:', error);
    return NextResponse.json({ error: 'Failed to get props count' }, { status: 500 });
  }
}
