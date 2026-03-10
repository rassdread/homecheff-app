import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const dishId = searchParams.get('dishId');

    if (!productId && !dishId) {
      return NextResponse.json({ error: 'Product ID or Dish ID is required' }, { status: 400, headers: cors });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
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
    }, { headers: cors });

  } catch {
    return NextResponse.json({ error: 'Failed to check props status' }, { status: 500, headers: getCorsHeaders(req) });
  }
}
