import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const dishId = searchParams.get('dishId');
    const userId = searchParams.get('userId');

    if (!productId && !dishId && !userId) {
      return NextResponse.json({ error: 'Product ID, Dish ID or User ID is required' }, { status: 400 });
    }

    let propsCount = 0;

    if (productId) {
      // Get props count for a specific product
      propsCount = await prisma.favorite.count({
        where: {
          productId: productId,
        }
      });
    } else if (dishId) {
      // Get props count for a specific dish (inspiration item)
      propsCount = await prisma.favorite.count({
        where: {
          dishId: dishId,
        }
      });
    } else if (userId) {
      // Get total props count for all products and dishes of a user
      const [userProducts, userDishes] = await Promise.all([
        prisma.product.findMany({
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
        }),
        prisma.dish.findMany({
          where: {
            userId: userId
          },
          select: {
            id: true
          }
        })
      ]);

      const productIds = userProducts.map(p => p.id);
      const dishIds = userDishes.map(d => d.id);
      
      if (productIds.length > 0 || dishIds.length > 0) {
        propsCount = await prisma.favorite.count({
          where: {
            OR: [
              ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
              ...(dishIds.length > 0 ? [{ dishId: { in: dishIds } }] : [])
            ]
          }
        });
      }
    }

    return NextResponse.json({ 
      propsCount,
      productId: productId || null,
      dishId: dishId || null,
      userId: userId || null
    });

  } catch (error) {
    console.error('Error getting props count:', error);
    return NextResponse.json({ error: 'Failed to get props count' }, { status: 500 });
  }
}
