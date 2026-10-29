import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateSalesLocation } from '@/lib/seller/sales-locations-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }
    const body = await req.json().catch(() => null);
    const result = await updateSalesLocation(user.id, context.params.id, body);
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
    console.error('[seller locations] update', error);
    return NextResponse.json(
      { error: 'Locatie wijzigen is nog niet beschikbaar.' },
      { status: 503 },
    );
  }
}
