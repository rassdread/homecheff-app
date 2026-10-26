import { isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';

type EnvSource = Record<string, string | undefined>;

const RESTRICTED_VALUES = new Set(['true', '1', 'yes', 'restricted']);

/** Client city labels and courier-entered region names are not a verified boundary. */
export const DELIVERY_GEOGRAPHIC_PILOT = 'UNSUPPORTED' as const;

export function isDeliveryPilotRestricted(env: EnvSource = process.env): boolean {
  const raw = env.HOMECHEFF_DELIVERY_PILOT;
  if (typeof raw !== 'string') return false;
  return RESTRICTED_VALUES.has(raw.trim().toLowerCase());
}

export function parsePilotIds(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(raw.split(/[,\s]+/).map((id) => id.trim()).filter(Boolean));
}

export type DeliveryAccessInput = {
  env?: EnvSource;
  requesterUserId?: string | null;
  courierProfileId?: string | null;
  courierUserId?: string | null;
  requireRequester?: boolean;
  requireCourier?: boolean;
};

/**
 * Public delivery stays closed unless the global flag is on.
 * A restricted pilot can admit the allowlist while that flag stays off.
 * An empty list denies. Open mode is the global flag without a list.
 * Role is not an input: an administrator is not admitted by this check.
 */
export function publicDeliveryIsClosed(env: EnvSource = process.env): boolean {
  return !isHomeCheffDeliveryEnabled(env) && !isDeliveryPilotRestricted(env);
}

export function evaluateDeliveryAccess(input: DeliveryAccessInput) {
  const env = input.env ?? process.env;
  const restricted = isDeliveryPilotRestricted(env);
  if (!isHomeCheffDeliveryEnabled(env) && !restricted) {
    return { allowed: false as const, code: 'DELIVERY_DISABLED' as const };
  }
  if (!restricted) {
    return { allowed: true as const, mode: 'OPEN' as const };
  }
  const users = parsePilotIds(env.HOMECHEFF_DELIVERY_PILOT_USER_IDS);
  const couriers = parsePilotIds(env.HOMECHEFF_DELIVERY_PILOT_COURIER_IDS);
  if (users.size === 0 || couriers.size === 0) {
    return { allowed: false as const, code: 'DELIVERY_PILOT_REQUIRED' as const };
  }
  if (input.requireRequester !== false) {
    const requester = input.requesterUserId?.trim() || '';
    if (!requester || !users.has(requester)) {
      return { allowed: false as const, code: 'DELIVERY_PILOT_REQUIRED' as const };
    }
  }
  if (input.requireCourier !== false) {
    const profileId = input.courierProfileId?.trim() || '';
    const userId = input.courierUserId?.trim() || '';
    const known = Boolean((profileId && couriers.has(profileId)) || (userId && couriers.has(userId)));
    if (!known) {
      return { allowed: false as const, code: 'DELIVERY_PILOT_REQUIRED' as const };
    }
  }
  return { allowed: true as const, mode: 'PILOT' as const };
}

/** Fail closed for a new quote, booking, or checkout. Allowed open and pilot calls return null. */
export function servicePilotDenial(input: DeliveryAccessInput) {
  const decision = evaluateDeliveryAccess(input);
  if (!decision.allowed) return decision;
  return null;
}

export function callerMaySeeDeliveryUi(
  userId: string | null | undefined,
  env: EnvSource = process.env,
): boolean {
  if (publicDeliveryIsClosed(env)) return false;
  if (!isDeliveryPilotRestricted(env)) return isHomeCheffDeliveryEnabled(env);
  const id = userId?.trim() || '';
  if (!id) return false;
  const users = parsePilotIds(env.HOMECHEFF_DELIVERY_PILOT_USER_IDS);
  const couriers = parsePilotIds(env.HOMECHEFF_DELIVERY_PILOT_COURIER_IDS);
  return users.has(id) || couriers.has(id);
}

export function courierListedInPilot(
  profileId: string,
  userId: string | null | undefined,
  env: EnvSource = process.env,
) {
  if (!isDeliveryPilotRestricted(env)) return true;
  const couriers = parsePilotIds(env.HOMECHEFF_DELIVERY_PILOT_COURIER_IDS);
  return couriers.has(profileId) || Boolean(userId && couriers.has(userId));
}

export function deliveryAccessDeniedBody(code: 'DELIVERY_DISABLED' | 'DELIVERY_PILOT_REQUIRED') {
  if (code === 'DELIVERY_DISABLED') {
    return {
      error: 'HomeCheff-bezorging is nog niet beschikbaar.',
      code: 'DELIVERY_DISABLED' as const,
    };
  }
  return {
    error: 'HomeCheff-bezorging is beperkt tot de goedgekeurde pilot.',
    code: 'DELIVERY_PILOT_REQUIRED' as const,
  };
}
