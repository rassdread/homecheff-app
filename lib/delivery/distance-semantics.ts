/**
 * Versioned HomeCheff Delivery distance semantics.
 *
 * NULL  — legacy matching. Do not infer version 1 from stored radii.
 * 1     — model A: pickup radius and transport distance are independent.
 * other — fail closed. Never treat an unknown version as version 1.
 *
 * Pickup radius ceiling (0.5–500 km) is the existing provider-pricing
 * kilometre ceiling in PROVIDER_PRICING_LIMITS.maxDistanceKm. It is not a
 * new product policy and it is not a vehicle cap. The owner-approved
 * transport ceiling is the same 500 km value. The legacy 100 km total-route
 * cap applies only to NULL marketplace matching.
 */

import { PROVIDER_PRICING_LIMITS } from '@/lib/delivery/provider-pricing';

export const DISTANCE_SEMANTICS_V1 = 1;

/** Marketplace legacy cap: courier → pickup + pickup → destination. */
export const LEGACY_TOTAL_ROUTE_CAP_KM = 100;

/** Existing Caribbean same-island gate. National coverage does not bypass it. */
export const CARIBBEAN_SAME_ISLAND_KM = 50;

export const CONFIGURABLE_DISTANCE_MIN_KM = PROVIDER_PRICING_LIMITS.maxDistanceKm.min;
export const CONFIGURABLE_DISTANCE_MAX_KM = PROVIDER_PRICING_LIMITS.maxDistanceKm.max;

export const CARIBBEAN_COUNTRY_CODES = [
  'CW',
  'AW',
  'SX',
  'BQ',
  'JM',
  'TT',
  'BB',
  'BS',
  'CU',
  'DO',
  'HT',
  'PR',
  'VI',
  'VG',
  'AG',
  'DM',
  'GD',
  'KN',
  'LC',
  'VC',
  'SR',
] as const;

export type DistanceSemanticsMode = 'legacy' | 'v1' | 'unsupported';

export function distanceSemanticsMode(
  version: number | null | undefined,
): DistanceSemanticsMode {
  if (version == null) return 'legacy';
  if (version === DISTANCE_SEMANTICS_V1) return 'v1';
  return 'unsupported';
}

export function isCaribbeanCountry(code: string | null | undefined): boolean {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return false;
  return (CARIBBEAN_COUNTRY_CODES as readonly string[]).includes(normalized);
}

export function validateConfigurableDistanceKm(
  value: unknown,
): { ok: true; km: number } | { ok: false; error: string } {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;
  if (
    !Number.isFinite(n) ||
    n < CONFIGURABLE_DISTANCE_MIN_KM ||
    n > CONFIGURABLE_DISTANCE_MAX_KM
  ) {
    return {
      ok: false,
      error: `Kies een afstand tussen ${CONFIGURABLE_DISTANCE_MIN_KM} en ${CONFIGURABLE_DISTANCE_MAX_KM} km.`,
    };
  }
  return { ok: true, km: n };
}

/**
 * Explicit distance save.
 * NULL → 1 only when both values are present and valid.
 * Version 1 may update one value and keeps the other.
 * Omitting the accept flag never changes distances or the version.
 */
export function planDistanceSettingsWrite(input: {
  existingVersion: number | null;
  existingPreferredRadius: number | null;
  existingMaxDistance: number;
  acceptDistanceModelA: boolean;
  preferredRadius: unknown;
  maxDistance: unknown;
  preferredRadiusProvided: boolean;
  maxDistanceProvided: boolean;
}):
  | { ok: true; apply: false }
  | {
      ok: true;
      apply: true;
      preferredRadius: number;
      maxDistance: number;
      distanceSemanticsVersion: 1;
    }
  | { ok: false; error: string } {
  if (!input.acceptDistanceModelA) {
    return { ok: true, apply: false };
  }
  if (
    input.existingVersion != null &&
    input.existingVersion !== DISTANCE_SEMANTICS_V1
  ) {
    return {
      ok: false,
      error: 'Deze afstandsversie wordt niet ondersteund.',
    };
  }

  const converting = input.existingVersion == null;
  if (converting && (!input.preferredRadiusProvided || !input.maxDistanceProvided)) {
    return {
      ok: false,
      error: 'Bevestig zowel de ophaalradius als de maximale transportafstand.',
    };
  }

  let preferredRadius = input.existingPreferredRadius;
  let maxDistance = input.existingMaxDistance;

  if (input.preferredRadiusProvided || converting) {
    const pickup = validateConfigurableDistanceKm(input.preferredRadius);
    if (!pickup.ok) return pickup;
    preferredRadius = pickup.km;
  }
  if (input.maxDistanceProvided || converting) {
    const transport = validateConfigurableDistanceKm(input.maxDistance);
    if (!transport.ok) return transport;
    maxDistance = transport.km;
  }

  if (preferredRadius == null || !Number.isFinite(maxDistance)) {
    return {
      ok: false,
      error: 'Bevestig zowel de ophaalradius als de maximale transportafstand.',
    };
  }

  return {
    ok: true,
    apply: true,
    preferredRadius,
    maxDistance,
    distanceSemanticsVersion: DISTANCE_SEMANTICS_V1,
  };
}

export function legacyMarketplaceDistanceEligible(input: {
  isCaribbean: boolean;
  nationalCoverage: boolean;
  distanceToPickupKm: number;
  distanceFromCourierToDestinationKm: number | null;
  totalRouteKm: number;
  maxDistanceKm: number;
}): boolean {
  if (input.isCaribbean) {
    return input.distanceToPickupKm <= CARIBBEAN_SAME_ISLAND_KM;
  }
  if (input.nationalCoverage) return true;
  const withinPickup = input.distanceToPickupKm <= input.maxDistanceKm;
  const withinDestination =
    input.distanceFromCourierToDestinationKm == null
      ? true
      : input.distanceFromCourierToDestinationKm <= input.maxDistanceKm;
  const withinTotal = input.totalRouteKm <= LEGACY_TOTAL_ROUTE_CAP_KM;
  return withinPickup && withinDestination && withinTotal;
}

export function version1DistanceEligible(input: {
  nationalCoverage: boolean;
  isCaribbean: boolean;
  sameCountry: boolean;
  distanceToPickupKm: number;
  pickupToDestinationKm: number | null;
  preferredRadiusKm: number | null;
  maxDistanceKm: number;
}): { ok: boolean; reason: string } {
  if (!input.sameCountry) return { ok: false, reason: 'COUNTRY' };
  if (input.isCaribbean && input.distanceToPickupKm > CARIBBEAN_SAME_ISLAND_KM) {
    return { ok: false, reason: 'CARIBBEAN' };
  }
  if (input.nationalCoverage && !input.isCaribbean) {
    return { ok: true, reason: 'NATIONAL' };
  }
  if (
    input.preferredRadiusKm == null ||
    !Number.isFinite(input.preferredRadiusKm) ||
    input.distanceToPickupKm > input.preferredRadiusKm
  ) {
    return { ok: false, reason: 'PICKUP_RADIUS' };
  }
  if (
    input.pickupToDestinationKm != null &&
    input.pickupToDestinationKm > input.maxDistanceKm
  ) {
    return { ok: false, reason: 'TRANSPORT' };
  }
  return { ok: true, reason: 'V1' };
}

export function marketplaceDistanceEligible(input: {
  version: number | null | undefined;
  isCaribbean: boolean;
  nationalCoverage: boolean;
  sameCountry?: boolean;
  distanceToPickupKm: number;
  distanceFromCourierToDestinationKm: number | null;
  pickupToDestinationKm: number | null;
  totalRouteKm: number;
  maxDistanceKm: number;
  preferredRadiusKm: number | null;
}): boolean {
  const mode = distanceSemanticsMode(input.version);
  if (mode === 'unsupported') return false;
  if (mode === 'legacy') {
    return legacyMarketplaceDistanceEligible(input);
  }
  return version1DistanceEligible({
    nationalCoverage: input.nationalCoverage,
    isCaribbean: input.isCaribbean,
    sameCountry: input.sameCountry !== false,
    distanceToPickupKm: input.distanceToPickupKm,
    pickupToDestinationKm: input.pickupToDestinationKm,
    preferredRadiusKm: input.preferredRadiusKm,
    maxDistanceKm: input.maxDistanceKm,
  }).ok;
}
