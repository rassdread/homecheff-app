import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';
import {
  applyDeliveryOnlineSession,
  expireExpiredTemporaryOnline,
} from '@/lib/delivery/delivery-online-session';
import {
  DELIVERY_MARKET_TIMEZONE,
  resolveDeliveryTimeAvailability,
  type OnlineDurationPreset,
} from '@/lib/delivery/delivery-time-availability';
import {
  aggregateRequirementNotice,
  noticesForOnlineGate,
  serializeRequirementNotice,
} from '@/lib/account/profile-requirement-notice';

export const dynamic = 'force-dynamic';

const PRESETS = new Set<OnlineDurationPreset>([
  '30m',
  '1h',
  '2h',
  '4h',
  'end_of_day',
  'custom',
]);

function asPreset(value: unknown): OnlineDurationPreset | null {
  return typeof value === 'string' && PRESETS.has(value as OnlineDurationPreset)
    ? (value as OnlineDurationPreset)
    : null;
}

async function loadProfile(userId: string) {
  return prisma.deliveryProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, lat: true, lng: true, place: true, dateOfBirth: true },
      },
    },
  });
}

function availabilityPayload(profile: {
  availableDays: string[];
  availableTimeSlots: string[];
  workStartTime: string | null;
  workEndTime: string | null;
  temporaryOffline: boolean;
  isOnline: boolean;
  lastOnlineAt: Date | null;
  onlineUntil: Date | null;
}) {
  return resolveDeliveryTimeAvailability(profile);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  await expireExpiredTemporaryOnline(prisma);

  const profile = await loadProfile(session.user.id);
  if (!profile) {
    return NextResponse.json(
      { ok: false, code: 'PROFILE_NOT_FOUND', message: 'Geen bezorgprofiel gevonden.' },
      { status: 404 },
    );
  }

  const flags = getDeliveryAlignmentFlags();
  const completion = getDeliveryProfileCompletionFromRow(profile, profile.user, {
    requirePricing: flags.providerPricingEnabled,
  });
  const availability = availabilityPayload(profile);
  const blockNotice = completion.ok
    ? null
    : serializeRequirementNotice(
        aggregateRequirementNotice(noticesForOnlineGate(completion.missing), {
          completeCtaNl: 'Bezorggegevens aanvullen',
        }),
      );

  return NextResponse.json({
    ok: true,
    isOnline: availability.overrideActive,
    lastOnlineAt: profile.lastOnlineAt,
    onlineUntil: profile.onlineUntil,
    availability,
    canGoOnline: completion.ok,
    completion: {
      isComplete: completion.isComplete,
      missing: completion.ok ? [] : completion.missing,
      message: completion.ok ? null : completion.message,
    },
    notice: blockNotice,
    timeZone: DELIVERY_MARKET_TIMEZONE,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const actionRaw = String(body.action || '').toLowerCase();
  const action =
    actionRaw === 'offline' || body.isOnline === false
      ? 'offline'
      : actionRaw === 'extend'
        ? 'extend'
        : 'online';
  const preset = asPreset(body.preset);
  const customUntil =
    typeof body.customUntil === 'string'
      ? body.customUntil
      : typeof body.until === 'string'
        ? body.until
        : null;
  const timeZone =
    typeof body.timeZone === 'string' && body.timeZone.trim()
      ? body.timeZone.trim()
      : DELIVERY_MARKET_TIMEZONE;

  await expireExpiredTemporaryOnline(prisma);

  const profile = await loadProfile(session.user.id);
  if (!profile) {
    return NextResponse.json(
      { ok: false, code: 'PROFILE_NOT_FOUND', message: 'Geen bezorgprofiel gevonden.' },
      { status: 404 },
    );
  }

  if (action !== 'offline') {
    const flags = getDeliveryAlignmentFlags();
    const completion = getDeliveryProfileCompletionFromRow(profile, profile.user, {
      requirePricing: flags.providerPricingEnabled,
    });
    if (!completion.ok) {
      const notice = serializeRequirementNotice(
        aggregateRequirementNotice(noticesForOnlineGate(completion.missing), {
          completeCtaNl: 'Bezorggegevens aanvullen',
        }),
      );
      return NextResponse.json(
        {
          ok: false,
          code: 'ACTIVATION_INCOMPLETE',
          message: notice?.titleNl || completion.message,
          missing: completion.missing,
          notice,
        },
        { status: 400 },
      );
    }
  }

  const applied = await applyDeliveryOnlineSession(prisma, profile.id, {
    action,
    preset: preset ?? undefined,
    customUntil,
    timeZone,
    currentUntil: profile.onlineUntil,
  });

  if (!applied.ok) {
    return NextResponse.json(
      { ok: false, code: applied.code, error: applied.error, message: applied.error },
      { status: 400 },
    );
  }

  const refreshed = await loadProfile(session.user.id);
  const availability = refreshed
    ? availabilityPayload(refreshed)
    : resolveDeliveryTimeAvailability({
        isOnline: applied.isOnline,
        onlineUntil: applied.onlineUntil,
        lastOnlineAt: applied.lastOnlineAt,
      });

  return NextResponse.json({
    ok: true,
    success: true,
    isOnline: availability.overrideActive,
    lastOnlineAt: applied.lastOnlineAt,
    onlineUntil: applied.onlineUntil,
    availability,
    scheduledUnchanged: {
      availableDays: profile.availableDays,
      availableTimeSlots: profile.availableTimeSlots,
      workStartTime: profile.workStartTime,
      workEndTime: profile.workEndTime,
    },
    message:
      action === 'offline'
        ? 'Je bent nu offline.'
        : availability.statusBodyNl,
  });
}
