import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['sponsored_impression', 'sponsored_click']);

/** First-party measurement only. No user id, no external ad platform. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      kind?: string;
      listingId?: string;
      analyticsConsent?: boolean;
    };
    if (!body.analyticsConsent) return NextResponse.json({ ok: true, stored: false });
    if (!body.kind || !ALLOWED.has(body.kind)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const listingId = body.listingId?.trim();
    if (!listingId || listingId.length > 80) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.analyticsEvent.create({
      data: {
        eventType: body.kind,
        entityType: 'SPONSORED',
        entityId: listingId,
        metadata: { placement: 'feed' },
      },
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
