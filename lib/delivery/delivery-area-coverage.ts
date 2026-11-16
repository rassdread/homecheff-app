/**
 * Area coverage for the public "Iets laten bezorgen?" tile.
 * The search point is the visitor's "Zoeken vanaf" location.
 * The product search radius is not an input: it does not create coverage.
 * Courier home, GPS and profile coordinates stay on the server.
 */
import type { PrismaClient } from '@prisma/client';
import { calculateDistance } from '@/lib/geocoding';
import { courierCanBeListedForPaidJob } from '@/lib/delivery/courier-payable';
import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';
import { courierListedInPilot, publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';
import { resolveDelivererPosition } from '@/lib/delivery/delivery-position';
import {
  isCaribbeanCountry,
  marketplaceDistanceEligible,
} from '@/lib/delivery/distance-semantics';
import type { ProviderAcceptanceProfile } from '@/lib/delivery/provider-acceptance';
import { suggestedPickupTimes } from '@/lib/delivery/standalone-pickup-options';

export type DeliveryCoveragePoint = { lat: number; lng: number };

export type DeliveryCoverageCourier = {
  id: string;
  userId: string | null;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  age: number | null;
  dateOfBirth: Date | string | null;
  maxDistance: number;
  preferredRadius: number | null;
  distanceSemanticsVersion: number | null;
  nationalCoverage: boolean;
  temporaryOffline: boolean;
  vacationStart: Date | null;
  vacationEnd: Date | null;
  workStartTime: string | null;
  workEndTime: string | null;
  breakWindows: unknown;
  availableDays: string[];
  availableTimeSlots: string[];
  isOnline: boolean;
  onlineUntil: Date | null;
  gpsTrackingEnabled: boolean;
  currentLat: number | null;
  currentLng: number | null;
  lastGpsUpdate: Date | null;
  homeLat: number | null;
  homeLng: number | null;
  profileLat: number | null;
  profileLng: number | null;
  country: string | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  acceptanceMode: string | null;
};

function acceptanceProfile(courier: DeliveryCoverageCourier): ProviderAcceptanceProfile {
  return {
    id: courier.id,
    isActive: courier.isActive,
    isVerified: courier.isVerified,
    isBlocked: courier.isBlocked,
    isOnline: courier.isOnline,
    onlineUntil: courier.onlineUntil,
    pricingEnabled: courier.pricingEnabled,
    baseFeeCents: courier.baseFeeCents,
    pricePerKmCents: courier.pricePerKmCents,
    minimumFeeCents: courier.minimumFeeCents,
    age: courier.age,
    maxDistance: courier.maxDistance,
    preferredRadius: courier.preferredRadius,
    distanceSemanticsVersion: courier.distanceSemanticsVersion,
    nationalCoverage: courier.nationalCoverage,
    temporaryOffline: courier.temporaryOffline,
    vacationStart: courier.vacationStart,
    vacationEnd: courier.vacationEnd,
    workStartTime: courier.workStartTime,
    workEndTime: courier.workEndTime,
    breakWindows: courier.breakWindows,
    availableDays: courier.availableDays,
    availableTimeSlots: courier.availableTimeSlots,
    acceptanceMode: courier.acceptanceMode,
    dateOfBirth: courier.dateOfBirth,
  };
}

/** A future roster counts while the courier is offline. No roster means no coverage. */
export function courierHasFutureRoster(
  courier: DeliveryCoverageCourier,
  now = new Date(),
): boolean {
  return suggestedPickupTimes(acceptanceProfile(courier), now, now, 0, 15, []).length > 0;
}

/**
 * True when the search point lies in this courier's own work area.
 * Version 1 uses the pickup radius. Legacy uses the stored radius around the courier.
 * The caller's product search radius is intentionally absent.
 */
export function courierCoversSearchPoint(
  courier: DeliveryCoverageCourier,
  point: DeliveryCoveragePoint,
  now = new Date(),
): boolean {
  if (
    !isCommerciallyMatchableDeliverer({
      isActive: courier.isActive,
      isVerified: courier.isVerified,
      isBlocked: courier.isBlocked,
      dateOfBirth: courier.dateOfBirth,
      profileAge: courier.age,
      now,
    })
  ) {
    return false;
  }
  if (!courierListedInPilot(courier.id, courier.userId)) return false;
  const position = resolveDelivererPosition({
    gpsTrackingEnabled: courier.gpsTrackingEnabled,
    isOnline: courier.isOnline,
    currentLat: courier.currentLat,
    currentLng: courier.currentLng,
    lastGpsUpdate: courier.lastGpsUpdate,
    homeLat: courier.homeLat,
    homeLng: courier.homeLng,
    user: { lat: courier.profileLat, lng: courier.profileLng },
  }, now.getTime());
  if (!position) return false;
  const distanceToSearchKm = calculateDistance(
    position.lat,
    position.lng,
    point.lat,
    point.lng,
  );
  const inWorkArea = marketplaceDistanceEligible({
    version: courier.distanceSemanticsVersion,
    isCaribbean: isCaribbeanCountry(courier.country),
    nationalCoverage: courier.nationalCoverage,
    sameCountry: true,
    distanceToPickupKm: distanceToSearchKm,
    distanceFromCourierToDestinationKm: null,
    pickupToDestinationKm: null,
    totalRouteKm: distanceToSearchKm,
    maxDistanceKm: courier.maxDistance,
    preferredRadiusKm: courier.preferredRadius,
  });
  if (!inWorkArea) return false;
  return courierHasFutureRoster(courier, now);
}

export function searchPointHasDeliveryCoverage(
  couriers: readonly DeliveryCoverageCourier[],
  point: DeliveryCoveragePoint,
  payableIds: ReadonlySet<string>,
  now = new Date(),
): boolean {
  return couriers.some(
    (courier) => payableIds.has(courier.id) && courierCoversSearchPoint(courier, point, now),
  );
}

type CoverageRow = {
  id: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  age: number;
  maxDistance: number;
  preferredRadius: number | null;
  distanceSemanticsVersion: number | null;
  nationalCoverage: boolean;
  temporaryOffline: boolean;
  vacationStart: Date | null;
  vacationEnd: Date | null;
  workStartTime: string | null;
  workEndTime: string | null;
  breakWindows: unknown;
  availableDays: string[];
  availableTimeSlots: string[];
  isOnline: boolean;
  onlineUntil: Date | null;
  gpsTrackingEnabled: boolean;
  currentLat: number | null;
  currentLng: number | null;
  lastGpsUpdate: Date | null;
  homeLat: number | null;
  homeLng: number | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  acceptanceMode: string;
  user: {
    id: string;
    lat: number | null;
    lng: number | null;
    country: string | null;
    dateOfBirth: Date | null;
  } | null;
};

function fromRow(row: CoverageRow): DeliveryCoverageCourier {
  return {
    id: row.id,
    userId: row.user?.id ?? null,
    isActive: row.isActive,
    isVerified: row.isVerified,
    isBlocked: row.isBlocked,
    age: row.age,
    dateOfBirth: row.user?.dateOfBirth ?? null,
    maxDistance: row.maxDistance,
    preferredRadius: row.preferredRadius,
    distanceSemanticsVersion: row.distanceSemanticsVersion,
    nationalCoverage: row.nationalCoverage,
    temporaryOffline: row.temporaryOffline,
    vacationStart: row.vacationStart,
    vacationEnd: row.vacationEnd,
    workStartTime: row.workStartTime,
    workEndTime: row.workEndTime,
    breakWindows: row.breakWindows,
    availableDays: row.availableDays,
    availableTimeSlots: row.availableTimeSlots,
    isOnline: row.isOnline,
    onlineUntil: row.onlineUntil,
    gpsTrackingEnabled: row.gpsTrackingEnabled,
    currentLat: row.currentLat,
    currentLng: row.currentLng,
    lastGpsUpdate: row.lastGpsUpdate,
    homeLat: row.homeLat,
    homeLng: row.homeLng,
    profileLat: row.user?.lat ?? null,
    profileLng: row.user?.lng ?? null,
    country: row.user?.country ?? null,
    pricingEnabled: row.pricingEnabled,
    baseFeeCents: row.baseFeeCents,
    pricePerKmCents: row.pricePerKmCents,
    minimumFeeCents: row.minimumFeeCents,
    acceptanceMode: row.acceptanceMode,
  };
}

/** Public feed outcome. One true covers every overlapping work area. */
export async function deliveryAreaCovered(
  prisma: PrismaClient,
  point: DeliveryCoveragePoint | null,
  now = new Date(),
): Promise<boolean> {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
  if (publicDeliveryIsClosed()) return false;
  const rows = await prisma.deliveryProfile.findMany({
    where: { isActive: true, isVerified: true, isBlocked: false },
    select: {
      id: true,
      isActive: true,
      isVerified: true,
      isBlocked: true,
      age: true,
      maxDistance: true,
      preferredRadius: true,
      distanceSemanticsVersion: true,
      nationalCoverage: true,
      temporaryOffline: true,
      vacationStart: true,
      vacationEnd: true,
      workStartTime: true,
      workEndTime: true,
      breakWindows: true,
      availableDays: true,
      availableTimeSlots: true,
      isOnline: true,
      onlineUntil: true,
      gpsTrackingEnabled: true,
      currentLat: true,
      currentLng: true,
      lastGpsUpdate: true,
      homeLat: true,
      homeLng: true,
      pricingEnabled: true,
      baseFeeCents: true,
      pricePerKmCents: true,
      minimumFeeCents: true,
      acceptanceMode: true,
      user: { select: { id: true, lat: true, lng: true, country: true, dateOfBirth: true } },
    },
  });
  for (const row of rows) {
    const courier = fromRow(row);
    if (!courierCoversSearchPoint(courier, point, now)) continue;
    if (await courierCanBeListedForPaidJob(prisma, courier.id)) return true;
  }
  return false;
}
