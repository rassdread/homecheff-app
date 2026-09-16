/**
 * Canonical DeliveryProfile source of truth.
 *
 * The DeliveryProfile row is the only persisted source for courier settings.
 * User.lat/lng/place is a fallback origin until home* is written — never a
 * competing editor. CourierAvailability / DeliveryAvailability are matching
 * helpers, not the settings form SoT.
 *
 * Canonical fields:
 * - active: isActive, isOnline, temporaryOffline
 * - area: homeLat, homeLng, homeAddress, maxDistance, preferredRadius,
 *   nationalCoverage, deliveryMode
 * - availability: availableDays, availableTimeSlots, workStartTime, workEndTime
 * - pricing: pricingEnabled, baseFeeCents, pricePerKmCents, minimumFeeCents,
 *   freeDeliveryRadiusKm, currency (cents integers, euros only in the UI)
 * - identity: providerType, companyDisplayName
 * - completeness: derived via getDeliveryProfileCompletion (not a stored flag)
 */

import type { ProviderActivationProfile } from '@/lib/delivery/provider-activation';

export const DELIVERY_PROFILE_UPDATED_EVENT = 'deliveryProfileUpdated';

export const CANONICAL_DELIVERY_DAYS = [
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
  'zondag',
] as const;

export const CANONICAL_DELIVERY_SLOTS = [
  'morning',
  'afternoon',
  'evening',
] as const;

export type CanonicalServiceCoords = {
  lat: number;
  lng: number;
  source: 'home' | 'user';
};

export type DeliveryUserLocation = {
  lat?: number | null;
  lng?: number | null;
  place?: string | null;
  address?: string | null;
  /**
   * Canonical User.dateOfBirth. Required whenever a user object is passed so
   * callers cannot silently drop age and treat VERIFIED_18_PLUS as UNKNOWN.
   * `null` means the account has no stored DOB.
   */
  dateOfBirth: Date | string | null;
};

export function toDeliveryUserLocation(user: {
  lat?: number | null;
  lng?: number | null;
  place?: string | null;
  address?: string | null;
  dateOfBirth?: Date | string | null;
}): DeliveryUserLocation {
  return {
    lat: user.lat ?? null,
    lng: user.lng ?? null,
    place: user.place ?? null,
    address: user.address ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
  };
}

export type CanonicalDeliveryProfileRow = {
  isActive: boolean;
  isOnline: boolean;
  temporaryOffline?: boolean | null;
  homeLat: number | null;
  homeLng: number | null;
  homeAddress?: string | null;
  maxDistance: number | null;
  preferredRadius?: number | null;
  nationalCoverage: boolean | null;
  deliveryMode?: string | null;
  availableDays?: string[] | null;
  availableTimeSlots?: string[] | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  freeDeliveryRadiusKm: number | null;
  currency?: string | null;
  providerType: string;
  companyDisplayName: string | null;
  isVerified?: boolean;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function resolveCanonicalServiceCoords(
  profile: Pick<CanonicalDeliveryProfileRow, 'homeLat' | 'homeLng'>,
  user?: DeliveryUserLocation | null,
): CanonicalServiceCoords | null {
  if (isFiniteNumber(profile.homeLat) && isFiniteNumber(profile.homeLng)) {
    return { lat: profile.homeLat, lng: profile.homeLng, source: 'home' };
  }
  if (isFiniteNumber(user?.lat) && isFiniteNumber(user?.lng)) {
    return { lat: user.lat, lng: user.lng, source: 'user' };
  }
  return null;
}

export function hasCanonicalAvailability(
  profile: Pick<
    CanonicalDeliveryProfileRow,
    'availableDays' | 'availableTimeSlots' | 'workStartTime' | 'workEndTime'
  >,
): boolean {
  const days = Array.isArray(profile.availableDays)
    ? profile.availableDays.filter((d) => typeof d === 'string' && d.trim())
    : [];
  const slots = Array.isArray(profile.availableTimeSlots)
    ? profile.availableTimeSlots.filter((s) => typeof s === 'string' && s.trim())
    : [];
  const start = normalizeWorkTime(profile.workStartTime);
  const end = normalizeWorkTime(profile.workEndTime);
  return days.length > 0 && (slots.length > 0 || (start != null && end != null));
}

export function toProviderActivationProfile(
  profile: CanonicalDeliveryProfileRow,
  user?: DeliveryUserLocation | null,
): ProviderActivationProfile {
  const coords = resolveCanonicalServiceCoords(profile, user);
  return {
    providerType: profile.providerType,
    isActive: Boolean(profile.isActive),
    isOnline: Boolean(profile.isOnline),
    homeLat: coords?.lat ?? null,
    homeLng: coords?.lng ?? null,
    maxDistance: isFiniteNumber(profile.maxDistance) ? profile.maxDistance : null,
    nationalCoverage: profile.nationalCoverage ?? null,
    pricingEnabled: Boolean(profile.pricingEnabled),
    baseFeeCents: profile.baseFeeCents ?? null,
    pricePerKmCents: profile.pricePerKmCents ?? null,
    minimumFeeCents: profile.minimumFeeCents ?? null,
    freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm ?? null,
    companyDisplayName: profile.companyDisplayName ?? null,
    availableDays: profile.availableDays ?? [],
    availableTimeSlots: profile.availableTimeSlots ?? [],
    workStartTime: profile.workStartTime ?? null,
    workEndTime: profile.workEndTime ?? null,
  };
}

export function coerceCents(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function coerceKm(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function coerceBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return Boolean(value);
}

export function coerceStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Accepts HH:mm or H:mm. Empty → null. Invalid → null (caller may 400). */
export function normalizeWorkTime(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function isValidWorkTimeInput(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return normalizeWorkTime(value) != null;
}

export function normalizeDeliveryMode(value: unknown, fallback = 'FIXED'): string {
  const s = String(value || fallback).toUpperCase();
  if (s === 'DYNAMIC' || s === 'FIXED') return s;
  if (s === 'STATIC') return 'FIXED';
  return fallback;
}

export type CanonicalSettingsWrite = {
  isActive?: boolean;
  maxDistance?: number;
  preferredRadius?: number;
  availableDays?: string[];
  availableTimeSlots?: string[];
  transportation?: unknown;
  deliveryRegions?: string[];
  deliveryMode?: string;
  bio?: string | null;
  pricingEnabled?: boolean;
  baseFeeCents?: number | null;
  pricePerKmCents?: number | null;
  minimumFeeCents?: number | null;
  freeDeliveryRadiusKm?: number;
  currency?: string;
  nationalCoverage?: boolean;
  acceptanceMode?: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  temporaryOffline?: boolean;
  maxSimultaneousDeliveries?: number;
  maxDeliveriesPerSlot?: number;
  preparationTimeMinutes?: number;
  estimatedPickupDelayMinutes?: number;
  homeLat?: number | null;
  homeLng?: number | null;
  homeAddress?: string | null;
};

/**
 * Merge a PUT body onto the existing row. Unspecified keys stay undefined
 * (Prisma skip). Explicit null is preserved for nullable cents / times / home.
 */
export function buildCanonicalSettingsUpdate(params: {
  body: Record<string, unknown>;
  existing: CanonicalDeliveryProfileRow & {
    transportation?: unknown;
    deliveryRegions?: string[];
    bio?: string | null;
    currency?: string;
    acceptanceMode?: string;
    maxSimultaneousDeliveries?: number;
    maxDeliveriesPerSlot?: number;
    preparationTimeMinutes?: number;
    estimatedPickupDelayMinutes?: number;
  };
  user?: DeliveryUserLocation | null;
}): { data: CanonicalSettingsWrite; error?: string } {
  const { body, existing, user } = params;

  const nextMaxDistance = coerceKm(body.maxDistance);
  const nextPreferred =
    coerceKm(body.preferredRadius) ??
    (nextMaxDistance !== undefined ? nextMaxDistance : undefined);

  const timeSlots =
    body.availableTimes !== undefined
      ? coerceStringArray(body.availableTimes)
      : body.availableTimeSlots !== undefined
        ? coerceStringArray(body.availableTimeSlots)
        : undefined;

  if (body.workStartTime !== undefined && !isValidWorkTimeInput(body.workStartTime)) {
    return { data: {}, error: 'Begintijd moet in HH:mm-formaat zijn (bijvoorbeeld 09:00).' };
  }
  if (body.workEndTime !== undefined && !isValidWorkTimeInput(body.workEndTime)) {
    return { data: {}, error: 'Eindtijd moet in HH:mm-formaat zijn (bijvoorbeeld 21:00).' };
  }

  const requestedHomeLat = coerceKm(body.homeLat);
  const requestedHomeLng = coerceKm(body.homeLng);
  const requestedHomeAddress =
    body.homeAddress !== undefined
      ? body.homeAddress == null
        ? null
        : String(body.homeAddress)
      : undefined;

  const existingCoords = resolveCanonicalServiceCoords(existing, user);
  let homeLat: number | null | undefined;
  let homeLng: number | null | undefined;
  let homeAddress: string | null | undefined;

  if (requestedHomeLat !== undefined || requestedHomeLng !== undefined) {
    homeLat = requestedHomeLat ?? existing.homeLat ?? existingCoords?.lat ?? null;
    homeLng = requestedHomeLng ?? existing.homeLng ?? existingCoords?.lng ?? null;
    homeAddress =
      requestedHomeAddress !== undefined
        ? requestedHomeAddress
        : existing.homeAddress ?? user?.place ?? user?.address ?? null;
  } else if (!existing.homeLat || !existing.homeLng) {
    if (existingCoords) {
      homeLat = existingCoords.lat;
      homeLng = existingCoords.lng;
      homeAddress =
        existing.homeAddress ?? user?.place ?? user?.address ?? null;
    }
  } else if (requestedHomeAddress !== undefined) {
    homeAddress = requestedHomeAddress;
  }

  const data: CanonicalSettingsWrite = {
    isActive: coerceBoolean(body.isActive),
    maxDistance: nextMaxDistance,
    preferredRadius: nextPreferred,
    availableDays:
      body.availableDays !== undefined ? coerceStringArray(body.availableDays) : undefined,
    availableTimeSlots: timeSlots,
    transportation: body.transportation !== undefined ? body.transportation : undefined,
    deliveryRegions:
      body.deliveryRegions !== undefined
        ? coerceStringArray(body.deliveryRegions)
        : undefined,
    deliveryMode:
      body.deliveryMode !== undefined
        ? normalizeDeliveryMode(body.deliveryMode, existing.deliveryMode || 'FIXED')
        : undefined,
    bio: body.bio !== undefined ? (body.bio == null ? null : String(body.bio)) : undefined,
    pricingEnabled: coerceBoolean(body.pricingEnabled),
    baseFeeCents: coerceCents(body.baseFeeCents),
    pricePerKmCents: coerceCents(body.pricePerKmCents),
    minimumFeeCents: coerceCents(body.minimumFeeCents),
    freeDeliveryRadiusKm: coerceKm(body.freeDeliveryRadiusKm),
    currency:
      body.currency !== undefined ? String(body.currency).toUpperCase() : undefined,
    nationalCoverage: coerceBoolean(body.nationalCoverage),
    acceptanceMode:
      body.acceptanceMode === 'AUTO_CONFIRM' || body.acceptanceMode === 'MANUAL_CONFIRM'
        ? body.acceptanceMode
        : undefined,
    workStartTime:
      body.workStartTime !== undefined ? normalizeWorkTime(body.workStartTime) : undefined,
    workEndTime:
      body.workEndTime !== undefined ? normalizeWorkTime(body.workEndTime) : undefined,
    temporaryOffline: coerceBoolean(body.temporaryOffline),
    maxSimultaneousDeliveries:
      body.maxSimultaneousDeliveries !== undefined
        ? Number(body.maxSimultaneousDeliveries)
        : undefined,
    maxDeliveriesPerSlot:
      body.maxDeliveriesPerSlot !== undefined
        ? Number(body.maxDeliveriesPerSlot)
        : undefined,
    preparationTimeMinutes:
      body.preparationTimeMinutes !== undefined
        ? Number(body.preparationTimeMinutes)
        : undefined,
    estimatedPickupDelayMinutes:
      body.estimatedPickupDelayMinutes !== undefined
        ? Number(body.estimatedPickupDelayMinutes)
        : undefined,
    homeLat,
    homeLng,
    homeAddress,
  };

  return { data };
}

export function serializeCanonicalSettingsProfile(profile: {
  id: string;
  isActive: boolean;
  isOnline: boolean | null;
  maxDistance: number;
  preferredRadius: number | null;
  homeLat: number | null;
  homeLng: number | null;
  homeAddress: string | null;
  availableDays: string[];
  availableTimeSlots: string[];
  transportation: unknown;
  deliveryRegions: string[];
  deliveryMode: string | null;
  gpsTrackingEnabled: boolean | null;
  currentLat: number | null;
  currentLng: number | null;
  bio: string | null;
  totalDeliveries: number;
  averageRating: number | null;
  totalEarnings: number;
  createdAt: Date;
  acceptanceMode: string;
  providerType: string;
  companyDisplayName: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  temporaryOffline: boolean;
  vacationStart: Date | null;
  vacationEnd: Date | null;
  maxSimultaneousDeliveries: number;
  maxDeliveriesPerSlot: number;
  preparationTimeMinutes: number;
  estimatedPickupDelayMinutes: number;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  freeDeliveryRadiusKm: number;
  currency: string;
  nationalCoverage: boolean;
  isVerified: boolean;
}) {
  const timeSlots = profile.availableTimeSlots || [];
  return {
    id: profile.id,
    isActive: profile.isActive,
    isOnline: profile.isOnline || false,
    isVerified: profile.isVerified,
    maxDistance: profile.maxDistance,
    preferredRadius: profile.preferredRadius ?? profile.maxDistance,
    homeLat: profile.homeLat,
    homeLng: profile.homeLng,
    homeAddress: profile.homeAddress,
    availableDays: profile.availableDays || [],
    availableTimes: timeSlots,
    availableTimeSlots: timeSlots,
    transportation: profile.transportation || [],
    deliveryRegions: profile.deliveryRegions || [],
    deliveryMode: normalizeDeliveryMode(profile.deliveryMode, 'FIXED'),
    gpsTrackingEnabled: profile.gpsTrackingEnabled || false,
    currentLat: profile.currentLat,
    currentLng: profile.currentLng,
    bio: profile.bio,
    totalDeliveries: profile.totalDeliveries,
    averageRating: profile.averageRating,
    totalEarnings: profile.totalEarnings,
    createdAt: profile.createdAt,
    acceptanceMode: profile.acceptanceMode,
    providerType: profile.providerType,
    companyDisplayName: profile.companyDisplayName,
    workStartTime: profile.workStartTime,
    workEndTime: profile.workEndTime,
    temporaryOffline: profile.temporaryOffline,
    vacationStart: profile.vacationStart,
    vacationEnd: profile.vacationEnd,
    maxSimultaneousDeliveries: profile.maxSimultaneousDeliveries,
    maxDeliveriesPerSlot: profile.maxDeliveriesPerSlot,
    preparationTimeMinutes: profile.preparationTimeMinutes,
    estimatedPickupDelayMinutes: profile.estimatedPickupDelayMinutes,
    pricingEnabled: profile.pricingEnabled,
    baseFeeCents: profile.baseFeeCents,
    pricePerKmCents: profile.pricePerKmCents,
    minimumFeeCents: profile.minimumFeeCents,
    freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
    currency: profile.currency,
    nationalCoverage: profile.nationalCoverage,
  };
}
