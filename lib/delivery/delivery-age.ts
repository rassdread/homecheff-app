/**
 * Authoritative commercial delivery age calculation.
 *
 * CANONICAL_DOB_SOURCE = User.dateOfBirth (account-level, one per HomeCheff user).
 * Delivery does not store a separate deliveryBirthDate. DeliveryProfile.age is a
 * legacy snapshot integer and is never sufficient for the 18+ gate.
 *
 * STRIPE_KYC_RELATION = Stripe Connect identity/DOB is payout KYC, not the
 * HomeCheff Delivery eligibility source. A missing Stripe DOB does not satisfy
 * this gate. HomeCheff never overwrites User.dateOfBirth from Stripe. Two ages
 * do not compete: Delivery uses User.dateOfBirth; Stripe payouts use Stripe.
 *
 * DOB_CHANGE_POLICY = first confirmation is allowed when User.dateOfBirth is
 * empty. After that the value is locked for the user (admin/support only) so
 * nobody can activate Delivery and then change DOB to bypass 18+.
 *
 * Calendar math uses Europe/Amsterdam Y-M-D so UTC storage cannot shift the
 * birthday by one day.
 */

export const COMMERCIAL_DELIVERY_MIN_AGE = 18;
export const DELIVERY_AGE_TIMEZONE = 'Europe/Amsterdam';
export const DELIVERY_AGE_SETTINGS_HREF = '/delivery/settings#leeftijd';

export const COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL =
  'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar.';

export const COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_EN =
  'Delivery via HomeCheff is available from age 18.';

export const COMMERCIAL_DELIVERY_DOB_REQUIRED_MESSAGE_NL =
  'Bevestig je leeftijd om te kunnen bezorgen.';

export const COMMERCIAL_DELIVERY_ONLINE_DOB_REQUIRED_NL =
  'Bevestig eerst je leeftijd om online te kunnen gaan als bezorger.';

export const COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL =
  'Je geboortedatum is bevestigd en kan niet meer zelf worden gewijzigd. Zo voorkomen we misbruik van de 18+-regel.';

export type AgeFromDobResult =
  | { ok: true; ageYears: number }
  | { ok: false; reason: 'MISSING_DOB' | 'INVALID_DOB' };

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type CalendarYmd = { year: number; month: number; day: number };

export function calendarYmdInTimeZone(
  date: Date,
  timeZone: string = DELIVERY_AGE_TIMEZONE,
): CalendarYmd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
    day: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

/** Store as UTC noon so the civil date is stable across timezones. */
export function calendarDateToStoredUtc(ymd: CalendarYmd): Date {
  return new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day, 12, 0, 0));
}

export function parseSubmittedDateOfBirth(
  raw: unknown,
): { ok: true; ymd: CalendarYmd; stored: Date } | { ok: false; reason: 'MISSING_DOB' | 'INVALID_DOB' } {
  if (raw == null || raw === '') return { ok: false, reason: 'MISSING_DOB' };
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return { ok: false, reason: 'INVALID_DOB' };
    const isUtcMidnight =
      raw.getUTCHours() === 0 &&
      raw.getUTCMinutes() === 0 &&
      raw.getUTCSeconds() === 0 &&
      raw.getUTCMilliseconds() === 0;
    const ymd = calendarYmdInTimeZone(
      raw,
      isUtcMidnight ? 'UTC' : DELIVERY_AGE_TIMEZONE,
    );
    return { ok: true, ymd, stored: calendarDateToStoredUtc(ymd) };
  }
  const text = String(raw).trim();
  if (!text) return { ok: false, reason: 'MISSING_DOB' };

  let y: number | null = null;
  let m: number | null = null;
  let d: number | null = null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const nl = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (nl) {
    d = Number(nl[1]);
    m = Number(nl[2]);
    y = Number(nl[3]);
  } else {
    const asDate = new Date(text);
    if (Number.isNaN(asDate.getTime())) return { ok: false, reason: 'INVALID_DOB' };
    const ymd = calendarYmdInTimeZone(asDate, 'UTC');
    return { ok: true, ymd, stored: calendarDateToStoredUtc(ymd) };
  }
  if (!y || !m || !d) return { ok: false, reason: 'INVALID_DOB' };
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
    return { ok: false, reason: 'INVALID_DOB' };
  }
  const stored = calendarDateToStoredUtc({ year: y, month: m, day: d });
  const check = calendarYmdInTimeZone(stored, 'UTC');
  if (check.year !== y || check.month !== m || check.day !== d) {
    return { ok: false, reason: 'INVALID_DOB' };
  }
  if (stored.getTime() > Date.now()) return { ok: false, reason: 'INVALID_DOB' };
  return { ok: true, ymd: { year: y, month: m, day: d }, stored };
}

export function formatDateOfBirthNl(value: Date | string | null | undefined): string | null {
  const parsed = parseSubmittedDateOfBirth(value);
  if (!parsed.ok) return null;
  const dd = String(parsed.ymd.day).padStart(2, '0');
  const mm = String(parsed.ymd.month).padStart(2, '0');
  return `${dd}-${mm}-${parsed.ymd.year}`;
}

export function formatDateOfBirthIso(value: Date | string | null | undefined): string | null {
  const parsed = parseSubmittedDateOfBirth(value);
  if (!parsed.ok) return null;
  const dd = String(parsed.ymd.day).padStart(2, '0');
  const mm = String(parsed.ymd.month).padStart(2, '0');
  return `${parsed.ymd.year}-${mm}-${dd}`;
}

/**
 * Compute whole years of age at `now` from date of birth.
 * Birthday today (in the delivery market timezone) counts as having turned that age.
 */
export function calculateAgeFromDob(
  dateOfBirth: Date | string | null | undefined,
  now: Date = new Date(),
  timeZone: string = DELIVERY_AGE_TIMEZONE,
): AgeFromDobResult {
  const dob = toDate(dateOfBirth);
  if (!dob) {
    return { ok: false, reason: dateOfBirth == null || dateOfBirth === '' ? 'MISSING_DOB' : 'INVALID_DOB' };
  }
  if (dob.getTime() > now.getTime()) {
    return { ok: false, reason: 'INVALID_DOB' };
  }

  const birth = calendarYmdInTimeZone(dob, timeZone);
  const today = calendarYmdInTimeZone(now, timeZone);
  let age = today.year - birth.year;
  if (
    today.month < birth.month ||
    (today.month === birth.month && today.day < birth.day)
  ) {
    age -= 1;
  }

  if (age < 0 || age > 150) {
    return { ok: false, reason: 'INVALID_DOB' };
  }

  return { ok: true, ageYears: age };
}

export function isDateOfBirthLocked(existing: Date | string | null | undefined): boolean {
  return toDate(existing) != null;
}

export function isAtLeastCommercialDeliveryAge(
  dateOfBirth: Date | string | null | undefined,
  now: Date = new Date(),
  minAge: number = COMMERCIAL_DELIVERY_MIN_AGE
): boolean {
  const result = calculateAgeFromDob(dateOfBirth, now);
  return result.ok && result.ageYears >= minAge;
}

/**
 * Commercial eligibility from DOB when age gate is on.
 * Missing/invalid DOB → fail closed (not eligible).
 * When gate is off, callers should not use this for blocking.
 */
export function resolveCommercialDeliveryAgeYears(params: {
  dateOfBirth?: Date | string | null;
  /** Legacy profile integer — never sufficient alone when gate is on. */
  profileAge?: number | null;
  now?: Date;
  ageGateEnabled: boolean;
}): {
  eligible: boolean;
  ageYears: number | null;
  reason:
    | 'OK'
    | 'UNDERAGE'
    | 'MISSING_DOB'
    | 'INVALID_DOB'
    | 'GATE_DISABLED';
} {
  const now = params.now ?? new Date();

  if (!params.ageGateEnabled) {
    if (
      typeof params.profileAge === 'number' &&
      Number.isFinite(params.profileAge)
    ) {
      return {
        eligible: params.profileAge >= COMMERCIAL_DELIVERY_MIN_AGE,
        ageYears: params.profileAge,
        reason:
          params.profileAge >= COMMERCIAL_DELIVERY_MIN_AGE ? 'OK' : 'UNDERAGE',
      };
    }
    return { eligible: true, ageYears: null, reason: 'GATE_DISABLED' };
  }

  const fromDob = calculateAgeFromDob(params.dateOfBirth, now);
  if (!fromDob.ok) {
    return {
      eligible: false,
      ageYears: null,
      reason: fromDob.reason,
    };
  }

  if (fromDob.ageYears < COMMERCIAL_DELIVERY_MIN_AGE) {
    return {
      eligible: false,
      ageYears: fromDob.ageYears,
      reason: 'UNDERAGE',
    };
  }

  return {
    eligible: true,
    ageYears: fromDob.ageYears,
    reason: 'OK',
  };
}

export type DeliveryAgeRequirementStatus =
  | 'DELIVERY_AGE_ELIGIBLE'
  | 'DELIVERY_DOB_MISSING'
  | 'DELIVERY_UNDER_18'
  | 'DELIVERY_DOB_INVALID';

export function evaluateDeliveryAgeRequirement(params: {
  dateOfBirth?: Date | string | null;
  now?: Date;
  ageGateEnabled?: boolean;
}): {
  status: DeliveryAgeRequirementStatus;
  eligible: boolean;
  missing: Array<'dateOfBirth' | 'under18'>;
  ageYears: number | null;
} {
  const ageGateEnabled = params.ageGateEnabled ?? true;
  const resolution = resolveCommercialDeliveryAgeYears({
    dateOfBirth: params.dateOfBirth,
    now: params.now,
    ageGateEnabled,
  });
  if (resolution.reason === 'GATE_DISABLED' || resolution.reason === 'OK') {
    return {
      status: 'DELIVERY_AGE_ELIGIBLE',
      eligible: true,
      missing: [],
      ageYears: resolution.ageYears,
    };
  }
  if (resolution.reason === 'UNDERAGE') {
    return {
      status: 'DELIVERY_UNDER_18',
      eligible: false,
      missing: ['under18'],
      ageYears: resolution.ageYears,
    };
  }
  if (resolution.reason === 'INVALID_DOB') {
    return {
      status: 'DELIVERY_DOB_INVALID',
      eligible: false,
      missing: ['dateOfBirth'],
      ageYears: null,
    };
  }
  return {
    status: 'DELIVERY_DOB_MISSING',
    eligible: false,
    missing: ['dateOfBirth'],
    ageYears: null,
  };
}

export function logCommercialAgeBlock(params: {
  boundary:
    | 'signup'
    | 'activation'
    | 'online'
    | 'matching'
    | 'accept'
    | 'payout'
    | 'public';
  userId?: string;
  profileId?: string;
  reason: string;
}): void {
  console.info('[delivery-age-gate]', {
    boundary: params.boundary,
    userId: params.userId ?? null,
    profileId: params.profileId ?? null,
    reason: params.reason,
  });
}
