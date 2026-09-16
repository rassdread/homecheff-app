import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateProviderPricingConfig,
  validateProviderPricingForSave,
} from '@/lib/delivery/provider-pricing';
import {
  buildCanonicalSettingsUpdate,
  serializeCanonicalSettingsProfile,
  toProviderActivationProfile,
  resolveCanonicalServiceCoords,
} from '@/lib/delivery/delivery-profile-canonical';
import { getDeliveryProfileCompletion } from '@/lib/delivery/delivery-profile-completion';

export const dynamic = 'force-dynamic';

const PROFILE_SELECT = {
  id: true,
  isActive: true,
  isOnline: true,
  isVerified: true,
  maxDistance: true,
  preferredRadius: true,
  homeLat: true,
  homeLng: true,
  homeAddress: true,
  availableDays: true,
  availableTimeSlots: true,
  transportation: true,
  deliveryRegions: true,
  deliveryMode: true,
  gpsTrackingEnabled: true,
  currentLat: true,
  currentLng: true,
  bio: true,
  totalDeliveries: true,
  averageRating: true,
  totalEarnings: true,
  createdAt: true,
  acceptanceMode: true,
  providerType: true,
  companyDisplayName: true,
  workStartTime: true,
  workEndTime: true,
  temporaryOffline: true,
  vacationStart: true,
  vacationEnd: true,
  maxSimultaneousDeliveries: true,
  maxDeliveriesPerSlot: true,
  preparationTimeMinutes: true,
  estimatedPickupDelayMinutes: true,
  pricingEnabled: true,
  baseFeeCents: true,
  pricePerKmCents: true,
  minimumFeeCents: true,
  freeDeliveryRadiusKm: true,
  currency: true,
  nationalCoverage: true,
} as const;

const USER_LOCATION_SELECT = {
  id: true,
  name: true,
  email: true,
  lat: true,
  lng: true,
  place: true,
  address: true,
  dateOfBirth: true,
  stripeConnectAccountId: true,
  stripeConnectOnboardingCompleted: true,
} as const;

function jsonProfile(
  profile: Parameters<typeof serializeCanonicalSettingsProfile>[0],
  user: {
    lat: number | null;
    lng: number | null;
    place: string | null;
    address?: string | null;
    dateOfBirth: Date | string | null;
  } | null,
) {
  const serialized = serializeCanonicalSettingsProfile(profile);
  const completion = getDeliveryProfileCompletion({
    ...toProviderActivationProfile(profile, user),
    dateOfBirth: user?.dateOfBirth ?? null,
  });
  return {
    profile: serialized,
    completion: {
      isComplete: completion.isComplete,
      missing: completion.ok ? [] : completion.missing,
      message: completion.ok ? null : completion.message,
    },
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: USER_LOCATION_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: PROFILE_SELECT,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        {
          error: 'Geen bezorgprofiel gevonden. Rond eerst je bezorgprofiel af via de onboarding.',
          code: 'DELIVERY_PROFILE_MISSING',
          startHref: '/delivery/start',
        },
        { status: 404 },
      );
    }

    const coords = resolveCanonicalServiceCoords(deliveryProfile, user);
    if (
      (deliveryProfile.homeLat == null || deliveryProfile.homeLng == null) &&
      coords?.source === 'user'
    ) {
      deliveryProfile = await prisma.deliveryProfile.update({
        where: { userId: user.id },
        data: {
          homeLat: coords.lat,
          homeLng: coords.lng,
          homeAddress:
            deliveryProfile.homeAddress || user.place || user.address || null,
        },
        select: PROFILE_SELECT,
      });
    }

    if (
      deliveryProfile.preferredRadius == null &&
      typeof deliveryProfile.maxDistance === 'number'
    ) {
      deliveryProfile = await prisma.deliveryProfile.update({
        where: { userId: user.id },
        data: { preferredRadius: deliveryProfile.maxDistance },
        select: PROFILE_SELECT,
      });
    }

    const completionNow = getDeliveryProfileCompletion({
      ...toProviderActivationProfile(deliveryProfile, user),
      dateOfBirth: user.dateOfBirth,
    });
    if (completionNow.isComplete && !deliveryProfile.isVerified) {
      deliveryProfile = await prisma.deliveryProfile.update({
        where: { userId: user.id },
        data: { isVerified: true },
        select: PROFILE_SELECT,
      });
    }

    return NextResponse.json({
      ...jsonProfile(deliveryProfile, user),
      user,
    });
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return NextResponse.json(
      { error: 'Bezorginstellingen konden niet worden geladen. Probeer het opnieuw.' },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: USER_LOCATION_SELECT,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: {
        ...PROFILE_SELECT,
        userId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Geen bezorgprofiel gevonden. Rond eerst je bezorgprofiel af via de onboarding.',
          code: 'DELIVERY_PROFILE_MISSING',
          startHref: '/delivery/start',
        },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Ongeldige gegevens. Controleer het formulier en probeer opnieuw.' },
        { status: 400 },
      );
    }

    const built = buildCanonicalSettingsUpdate({
      body,
      existing,
      user,
    });
    if (built.error) {
      return NextResponse.json({ error: built.error, code: 'DELIVERY_SETTINGS_INVALID' }, { status: 400 });
    }

    const patch = built.data;

    const mergedPricing = {
      pricingEnabled:
        patch.pricingEnabled !== undefined ? patch.pricingEnabled : existing.pricingEnabled,
      baseFeeCents:
        patch.baseFeeCents !== undefined ? patch.baseFeeCents : existing.baseFeeCents,
      pricePerKmCents:
        patch.pricePerKmCents !== undefined
          ? patch.pricePerKmCents
          : existing.pricePerKmCents,
      minimumFeeCents:
        patch.minimumFeeCents !== undefined
          ? patch.minimumFeeCents
          : existing.minimumFeeCents,
      freeDeliveryRadiusKm:
        patch.freeDeliveryRadiusKm !== undefined
          ? patch.freeDeliveryRadiusKm
          : existing.freeDeliveryRadiusKm,
      maxDistanceKm:
        patch.maxDistance !== undefined ? patch.maxDistance : existing.maxDistance,
      currency: patch.currency !== undefined ? patch.currency : existing.currency,
      nationalCoverage:
        patch.nationalCoverage !== undefined
          ? patch.nationalCoverage
          : existing.nationalCoverage,
    };

    const completeWhenEnabled = validateProviderPricingConfig({
      ...mergedPricing,
      pricingEnabled: true,
    });
    if (completeWhenEnabled.ok && !mergedPricing.pricingEnabled) {
      mergedPricing.pricingEnabled = true;
      patch.pricingEnabled = true;
    }

    if (
      patch.pricingEnabled !== undefined ||
      patch.baseFeeCents !== undefined ||
      patch.pricePerKmCents !== undefined ||
      patch.minimumFeeCents !== undefined ||
      patch.freeDeliveryRadiusKm !== undefined
    ) {
      const pricingCheck = validateProviderPricingForSave(mergedPricing);
      if (!pricingCheck.ok) {
        return NextResponse.json(
          {
            error: pricingCheck.error,
            code: pricingCheck.code,
            details: pricingCheck.details,
          },
          { status: 400 },
        );
      }
    }

    const mergedForGate = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      ),
    };

    const completionPreview = getDeliveryProfileCompletion({
      ...toProviderActivationProfile(mergedForGate, user),
      dateOfBirth: user.dateOfBirth,
    });

    const updatedDeliveryProfile = await prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryProfile.update({
        where: { userId: user.id },
        data: {
          isActive: patch.isActive,
          maxDistance: patch.maxDistance,
          preferredRadius: patch.preferredRadius,
          availableDays: patch.availableDays,
          availableTimeSlots: patch.availableTimeSlots,
          transportation:
            patch.transportation !== undefined
              ? (patch.transportation as typeof existing.transportation)
              : undefined,
          deliveryRegions: patch.deliveryRegions,
          deliveryMode: patch.deliveryMode,
          bio: patch.bio,
          pricingEnabled: patch.pricingEnabled,
          baseFeeCents: patch.baseFeeCents,
          pricePerKmCents: patch.pricePerKmCents,
          minimumFeeCents: patch.minimumFeeCents,
          freeDeliveryRadiusKm: patch.freeDeliveryRadiusKm,
          currency: patch.currency,
          nationalCoverage: patch.nationalCoverage,
          acceptanceMode: patch.acceptanceMode,
          workStartTime: patch.workStartTime,
          workEndTime: patch.workEndTime,
          temporaryOffline: patch.temporaryOffline,
          maxSimultaneousDeliveries: Number.isFinite(patch.maxSimultaneousDeliveries)
            ? patch.maxSimultaneousDeliveries
            : undefined,
          maxDeliveriesPerSlot: Number.isFinite(patch.maxDeliveriesPerSlot)
            ? patch.maxDeliveriesPerSlot
            : undefined,
          preparationTimeMinutes: Number.isFinite(patch.preparationTimeMinutes)
            ? patch.preparationTimeMinutes
            : undefined,
          estimatedPickupDelayMinutes: Number.isFinite(
            patch.estimatedPickupDelayMinutes,
          )
            ? patch.estimatedPickupDelayMinutes
            : undefined,
          homeLat: patch.homeLat,
          homeLng: patch.homeLng,
          homeAddress: patch.homeAddress,
          ...(completionPreview.isComplete && !existing.isVerified
            ? { isVerified: true }
            : {}),
          updatedAt: new Date(),
        },
        select: PROFILE_SELECT,
      });

      if (patch.homeLat != null && patch.homeLng != null) {
        const userPatch: { lat?: number; lng?: number; place?: string } = {};
        if (user.lat == null) userPatch.lat = patch.homeLat;
        if (user.lng == null) userPatch.lng = patch.homeLng;
        if (!user.place && patch.homeAddress) userPatch.place = patch.homeAddress;
        if (Object.keys(userPatch).length > 0) {
          await tx.user.update({
            where: { id: user.id },
            data: userPatch,
          });
        }
      } else if (body.lat !== undefined || body.lng !== undefined || body.place !== undefined) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            lat: body.lat !== undefined ? Number(body.lat) : undefined,
            lng: body.lng !== undefined ? Number(body.lng) : undefined,
            place: body.place !== undefined ? String(body.place) : undefined,
          },
        });
      }

      return updated;
    });

    const persisted = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: PROFILE_SELECT,
    });
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: USER_LOCATION_SELECT,
    });

    const saved = persisted || updatedDeliveryProfile;
    const payload = jsonProfile(saved, freshUser);

    if (!payload.profile) {
      return NextResponse.json(
        { error: 'Opslaan is niet bevestigd. Probeer het opnieuw.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      persisted: true,
      ...payload,
      user: freshUser,
    });
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return NextResponse.json(
      {
        error:
          'Je instellingen zijn niet opgeslagen. Controleer je verbinding en probeer het opnieuw.',
        persisted: false,
      },
      { status: 500 },
    );
  }
}
