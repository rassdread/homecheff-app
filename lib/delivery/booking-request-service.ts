/**
 * Phase 3 — targeted booking requests (manual or auto-confirmed).
 */

import type { PrismaClient } from '@prisma/client';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import {
  ACCEPTANCE_MODE_AUTO,
  ACCEPTANCE_MODE_MANUAL,
  BOOKING_REQUEST_TTL_MS,
  validateProviderAutoConfirm,
} from '@/lib/delivery/provider-acceptance';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function expireStaleBookingRequests(
  prisma: PrismaClient,
  ids?: string[]
) {
  const where = {
    status: 'PENDING' as const,
    expiresAt: { lt: new Date() },
    ...(ids?.length ? { id: { in: ids } } : {}),
  };
  await prisma.deliveryBookingRequest.updateMany({
    where,
    data: { status: 'EXPIRED', updatedAt: new Date() },
  });
}

export async function createDeliveryBookingRequest(
  prisma: PrismaClient,
  input: {
    buyerId: string;
    deliveryProfileId: string;
    productId?: string | null;
    buyerLat?: number | null;
    buyerLng?: number | null;
    routeDistanceKm?: number | null;
    quotedFeeCents?: number | null;
    notes?: string | null;
  }
) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: input.deliveryProfileId },
    include: {
      user: { select: { id: true, name: true, dateOfBirth: true } },
    },
  });
  if (!profile) {
    return {
      ok: false as const,
      status: 404,
      code: 'DELIVERY_PROVIDER_REQUIRED',
      error: 'Bezorgaanbieder niet gevonden.',
    };
  }

  const flags = getDeliveryAlignmentFlags();
  const activeCount = await prisma.deliveryOrder.count({
    where: {
      deliveryProfileId: profile.id,
      status: { in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] },
    },
  });

  const validation = validateProviderAutoConfirm(
    {
      id: profile.id,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      isBlocked: profile.isBlocked,
      isOnline: profile.isOnline,
      pricingEnabled: profile.pricingEnabled,
      baseFeeCents: profile.baseFeeCents,
      pricePerKmCents: profile.pricePerKmCents,
      minimumFeeCents: profile.minimumFeeCents,
      age: profile.age,
      maxDistance: profile.maxDistance,
      nationalCoverage: profile.nationalCoverage,
      temporaryOffline: profile.temporaryOffline,
      vacationStart: profile.vacationStart,
      vacationEnd: profile.vacationEnd,
      workStartTime: profile.workStartTime,
      workEndTime: profile.workEndTime,
      breakWindows: profile.breakWindows,
      availableDays: profile.availableDays,
      maxSimultaneousDeliveries: profile.maxSimultaneousDeliveries,
      maxDeliveriesPerSlot: profile.maxDeliveriesPerSlot,
      preparationTimeMinutes: profile.preparationTimeMinutes,
      estimatedPickupDelayMinutes: profile.estimatedPickupDelayMinutes,
      transportation: profile.transportation,
      acceptanceMode: profile.acceptanceMode,
      dateOfBirth: profile.user?.dateOfBirth,
    },
    {
      routeDistanceKm: input.routeDistanceKm,
      activeDeliveryCount: activeCount,
      requirePricingEnabled: flags.providerPricingEnabled,
    }
  );

  const mode = profile.acceptanceMode || ACCEPTANCE_MODE_MANUAL;
  const expiresAt = new Date(Date.now() + BOOKING_REQUEST_TTL_MS);

  if (mode === ACCEPTANCE_MODE_AUTO) {
    if (!validation.ok) {
      return {
        ok: false as const,
        status: 422,
        code: validation.code,
        error: validation.error,
        failedChecks: validation.failedChecks,
      };
    }

    const request = await prisma.deliveryBookingRequest.create({
      data: {
        buyerId: input.buyerId,
        deliveryProfileId: profile.id,
        productId: input.productId || null,
        status: 'AUTO_CONFIRMED',
        acceptanceModeSnapshot: ACCEPTANCE_MODE_AUTO,
        expiresAt,
        quotedFeeCents: input.quotedFeeCents ?? null,
        routeDistanceKm: input.routeDistanceKm ?? null,
        buyerLat: input.buyerLat ?? null,
        buyerLng: input.buyerLng ?? null,
        notes: input.notes ?? null,
        respondedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.deliveryCalendarEntry.create({
      data: {
        deliveryProfileId: profile.id,
        bookingRequestId: request.id,
        title: 'Direct bevestigde bezorging (checkout)',
        pickupAt: new Date(
          Date.now() +
            (validation.estimatedPickupDelayMinutes +
              validation.preparationTimeMinutes) *
              60_000
        ),
        estimatedDurationMinutes:
          validation.preparationTimeMinutes +
          validation.estimatedPickupDelayMinutes +
          30,
        status: 'CONFIRMED',
        earningsCents: input.quotedFeeCents
          ? Math.round(input.quotedFeeCents * 0.88)
          : null,
        updatedAt: new Date(),
      },
    });

    return {
      ok: true as const,
      request,
      acceptanceMode: ACCEPTANCE_MODE_AUTO,
      confirmed: true as const,
    };
  }

  // MANUAL: commercial eligibility required; soft availability warnings allowed
  if (!profile.isActive || profile.isBlocked || !profile.isVerified) {
    return {
      ok: false as const,
      status: 422,
      code: 'DELIVERY_PROVIDER_INELIGIBLE',
      error: 'Bezorgaanbieder is niet beschikbaar.',
    };
  }

  const request = await prisma.deliveryBookingRequest.create({
    data: {
      buyerId: input.buyerId,
      deliveryProfileId: profile.id,
      productId: input.productId || null,
      status: 'PENDING',
      acceptanceModeSnapshot: ACCEPTANCE_MODE_MANUAL,
      expiresAt,
      quotedFeeCents: input.quotedFeeCents ?? null,
      routeDistanceKm: input.routeDistanceKm ?? null,
      buyerLat: input.buyerLat ?? null,
      buyerLng: input.buyerLng ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    },
  });

  try {
    await NotificationService.send({
      userId: profile.userId,
      message: {
        title: 'Nieuwe bezorgaanvraag',
        body: 'Een koper wil jou als bezorger. Bevestig binnen 5 minuten.',
        urgent: true,
        data: {
          type: 'DELIVERY_ORDER_AVAILABLE',
          bookingRequestId: request.id,
          buyerId: input.buyerId,
          link: '/delivery/dashboard',
        },
      },
      channels: ['push'],
      saveToDatabase: true,
    });
  } catch (e) {
    console.warn('booking request notify failed', e);
  }

  return {
    ok: true as const,
    request,
    acceptanceMode: ACCEPTANCE_MODE_MANUAL,
    confirmed: false as const,
    expiresAt,
  };
}

export async function acceptDeliveryBookingRequest(
  prisma: PrismaClient,
  params: { requestId: string; deliveryProfileUserId: string }
) {
  await expireStaleBookingRequests(prisma, [params.requestId]);

  const request = await prisma.deliveryBookingRequest.findUnique({
    where: { id: params.requestId },
    include: { deliveryProfile: true },
  });
  if (!request) {
    return { ok: false as const, status: 404, error: 'Aanvraag niet gevonden' };
  }
  if (request.deliveryProfile.userId !== params.deliveryProfileUserId) {
    return { ok: false as const, status: 403, error: 'Niet geautoriseerd' };
  }
  if (request.status === 'EXPIRED') {
    return { ok: false as const, status: 410, error: 'Aanvraag verlopen', code: 'DELIVERY_BOOKING_EXPIRED' };
  }
  if (request.status !== 'PENDING') {
    return { ok: false as const, status: 409, error: 'Aanvraag is al afgehandeld' };
  }

  const updated = await prisma.deliveryBookingRequest.update({
    where: { id: request.id },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.deliveryCalendarEntry.create({
    data: {
      deliveryProfileId: request.deliveryProfileId,
      bookingRequestId: request.id,
      title: 'Handmatig bevestigde bezorging',
      pickupAt: new Date(
        Date.now() +
          ((request.deliveryProfile.estimatedPickupDelayMinutes ?? 10) +
            (request.deliveryProfile.preparationTimeMinutes ?? 15)) *
            60_000
      ),
      status: 'CONFIRMED',
      earningsCents: request.quotedFeeCents
        ? Math.round(request.quotedFeeCents * 0.88)
        : null,
      updatedAt: new Date(),
    },
  });

  return { ok: true as const, request: updated };
}

export async function rejectDeliveryBookingRequest(
  prisma: PrismaClient,
  params: { requestId: string; deliveryProfileUserId: string }
) {
  const request = await prisma.deliveryBookingRequest.findUnique({
    where: { id: params.requestId },
    include: { deliveryProfile: true },
  });
  if (!request) {
    return { ok: false as const, status: 404, error: 'Aanvraag niet gevonden' };
  }
  if (request.deliveryProfile.userId !== params.deliveryProfileUserId) {
    return { ok: false as const, status: 403, error: 'Niet geautoriseerd' };
  }
  if (request.status !== 'PENDING') {
    return { ok: false as const, status: 409, error: 'Aanvraag is al afgehandeld' };
  }

  const updated = await prisma.deliveryBookingRequest.update({
    where: { id: request.id },
    data: {
      status: 'REJECTED',
      respondedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { ok: true as const, request: updated };
}
