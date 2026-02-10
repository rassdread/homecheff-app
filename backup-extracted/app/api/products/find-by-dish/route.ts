import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');
    const title = searchParams.get('title');
    const userId = searchParams.get('userId');

    if (!dishId && !title && !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get seller profile for the user
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: userId || '' },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ productId: null });
    }

    // Try to find product by:
    // 1. Same ID as dish (if product was created from dish)
    // 2. Same title and seller
    // 3. Same title, seller, and category
    let product = null;

    if (dishId) {
      // Method 1: Try same ID
      product = await prisma.product.findUnique({
        where: { id: dishId },
        select: { id: true }
      });
    }

    if (!product && title && sellerProfile) {
      // Method 2: Try by title and seller
      const products = await prisma.product.findMany({
        where: {
          sellerId: sellerProfile.id,
          title: title,
          isActive: true
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      if (products.length > 0) {
        product = products[0];
      }
    }

    return NextResponse.json({ 
      productId: product?.id || null 
    });
  } catch (error) {
    console.error('Error finding product by dish:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

