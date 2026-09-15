import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  applyDeliveryOnlineSession,
  expireExpiredTemporaryOnline,
} from '@/lib/delivery/delivery-online-session';
import { DELIVERY_MARKET_TIMEZONE } from '@/lib/delivery/delivery-time-availability';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';
import {
  aggregateRequirementNotice,
  noticesForOnlineGate,
  serializeRequirementNotice,
} from '@/lib/account/profile-requirement-notice';

export const dynamic = 'force-dynamic';

/**
 * Legacy wrapper. Prefer POST /api/delivery/online with a duration preset.
 * Going online without a duration is rejected so the dashboard sheet is used.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const wantOnline = body.isOnline !== false && body.action !== 'offline';

    await expireExpiredTemporaryOnline(prisma);

    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { lat: true, lng: true, place: true, dateOfBirth: true } },
      },
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
    }

    if (!wantOnline) {
      const applied = await applyDeliveryOnlineSession(prisma, deliveryProfile.id, {
        action: 'offline',
      });
      if (!applied.ok) {
        return NextResponse.json({ error: applied.error, code: applied.code }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        isOnline: false,
        onlineUntil: null,
        message: 'Je bent nu offline en ontvangt geen bestellingen',
      });
    }

    const flags = getDeliveryAlignmentFlags();
    const completion = getDeliveryProfileCompletionFromRow(
      deliveryProfile,
      deliveryProfile.user,
      { requirePricing: flags.providerPricingEnabled },
    );
    if (!completion.ok) {
      const notice = serializeRequirementNotice(
        aggregateRequirementNotice(noticesForOnlineGate(completion.missing), {
          completeCtaNl: 'Bezorggegevens aanvullen',
        }),
      );
      return NextResponse.json(
        {
          error: notice?.titleNl || completion.message,
          code: 'ACTIVATION_INCOMPLETE',
          missing: completion.missing,
          notice,
        },
        { status: 400 },
      );
    }

    const preset = typeof body.preset === 'string' ? body.preset : null;
    if (!preset && !body.until && !body.customUntil) {
      return NextResponse.json(
        {
          error: 'Kies hoe lang je online wilt blijven.',
          code: 'DURATION_REQUIRED',
        },
        { status: 400 },
      );
    }

    const applied = await applyDeliveryOnlineSession(prisma, deliveryProfile.id, {
      action: body.action === 'extend' ? 'extend' : 'online',
      preset: preset as '30m' | '1h' | '2h' | '4h' | 'end_of_day' | 'custom',
      customUntil: body.customUntil || body.until || null,
      timeZone: body.timeZone || DELIVERY_MARKET_TIMEZONE,
      currentUntil: deliveryProfile.onlineUntil,
    });
    if (!applied.ok) {
      return NextResponse.json({ error: applied.error, code: applied.code }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      isOnline: true,
      onlineUntil: applied.onlineUntil,
      lastOnlineAt: applied.lastOnlineAt,
      message: 'Je bent nu online en ontvangt bestellingen',
    });
  } catch (error) {
    console.error('Error toggling delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle delivery status' },
      { status: 500 },
    );
  }
}
