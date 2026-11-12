/**
 * Pure rules for standalone moving/transport jobs.
 * No database, no Stripe client, no email matching.
 */
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

export const TRANSPORT_VEHICLES = [
  'BIKE',
  'EBIKE',
  'SCOOTER',
  'CAR',
  'ESTATE',
  'VAN',
  'BOX_TRUCK',
  'TRAILER',
] as const;

export type TransportVehicle = (typeof TRANSPORT_VEHICLES)[number];

export const MIN_TRANSPORT_PROPOSAL_CENTS = 1500;

/** One conversion for the whole release. The database stores grams. The form asks for whole kilograms. */
export const GRAMS_PER_KILOGRAM = 1000;
export const MAX_CARGO_KILOGRAMS = 10_000;

export function kilogramsToGrams(kilograms: number): number | null {
  if (!Number.isInteger(kilograms) || kilograms <= 0 || kilograms > MAX_CARGO_KILOGRAMS) return null;
  return kilograms * GRAMS_PER_KILOGRAM;
}

export function gramsToKilograms(grams: number): number | null {
  if (!Number.isInteger(grams) || grams <= 0 || grams % GRAMS_PER_KILOGRAM !== 0) return null;
  const kilograms = grams / GRAMS_PER_KILOGRAM;
  if (kilograms > MAX_CARGO_KILOGRAMS) return null;
  return kilograms;
}

export type CargoItem = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
};

export type TransportCargo = {
  itemCount: number;
  items: CargoItem[];
  totalWeightKg: number;
  floors: number;
  lift: boolean;
  helpNeeded: boolean;
  fragile: boolean;
  note: string;
  preferredVehicle: TransportVehicle | null;
  photoIds: string[];
};

export const CAPACITY_AXES = ['length', 'width', 'height', 'weight'] as const;
export type CapacityAxis = (typeof CAPACITY_AXES)[number];
/** unset = niet ingevuld. unknown = onbekend. not_applicable = niet van toepassing. set = gemeten. */
export type CapacityMark = 'unset' | 'unknown' | 'not_applicable' | 'set';

export type VehicleCapacity = {
  modes: string[];
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  /** Stored unit. A form kilogram is converted before it reaches this field. */
  maxWeightGrams: number | null;
  status?: Partial<Record<CapacityAxis, InterpretedCapacityMark>> | null;
};

export type InterpretedCapacityMark = CapacityMark | 'legacy';

export type VehicleFit = 'fit' | 'too_small' | 'wrong_type' | 'missing_data' | 'unknown';

const AXIS_NUMBER = {
  length: 'maxLengthCm',
  width: 'maxWidthCm',
  height: 'maxHeightCm',
  weight: 'maxWeightGrams',
} as const;

export function emptyCapacityStatus(): Record<CapacityAxis, CapacityMark> {
  return { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' };
}

function readMark(value: unknown): CapacityMark | null {
  if (value === 'unset' || value === 'unknown' || value === 'not_applicable' || value === 'set') return value;
  return null;
}

/**
 * A new save stores a number only when its status is `set`.
 * Weight arrives as whole kilograms and is stored as grams.
 * Omitting the status does not invent `set` and does not clear a legacy row.
 */
export function normalizeVehicleCapacity(input: {
  maxLengthCm?: unknown;
  maxWidthCm?: unknown;
  maxHeightCm?: unknown;
  maxWeightKg?: unknown;
  status?: unknown;
}): { ok: true; maxLengthCm: number | null; maxWidthCm: number | null; maxHeightCm: number | null; maxWeightGrams: number | null; status: Record<CapacityAxis, CapacityMark> } | { ok: false; axis: CapacityAxis; code: 'NUMBER_REQUIRED' | 'NUMBER_FORBIDDEN' | 'NUMBER_INVALID' | 'STATUS_INVALID' | 'UNKNOWN_KEY' | 'STATUS_REQUIRED' } {
  if (input.status == null) {
    const hasNumber = [input.maxLengthCm, input.maxWidthCm, input.maxHeightCm, input.maxWeightKg].some(
      (value) => value != null && value !== '',
    );
    if (hasNumber) return { ok: false, axis: 'length', code: 'STATUS_REQUIRED' };
  }
  if (input.status != null && (typeof input.status !== 'object' || Array.isArray(input.status))) {
    return { ok: false, axis: 'length', code: 'STATUS_INVALID' };
  }
  const rawStatus = input.status && typeof input.status === 'object' ? (input.status as Record<string, unknown>) : null;
  if (rawStatus) {
    const unknownKey = Object.keys(rawStatus).find((key) => !(CAPACITY_AXES as readonly string[]).includes(key));
    if (unknownKey) return { ok: false, axis: 'length', code: 'UNKNOWN_KEY' };
  }
  const status = emptyCapacityStatus();
  const numbers = {
    maxLengthCm: null as number | null,
    maxWidthCm: null as number | null,
    maxHeightCm: null as number | null,
    maxWeightGrams: null as number | null,
  };
  const rawNumbers = {
    length: input.maxLengthCm,
    width: input.maxWidthCm,
    height: input.maxHeightCm,
    weight: input.maxWeightKg,
  };
  for (const axis of CAPACITY_AXES) {
    const mark = rawStatus ? readMark(rawStatus[axis]) : 'unset';
    if (!mark) return { ok: false, axis, code: 'STATUS_INVALID' };
    status[axis] = mark;
    const parsed = readMeasurement(rawNumbers[axis]);
    if (parsed === 'invalid') return { ok: false, axis, code: 'NUMBER_INVALID' };
    if (mark === 'set') {
      if (parsed === 'empty') return { ok: false, axis, code: 'NUMBER_REQUIRED' };
      if (axis === 'weight') {
        const grams = kilogramsToGrams(parsed);
        if (grams == null) return { ok: false, axis, code: 'NUMBER_INVALID' };
        numbers.maxWeightGrams = grams;
      } else if (axis === 'length') numbers.maxLengthCm = parsed;
      else if (axis === 'width') numbers.maxWidthCm = parsed;
      else numbers.maxHeightCm = parsed;
    } else if (parsed !== 'empty') {
      return { ok: false, axis, code: 'NUMBER_FORBIDDEN' };
    }
  }
  return { ok: true, ...numbers, status };
}

const STORED_NUMBER = {
  length: 'maxLengthCm',
  width: 'maxWidthCm',
  height: 'maxHeightCm',
  weight: 'maxWeightGrams',
} as const;

/**
 * A production profile can already contain centimetres or grams while
 * vehicleCapacityStatus is still null. Those numbers stay usable as limits.
 * They are not rewritten to `set`.
 */
export function interpretStoredCapacity(input: {
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  maxWeightGrams: number | null;
  status?: unknown;
}): {
  status: Record<CapacityAxis, InterpretedCapacityMark>;
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  maxWeightGrams: number | null;
  legacy: boolean;
} {
  const numbers = {
    length: input.maxLengthCm,
    width: input.maxWidthCm,
    height: input.maxHeightCm,
    weight: input.maxWeightGrams,
  };
  const rawStatus = input.status && typeof input.status === 'object' && !Array.isArray(input.status)
    ? (input.status as Record<string, unknown>)
    : null;
  const status = {} as Record<CapacityAxis, InterpretedCapacityMark>;
  let legacy = false;
  for (const axis of CAPACITY_AXES) {
    const number = numbers[axis];
    const usable = typeof number === 'number' && Number.isInteger(number) && number > 0;
    const mark = rawStatus ? readMark(rawStatus[axis]) : null;
    if (!rawStatus) {
      if (usable) {
        status[axis] = 'legacy';
        legacy = true;
      } else {
        status[axis] = 'unset';
      }
      continue;
    }
    status[axis] = mark ?? 'unset';
  }
  return {
    status,
    maxLengthCm: input.maxLengthCm,
    maxWidthCm: input.maxWidthCm,
    maxHeightCm: input.maxHeightCm,
    maxWeightGrams: input.maxWeightGrams,
    legacy,
  };
}

function readMeasurement(value: unknown): number | 'empty' | 'invalid' {
  if (value == null || value === '') return 'empty';
  if (typeof value === 'boolean') return 'invalid';
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return 'invalid';
  return parsed;
}

/** Transport proposals stay off unless this variable is explicitly enabled. */
export function transportProposalsEnabled(env: string | undefined = process.env.STANDALONE_TRANSPORT_PROPOSALS): boolean {
  if (env == null || env.trim() === '') return false;
  return ['1', 'true', 'on', 'yes'].includes(env.trim().toLowerCase());
}

/**
 * The flag blocks a new transport checkout. A checkout that already has a
 * Stripe session stays reachable. A received payment is not decided here.
 */
export function transportCheckoutFlagDecision(input: {
  enabled: boolean;
  existingSession: boolean;
}): 'allow' | 'continue_existing' | 'block_new' {
  if (input.enabled) return 'allow';
  if (input.existingSession) return 'continue_existing';
  return 'block_new';
}

export function isTransportVehicle(value: string): value is TransportVehicle {
  return (TRANSPORT_VEHICLES as readonly string[]).includes(value);
}

const AXIS_LABEL: Record<CapacityAxis, string> = {
  length: 'maximale lengte',
  width: 'maximale breedte',
  height: 'maximale hoogte',
  weight: 'maximaal gewicht',
};

export function capacityAxisLabel(axis: CapacityAxis, mark: CapacityMark): string {
  if (mark === 'unset') return 'Niet ingevuld';
  if (mark === 'unknown') return `${AXIS_LABEL[axis]} is onbekend`;
  return `${AXIS_LABEL[axis]} is niet van toepassing`;
}

export function vehicleFits(cargo: TransportCargo, vehicle: VehicleCapacity): VehicleFit {
  const interpreted = vehicle.status == null
    ? interpretStoredCapacity({
        maxLengthCm: vehicle.maxLengthCm,
        maxWidthCm: vehicle.maxWidthCm,
        maxHeightCm: vehicle.maxHeightCm,
        maxWeightGrams: vehicle.maxWeightGrams,
        status: null,
      }).status
    : null;
  const rawStatus = interpreted ?? vehicle.status;
  if (rawStatus && Object.keys(rawStatus).some((key) => !(CAPACITY_AXES as readonly string[]).includes(key))) {
    return 'missing_data';
  }
  if (vehicle.modes.length === 0) return 'missing_data';
  if (cargo.preferredVehicle && !vehicle.modes.includes(cargo.preferredVehicle)) return 'wrong_type';
  const status = { ...emptyCapacityStatus(), ...rawStatus };
  const measured: Partial<Record<CapacityAxis, number>> = {};
  for (const axis of CAPACITY_AXES) {
    const mark = status[axis];
    const number = vehicle[AXIS_NUMBER[axis]];
    if (mark !== 'set' && mark !== 'legacy' && mark !== 'unknown' && mark !== 'not_applicable' && mark !== 'unset') {
      return 'missing_data';
    }
    if (mark === 'unknown') return 'unknown';
    if (mark === 'unset') return 'missing_data';
    if (mark === 'not_applicable') continue;
    if (number == null || number <= 0) return 'missing_data';
    measured[axis] = number;
  }
  if (Object.keys(measured).length === 0) return 'missing_data';
  const cargoGrams = Math.round(cargo.totalWeightKg * GRAMS_PER_KILOGRAM);
  const tooBig = cargo.items.some(
    (item) =>
      (measured.length != null && item.lengthCm > measured.length) ||
      (measured.width != null && item.widthCm > measured.width) ||
      (measured.height != null && item.heightCm > measured.height),
  );
  if (tooBig || (measured.weight != null && cargoGrams > measured.weight)) return 'too_small';
  return 'fit';
}

export function areaFromAddress(address: string): string {
  const postal = address.match(/\b(\d{4})\s?[A-Za-z]{2}\b/);
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const city = parts.length > 1 ? parts[parts.length - 1]!.replace(/\b\d{4}\s?[A-Za-z]{2}\b/, '').trim() : '';
  const area = [postal?.[1], city].filter(Boolean).join(' ');
  return area || 'Omgeving verborgen';
}

export function publicJobView(input: {
  pickupAddress: string;
  deliveryAddress: string;
  paid: boolean;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}): { pickupArea: string; deliveryArea: string; pickupAddress: string | null; deliveryAddress: string | null } {
  if (!input.paid) {
    return {
      pickupArea: areaFromAddress(input.pickupAddress),
      deliveryArea: areaFromAddress(input.deliveryAddress),
      pickupAddress: null,
      deliveryAddress: null,
    };
  }
  return {
    pickupArea: areaFromAddress(input.pickupAddress),
    deliveryArea: areaFromAddress(input.deliveryAddress),
    pickupAddress: input.pickupAddress,
    deliveryAddress: input.deliveryAddress,
  };
}

export type ProposalAction = 'OFFER' | 'COUNTER' | 'ACCEPT' | 'REJECT' | 'QUESTION' | 'REVISE';
export type ProposalStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'EXPIRED';

export type ProposalVersion = {
  version: number;
  authorRole: 'CUSTOMER' | 'COURIER';
  action: ProposalAction;
  priceCents: number | null;
  status: ProposalStatus;
  expiresAt: string;
};

const OPEN_ACTIONS = new Set<ProposalAction>(['OFFER', 'COUNTER', 'QUESTION']);

export function proposalPaymentAllowed(versions: ProposalVersion[]): boolean {
  return versions.some((version) => version.status === 'ACCEPTED');
}

/** The last version both parties accepted. A later open revision means there is no payable agreement. */
export function agreedTransportPrice(versions: ProposalVersion[]): { version: number; priceCents: number } | null {
  const latest = versions[versions.length - 1] ?? null;
  if (!latest || latest.status !== 'ACCEPTED' || latest.priceCents == null || latest.priceCents <= 0) return null;
  return { version: latest.version, priceCents: latest.priceCents };
}

/** Existing 12/88 split and the existing Stripe buyer surcharge. No new tariff. */
export function transportCheckoutAmounts(agreedCents: number) {
  const split = splitDeliveryCommission(agreedCents);
  const buyer = calculateStripeFeeForBuyer(split.grossFeeCents);
  return {
    agreedCents: split.grossFeeCents,
    platformCommissionCents: split.platformCommissionCents,
    courierCents: split.providerNetPayoutCents,
    stripeFeeCents: buyer.stripeFeeCents,
    buyerTotalCents: buyer.buyerTotalCents,
    currency: 'eur' as const,
  };
}

export function checkoutSessionStillCurrent(input: {
  sessionProposalVersion: string | null;
  sessionBuyerTotalCents: number | null;
  acceptedVersion: number;
  buyerTotalCents: number;
}): boolean {
  return input.sessionProposalVersion === String(input.acceptedVersion)
    && input.sessionBuyerTotalCents === input.buyerTotalCents;
}

export const ROUTE_UNCONFIRMED_NL =
  'De rijafstand kon niet via Google worden bevestigd. Een conceptvoorstel kun je bewaren. Betalen kan pas als de route bevestigd is.';

export function confirmedDrivingRoute(route: { distance?: number; source?: 'google' | 'straight_line' } | { error: string }): { confirmed: true; distanceKm: number } | { confirmed: false; message: string } {
  if (!('distance' in route) || typeof route.distance !== 'number' || route.source !== 'google') {
    return { confirmed: false, message: ROUTE_UNCONFIRMED_NL };
  }
  return { confirmed: true, distanceKm: route.distance };
}

export function applyProposalAction(input: {
  versions: ProposalVersion[];
  expectedVersion: number;
  actorRole: 'CUSTOMER' | 'COURIER';
  action: ProposalAction;
  priceCents: number | null;
  negotiable: boolean;
  now: Date;
  expiresAt: Date;
}): { ok: true; versions: ProposalVersion[]; paymentAllowed: boolean; agreedPriceCents: number | null } | { ok: false; code: string } {
  const latest = input.versions[input.versions.length - 1] ?? null;
  if (latest && input.expectedVersion !== latest.version) {
    return { ok: false, code: 'VERSION_CONFLICT' };
  }
  if (latest && latest.status === 'OPEN' && new Date(latest.expiresAt).getTime() <= input.now.getTime()) {
    return { ok: false, code: 'PROPOSAL_EXPIRED' };
  }
  if (latest && latest.status === 'REJECTED') {
    return { ok: false, code: 'PROPOSAL_CLOSED' };
  }
  if (latest && latest.status === 'ACCEPTED' && input.action !== 'REVISE') {
    return { ok: false, code: 'PROPOSAL_CLOSED' };
  }
  if (input.action === 'REVISE') {
    if (!latest || (latest.status !== 'ACCEPTED' && latest.status !== 'OPEN')) {
      return { ok: false, code: 'PROPOSAL_CLOSED' };
    }
  }
  if (!latest && input.actorRole !== 'CUSTOMER') {
    return { ok: false, code: 'CUSTOMER_OPENS' };
  }
  if (!latest && input.action !== 'OFFER' && input.action !== 'QUESTION') {
    return { ok: false, code: 'CUSTOMER_OPENS' };
  }
  if (input.action === 'ACCEPT' || input.action === 'REJECT' || input.action === 'COUNTER') {
    if (!latest || latest.status !== 'OPEN' || latest.authorRole === input.actorRole) {
      return { ok: false, code: 'NOT_YOUR_TURN' };
    }
    if (input.action === 'ACCEPT' && latest.action === 'QUESTION') {
      return { ok: false, code: 'QUESTION_NOT_ACCEPTABLE' };
    }
  }
  const price = input.action === 'REVISE' && (input.priceCents == null || input.priceCents <= 0)
    ? latest?.priceCents ?? null
    : input.priceCents;
  if ((input.action === 'OFFER' || input.action === 'COUNTER' || input.action === 'REVISE') && (price == null || price <= 0)) {
    return { ok: false, code: 'PRICE_REQUIRED' };
  }
  if (
    (input.action === 'OFFER' || input.action === 'COUNTER' || input.action === 'REVISE') &&
    price != null &&
    price < MIN_TRANSPORT_PROPOSAL_CENTS &&
    !input.negotiable
  ) {
    return { ok: false, code: 'BELOW_MINIMUM' };
  }
  const nextVersion = (latest?.version ?? 0) + 1;
  const opened: ProposalVersion = {
    version: nextVersion,
    authorRole: input.actorRole,
    action: input.action,
    priceCents: input.action === 'ACCEPT' ? latest?.priceCents ?? null : price,
    status: input.action === 'ACCEPT' ? 'ACCEPTED' : input.action === 'REJECT' ? 'REJECTED' : 'OPEN',
    expiresAt: input.expiresAt.toISOString(),
  };
  const versions = input.versions.map((version) =>
    version.status === 'OPEN' || (input.action === 'REVISE' && version.status === 'ACCEPTED')
      ? { ...version, status: 'SUPERSEDED' as const }
      : version,
  );
  versions.push(opened);
  const agreed = opened.status === 'ACCEPTED' ? opened.priceCents : null;
  return { ok: true, versions, paymentAllowed: opened.status === 'ACCEPTED', agreedPriceCents: agreed };
}

export function checkoutAllowed(input: {
  jobKind: 'SIMPLE' | 'TRANSPORT';
  bookingStatus: string | null;
  proposalAccepted: boolean;
}): { ok: true } | { ok: false; code: string } {
  if (input.bookingStatus !== 'ACCEPTED' && input.bookingStatus !== 'AUTO_CONFIRMED') {
    return { ok: false, code: 'DELIVERY_BOOKING_REQUIRED' };
  }
  if (input.jobKind === 'TRANSPORT' && !input.proposalAccepted) {
    return { ok: false, code: 'PROPOSAL_NOT_ACCEPTED' };
  }
  return { ok: true };
}

export function payoutAllowed(deliveryStatus: string): boolean {
  return deliveryStatus === 'DELIVERED';
}

export function standaloneWebhookDecision(input: {
  livemode: boolean | null;
  platformIsTestMode: boolean;
  paymentStatus: string | null;
  currency: string | null;
  amountTotal: number | null;
  metadataUserId: string | null;
  requestUserId: string;
  buyerTotalCents: number;
  alreadyFulfilled: boolean;
  /** Set for transport. A payment for an older proposal version is refused. */
  acceptedProposalVersion?: number | null;
  paidProposalVersion?: number | null;
}): 'ok' | 'duplicate' | 'wrong_mode' | 'unpaid' | 'wrong_currency' | 'wrong_amount' | 'wrong_user' | 'stale_version' {
  if (input.alreadyFulfilled) return 'duplicate';
  if (input.livemode != null && input.livemode === input.platformIsTestMode) return 'wrong_mode';
  if (input.paymentStatus !== 'paid') return 'unpaid';
  if ((input.currency || '').toLowerCase() !== 'eur') return 'wrong_currency';
  if (input.amountTotal !== input.buyerTotalCents) return 'wrong_amount';
  if (input.paidProposalVersion != null && input.paidProposalVersion !== input.acceptedProposalVersion) return 'stale_version';
  if (input.metadataUserId !== input.requestUserId) return 'wrong_user';
  return 'ok';
}

export const STANDALONE_PAYMENT_REVIEW_ACTION = 'standalone_delivery_payment_review';

/**
 * A paid transport session that is not the current accepted version is a permanent
 * exception. The money stays recorded, no delivery order is created, and Stripe
 * must not keep retrying. A missing database write is not this result.
 */
export function transportReceivedPaymentDisposition(input: {
  livemode: boolean | null;
  platformIsTestMode: boolean;
  paymentStatus: string | null;
  currency: string | null;
  amountTotal: number | null;
  metadataUserId: string | null;
  requestUserId: string;
  buyerTotalCents: number;
  alreadyFulfilled: boolean;
  reviewRecorded: boolean;
  acceptedProposalVersion: number | null;
  paidProposalVersion: number | null;
}): 'fulfill' | 'duplicate' | 'review' | 'duplicate_review' | 'wrong_mode' | 'unpaid' | 'wrong_currency' | 'wrong_user' {
  if (input.livemode != null && input.livemode === input.platformIsTestMode) return 'wrong_mode';
  if (input.paymentStatus !== 'paid') return 'unpaid';
  if ((input.currency || '').toLowerCase() !== 'eur') return 'wrong_currency';
  if (input.metadataUserId !== input.requestUserId) return 'wrong_user';
  const current = input.paidProposalVersion != null
    && input.paidProposalVersion === input.acceptedProposalVersion
    && input.amountTotal === input.buyerTotalCents;
  if (current) return input.alreadyFulfilled ? 'duplicate' : 'fulfill';
  return input.reviewRecorded ? 'duplicate_review' : 'review';
}

export function transportPaymentReviewReason(input: {
  acceptedProposalVersion: number | null;
  paidProposalVersion: number | null;
  amountTotal: number | null;
  buyerTotalCents: number;
}): string {
  if (input.paidProposalVersion !== input.acceptedProposalVersion) return 'STALE_PROPOSAL_VERSION';
  if (input.amountTotal !== input.buyerTotalCents) return 'AMOUNT_MISMATCH';
  return 'STALE_PROPOSAL_VERSION';
}

export function validateCargoPhoto(input: { mimeType: string; sizeBytes: number }): { ok: true } | { ok: false; code: string } {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(input.mimeType)) {
    return { ok: false, code: 'UNSUPPORTED_TYPE' };
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > 8 * 1024 * 1024) {
    return { ok: false, code: 'INVALID_SIZE' };
  }
  return { ok: true };
}

export function canReadCargoPhoto(input: {
  ownerUserId: string;
  viewerUserId: string | null;
  courierUserId: string | null;
  paid: boolean;
}): boolean {
  if (!input.viewerUserId) return false;
  if (input.viewerUserId === input.ownerUserId) return true;
  return Boolean(input.paid && input.courierUserId && input.viewerUserId === input.courierUserId);
}
