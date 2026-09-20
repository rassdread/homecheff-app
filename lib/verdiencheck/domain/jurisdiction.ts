/**
 * LANGUAGE ≠ JURISDICTION.
 * Never use UI language or User.country default "NL" as tax truth.
 */

export const TAX_JURISDICTIONS = ['NL', 'BE', 'SR', 'OTHER'] as const;
export type TaxJurisdiction = (typeof TAX_JURISDICTIONS)[number];

export const UI_LANGUAGES = ['nl', 'en'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

export type JurisdictionResolution =
  | { status: 'ELIGIBLE'; jurisdiction: 'NL' }
  | {
      status: 'NOT_SUPPORTED';
      jurisdiction: Exclude<TaxJurisdiction, 'NL'>;
      reason: 'NOT_NL';
    }
  | { status: 'ASK_JURISDICTION' };

export type ConfirmedTaxResidence = TaxJurisdiction | 'UNKNOWN' | null;

export type ResolveTaxJurisdictionInput = {
  confirmedResidence: ConfirmedTaxResidence;
  /**
   * UI language. Ignored for pack selection. Present so callers cannot
   * accidentally pass it as jurisdiction.
   */
  uiLanguage?: UiLanguage | null;
  /**
   * Profile / geo country. MUST NOT be used as tax jurisdiction.
   * Accepted only to make misuse visible in tests.
   */
  userCountry?: string | null;
};

/**
 * User.country (schema default "NL") is never tax jurisdiction.
 * This function exists so tests can prove we refuse that shortcut.
 */
export function userCountryMustNotBecomeTaxJurisdiction(
  _userCountry: string | null | undefined,
): false {
  void _userCountry;
  return false;
}

export function resolveTaxJurisdiction(
  input: ResolveTaxJurisdictionInput,
): JurisdictionResolution {
  void input.uiLanguage;
  void input.userCountry;

  const confirmed = input.confirmedResidence;
  if (confirmed == null || confirmed === 'UNKNOWN') {
    return { status: 'ASK_JURISDICTION' };
  }
  if (confirmed === 'NL') {
    return { status: 'ELIGIBLE', jurisdiction: 'NL' };
  }
  return {
    status: 'NOT_SUPPORTED',
    jurisdiction: confirmed,
    reason: 'NOT_NL',
  };
}

export function isNlTaxEligible(
  input: ResolveTaxJurisdictionInput,
): boolean {
  return resolveTaxJurisdiction(input).status === 'ELIGIBLE';
}

export function currentCalendarYear(
  now: Date = new Date(),
  timeZone: string = 'Europe/Amsterdam',
): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  return Number(year);
}
