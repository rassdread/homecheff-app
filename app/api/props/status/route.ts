import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const dishId = searchParams.get('dishId');

    if (!productId && !dishId) {
      return NextResponse.json({ error: 'Product ID or Dish ID is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has given props to this product or dish
    const props = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        ...(productId ? { productId: productId } : {}),
        ...(dishId ? { dishId: dishId } : {}),
      }
    });

    return NextResponse.json({ 
      propsGiven: !!props,
      productId: productId || null,
      dishId: dishId || null
    });

  } catch (error) {
    console.error('Error checking props status:', error);
    return NextResponse.json({ error: 'Failed to check props status' }, { status: 500 });
  }
}
