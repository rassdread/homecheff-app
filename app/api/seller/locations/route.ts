import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createSalesLocation,
  listSalesLocations,
  selectedLocationIdsForProduct,
} from '@/lib/seller/sales-locations-server';

export const dynamic = 'force-dynamic';

async function sellerUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await sellerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    const payload = await listSalesLocations(userId);
    const productId = req.nextUrl.searchParams.get('productId');
    const selectedIds = productId
      ? await selectedLocationIdsForProduct(userId, productId)
      : undefined;
    return NextResponse.json({
      ...payload,
      ...(selectedIds ? { selectedIds } : {}),
    });
  } catch (error) {
    console.error('[seller locations] list', error);
    return NextResponse.json(
      { error: 'Locaties zijn nog niet beschikbaar.' },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await sellerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const result = await createSalesLocation(userId, body);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          maxLocations: result.maxLocations,
          plan: result.plan,
          upgradeHref: result.upgradeHref,
        },
        { status: result.status },
      );
    }
    return NextResponse.json({ location: result.location });
  } catch (error) {
    console.error('[seller locations] create', error);
    return NextResponse.json(
      { error: 'Locatie opslaan is nog niet beschikbaar.' },
      { status: 503 },
    );
  }
}
