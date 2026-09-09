/**
 * Pure delivery signup validation (no Prisma / DB).
 * Commercial delivery remains hard 18+ (no parental-consent bypass).
 */

import type { TransportationMode } from '@prisma/client';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { COMMERCIAL_DELIVERY_MIN_AGE } from '@/lib/delivery/delivery-age';

export const VALID_TRANSPORTATION_MODES = [
  'BIKE',
  'EBIKE',
  'SCOOTER',
  'CAR',
] as const satisfies readonly TransportationMode[];

export type DeliveryProviderType = 'INDEPENDENT' | 'DELIVERY_BUSINESS';

export type DeliverySignupInput = {
  name?: string;
  email?: string;
  password?: string;
  username?: string;
  age?: unknown;
  transportation?: unknown;
  maxDistance?: unknown;
  availableDays?: unknown;
  availableTimeSlots?: unknown;
  bio?: unknown;
  deliveryMode?: unknown;
  preferredRadius?: unknown;
  homeLat?: unknown;
  homeLng?: unknown;
  homeAddress?: unknown;
  acceptDeliveryAgreement?: unknown;
  providerType?: unknown;
  companyName?: unknown;
  kvkNumber?: unknown;
  vatNumber?: unknown;
  contactPhone?: unknown;
};

export type DeliverySignupErrorCode =
  | 'VALIDATION'
  | 'UNDERAGE'
  | 'DOB_REQUIRED'
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_USERNAME'
  | 'ALREADY_HAS_PROFILE'
  | 'RESUME_REQUIRED'
  | 'USER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INTERNAL';

export type DeliverySignupResult =
  | {
      ok: true;
      status: 200;
      recovered: boolean;
      user: {
        id: string;
        name: string | null;
        email: string;
        username: string | null;
        role: string;
      };
      deliveryProfile: {
        id: string;
        age: number;
        isActive: boolean;
        providerType: string;
      };
      business?: { id: string; name: string } | null;
    }
  | {
      ok: false;
      status: number;
      code: DeliverySignupErrorCode;
      error: string;
      resumeHint?: 'login_and_resume' | 'complete_profile';
      duplicateKind?: string;
      fieldErrors?: Record<string, string>;
    };

export const DELIVERY_SIGNUP_NL = {
  required: 'Controleer de gemarkeerde gegevens en probeer opnieuw.',
  agreement: 'Je moet de Bezorger Overeenkomst accepteren.',
  transport: 'Selecteer minimaal één vervoersmiddel.',
  email: 'Voer een geldig e-mailadres in.',
  password: 'Wachtwoord moet minimaal 6 karakters bevatten.',
  username:
    'Gebruikersnaam moet 3-20 karakters bevatten en mag alleen letters, cijfers en underscores bevatten.',
  usernameTaken: 'Deze gebruikersnaam is al in gebruik.',
  hasProfile: 'Je hebt al een bezorgerprofiel.',
  userMissing: 'Gebruiker niet gevonden.',
  companyName: 'Vul een bedrijfsnaam in.',
  kvk: 'Vul een geldig KvK-nummer in (8 cijfers).',
  resume:
    'Je account bestaat al, maar je bezorgerprofiel is nog niet afgerond. Log in en rond je aanmelding af — je hoeft geen nieuw account aan te maken.',
  orphanRetry:
    'Je account is aangemaakt, maar je bezorgerprofiel kon nog niet worden afgerond. Je gegevens zijn bewaard. Log in en probeer het opnieuw.',
  internal:
    'Er ging iets mis bij het afronden van je bezorgeraanmelding. Je gegevens zijn bewaard. Probeer het opnieuw of log in om verder te gaan.',
  unauthorized: 'Je moet ingelogd zijn om je bezorgerprofiel af te ronden.',
} as const;

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function normalizeProviderType(raw: unknown): DeliveryProviderType {
  if (raw === 'DELIVERY_BUSINESS' || raw === 'BUSINESS' || raw === 'company') {
    return 'DELIVERY_BUSINESS';
  }
  return 'INDEPENDENT';
}

function normalizeKvk(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\s+/g, '');
  if (!/^\d{8}$/.test(digits)) return null;
  return digits;
}

function normalizeOptionalString(raw: unknown, max = 200): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function filterValidTransportation(raw: unknown): TransportationMode[] {
  const list = asStringArray(raw);
  return list.filter((t): t is TransportationMode =>
    (VALID_TRANSPORTATION_MODES as readonly string[]).includes(t)
  );
}

export type ParsedDeliverySignup = {
  age: number;
  transportation: TransportationMode[];
  maxDistance: number;
  preferredRadius: number;
  deliveryMode: string;
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string | null;
  homeLat: number | null;
  homeLng: number | null;
  homeAddress: string | null;
  acceptDeliveryAgreement: boolean;
  providerType: DeliveryProviderType;
  companyName: string | null;
  kvkNumber: string | null;
  vatNumber: string | null;
  contactPhone: string | null;
  name: string | null;
  email: string | null;
  password: string | null;
  username: string | null;
};

export function parseAndValidateDeliverySignupFields(
  input: DeliverySignupInput,
  options: { requireAccountFields: boolean }
): { ok: true; data: ParsedDeliverySignup } | { ok: false; result: DeliverySignupResult } {
  const fieldErrors: Record<string, string> = {};
  const providerType = normalizeProviderType(input.providerType);
  const NL = DELIVERY_SIGNUP_NL;

  const age = asFiniteNumber(input.age);
  if (age == null || age < COMMERCIAL_DELIVERY_MIN_AGE) {
    fieldErrors.age =
      'Commerciële bezorging via HomeCheff is beschikbaar vanaf 18 jaar.';
  }

  const transportation = filterValidTransportation(input.transportation);
  if (transportation.length === 0) {
    fieldErrors.transportation = NL.transport;
  }

  if (!input.acceptDeliveryAgreement) {
    fieldErrors.acceptDeliveryAgreement = NL.agreement;
  }

  let name: string | null = null;
  let email: string | null = null;
  let password: string | null = null;
  let username: string | null = null;

  if (options.requireAccountFields) {
    name = normalizeOptionalString(input.name, 120);
    if (!name) fieldErrors.name = 'Vul je naam in.';

    email = tryNormalizeEmail(input.email);
    if (!email) fieldErrors.email = NL.email;

    password = typeof input.password === 'string' ? input.password : null;
    if (!password || password.length < 6) fieldErrors.password = NL.password;

    username = normalizeUsername(input.username);
    if (!username) fieldErrors.username = NL.username;
  }

  let companyName: string | null = null;
  let kvkNumber: string | null = null;
  let vatNumber: string | null = null;

  if (providerType === 'DELIVERY_BUSINESS') {
    companyName = normalizeOptionalString(input.companyName, 160);
    if (!companyName) fieldErrors.companyName = NL.companyName;
    kvkNumber = normalizeKvk(input.kvkNumber);
    if (!kvkNumber) fieldErrors.kvkNumber = NL.kvk;
    vatNumber = normalizeOptionalString(input.vatNumber, 32);
  }

  if (Object.keys(fieldErrors).length > 0) {
    const underage =
      age != null && Number.isFinite(age) && age < COMMERCIAL_DELIVERY_MIN_AGE;
    return {
      ok: false,
      result: {
        ok: false,
        status: underage ? 403 : 400,
        code: underage ? 'UNDERAGE' : 'VALIDATION',
        error: underage ? fieldErrors.age || NL.required : NL.required,
        fieldErrors,
      },
    };
  }

  const maxDistance = asFiniteNumber(input.maxDistance) ?? 3;
  const preferredRadius = asFiniteNumber(input.preferredRadius) ?? 5;
  const homeLat = asFiniteNumber(input.homeLat);
  const homeLng = asFiniteNumber(input.homeLng);

  return {
    ok: true,
    data: {
      age: age!,
      transportation,
      maxDistance: Math.min(Math.max(maxDistance, 0.5), 100),
      preferredRadius: Math.min(Math.max(preferredRadius, 0.5), 100),
      deliveryMode:
        input.deliveryMode === 'DYNAMIC' || input.deliveryMode === 'FIXED'
          ? String(input.deliveryMode)
          : 'FIXED',
      availableDays: asStringArray(input.availableDays).slice(0, 14),
      availableTimeSlots: asStringArray(input.availableTimeSlots).slice(0, 12),
      bio: normalizeOptionalString(input.bio, 2000),
      homeLat,
      homeLng,
      homeAddress: normalizeOptionalString(input.homeAddress, 300),
      acceptDeliveryAgreement: true,
      providerType,
      companyName,
      kvkNumber,
      vatNumber,
      contactPhone: normalizeOptionalString(input.contactPhone, 40),
      name,
      email,
      password,
      username,
    },
  };
}
