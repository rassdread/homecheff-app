import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if favorite relationship already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });

      return NextResponse.json({ 
        success: true, 
        favorited: false,
        message: 'Removed from favorites'
      });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId,
          productId,
        },
      });

      return NextResponse.json({ 
        success: true, 
        favorited: true,
        message: 'Added to favorites'
      });
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}


