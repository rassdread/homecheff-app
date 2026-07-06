import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { tryAwardItemLikedOrSavedHcp } from '@/lib/gamification/interaction-hcp';

/**
 * @deprecated Phase 0 — use /api/favorites/toggle for products and dishes.
 * Workspace props use WorkspaceContentProp (separate API).
 * Kept for backward compatibility; writes the same Favorite rows as favorites.
 */
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: cors });
    }

    const { productId, dishId } = await req.json();

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
      if (ownerUserId === user.id) {
        return NextResponse.json(
          { error: 'Je kunt je eigen item geen props geven' },
          { status: 400, headers: cors }
        );
      }

      // Give props
      await prisma.favorite.create({
        data: {
          userId: user.id,
          ...(productId ? { productId: productId } : {}),
          ...(dishId ? { dishId: dishId } : {}),
        }
      });
      propsGiven = true;
      if (productId) {
        void tryAwardItemLikedOrSavedHcp(user.id, 'PRODUCT', productId, ownerUserId).catch((e) =>
          console.warn('[gamification] ITEM_LIKED_OR_SAVED', e),
        );
      } else if (dishId) {
        void tryAwardItemLikedOrSavedHcp(user.id, 'DISH', dishId, ownerUserId).catch((e) =>
          console.warn('[gamification] ITEM_LIKED_OR_SAVED', e),
        );
      }
    }

    return NextResponse.json({ 
      propsGiven,
      productId: productId || null,
      dishId: dishId || null
    }, { headers: cors });

  } catch (error) {
    console.error('Error toggling props:', error);
    return NextResponse.json({ error: 'Failed to toggle props' }, { status: 500, headers: cors });
  }
}
