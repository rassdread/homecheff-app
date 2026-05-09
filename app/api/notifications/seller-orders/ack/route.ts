import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { markSellerFacingOrderNotificationsRead } from '@/lib/notifications/markSellerFacingOrderNotificationsRead';

/** Verkoper heeft het orderoverzicht geopend — markeer bijbehorende seller-facing ordermeldingen gelezen (nav-badge). */
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404, headers: cors });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Geen verkoperprofiel' }, { status: 403, headers: cors });
    }

    const marked = await markSellerFacingOrderNotificationsRead(user.id);

    return NextResponse.json({ success: true, markedCount: marked }, { headers: cors });
  } catch (error) {
    console.error('seller-orders ack:', error);
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500, headers: cors }
    );
  }
}
