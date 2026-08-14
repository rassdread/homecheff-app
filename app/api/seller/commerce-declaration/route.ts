/**
 * LEGAL-1 — GET/PUT seller commerce self-declaration (owner only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  applyCommerceDeclarationUpdate,
  toOwnerSellerCommerceView,
} from '@/lib/legal/seller-commerce-context';
import { getSellerCommerceContextForUserId } from '@/lib/legal/get-seller-commerce-context';
import { isSelectableCommerceDeclaration } from '@/lib/legal/seller-commerce-types';

export const dynamic = 'force-dynamic';

async function resolveUserId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await getSellerCommerceContextForUserId(userId, {
      persistReviewSignals: true,
    });

    return NextResponse.json({
      commerce: toOwnerSellerCommerceView(ctx),
    });
  } catch (e) {
    console.error('[seller/commerce-declaration GET]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (!isSelectableCommerceDeclaration(body?.declaration)) {
      return NextResponse.json(
        {
          error: 'Ongeldige keuze',
          errorKey: 'commerce.declaration.invalid',
        },
        { status: 400 },
      );
    }

    let seller = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!seller) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });
      seller = await prisma.sellerProfile.create({
        data: {
          id: randomUUID(),
          userId,
          displayName: user?.name || user?.username || 'Verkoper',
          bio: 'Verkoop via HomeCheff',
          deliveryMode: 'FIXED',
          deliveryRadius: 5,
        },
      });
    }

    const update = applyCommerceDeclarationUpdate({
      previous: seller,
      nextDeclaration: body.declaration,
    });

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: update,
    });

    const ctx = await getSellerCommerceContextForUserId(userId, {
      persistReviewSignals: true,
    });

    return NextResponse.json({
      ok: true,
      commerce: toOwnerSellerCommerceView(ctx),
    });
  } catch (e) {
    console.error('[seller/commerce-declaration PUT]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
