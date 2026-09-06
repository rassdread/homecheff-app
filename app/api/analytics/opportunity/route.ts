import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  normalizeOpportunityEventType,
  trackOpportunityEventServer,
} from '@/lib/analytics/opportunity-analytics-server';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'OPPORTUNITY_HUB_VIEW',
  'OPPORTUNITY_CARD_CLICK',
  'OPPORTUNITY_SHARE_INTENT',
  'OPPORTUNITY_SHARE_LINK_CREATED',
  'OPPORTUNITY_SHARE_NATIVE_OPENED',
  'OPPORTUNITY_SHARE_LINK_COPIED',
  'REFERRAL_LANDING',
  'SIGNUP_STARTED',
  'SIGNUP_COMPLETED',
  'CANONICAL_ATTRIBUTION_LOCKED',
  'DELIVERY_PROVIDER_ONBOARDING_STARTED',
  'DELIVERY_PROVIDER_PROFILE_CREATED',
  'DELIVERY_PROVIDER_ACTIVATED',
  'opportunity_hub_view',
  'opportunity_card_click',
  'opportunity_share_intent',
  'opportunity_share_link_copied',
  'opportunity_share_native_opened',
  'opportunity_share_link_created',
]);

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const body = (await req.json().catch(() => ({}))) as {
      eventType?: string;
      metadata?: Record<string, unknown>;
      entityId?: string;
    };
    const raw = typeof body.eventType === 'string' ? body.eventType.trim() : '';
    if (!raw || !ALLOWED.has(raw)) {
      return NextResponse.json({ ok: false, code: 'INVALID_EVENT' }, { status: 400, headers: cors });
    }

    const session = await auth();
    let userId: string | null = null;
    if (session?.user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = u?.id ?? null;
    }

    const result = await trackOpportunityEventServer({
      eventType: normalizeOpportunityEventType(raw),
      userId,
      entityId: body.entityId ?? null,
      metadata: {
        ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
        authenticated: Boolean(session?.user),
      },
    });

    return NextResponse.json({ ok: result.ok, id: result.id }, { headers: cors });
  } catch (e) {
    console.error('[analytics/opportunity]', e);
    return NextResponse.json({ ok: false }, { status: 500, headers: cors });
  }
}
