import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';
import {
  acceptDeliveryBookingRequest,
  createDeliveryBookingRequest,
  type ScheduleConfirmation,
} from '@/lib/delivery/booking-request-service';
import { standaloneBookingNotes } from '@/lib/delivery/standalone-booking-meta';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { resolveDelivererPosition } from '@/lib/delivery/delivery-position';
import { assertCourierBookableAt } from '@/lib/delivery/standalone-availability';
import { assertDelivererCanAccept } from '@/lib/delivery/delivery-eligibility';
import { ensureCourierPayable } from '@/lib/delivery/courier-payable';
import {
  attachConnectionTravel,
  resolveJobDrive,
  scheduleConflictError,
  scheduleNeighbors,
} from '@/lib/delivery/booking-schedule';
import { assessSchedule, planReservation, routeModeForVehicle } from '@/lib/delivery/delivery-schedule';
import {
  applyProposalAction,
  interpretStoredCapacity,
  isTransportVehicle,
  transportProposalsEnabled,
  vehicleFits,
  type ProposalAction,
  type TransportCargo,
} from '@/lib/delivery/transport-job';

const PAYMENT_WINDOW_MS = 20 * 60 * 1000;
const PROPOSAL_TTL_MS = 48 * 60 * 60 * 1000;

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readTransportCargo(value: unknown): TransportCargo | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const items = Array.isArray(raw.items)
    ? raw.items.slice(0, 20).map((item) => {
        const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        return {
          lengthCm: numberOrNull(row.lengthCm) ?? 0,
          widthCm: numberOrNull(row.widthCm) ?? 0,
          heightCm: numberOrNull(row.heightCm) ?? 0,
          weightKg: numberOrNull(row.weightKg) ?? 0,
        };
      })
    : [];
  const preferred = typeof raw.preferredVehicle === 'string' && isTransportVehicle(raw.preferredVehicle)
    ? raw.preferredVehicle
    : null;
  const itemCount = numberOrNull(raw.itemCount) ?? items.length;
  if (itemCount <= 0) return null;
  return {
    itemCount,
    items,
    totalWeightKg: numberOrNull(raw.totalWeightKg) ?? items.reduce((sum, item) => sum + item.weightKg, 0),
    floors: numberOrNull(raw.floors) ?? 0,
    lift: raw.lift === true,
    helpNeeded: raw.helpNeeded === true,
    fragile: raw.fragile === true,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 1000) : '',
    preferredVehicle: preferred,
    photoIds: Array.isArray(raw.photoIds) ? raw.photoIds.filter((id): id is string => typeof id === 'string').slice(0, 12) : [],
  };
}

function fitCargo(
  cargo: TransportCargo,
  profile: {
    transportation: string[];
    maxLengthCm: number | null;
    maxWidthCm: number | null;
    maxHeightCm: number | null;
    maxWeightGrams: number | null;
    vehicleCapacityStatus: unknown;
  },
) {
  const interpreted = interpretStoredCapacity(profile);
  return vehicleFits(cargo, {
    modes: profile.transportation,
    maxLengthCm: interpreted.maxLengthCm,
    maxWidthCm: interpreted.maxWidthCm,
    maxHeightCm: interpreted.maxHeightCm,
    maxWeightGrams: interpreted.maxWeightGrams,
    status: interpreted.status,
  });
}

async function courierCanTakePaidJob(deliveryProfileId: string) {
  const payable = await ensureCourierPayable(prisma, deliveryProfileId);
  if (!payable.ok) return payable;
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: deliveryProfileId },
    include: {
      user: { select: { id: true, name: true, lat: true, lng: true, dateOfBirth: true } },
    },
  });
  if (!profile?.user) {
    return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
  }
  const gate = assertDelivererCanAccept(
    {
      id: profile.id,
      userId: profile.userId,
      isVerified: profile.isVerified,
      isActive: profile.isActive,
      isBlocked: profile.isBlocked,
      age: profile.age,
      user: { dateOfBirth: profile.user.dateOfBirth },
    },
    { dateOfBirth: profile.user.dateOfBirth },
  );
  if (!gate.ok) return { ok: false as const, status: gate.status, code: gate.code, error: gate.error };
  return { ok: true as const, profile };
}

async function scheduleView(input: {
  deliveryProfileId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  routeDistanceKm: number;
  requestedPickupAt: Date | null;
  confirmation: ScheduleConfirmation | null;
}) {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: input.deliveryProfileId },
    include: { user: { select: { lat: true, lng: true } } },
  });
  if (!profile) return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
  const start = input.requestedPickupAt ?? new Date();
  const drive = await resolveJobDrive(profile, {
    buyerLat: input.dropoffLat,
    buyerLng: input.dropoffLng,
    routeDistanceKm: input.routeDistanceKm,
  });
  const mode = routeModeForVehicle(profile.transportation[0] ?? null);
  const neighbors = await attachConnectionTravel(
    prisma,
    await scheduleNeighbors(prisma, profile.id, 'transport-preview'),
    {
      pickup: { lat: input.pickupLat, lng: input.pickupLng },
      dropoff: { lat: input.dropoffLat, lng: input.dropoffLng },
    },
    mode,
  );
  const plan = planReservation({
    start,
    loadMinutes: input.confirmation?.loadMinutes ?? null,
    driveMinutes: drive.minutes,
    driveSource: drive.source,
    driveMatchesVehicle: drive.matchesVehicle,
    unloadMinutes: input.confirmation?.unloadMinutes ?? null,
  });
  const assessed = assessSchedule(plan, neighbors);
  const schedule = {
    start: start.toISOString(),
    driveMinutes: drive.minutes,
    driveIsEstimate: drive.source !== 'google' || !drive.matchesVehicle,
    neighbors: neighbors.map((neighbor) => ({
      id: neighbor.id,
      start: neighbor.start?.toISOString() ?? null,
      end: neighbor.end?.toISOString() ?? null,
      endKnown: neighbor.end != null,
      travelToMinutes: neighbor.travelToCandidateMinutes,
      travelFromMinutes: neighbor.travelFromCandidateMinutes,
      travelIsEstimate: neighbor.travelSource !== 'google' || !neighbor.travelMatchesVehicle,
    })),
  };
  if (!input.confirmation || !plan.complete) {
    return {
      ok: false as const,
      status: 422,
      code: 'SCHEDULE_CONFIRMATION_REQUIRED',
      error: 'Bevestig laden, rijden en lossen. Een ontbrekende tijd telt niet als nul minuten.',
      schedule,
    };
  }
  if (assessed.conflicts.some((conflict) => conflict.code === 'WINDOW_OVERLAP' || conflict.code === 'TRAVEL_TOO_SHORT')) {
    return {
      ok: false as const,
      status: 422,
      code: 'SCHEDULE_CONFLICT',
      error: scheduleConflictError(assessed.conflicts),
      schedule,
    };
  }
  if (plan.driveIsEstimate && !input.confirmation.acceptEstimatedDrive) {
    return {
      ok: false as const,
      status: 422,
      code: 'SCHEDULE_ESTIMATE_REQUIRED',
      error: 'De reistijd is een schatting. Bevestig die schatting of kies een ander moment.',
      schedule,
    };
  }
  if (
    assessed.conflicts.some((conflict) => conflict.code === 'CONNECTION_UNKNOWN') &&
    !input.confirmation.acknowledgeUnknownConnections
  ) {
    return {
      ok: false as const,
      status: 422,
      code: 'SCHEDULE_CONNECTION_UNKNOWN',
      error: 'De aansluiting op een andere opdracht is onbekend. Bevestig die aansluiting of kies een ander moment.',
      schedule,
    };
  }
  return { ok: true as const, schedule };
}

export async function sendTransportProposal(input: {
  requesterUserId: string;
  deliveryProfileId: string;
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  requestedPickupAt: Date | null;
  priceCents: number | null;
  note: string;
  negotiable: boolean;
  action?: 'OFFER' | 'QUESTION';
  cargo: TransportCargo;
  routeDistanceKm: number;
}) {
  if (!transportProposalsEnabled()) {
    return { ok: false as const, status: 403, code: 'TRANSPORT_DISABLED', error: 'Transportvoorstellen staan uit.' };
  }
  const opened = applyProposalAction({
    versions: [],
    expectedVersion: 0,
    actorRole: 'CUSTOMER',
    action: input.action === 'QUESTION' ? 'QUESTION' : 'OFFER',
    priceCents: input.action === 'QUESTION' ? null : input.priceCents,
    negotiable: input.negotiable,
    now: new Date(),
    expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS),
  });
  if (!opened.ok) {
    return { ok: false as const, status: 422, code: opened.code, error: 'Het prijsvoorstel is niet geldig.' };
  }
  const ready = await courierCanTakePaidJob(input.deliveryProfileId);
  if (!ready.ok) return ready;
  const fit = fitCargo(input.cargo, ready.profile);
  if (fit !== 'fit') {
    return {
      ok: false as const,
      status: 422,
      code: fit === 'too_small' || fit === 'wrong_type' ? 'VEHICLE_TOO_SMALL' : 'VEHICLE_CAPACITY_UNKNOWN',
      error: 'De lading past niet bij de bekende voertuigcapaciteit. Een ontbrekende maat is geen onbeperkt voertuig.',
    };
  }
  const storedPrice = input.action === 'QUESTION' ? 0 : input.priceCents || 0;
  const split = splitDeliveryCommission(storedPrice);
  const buyerFee = calculateStripeFeeForBuyer(storedPrice);
  const now = new Date();
  const requestId = randomUUID();
  const version = opened.versions[0]!;
  await prisma.standaloneDeliveryRequest.create({
    data: {
      id: requestId,
      requesterUserId: input.requesterUserId,
      pickupAddress: input.pickupAddress.trim(),
      deliveryAddress: input.deliveryAddress.trim(),
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      itemDescription: input.itemDescription.trim(),
      deliveryProfileId: input.deliveryProfileId,
      providerDisplayName: ready.profile.user.name?.trim() || 'Bezorgaanbieder',
      quotedFeeCents: storedPrice,
      stripeFeeCents: buyerFee.stripeFeeCents,
      buyerTotalCents: buyerFee.buyerTotalCents,
      routeDistanceKm: input.routeDistanceKm,
      baseFeeCents: 0,
      pricePerKmCents: 0,
      minimumFeeCents: storedPrice,
      platformCommissionCents: split.platformCommissionCents,
      providerNetPayoutCents: split.providerNetPayoutCents,
      quoteExpiresAt: new Date(version.expiresAt),
      requestedPickupAt: input.requestedPickupAt,
      paymentStatus: 'UNPAID',
      status: 'PROPOSAL',
      jobKind: 'TRANSPORT',
      cargo: input.cargo as Prisma.InputJsonValue,
      proposalExpiresAt: new Date(version.expiresAt),
      updatedAt: now,
    },
  });
  await prisma.deliveryTransportProposal.create({
    data: {
      id: randomUUID(),
      requestId,
      version: version.version,
      authorUserId: input.requesterUserId,
      authorRole: version.authorRole,
      action: version.action,
      priceCents: version.priceCents,
      note: input.note.slice(0, 1000) || null,
      status: version.status,
      expiresAt: new Date(version.expiresAt),
    },
  });
  if (input.cargo.photoIds.length > 0) {
    await prisma.deliveryCargoPhoto.updateMany({
      where: { id: { in: input.cargo.photoIds }, ownerUserId: input.requesterUserId, requestId: null, deletedAt: null },
      data: { requestId },
    });
  }
  return {
    ok: true as const,
    request: { id: requestId, status: 'PROPOSAL', version: 1, paymentAvailable: false },
  };
}

export async function respondToTransportProposal(input: {
  actorUserId: string;
  requestId: string;
  expectedVersion: number;
  action: Exclude<ProposalAction, 'OFFER'>;
  priceCents: number | null;
  note: string;
  negotiable: boolean;
  confirmation?: ScheduleConfirmation | null;
  revision?: {
    pickupAddress?: string | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
    deliveryAddress?: string | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    requestedPickupAt?: Date | null;
    cargo?: TransportCargo | null;
  } | null;
}) {
  const row = await prisma.standaloneDeliveryRequest.findUnique({ where: { id: input.requestId } });
  if (!row || row.jobKind !== 'TRANSPORT') {
    return { ok: false as const, status: 404, code: 'NOT_FOUND', error: 'Voorstel niet gevonden.' };
  }
  if (row.paymentStatus === 'PAID' || row.deliveryOrderId) {
    return { ok: false as const, status: 409, code: 'ALREADY_PAID', error: 'Een betaalde opdracht kan niet meer via het voorstel worden gewijzigd.' };
  }
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: row.deliveryProfileId },
    select: { userId: true },
  });
  const actorRole = input.actorUserId === row.requesterUserId
    ? 'CUSTOMER'
    : input.actorUserId === profile?.userId
      ? 'COURIER'
      : null;
  if (!actorRole) {
    return { ok: false as const, status: 403, code: 'FORBIDDEN', error: 'Dit voorstel hoort bij iemand anders.' };
  }
  const versions = await prisma.deliveryTransportProposal.findMany({
    where: { requestId: row.id },
    orderBy: { version: 'asc' },
  });
  const now = new Date();
  const decision = applyProposalAction({
    versions: versions.map((version) => ({
      version: version.version,
      authorRole: version.authorRole === 'COURIER' ? 'COURIER' : 'CUSTOMER',
      action: version.action as ProposalAction,
      priceCents: version.priceCents,
      status: version.status as 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'EXPIRED',
      expiresAt: version.expiresAt.toISOString(),
    })),
    expectedVersion: input.expectedVersion,
    actorRole,
    action: input.action,
    priceCents: input.priceCents,
    negotiable: input.negotiable,
    now,
    expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
  });
  if (!decision.ok) {
    return { ok: false as const, status: 409, code: decision.code, error: 'Dit voorstel is intussen gewijzigd of verlopen.' };
  }

  const revisionData: {
    pickupAddress?: string;
    deliveryAddress?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffLat?: number;
    dropoffLng?: number;
    routeDistanceKm?: number;
    requestedPickupAt?: Date | null;
    cargo?: Prisma.InputJsonValue;
  } = {};
  let pickupLat = row.pickupLat;
  let pickupLng = row.pickupLng;
  let dropoffLat = row.dropoffLat;
  let dropoffLng = row.dropoffLng;
  let routeDistanceKm = row.routeDistanceKm;
  let requestedPickupAt = row.requestedPickupAt;
  if (input.action === 'REVISE' && input.revision) {
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { id: row.deliveryProfileId },
      include: { user: { select: { lat: true, lng: true, dateOfBirth: true } } },
    });
    if (!deliveryProfile?.user) {
      return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
    }
    if (input.revision.cargo) {
      if (fitCargo(input.revision.cargo, deliveryProfile) !== 'fit') {
        return { ok: false as const, status: 422, code: 'VEHICLE_TOO_SMALL', error: 'De lading past niet meer bij dit voertuig.' };
      }
      revisionData.cargo = input.revision.cargo as Prisma.InputJsonValue;
    }
    const nextPickupLat = input.revision.pickupLat;
    const nextPickupLng = input.revision.pickupLng;
    const nextDropLat = input.revision.dropoffLat;
    const nextDropLng = input.revision.dropoffLng;
    const addressChanged = [nextPickupLat, nextPickupLng, nextDropLat, nextDropLng].some((value) => value != null);
    if (addressChanged) {
      if (![nextPickupLat, nextPickupLng, nextDropLat, nextDropLng].every((value) => typeof value === 'number' && Number.isFinite(value))) {
        return { ok: false as const, status: 422, code: 'MISSING_ADDRESS', error: 'Een gewijzigd adres heeft coördinaten nodig.' };
      }
      pickupLat = nextPickupLat as number;
      pickupLng = nextPickupLng as number;
      dropoffLat = nextDropLat as number;
      dropoffLng = nextDropLng as number;
      const drivingRoute = await getRouteDistance(
        { lat: pickupLat, lng: pickupLng },
        { lat: dropoffLat, lng: dropoffLng },
        'driving',
      );
      if (!drivingRoute || !('distance' in drivingRoute)) {
        return { ok: false as const, status: 422, code: 'GEOCODE_FAILED', error: 'De route kon niet worden berekend.' };
      }
      revisionData.pickupAddress = (input.revision.pickupAddress || row.pickupAddress).trim();
      revisionData.deliveryAddress = (input.revision.deliveryAddress || row.deliveryAddress).trim();
      revisionData.pickupLat = pickupLat;
      revisionData.pickupLng = pickupLng;
      revisionData.dropoffLat = dropoffLat;
      revisionData.dropoffLng = dropoffLng;
      revisionData.routeDistanceKm = drivingRoute.distance;
      routeDistanceKm = drivingRoute.distance;
    }
    const at = input.revision.requestedPickupAt === undefined ? (row.requestedPickupAt ?? now) : (input.revision.requestedPickupAt ?? now);
    const position = resolveDelivererPosition(deliveryProfile);
    const baseRoute = position
      ? await getRouteDistance(position, { lat: pickupLat, lng: pickupLng }, 'driving')
      : null;
    const bookable = assertCourierBookableAt(
      { ...deliveryProfile, dateOfBirth: deliveryProfile.user.dateOfBirth },
      at,
      baseRoute && 'distance' in baseRoute ? baseRoute.distance : null,
    );
    if (!bookable.ok) {
      return { ok: false as const, status: 422, code: bookable.code, error: bookable.error };
    }
    if (input.revision.requestedPickupAt !== undefined) {
      revisionData.requestedPickupAt = input.revision.requestedPickupAt;
      requestedPickupAt = input.revision.requestedPickupAt;
    }
  }

  let bookingId: string | null = null;
  let bookingStatus: string | null = null;
  if (decision.paymentAllowed && decision.agreedPriceCents != null) {
    const ready = await courierCanTakePaidJob(row.deliveryProfileId);
    if (!ready.ok) return ready;
    const planned = await scheduleView({
      deliveryProfileId: row.deliveryProfileId,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      routeDistanceKm,
      requestedPickupAt,
      confirmation: input.confirmation ?? null,
    });
    if (!planned.ok) return planned;
    const position = resolveDelivererPosition(ready.profile);
    const baseRoute = position
      ? await getRouteDistance(position, { lat: pickupLat, lng: pickupLng }, 'driving')
      : null;
    const bookable = assertCourierBookableAt(
      { ...ready.profile, dateOfBirth: ready.profile.user.dateOfBirth },
      requestedPickupAt ?? now,
      baseRoute && 'distance' in baseRoute ? baseRoute.distance : null,
    );
    if (!bookable.ok) {
      return { ok: false as const, status: 422, code: bookable.code, error: bookable.error };
    }
    const booking = await createDeliveryBookingRequest(prisma, {
      buyerId: row.requesterUserId,
      deliveryProfileId: row.deliveryProfileId,
      buyerLat: dropoffLat,
      buyerLng: dropoffLng,
      routeDistanceKm,
      quotedFeeCents: decision.agreedPriceCents,
      notes: standaloneBookingNotes({
        standaloneRequestId: row.id,
        requestedPickupAt,
        itemDescription: row.itemDescription,
      }),
      evaluateAt: requestedPickupAt ?? now,
      itemSummary: row.itemDescription,
    });
    if (!booking.ok) return booking;
    bookingId = booking.request.id;
    if (booking.request.status === 'PENDING') {
      const accepted = await acceptDeliveryBookingRequest(prisma, {
        requestId: booking.request.id,
        deliveryProfileUserId: ready.profile.userId,
        confirmation: input.confirmation,
      });
      if (!accepted.ok) {
        await prisma.deliveryBookingRequest.update({
          where: { id: booking.request.id },
          data: { status: 'EXPIRED', updatedAt: new Date() },
        });
        return accepted;
      }
      bookingStatus = 'ACCEPTED';
    } else {
      bookingStatus = booking.request.status;
    }
  }

  if (input.action === 'REVISE' && row.stripeSessionId && stripe) {
    try {
      await stripe.checkout.sessions.expire(row.stripeSessionId);
    } catch (error) {
      console.warn('oude checkout kon niet worden gesloten', error instanceof Error ? error.name : 'error');
    }
  }

  const latest = versions[versions.length - 1];
  const opened = decision.versions[decision.versions.length - 1]!;
  const saved = await prisma.$transaction(async (tx) => {
    if (input.action === 'REVISE') {
      const held = await tx.standaloneDeliveryRequest.updateMany({
        where: { id: row.id, paymentStatus: { not: 'PAID' }, deliveryOrderId: null },
        data: { status: 'PROPOSAL', stripeSessionId: null, bookingRequestId: null, updatedAt: now },
      });
      if (held.count !== 1) return 'paid' as const;
    }
    if (latest) {
      const flipped = await tx.deliveryTransportProposal.updateMany({
        where: {
          id: latest.id,
          version: input.expectedVersion,
          status: input.action === 'REVISE' ? { in: ['OPEN', 'ACCEPTED'] } : 'OPEN',
        },
        data: { status: 'SUPERSEDED' },
      });
      if (flipped.count !== 1) return false;
    }
    await tx.deliveryTransportProposal.create({
      data: {
        id: randomUUID(),
        requestId: row.id,
        version: opened.version,
        authorUserId: input.actorUserId,
        authorRole: opened.authorRole,
        action: opened.action,
        priceCents: opened.priceCents,
        note: input.note.slice(0, 1000) || null,
        status: opened.status,
        expiresAt: new Date(opened.expiresAt),
      },
    });
    if (decision.paymentAllowed && decision.agreedPriceCents != null && bookingId) {
      const split = splitDeliveryCommission(decision.agreedPriceCents);
      const buyerFee = calculateStripeFeeForBuyer(decision.agreedPriceCents);
      await tx.standaloneDeliveryRequest.update({
        where: { id: row.id },
        data: {
          quotedFeeCents: decision.agreedPriceCents,
          stripeFeeCents: buyerFee.stripeFeeCents,
          buyerTotalCents: buyerFee.buyerTotalCents,
          platformCommissionCents: split.platformCommissionCents,
          providerNetPayoutCents: split.providerNetPayoutCents,
          bookingRequestId: bookingId,
          status: 'AWAITING_PAYMENT',
          quoteExpiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MS),
          updatedAt: now,
        },
      });
    } else if (input.action === 'REVISE' && opened.priceCents != null) {
      const split = splitDeliveryCommission(opened.priceCents);
      const buyerFee = calculateStripeFeeForBuyer(opened.priceCents);
      if (row.bookingRequestId) {
        await tx.deliveryBookingRequest.updateMany({
          where: { id: row.bookingRequestId },
          data: { status: 'EXPIRED', updatedAt: now },
        });
      }
      await tx.standaloneDeliveryRequest.update({
        where: { id: row.id },
        data: {
          quotedFeeCents: opened.priceCents,
          stripeFeeCents: buyerFee.stripeFeeCents,
          buyerTotalCents: buyerFee.buyerTotalCents,
          platformCommissionCents: split.platformCommissionCents,
          providerNetPayoutCents: split.providerNetPayoutCents,
          bookingRequestId: null,
          stripeSessionId: null,
          status: 'PROPOSAL',
          ...revisionData,
          updatedAt: now,
        },
      });
    } else if (opened.status === 'REJECTED') {
      await tx.standaloneDeliveryRequest.update({
        where: { id: row.id },
        data: { status: 'REJECTED', updatedAt: now },
      });
    }
    return true;
  });
  if (saved === 'paid') {
    return { ok: false as const, status: 409, code: 'ALREADY_PAID', error: 'Een betaalde opdracht kan niet meer via het voorstel worden gewijzigd.' };
  }
  if (!saved) {
    if (bookingId) {
      await prisma.deliveryBookingRequest.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED', updatedAt: new Date() },
      });
    }
    return { ok: false as const, status: 409, code: 'VERSION_CONFLICT', error: 'Iemand anders heeft dit voorstel net gewijzigd.' };
  }
  return {
    ok: true as const,
    request: {
      id: row.id,
      status: decision.paymentAllowed ? 'AWAITING_PAYMENT' : opened.status,
      version: opened.version,
      paymentAvailable: decision.paymentAllowed,
      bookingStatus,
      agreedPriceCents: decision.agreedPriceCents,
    },
  };
}
