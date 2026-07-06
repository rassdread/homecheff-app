import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const dishId = searchParams.get('dishId');

    if (!productId && !dishId) {
      return NextResponse.json(
        { error: 'Product ID or Dish ID is required' },
        { status: 400, headers: cors },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        ...(productId ? { productId } : { dishId: dishId! }),
      },
    });

    return NextResponse.json({
      favorited: !!favorite,
      userId: user.id,
      productId: productId ?? null,
      dishId: dishId ?? null,
    }, { headers: cors });
  } catch (error) {
    console.error('Favorite status error:', error);
    return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500, headers: cors });
  }
}
