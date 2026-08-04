/**
 * Phase 3 — provider-defined auto-confirm / availability / capacity validation.
 * HomeCheff validates provider rules; it does not dispatch transport.
 */

import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';

export const ACCEPTANCE_MODE_AUTO = 'AUTO_CONFIRM';
export const ACCEPTANCE_MODE_MANUAL = 'MANUAL_CONFIRM';

export const BOOKING_REQUEST_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type ProviderAcceptanceProfile = {
  id: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked?: boolean | null;
  isOnline?: boolean | null;
  pricingEnabled?: boolean | null;
  baseFeeCents?: number | null;
  pricePerKmCents?: number | null;
  minimumFeeCents?: number | null;
  age?: number | null;
  maxDistance: number;
  nationalCoverage?: boolean | null;
  temporaryOffline?: boolean | null;
  vacationStart?: Date | string | null;
  vacationEnd?: Date | string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  breakWindows?: unknown;
  availableDays?: string[] | null;
  maxSimultaneousDeliveries?: number | null;
  maxDeliveriesPerSlot?: number | null;
  preparationTimeMinutes?: number | null;
  estimatedPickupDelayMinutes?: number | null;
  transportation?: string[] | null;
  acceptanceMode?: string | null;
  dateOfBirth?: Date | string | null;
};

export type AutoConfirmContext = {
  now?: Date;
  routeDistanceKm?: number | null;
  activeDeliveryCount?: number;
  slotDeliveryCount?: number;
  requiredVehicle?: string | null;
  /** When true (provider-pricing flag on), pricingEnabled must be true. */
  requirePricingEnabled?: boolean;
};

export type AutoConfirmDenial = {
  ok: false;
  code:
    | 'DELIVERY_PROVIDER_INELIGIBLE'
    | 'DELIVERY_PROVIDER_OFFLINE'
    | 'DELIVERY_PROVIDER_ON_VACATION'
    | 'DELIVERY_OUTSIDE_WORKING_HOURS'
    | 'DELIVERY_CAPACITY_FULL'
    | 'DELIVERY_PREP_TIME_UNAVAILABLE'
    | 'DELIVERY_VEHICLE_INCOMPATIBLE'
    | 'DELIVERY_OUT_OF_RADIUS'
    | 'DELIVERY_PRICING_INCOMPLETE';
  error: string;
  failedChecks: string[];
};

export type AutoConfirmOk = {
  ok: true;
  acceptanceMode: string;
  estimatedPickupDelayMinutes: number;
  preparationTimeMinutes: number;
};

function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function weekdayKeyNl(d: Date): string {
  const keys = [
    'zondag',
    'maandag',
    'dinsdag',
    'woensdag',
    'donderdag',
    'vrijdag',
    'zaterdag',
  ];
  return keys[d.getDay()] ?? 'maandag';
}

function weekdayKeyEn(d: Date): string {
  const keys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return keys[d.getDay()] ?? 'monday';
}

function isWithinBreak(
  minutesNow: number,
  breakWindows: unknown
): boolean {
  if (!Array.isArray(breakWindows)) return false;
  for (const w of breakWindows) {
    if (!w || typeof w !== 'object') continue;
    const start = parseHm(String((w as { start?: string }).start ?? ''));
    const end = parseHm(String((w as { end?: string }).end ?? ''));
    if (start == null || end == null) continue;
    if (minutesNow >= start && minutesNow < end) return true;
  }
  return false;
}

/**
 * Validate provider-defined AUTO_CONFIRM conditions.
 * For MANUAL_CONFIRM, commercial eligibility still applies; time/capacity
 * soft-checks are reported but do not block request creation.
 */
export function validateProviderAutoConfirm(
  profile: ProviderAcceptanceProfile,
  ctx: AutoConfirmContext = {}
): AutoConfirmOk | AutoConfirmDenial {
  const now = ctx.now ?? new Date();
  const failed: string[] = [];

  const commerciallyOk = isCommerciallyMatchableDeliverer({
    isActive: profile.isActive,
    isVerified: profile.isVerified,
    isBlocked: Boolean(profile.isBlocked),
    dateOfBirth: profile.dateOfBirth,
    profileAge: profile.age,
  });
  if (!commerciallyOk) failed.push('commercial_eligibility');

  if (profile.pricingEnabled === false && ctx.requirePricingEnabled) {
    failed.push('pricing_enabled');
  }
  if (ctx.requirePricingEnabled && profile.pricingEnabled) {
    if (
      profile.baseFeeCents == null ||
      profile.pricePerKmCents == null ||
      profile.minimumFeeCents == null
    ) {
      failed.push('pricing_enabled');
    }
  }

  if (profile.temporaryOffline) failed.push('temporary_offline');

  if (profile.vacationStart && profile.vacationEnd) {
    const vs = new Date(profile.vacationStart);
    const ve = new Date(profile.vacationEnd);
    if (!Number.isNaN(vs.getTime()) && !Number.isNaN(ve.getTime())) {
      if (now >= vs && now <= ve) failed.push('vacation');
    }
  }

  if (profile.isOnline === false) failed.push('online');

  const days = profile.availableDays ?? [];
  if (days.length > 0) {
    const nl = weekdayKeyNl(now);
    const en = weekdayKeyEn(now);
    const hit = days.some(
      (d) =>
        d.toLowerCase() === nl ||
        d.toLowerCase() === en ||
        d.toLowerCase().startsWith(nl.slice(0, 2))
    );
    if (!hit) failed.push('weekday');
  }

  const start = profile.workStartTime
    ? parseHm(profile.workStartTime)
    : null;
  const end = profile.workEndTime ? parseHm(profile.workEndTime) : null;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (start != null && end != null) {
    if (minutesNow < start || minutesNow >= end) {
      failed.push('working_hours');
    }
  }
  if (isWithinBreak(minutesNow, profile.breakWindows)) {
    failed.push('break');
  }

  if (
    ctx.routeDistanceKm != null &&
    Number.isFinite(ctx.routeDistanceKm) &&
    !profile.nationalCoverage &&
    ctx.routeDistanceKm > profile.maxDistance
  ) {
    failed.push('radius');
  }

  const maxSim = profile.maxSimultaneousDeliveries ?? 3;
  if (
    typeof ctx.activeDeliveryCount === 'number' &&
    ctx.activeDeliveryCount >= maxSim
  ) {
    failed.push('capacity_simultaneous');
  }

  const maxSlot = profile.maxDeliveriesPerSlot ?? 2;
  if (
    typeof ctx.slotDeliveryCount === 'number' &&
    ctx.slotDeliveryCount >= maxSlot
  ) {
    failed.push('capacity_slot');
  }

  const prep = profile.preparationTimeMinutes ?? 15;
  if (prep < 0) failed.push('prep_time');

  if (ctx.requiredVehicle && profile.transportation?.length) {
    if (!profile.transportation.includes(ctx.requiredVehicle)) {
      failed.push('vehicle');
    }
  }

  const mode = profile.acceptanceMode || ACCEPTANCE_MODE_MANUAL;

  if (failed.length > 0) {
    let code: AutoConfirmDenial['code'] = 'DELIVERY_PROVIDER_INELIGIBLE';
    if (failed.includes('pricing_enabled')) code = 'DELIVERY_PRICING_INCOMPLETE';
    else if (failed.includes('radius')) code = 'DELIVERY_OUT_OF_RADIUS';
    else if (failed.includes('vacation') || failed.includes('temporary_offline'))
      code = 'DELIVERY_PROVIDER_ON_VACATION';
    else if (failed.includes('online')) code = 'DELIVERY_PROVIDER_OFFLINE';
    else if (failed.includes('working_hours') || failed.includes('break') || failed.includes('weekday'))
      code = 'DELIVERY_OUTSIDE_WORKING_HOURS';
    else if (failed.includes('capacity_simultaneous') || failed.includes('capacity_slot'))
      code = 'DELIVERY_CAPACITY_FULL';
    else if (failed.includes('vehicle')) code = 'DELIVERY_VEHICLE_INCOMPATIBLE';
    else if (failed.includes('prep_time')) code = 'DELIVERY_PREP_TIME_UNAVAILABLE';

    return {
      ok: false,
      code,
      error: 'Bezorgaanbieder voldoet niet aan de eigen boekingsvoorwaarden.',
      failedChecks: failed,
    };
  }

  return {
    ok: true,
    acceptanceMode: mode,
    estimatedPickupDelayMinutes: profile.estimatedPickupDelayMinutes ?? 10,
    preparationTimeMinutes: prep,
  };
}

export function resolvePublicAvailabilityBadge(params: {
  acceptanceMode?: string | null;
  temporaryOffline?: boolean | null;
  isActive?: boolean | null;
  isOnline?: boolean | null;
  autoConfirmOk?: boolean;
}): {
  code: 'DIRECT_BOOKABLE' | 'MANUAL_CONFIRM' | 'UNAVAILABLE';
  labelNl: string;
  labelEn: string;
} {
  if (
    params.temporaryOffline ||
    params.isActive === false ||
    params.isOnline === false
  ) {
    return {
      code: 'UNAVAILABLE',
      labelNl: 'Niet beschikbaar',
      labelEn: 'Unavailable',
    };
  }
  if (
    params.acceptanceMode === ACCEPTANCE_MODE_AUTO &&
    params.autoConfirmOk !== false
  ) {
    return {
      code: 'DIRECT_BOOKABLE',
      labelNl: 'Direct boekbaar',
      labelEn: 'Instant book',
    };
  }
  return {
    code: 'MANUAL_CONFIRM',
    labelNl: 'Handmatige bevestiging',
    labelEn: 'Manual confirmation',
  };
}
