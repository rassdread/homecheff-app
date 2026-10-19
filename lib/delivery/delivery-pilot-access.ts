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
 * Global OFF always denies, including when an allowlist contains the caller.
 * Restricted mode with an empty list denies. Open mode is global ON without a list.
 */
export function evaluateDeliveryAccess(input: DeliveryAccessInput) {
  const env = input.env ?? process.env;
  if (!isHomeCheffDeliveryEnabled(env)) {
    return { allowed: false as const, code: 'DELIVERY_DISABLED' as const };
  }
  if (!isDeliveryPilotRestricted(env)) {
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

/** Service calls enforce the pilot only after the global switch is already on. */
export function servicePilotDenial(input: DeliveryAccessInput) {
  const env = input.env ?? process.env;
  if (!isHomeCheffDeliveryEnabled(env) || !isDeliveryPilotRestricted(env)) return null;
  const decision = evaluateDeliveryAccess({ ...input, env });
  if (!decision.allowed) return decision;
  return null;
}

export function courierListedInPilot(
  profileId: string,
  userId: string | null | undefined,
  env: EnvSource = process.env,
) {
  if (!isHomeCheffDeliveryEnabled(env) || !isDeliveryPilotRestricted(env)) return true;
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
