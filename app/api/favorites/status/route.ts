import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Check if user has favorited this product
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        productId,
      },
    });

    return NextResponse.json({ 
      favorited: !!favorite,
      userId,
      productId
    });
  } catch (error) {
    console.error('Favorite status error:', error);
    return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
  }
}

