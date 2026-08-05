/**
 * Phase 3 — targeted booking requests (manual or auto-confirmed).
 * Phase 5.7 — route distance and fee are recomputed server-side when
 * productId + buyer coords exist; client values are not trusted.
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
import { resolveDeliveryPickupCoords } from '@/lib/delivery/delivery-position';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { normalizeCountryCode } from '@/lib/gamification/country-code';

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

async function resolveAuthoritativeQuote(
  prisma: PrismaClient,
  input: {
    productId?: string | null;
    buyerLat?: number | null;
    buyerLng?: number | null;
    profile: {
      pricingEnabled: boolean;
      baseFeeCents: number | null;
      pricePerKmCents: number | null;
      minimumFeeCents: number | null;
      freeDeliveryRadiusKm: number | null;
      maxDistance: number;
      currency: string | null;
      nationalCoverage: boolean;
      user?: { country?: string | null } | null;
    };
  }
): Promise<
  | { ok: true; routeDistanceKm: number; quotedFeeCents: number }
  | { ok: false; status: number; code: string; error: string }
  | { ok: true; routeDistanceKm: null; quotedFeeCents: null }
> {
  const flags = getDeliveryAlignmentFlags();
  if (
    !input.productId ||
    input.buyerLat == null ||
    input.buyerLng == null ||
    !Number.isFinite(input.buyerLat) ||
    !Number.isFinite(input.buyerLng)
  ) {
    // Soft path (manual without full route yet) — no fee lock.
    return { ok: true, routeDistanceKm: null, quotedFeeCents: null };
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: {
      pickupLat: true,
      pickupLng: true,
      seller: {
        select: {
          lat: true,
          lng: true,
          User: { select: { lat: true, lng: true, country: true } },
        },
      },
    },
  });

  const pickup = resolveDeliveryPickupCoords(product);
  if (!pickup) {
    return {
      ok: false,
      status: 422,
      code: 'DELIVERY_ROUTE_UNAVAILABLE',
      error: 'Ophaallocatie van de verkoper ontbreekt.',
    };
  }

  const routeResult = await getRouteDistance(
    { lat: pickup.lat, lng: pickup.lng },
    { lat: input.buyerLat, lng: input.buyerLng },
    'driving'
  );

  if (!('distance' in routeResult)) {
    return {
      ok: false,
      status: 422,
      code: 'DELIVERY_ROUTE_UNAVAILABLE',
      error: 'Routeafstand ontbreekt; prijs kan niet worden berekend.',
    };
  }

  const routeDistanceKm = Math.round(routeResult.distance * 10) / 10;
  const pickupCc = normalizeCountryCode(product?.seller?.User?.country);
  const providerCc = normalizeCountryCode(input.profile.user?.country) || pickupCc;

  if (flags.providerPricingEnabled) {
    const quote = calculateProviderDeliveryPrice({
      pricing: {
        pricingEnabled: input.profile.pricingEnabled,
        baseFeeCents: input.profile.baseFeeCents,
        pricePerKmCents: input.profile.pricePerKmCents,
        minimumFeeCents: input.profile.minimumFeeCents,
        freeDeliveryRadiusKm: input.profile.freeDeliveryRadiusKm,
        maxDistanceKm: input.profile.maxDistance,
        currency: input.profile.currency,
        nationalCoverage: input.profile.nationalCoverage,
      },
      routeDistanceKm,
      pickupCountryCode: pickupCc,
      dropoffCountryCode: pickupCc,
      providerCountryCode: providerCc,
    });
    if (!quote.ok) {
      return {
        ok: false,
        status: quote.code === 'DELIVERY_OUT_OF_RADIUS' ? 422 : 400,
        code: quote.code,
        error: quote.error,
      };
    }
    return {
      ok: true,
      routeDistanceKm: quote.routeDistanceKm,
      quotedFeeCents: quote.deliveryFeeCents,
    };
  }

  return { ok: true, routeDistanceKm, quotedFeeCents: null };
}

export async function createDeliveryBookingRequest(
  prisma: PrismaClient,
  input: {
    buyerId: string;
    deliveryProfileId: string;
    productId?: string | null;
    buyerLat?: number | null;
    buyerLng?: number | null;
    /** Ignored when server can recompute (Phase 5.7). */
    routeDistanceKm?: number | null;
    /** Ignored when server can recompute (Phase 5.7). */
    quotedFeeCents?: number | null;
    notes?: string | null;
  }
) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: input.deliveryProfileId },
    include: {
      user: { select: { id: true, name: true, dateOfBirth: true, country: true } },
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

  const authoritative = await resolveAuthoritativeQuote(prisma, {
    productId: input.productId,
    buyerLat: input.buyerLat,
    buyerLng: input.buyerLng,
    profile,
  });
  if (!authoritative.ok) {
    return {
      ok: false as const,
      status: authoritative.status,
      code: authoritative.code,
      error: authoritative.error,
    };
  }

  const routeDistanceKm =
    authoritative.routeDistanceKm ?? input.routeDistanceKm ?? null;
  // Server-recomputed route → never trust client fee. Soft path may keep client hint.
  const quotedFeeCents =
    authoritative.quotedFeeCents != null
      ? authoritative.quotedFeeCents
      : authoritative.routeDistanceKm != null
        ? null
        : input.quotedFeeCents ?? null;

  const flags = getDeliveryAlignmentFlags();
  if (
    input.productId &&
    input.buyerLat != null &&
    input.buyerLng != null &&
    flags.providerPricingEnabled &&
    authoritative.routeDistanceKm != null &&
    quotedFeeCents == null
  ) {
    return {
      ok: false as const,
      status: 422,
      code: 'DELIVERY_ROUTE_UNAVAILABLE',
      error: 'Bezorgprijs kon niet worden berekend.',
    };
  }

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
      routeDistanceKm,
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
        quotedFeeCents,
        routeDistanceKm,
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
        earningsCents: quotedFeeCents
          ? Math.round(quotedFeeCents * 0.88)
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
      quotedFeeCents,
      routeDistanceKm,
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
