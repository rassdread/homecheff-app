import type { PrismaClient } from '@prisma/client';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { resolveDelivererPosition } from '@/lib/delivery/delivery-position';
import {
  estimateTravelMinutes,
  routeModeForVehicle,
  type ScheduledNeighbor,
  type TravelSource,
} from '@/lib/delivery/delivery-schedule';

type NeighborWindow = {
  id: string;
  bookingRequestId: string | null;
  deliveryOrderId: string | null;
  pickupAt: Date | null;
  deliverAt: Date | null;
};

export async function scheduleNeighbors(
  client: { deliveryCalendarEntry: PrismaClient['deliveryCalendarEntry'] },
  profileId: string,
  exceptBookingId?: string,
): Promise<NeighborWindow[]> {
  return client.deliveryCalendarEntry.findMany({
    where: {
      deliveryProfileId: profileId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(exceptBookingId ? { NOT: { bookingRequestId: exceptBookingId } } : {}),
    },
    select: {
      id: true,
      bookingRequestId: true,
      deliveryOrderId: true,
      pickupAt: true,
      deliverAt: true,
    },
  });
}

function finitePoint(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function asScheduled(entry: NeighborWindow, travel?: Partial<ScheduledNeighbor>): ScheduledNeighbor {
  return {
    id: entry.id,
    origin: 'UNKNOWN',
    start: entry.pickupAt,
    end: entry.deliverAt,
    travelToCandidateMinutes: travel?.travelToCandidateMinutes ?? null,
    travelFromCandidateMinutes: travel?.travelFromCandidateMinutes ?? null,
    travelSource: travel?.travelSource ?? 'unknown',
    travelMatchesVehicle: travel?.travelMatchesVehicle ?? false,
  };
}

function sameInstant(left: Date | null, right: Date | null) {
  if (left == null || right == null) return left == null && right == null;
  return left.getTime() === right.getTime();
}

async function routeMinutes(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number } | null,
  mode: 'driving' | 'walking' | 'bicycling' | null,
) {
  if (!from || !to || !mode) return null;
  const route = await getRouteDistance(from, to, mode);
  if (!route || !('duration' in route) || typeof route.duration !== 'number' || route.duration <= 0) return null;
  const source: TravelSource = route.distanceSource === 'google' ? 'google' : 'straight_line';
  return { minutes: route.duration, source };
}

/** Uses coordinates already stored on the booking or standalone request. */
export async function attachConnectionTravel(
  prisma: PrismaClient,
  windows: NeighborWindow[],
  candidate: {
    pickup: { lat: number; lng: number } | null;
    dropoff: { lat: number; lng: number } | null;
  },
  mode: { googleMode: 'driving' | 'walking' | 'bicycling' | null; matchesVehicle: boolean },
): Promise<ScheduledNeighbor[]> {
  const bookingIds = windows.map((row) => row.bookingRequestId).filter((id): id is string => Boolean(id));
  const orderIds = windows.map((row) => row.deliveryOrderId).filter((id): id is string => Boolean(id));
  const standaloneWhere = [
    bookingIds.length ? { bookingRequestId: { in: bookingIds } } : null,
    orderIds.length ? { deliveryOrderId: { in: orderIds } } : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);
  const [standalones, bookings] = await Promise.all([
    standaloneWhere.length
      ? prisma.standaloneDeliveryRequest.findMany({
          where: { OR: standaloneWhere },
          select: {
            bookingRequestId: true,
            deliveryOrderId: true,
            pickupLat: true,
            pickupLng: true,
            dropoffLat: true,
            dropoffLng: true,
          },
        })
      : Promise.resolve([]),
    bookingIds.length
      ? prisma.deliveryBookingRequest.findMany({
          where: { id: { in: bookingIds } },
          select: { id: true, buyerLat: true, buyerLng: true },
        })
      : Promise.resolve([]),
  ]);
  const bookingById = new Map(bookings.map((row) => [row.id, row]));
  const neighbors: ScheduledNeighbor[] = [];
  for (const window of windows) {
    const standalone = standalones.find(
      (row) =>
        (window.bookingRequestId && row.bookingRequestId === window.bookingRequestId) ||
        (window.deliveryOrderId && row.deliveryOrderId === window.deliveryOrderId),
    );
    const booking = window.bookingRequestId ? bookingById.get(window.bookingRequestId) : undefined;
    const pickup = finitePoint(standalone?.pickupLat, standalone?.pickupLng);
    const dropoff =
      finitePoint(standalone?.dropoffLat, standalone?.dropoffLng) ??
      finitePoint(booking?.buyerLat, booking?.buyerLng);
    const toCandidate = await routeMinutes(dropoff, candidate.pickup, mode.googleMode);
    const fromCandidate = await routeMinutes(candidate.dropoff, pickup, mode.googleMode);
    const routes = [toCandidate, fromCandidate].filter((row): row is NonNullable<typeof row> => row != null);
    const allGoogle = routes.length > 0 && routes.every((row) => row.source === 'google');
    neighbors.push(
      asScheduled(window, {
        travelToCandidateMinutes: toCandidate?.minutes ?? null,
        travelFromCandidateMinutes: fromCandidate?.minutes ?? null,
        travelSource: allGoogle ? 'google' : routes.length ? 'straight_line' : 'unknown',
        travelMatchesVehicle: allGoogle && mode.matchesVehicle,
      }),
    );
  }
  return neighbors;
}

export function sameScheduleInstant(left: Date | null, right: Date | null) {
  return sameInstant(left, right);
}

export function scheduleConflictError(conflicts: Array<{ code: string }>) {
  const overlap = conflicts.some((conflict) => conflict.code === 'WINDOW_OVERLAP');
  const shortTravel = conflicts.some((conflict) => conflict.code === 'TRAVEL_TOO_SHORT');
  if (overlap && shortTravel) {
    return 'Deze tijd overlapt een andere opdracht en de reistijd ertussen is te kort. Kies een ander moment.';
  }
  if (overlap) return 'Deze tijd overlapt een andere opdracht. Kies een ander moment.';
  return 'De reistijd tussen deze opdrachten is te kort. Kies een ander moment.';
}

export async function resolveJobDrive(
  profile: {
    transportation: string[];
    gpsTrackingEnabled: boolean;
    isOnline: boolean;
    currentLat: number | null;
    currentLng: number | null;
    lastGpsUpdate: Date | null;
    homeLat: number | null;
    homeLng: number | null;
    user?: { lat?: number | null; lng?: number | null } | null;
  },
  request: { buyerLat: number | null; buyerLng: number | null; routeDistanceKm: number | null },
): Promise<{ minutes: number | null; source: TravelSource; matchesVehicle: boolean }> {
  const vehicle = profile.transportation[0] ?? null;
  const mode = routeModeForVehicle(vehicle);
  const position = resolveDelivererPosition(profile);
  if (position && request.buyerLat != null && request.buyerLng != null && mode.googleMode) {
    const route = await getRouteDistance(position, { lat: request.buyerLat, lng: request.buyerLng }, mode.googleMode);
    if (route && 'duration' in route && typeof route.duration === 'number' && route.duration > 0) {
      const source: TravelSource = route.distanceSource === 'google' ? 'google' : 'straight_line';
      return {
        minutes: route.duration,
        source,
        matchesVehicle: source === 'google' && mode.matchesVehicle,
      };
    }
  }
  const estimate = request.routeDistanceKm == null ? null : estimateTravelMinutes(request.routeDistanceKm, vehicle);
  return {
    minutes: estimate,
    source: estimate == null ? 'unknown' : 'straight_line',
    matchesVehicle: false,
  };
}

export function finiteSchedulePoint(lat: number | null | undefined, lng: number | null | undefined) {
  return finitePoint(lat, lng);
}

export function readMarketplaceSlot(notes: string | null | undefined): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { kind?: string; requestedPickupAt?: string };
    if (parsed.kind !== 'MARKETPLACE_SLOT') return null;
    return typeof parsed.requestedPickupAt === 'string' ? parsed.requestedPickupAt : null;
  } catch {
    return null;
  }
}
