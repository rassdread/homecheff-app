import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateProviderPricingForSave } from '@/lib/delivery/provider-pricing';

export const dynamic = 'force-dynamic';

function pricingPayload(profile: {
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  freeDeliveryRadiusKm: number;
  currency: string;
  nationalCoverage: boolean;
  maxDistance: number;
}) {
  return {
    pricingEnabled: profile.pricingEnabled,
    baseFeeCents: profile.baseFeeCents,
    pricePerKmCents: profile.pricePerKmCents,
    minimumFeeCents: profile.minimumFeeCents,
    freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
    currency: profile.currency,
    nationalCoverage: profile.nationalCoverage,
    maxDistance: profile.maxDistance,
  };
}

export async function GET(req: NextRequest) {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lat: true,
            lng: true,
            place: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        },
      },
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: deliveryProfile.id,
        isActive: deliveryProfile.isActive,
        isOnline: deliveryProfile.isOnline || false,
        maxDistance: deliveryProfile.maxDistance,
        availableDays: deliveryProfile.availableDays,
        availableTimes: deliveryProfile.availableTimeSlots || [],
        transportation: deliveryProfile.transportation || [],
        deliveryRegions: deliveryProfile.deliveryRegions,
        deliveryMode: deliveryProfile.deliveryMode || 'STATIC',
        gpsTrackingEnabled: deliveryProfile.gpsTrackingEnabled || false,
        currentLat: deliveryProfile.currentLat,
        currentLng: deliveryProfile.currentLng,
        bio: deliveryProfile.bio,
        totalDeliveries: deliveryProfile.totalDeliveries,
        averageRating: deliveryProfile.averageRating,
        totalEarnings: deliveryProfile.totalEarnings,
        createdAt: deliveryProfile.createdAt,
        acceptanceMode: deliveryProfile.acceptanceMode,
        providerType: deliveryProfile.providerType,
        workStartTime: deliveryProfile.workStartTime,
        workEndTime: deliveryProfile.workEndTime,
        temporaryOffline: deliveryProfile.temporaryOffline,
        vacationStart: deliveryProfile.vacationStart,
        vacationEnd: deliveryProfile.vacationEnd,
        maxSimultaneousDeliveries: deliveryProfile.maxSimultaneousDeliveries,
        maxDeliveriesPerSlot: deliveryProfile.maxDeliveriesPerSlot,
        preparationTimeMinutes: deliveryProfile.preparationTimeMinutes,
        estimatedPickupDelayMinutes: deliveryProfile.estimatedPickupDelayMinutes,
        ...pricingPayload(deliveryProfile),
      },
      user: deliveryProfile.user || null,
    });
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery settings' },
      { status: 500 }
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      isActive,
      maxDistance,
      availableDays,
      availableTimes,
      availableTimeSlots,
      transportation,
      deliveryRegions,
      bio,
      lat,
      lng,
      place,
      pricingEnabled,
      baseFeeCents,
      pricePerKmCents,
      minimumFeeCents,
      freeDeliveryRadiusKm,
      currency,
      nationalCoverage,
      acceptanceMode,
      workStartTime,
      workEndTime,
      temporaryOffline,
      maxSimultaneousDeliveries,
      maxDeliveriesPerSlot,
      preparationTimeMinutes,
      estimatedPickupDelayMinutes,
    } = body;

    const nextMaxDistance =
      maxDistance !== undefined ? Number(maxDistance) : undefined;

    if (
      pricingEnabled !== undefined ||
      baseFeeCents !== undefined ||
      pricePerKmCents !== undefined ||
      minimumFeeCents !== undefined ||
      freeDeliveryRadiusKm !== undefined
    ) {
      const existing = await prisma.deliveryProfile.findUnique({
        where: { userId: user.id },
        select: {
          pricingEnabled: true,
          baseFeeCents: true,
          pricePerKmCents: true,
          minimumFeeCents: true,
          freeDeliveryRadiusKm: true,
          currency: true,
          nationalCoverage: true,
          maxDistance: true,
        },
      });

      if (!existing) {
        return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
      }

      const pricingCheck = validateProviderPricingForSave({
        pricingEnabled:
          pricingEnabled !== undefined
            ? Boolean(pricingEnabled)
            : existing.pricingEnabled,
        baseFeeCents:
          baseFeeCents !== undefined ? baseFeeCents : existing.baseFeeCents,
        pricePerKmCents:
          pricePerKmCents !== undefined
            ? pricePerKmCents
            : existing.pricePerKmCents,
        minimumFeeCents:
          minimumFeeCents !== undefined
            ? minimumFeeCents
            : existing.minimumFeeCents,
        freeDeliveryRadiusKm:
          freeDeliveryRadiusKm !== undefined
            ? Number(freeDeliveryRadiusKm)
            : existing.freeDeliveryRadiusKm,
        maxDistanceKm:
          nextMaxDistance !== undefined
            ? nextMaxDistance
            : existing.maxDistance,
        currency: currency !== undefined ? currency : existing.currency,
        nationalCoverage:
          nationalCoverage !== undefined
            ? Boolean(nationalCoverage)
            : existing.nationalCoverage,
      });

      if (!pricingCheck.ok) {
        return NextResponse.json(
          {
            error: pricingCheck.error,
            code: pricingCheck.code,
            details: pricingCheck.details,
          },
          { status: 400 }
        );
      }
    }

    const timeSlots =
      availableTimes !== undefined
        ? availableTimes
        : availableTimeSlots !== undefined
          ? availableTimeSlots
          : undefined;

    const updatedDeliveryProfile = await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        maxDistance: nextMaxDistance !== undefined ? nextMaxDistance : undefined,
        availableDays: availableDays !== undefined ? availableDays : undefined,
        availableTimeSlots: timeSlots !== undefined ? timeSlots : undefined,
        transportation: transportation !== undefined ? transportation : undefined,
        deliveryRegions: deliveryRegions !== undefined ? deliveryRegions : undefined,
        bio: bio !== undefined ? bio : undefined,
        pricingEnabled:
          pricingEnabled !== undefined ? Boolean(pricingEnabled) : undefined,
        baseFeeCents: baseFeeCents !== undefined ? baseFeeCents : undefined,
        pricePerKmCents:
          pricePerKmCents !== undefined ? pricePerKmCents : undefined,
        minimumFeeCents:
          minimumFeeCents !== undefined ? minimumFeeCents : undefined,
        freeDeliveryRadiusKm:
          freeDeliveryRadiusKm !== undefined
            ? Number(freeDeliveryRadiusKm)
            : undefined,
        currency: currency !== undefined ? String(currency).toUpperCase() : undefined,
        nationalCoverage:
          nationalCoverage !== undefined ? Boolean(nationalCoverage) : undefined,
        acceptanceMode:
          acceptanceMode === 'AUTO_CONFIRM' || acceptanceMode === 'MANUAL_CONFIRM'
            ? acceptanceMode
            : undefined,
        workStartTime: workStartTime !== undefined ? String(workStartTime) : undefined,
        workEndTime: workEndTime !== undefined ? String(workEndTime) : undefined,
        temporaryOffline:
          temporaryOffline !== undefined ? Boolean(temporaryOffline) : undefined,
        maxSimultaneousDeliveries:
          maxSimultaneousDeliveries !== undefined
            ? Number(maxSimultaneousDeliveries)
            : undefined,
        maxDeliveriesPerSlot:
          maxDeliveriesPerSlot !== undefined
            ? Number(maxDeliveriesPerSlot)
            : undefined,
        preparationTimeMinutes:
          preparationTimeMinutes !== undefined
            ? Number(preparationTimeMinutes)
            : undefined,
        estimatedPickupDelayMinutes:
          estimatedPickupDelayMinutes !== undefined
            ? Number(estimatedPickupDelayMinutes)
            : undefined,
        updatedAt: new Date(),
      },
    });

    if (lat !== undefined || lng !== undefined || place !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lat: lat !== undefined ? lat : undefined,
          lng: lng !== undefined ? lng : undefined,
          place: place !== undefined ? place : undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedDeliveryProfile,
        ...pricingPayload(updatedDeliveryProfile),
      },
    });
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery settings' },
      { status: 500 }
    );
  }
}
