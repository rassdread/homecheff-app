import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId, dishId } = await req.json();

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

    // Check if user has already given props to this product or dish
    const existingProps = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        ...(productId ? { productId: productId } : {}),
        ...(dishId ? { dishId: dishId } : {}),
      }
    });

    let propsGiven = false;

    if (existingProps) {
      // Remove props
      await prisma.favorite.delete({
        where: {
          id: existingProps.id
        }
      });
      propsGiven = false;
    } else {
      // Give props
      await prisma.favorite.create({
        data: {
          userId: user.id,
          ...(productId ? { productId: productId } : {}),
          ...(dishId ? { dishId: dishId } : {}),
        }
      });
      propsGiven = true;
    }

    return NextResponse.json({ 
      propsGiven,
      productId: productId || null,
      dishId: dishId || null
    });

  } catch (error) {
    console.error('Error toggling props:', error);
    return NextResponse.json({ error: 'Failed to toggle props' }, { status: 500 });
  }
}
