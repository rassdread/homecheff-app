/**
 * Courier audiences for the existing admin notification composer.
 * Eligibility comes from the delivery profile, age, agreement, and Stripe
 * identity classifiers. This module does not write accounts or caches.
 */

import {
  classifyCourierStripeIdentity,
  type CourierStripeAccount,
  type CourierVerificationState,
} from '@/lib/delivery/courier-identity';
import {
  acceptanceMatchesCurrent,
  DELIVERY_AGREEMENT_VERSION,
} from '@/lib/delivery/delivery-agreement-version';
import { resolveDeliveryAgeStatus } from '@/lib/delivery/delivery-age';
import { getDeliveryProfileCompletion } from '@/lib/delivery/delivery-profile-completion';
import {
  toProviderActivationProfile,
  type CanonicalDeliveryProfileRow,
} from '@/lib/delivery/delivery-profile-canonical';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';

export const SYSTEM_COURIER_USER_ID = 'system-unassigned-delivery';

export const COURIER_SEGMENT_IDS = [
  'ALL_EXISTING_COURIERS',
  'ACTIVE_COURIERS',
  'READY_COURIERS',
  'AGREEMENT_MISSING',
  'STRIPE_CONNECT_MISSING',
  'STRIPE_ONBOARDING_INCOMPLETE',
  'STRIPE_IDENTITY_UNVERIFIED',
  'PROFILE_INCOMPLETE',
  'INACTIVE_COURIERS',
] as const;

export type CourierSegmentId = (typeof COURIER_SEGMENT_IDS)[number];

export const COURIER_VEHICLE_FILTERS = ['BIKE', 'EBIKE', 'SCOOTER', 'CAR'] as const;
export type CourierVehicleFilter = (typeof COURIER_VEHICLE_FILTERS)[number];

export const COURIER_TEMPLATE_IDS = [
  'COURIER_AGREEMENT_REMINDER',
  'COURIER_STRIPE_ONBOARDING',
  'COURIER_PROFILE_COMPLETION',
  'COURIER_PILOT_INVITATION',
  'COURIER_REACTIVATION',
] as const;
export type CourierTemplateId = (typeof COURIER_TEMPLATE_IDS)[number];

export const COURIER_CONNECT_CLASSES = [
  'NO_CONNECT_ACCOUNT',
  'ONBOARDING_INCOMPLETE',
  'VERIFICATION_PENDING',
  'VERIFICATION_RESTRICTED',
  'VERIFIED_AND_ELIGIBLE',
  'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE',
] as const;
export type CourierConnectClass = (typeof COURIER_CONNECT_CLASSES)[number];

export type AgreementAcceptanceState =
  | 'ACCEPTED_CURRENT_VERSION'
  | 'ACCEPTED_OLDER_VERSION'
  | 'NOT_ACCEPTED'
  | 'UNKNOWN';

export type CourierNotificationQuery = {
  segment: CourierSegmentId;
  vehicle: CourierVehicleFilter | null;
  area: string | null;
  activeWithinDays: 7 | 30 | 90 | null;
  templateId: CourierTemplateId | null;
};

export type CourierStripeObservation =
  | { source: 'none' }
  | { source: 'unavailable' }
  | {
      source: 'cache';
      identityState: string | null;
      transfersStatus: string | null;
    }
  | {
      source: 'live';
      failed: boolean;
      account: CourierStripeAccount | null;
      transfersStatus: string | null;
    };

export type CourierNotificationSource = {
  userId: string;
  name: string | null;
  email: string | null;
  deleted: boolean;
  suspended: boolean;
  blocked: boolean;
  isActive: boolean;
  isVerified: boolean;
  dateOfBirth: Date | string | null;
  marketingAccepted: boolean;
  onboardingCompleted: boolean;
  connectAccountId: string | null;
  city: string | null;
  regions: string[];
  nationalCoverage: boolean;
  transportation: string[];
  lastActivity: Date | null;
  agreementRows: { version: string; contentHash: string; language: string }[] | null;
  profile: CanonicalDeliveryProfileRow;
  userLat: number | null;
  userLng: number | null;
  stripe: CourierStripeObservation;
};

export type AssessedCourier = {
  userId: string;
  name: string | null;
  email: string | null;
  normalizedEmail: string | null;
  connectClass: CourierConnectClass;
  agreement: AgreementAcceptanceState;
  identityState: CourierVerificationState | 'NO_ACCOUNT';
  ready: boolean;
  isActive: boolean;
  profileComplete: boolean;
  ageEligible: boolean;
  marketingAccepted: boolean;
  transportation: string[];
  city: string | null;
  regions: string[];
  nationalCoverage: boolean;
  lastActivity: Date | null;
  primaryLabel: string;
  missing: string[];
  exclusionReason: string | null;
};

const KNOWN_IDENTITY = new Set<CourierVerificationState>([
  'NOT_STARTED',
  'PENDING',
  'VERIFIED',
  'RESTRICTED',
  'FAILED',
  'UNKNOWN',
]);

export function parseCourierNotificationQuery(
  raw: unknown,
): { ok: true; query: CourierNotificationQuery } | { ok: false; error: string } {
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const segment = typeof body.segment === 'string' ? body.segment : 'ALL_EXISTING_COURIERS';
  if (!(COURIER_SEGMENT_IDS as readonly string[]).includes(segment)) {
    return { ok: false, error: 'Onbekend bezorgerfilter.' };
  }
  let vehicle: CourierVehicleFilter | null = null;
  if (body.vehicle != null && body.vehicle !== '') {
    if (!(COURIER_VEHICLE_FILTERS as readonly string[]).includes(String(body.vehicle))) {
      return { ok: false, error: 'Onbekend vervoermiddel.' };
    }
    vehicle = body.vehicle as CourierVehicleFilter;
  }
  const area = typeof body.area === 'string' ? body.area.trim().slice(0, 80) : '';
  let activeWithinDays: 7 | 30 | 90 | null = null;
  if (body.activeWithinDays != null && body.activeWithinDays !== '') {
    const days = Number(body.activeWithinDays);
    if (days !== 7 && days !== 30 && days !== 90) {
      return { ok: false, error: 'Onbekende activiteitsperiode.' };
    }
    activeWithinDays = days;
  }
  let templateId: CourierTemplateId | null = null;
  if (body.templateId != null && body.templateId !== '') {
    if (!(COURIER_TEMPLATE_IDS as readonly string[]).includes(String(body.templateId))) {
      return { ok: false, error: 'Onbekend sjabloon.' };
    }
    templateId = body.templateId as CourierTemplateId;
  }
  return {
    ok: true,
    query: {
      segment: segment as CourierSegmentId,
      vehicle,
      area: area || null,
      activeWithinDays,
      templateId,
    },
  };
}

export function courierQueryKey(query: CourierNotificationQuery): string {
  return JSON.stringify({
    segment: query.segment,
    vehicle: query.vehicle,
    area: (query.area || '').trim().toLowerCase(),
    activeWithinDays: query.activeWithinDays,
    templateId: query.templateId,
  });
}

export function resolveAgreementState(
  rows: { version: string; contentHash: string; language: string }[] | null,
): AgreementAcceptanceState {
  if (rows == null) return 'UNKNOWN';
  if (rows.some((row) => acceptanceMatchesCurrent(row))) return 'ACCEPTED_CURRENT_VERSION';
  if (rows.length > 0) return 'ACCEPTED_OLDER_VERSION';
  return 'NOT_ACCEPTED';
}

export function classifyAdminCourierConnect(input: {
  accountId: string | null;
  onboardingCompleted: boolean;
  stripe: CourierStripeObservation;
}): { connectClass: CourierConnectClass; identityState: CourierVerificationState | 'NO_ACCOUNT' } {
  if (!input.accountId) {
    return { connectClass: 'NO_CONNECT_ACCOUNT', identityState: 'NO_ACCOUNT' };
  }
  if (!input.onboardingCompleted) {
    return { connectClass: 'ONBOARDING_INCOMPLETE', identityState: 'UNKNOWN' };
  }
  if (input.stripe.source === 'unavailable' || (input.stripe.source === 'live' && input.stripe.failed)) {
    return { connectClass: 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE', identityState: 'UNKNOWN' };
  }
  const identityState = identityFromObservation(input.stripe);
  const transfers = transfersFromObservation(input.stripe);
  if (identityState === 'UNKNOWN') {
    return { connectClass: 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE', identityState };
  }
  if (identityState === 'RESTRICTED') {
    return { connectClass: 'VERIFICATION_RESTRICTED', identityState };
  }
  if (identityState === 'PENDING') {
    return { connectClass: 'VERIFICATION_PENDING', identityState };
  }
  if (identityState === 'VERIFIED') {
    if (transfers === 'active') {
      return { connectClass: 'VERIFIED_AND_ELIGIBLE', identityState };
    }
    if (transfers == null) {
      return { connectClass: 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE', identityState };
    }
    return { connectClass: 'ONBOARDING_INCOMPLETE', identityState };
  }
  return { connectClass: 'VERIFICATION_PENDING', identityState };
}

function identityFromObservation(stripe: CourierStripeObservation): CourierVerificationState {
  if (stripe.source === 'live' && !stripe.failed && stripe.account) {
    return classifyCourierStripeIdentity(stripe.account).state;
  }
  if (stripe.source === 'cache' && stripe.identityState && KNOWN_IDENTITY.has(stripe.identityState as CourierVerificationState)) {
    return stripe.identityState as CourierVerificationState;
  }
  return 'UNKNOWN';
}

function transfersFromObservation(stripe: CourierStripeObservation): string | null {
  if (stripe.source === 'live') return stripe.transfersStatus;
  if (stripe.source === 'cache') return stripe.transfersStatus;
  return null;
}

function vehicleLabel(mode: string): string {
  switch (mode) {
    case 'BIKE':
      return 'fiets';
    case 'EBIKE':
      return 'e-bike';
    case 'SCOOTER':
      return 'scooter';
    case 'CAR':
      return 'auto';
    default:
      return 'vervoermiddel';
  }
}

export function assessCourierForNotification(
  source: CourierNotificationSource,
  now = new Date(),
): AssessedCourier {
  const age = resolveDeliveryAgeStatus({ dateOfBirth: source.dateOfBirth, now });
  const ageEligible = age.status === 'VERIFIED_18_PLUS';
  const completion = getDeliveryProfileCompletion(
    {
      ...toProviderActivationProfile(source.profile, {
        lat: source.userLat,
        lng: source.userLng,
        dateOfBirth: source.dateOfBirth,
      }),
      isVerified: source.isVerified,
      dateOfBirth: source.dateOfBirth,
    },
  );
  const vehicles = source.transportation.filter((mode) => typeof mode === 'string' && mode.trim());
  const completionMissing = completion.missing as string[];
  const profileMissing = [...completionMissing];
  if (!source.isVerified) profileMissing.push('profileNotMarkedComplete');
  if (vehicles.length === 0) profileMissing.push('vehicle');
  const profileComplete = profileMissing.length === 0;
  const agreement = resolveAgreementState(source.agreementRows);
  const connect = classifyAdminCourierConnect({
    accountId: source.connectAccountId,
    onboardingCompleted: source.onboardingCompleted,
    stripe: source.stripe,
  });
  const transfersActive =
    connect.connectClass === 'VERIFIED_AND_ELIGIBLE'
      ? true
      : transfersFromObservation(source.stripe) === 'active'
        ? true
        : transfersFromObservation(source.stripe) == null
          ? null
          : false;

  const missing: string[] = [];
  if (!ageEligible) {
    missing.push(age.status === 'UNDER_18' ? 'Jonger dan 18 jaar.' : 'Leeftijd is niet bevestigd.');
  }
  if (!source.isActive) missing.push('Het bezorgprofiel staat niet actief.');
  if (source.blocked) missing.push('Het bezorgprofiel is geblokkeerd.');
  if (!profileComplete) {
    if (completionMissing.includes('serviceArea')) missing.push('Werkgebied ontbreekt.');
    if (completionMissing.includes('availability')) missing.push('Beschikbaarheid ontbreekt.');
    if (completionMissing.includes('pricing')) missing.push('Bezorgtarief ontbreekt.');
    if (completionMissing.includes('companyDisplayName')) missing.push('Bedrijfsnaam ontbreekt.');
    if (!source.isVerified) missing.push('Het bezorgprofiel is nog niet afgerond.');
    if (vehicles.length === 0) missing.push('Vervoermiddel ontbreekt.');
  }
  if (connect.connectClass === 'NO_CONNECT_ACCOUNT') missing.push('Stripe Connect ontbreekt.');
  else if (connect.connectClass === 'ONBOARDING_INCOMPLETE') missing.push('Stripe-onboarding is niet afgerond.');
  else if (
    connect.connectClass === 'VERIFICATION_PENDING' ||
    connect.connectClass === 'VERIFICATION_RESTRICTED'
  ) {
    missing.push('Stripe-verificatie is niet afgerond.');
  } else if (connect.connectClass === 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE') {
    missing.push('Stripe-status is nu onbekend.');
  } else if (transfersActive === false) {
    missing.push('Stripe kan nog geen vergoeding overmaken.');
  }
  if (agreement === 'NOT_ACCEPTED' || agreement === 'ACCEPTED_OLDER_VERSION') {
    missing.push('De huidige bezorgerovereenkomst is nog niet geaccepteerd.');
  } else if (agreement === 'UNKNOWN') {
    missing.push('De overeenkomststatus is onbekend.');
  }

  const ready =
    !source.deleted &&
    !source.suspended &&
    source.userId !== SYSTEM_COURIER_USER_ID &&
    !source.blocked &&
    ageEligible &&
    source.isActive &&
    profileComplete &&
    Boolean(source.connectAccountId) &&
    source.onboardingCompleted &&
    connect.connectClass === 'VERIFIED_AND_ELIGIBLE' &&
    connect.identityState === 'VERIFIED' &&
    transfersActive === true &&
    agreement === 'ACCEPTED_CURRENT_VERSION';

  const placeholder = source.userId === SYSTEM_COURIER_USER_ID;
  const normalizedEmail = tryNormalizeEmail(source.email);
  let exclusionReason: string | null = null;
  if (source.deleted) exclusionReason = 'Verwijderd account';
  else if (placeholder) exclusionReason = 'Systeemprofiel';
  else if (source.suspended) exclusionReason = 'Geschorst account';
  else if (source.blocked) exclusionReason = 'Geblokkeerd bezorgprofiel';
  else if (!ageEligible) exclusionReason = age.status === 'UNDER_18' ? 'Jonger dan 18 jaar' : 'Leeftijd niet bevestigd';
  else if (!normalizedEmail) exclusionReason = 'Geen geldig e-mailadres';

  return {
    userId: source.userId,
    name: source.name,
    email: normalizedEmail,
    normalizedEmail,
    connectClass: connect.connectClass,
    agreement,
    identityState: connect.identityState,
    ready,
    isActive: source.isActive,
    profileComplete,
    ageEligible,
    marketingAccepted: source.marketingAccepted,
    transportation: vehicles,
    city: source.city,
    regions: source.regions,
    nationalCoverage: source.nationalCoverage,
    lastActivity: source.lastActivity,
    primaryLabel: primaryLabel({
      ready,
      isActive: source.isActive,
      profileComplete,
      connectClass: connect.connectClass,
      agreement,
      exclusionReason,
    }),
    missing,
    exclusionReason,
  };
}

function primaryLabel(input: {
  ready: boolean;
  isActive: boolean;
  profileComplete: boolean;
  connectClass: CourierConnectClass;
  agreement: AgreementAcceptanceState;
  exclusionReason: string | null;
}): string {
  if (input.exclusionReason) return 'Niet beschikbaar';
  if (input.ready) return 'Klaar voor bezorgingen';
  if (!input.isActive) return 'Inactieve bezorger';
  if (!input.profileComplete) return 'Profiel onvolledig';
  if (input.connectClass === 'NO_CONNECT_ACCOUNT') return 'Stripe Connect ontbreekt';
  if (input.connectClass === 'ONBOARDING_INCOMPLETE') return 'Stripe-onboarding niet afgerond';
  if (input.connectClass === 'VERIFICATION_PENDING' || input.connectClass === 'VERIFICATION_RESTRICTED') {
    return 'Stripe-verificatie niet afgerond';
  }
  if (input.connectClass === 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE') return 'Stripe-status onbekend';
  if (input.agreement !== 'ACCEPTED_CURRENT_VERSION') return 'Overeenkomst nog accepteren';
  return 'Nog niet gereed';
}

function matchesSegment(courier: AssessedCourier, segment: CourierSegmentId): boolean {
  switch (segment) {
    case 'ALL_EXISTING_COURIERS':
      return true;
    case 'ACTIVE_COURIERS':
      return courier.isActive;
    case 'READY_COURIERS':
      return courier.ready;
    case 'AGREEMENT_MISSING':
      return courier.agreement === 'NOT_ACCEPTED' || courier.agreement === 'ACCEPTED_OLDER_VERSION';
    case 'STRIPE_CONNECT_MISSING':
      return courier.connectClass === 'NO_CONNECT_ACCOUNT';
    case 'STRIPE_ONBOARDING_INCOMPLETE':
      return courier.connectClass === 'ONBOARDING_INCOMPLETE';
    case 'STRIPE_IDENTITY_UNVERIFIED':
      return (
        courier.connectClass === 'VERIFICATION_PENDING' ||
        courier.connectClass === 'VERIFICATION_RESTRICTED'
      );
    case 'PROFILE_INCOMPLETE':
      return !courier.profileComplete;
    case 'INACTIVE_COURIERS':
      return !courier.isActive;
    default:
      return false;
  }
}

function matchesVehicle(courier: AssessedCourier, vehicle: CourierVehicleFilter | null): boolean {
  if (!vehicle) return true;
  return courier.transportation.includes(vehicle);
}

function matchesArea(courier: AssessedCourier, area: string | null): boolean {
  if (!area) return true;
  const query = area.trim().toLowerCase();
  if (!query) return true;
  if (['nederland', 'netherlands', 'nationaal', 'nl'].includes(query) && courier.nationalCoverage) {
    return true;
  }
  const haystack = [courier.city, ...courier.regions]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function matchesActivity(courier: AssessedCourier, days: 7 | 30 | 90 | null, now: Date): boolean {
  if (!days) return true;
  if (!courier.lastActivity) return false;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return courier.lastActivity.getTime() >= cutoff;
}

export function selectCourierRecipients(
  couriers: AssessedCourier[],
  query: CourierNotificationQuery,
  now = new Date(),
): {
  eligible: AssessedCourier[];
  excluded: { reason: string; count: number }[];
} {
  const excluded = new Map<string, number>();
  const bump = (reason: string) => excluded.set(reason, (excluded.get(reason) || 0) + 1);
  const matched: AssessedCourier[] = [];
  for (const courier of couriers) {
    if (courier.exclusionReason) {
      bump(courier.exclusionReason);
      continue;
    }
    if (!matchesSegment(courier, query.segment)) {
      bump('Valt buiten het gekozen bezorgerfilter');
      continue;
    }
    if (!matchesVehicle(courier, query.vehicle)) {
      bump('Ander vervoermiddel');
      continue;
    }
    if (!matchesArea(courier, query.area)) {
      bump('Ander werkgebied');
      continue;
    }
    if (!matchesActivity(courier, query.activeWithinDays, now)) {
      bump('Geen recente activiteit');
      continue;
    }
    if (query.templateId === 'COURIER_REACTIVATION' && !courier.marketingAccepted) {
      bump('Geen marketingtoestemming');
      continue;
    }
    matched.push(courier);
  }

  const seen = new Set<string>();
  const eligible: AssessedCourier[] = [];
  for (const courier of [...matched].sort((a, b) => a.userId.localeCompare(b.userId))) {
    const email = courier.normalizedEmail;
    if (!email || seen.has(email)) {
      bump('Dubbel e-mailadres');
      continue;
    }
    seen.add(email);
    eligible.push(courier);
  }

  return {
    eligible,
    excluded: [...excluded.entries()].map(([reason, count]) => ({ reason, count })),
  };
}

export function currentAgreementVersion(): string {
  return DELIVERY_AGREEMENT_VERSION;
}

export function vehicleDisplay(mode: string): string {
  return vehicleLabel(mode);
}
