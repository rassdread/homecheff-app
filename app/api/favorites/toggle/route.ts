import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { tryAwardItemLikedOrSavedHcp } from '@/lib/gamification/interaction-hcp';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const productId = body.productId as string | undefined;
    const dishId = body.dishId as string | undefined;

    if (!productId && !dishId) {
      return NextResponse.json(
        { error: 'Product ID or Dish ID is required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(productId ? { productId } : { dishId }),
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({ where: { id: existingFavorite.id } });
      return NextResponse.json({
        success: true,
        favorited: false,
        message: 'Removed from favorites',
      });
    }

    let ownerUserId: string | null = null;
    if (productId) {
      const p = await prisma.product.findUnique({
        where: { id: productId },
        select: { seller: { select: { userId: true } } },
      });
      ownerUserId = p?.seller?.userId ?? null;
    } else if (dishId) {
      const d = await prisma.dish.findUnique({
        where: { id: dishId },
        select: { userId: true },
      });
      ownerUserId = d?.userId ?? null;
    }

    if (ownerUserId === userId) {
      return NextResponse.json(
        { error: 'Je kunt je eigen item niet favorieten' },
        { status: 400 },
      );
    }

    await prisma.favorite.create({
      data: {
        userId,
        ...(productId ? { productId } : { dishId }),
      },
    });

    if (productId) {
      void tryAwardItemLikedOrSavedHcp(userId, 'PRODUCT', productId, ownerUserId).catch(
        (e) => console.warn('[gamification] ITEM_LIKED_OR_SAVED', e),
      );
    } else if (dishId) {
      void tryAwardItemLikedOrSavedHcp(userId, 'DISH', dishId, ownerUserId).catch(
        (e) => console.warn('[gamification] ITEM_LIKED_OR_SAVED', e),
      );
    }

    return NextResponse.json({
      success: true,
      favorited: true,
      message: 'Added to favorites',
    });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
