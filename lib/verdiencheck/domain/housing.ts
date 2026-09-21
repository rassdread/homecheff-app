/**
 * Canonical housing tenure for VerdienCheck.
 * rentsHome is a derived compatibility field — not a second source of truth.
 */

export const HOUSING_TENURES = [
  'RENT',
  'OWNER_OCCUPIED',
  'OTHER',
  'UNKNOWN',
] as const;

export type HousingTenure = (typeof HOUSING_TENURES)[number];

export const MORTGAGE_INTEREST_STATUSES = ['KNOWN', 'NONE', 'UNKNOWN'] as const;
export type MortgageInterestStatus = (typeof MORTGAGE_INTEREST_STATUSES)[number];

export const OWNER_HOME_SHARES = ['ALL', 'HALF', 'CUSTOM'] as const;
export type OwnerHomeShare = (typeof OWNER_HOME_SHARES)[number];

export function rentsHomeFromTenure(
  tenure: HousingTenure | null | undefined,
): boolean | 'UNKNOWN' | null {
  if (tenure == null) return null;
  if (tenure === 'RENT') return true;
  if (tenure === 'OWNER_OCCUPIED' || tenure === 'OTHER') return false;
  return 'UNKNOWN';
}

export function housingTenureFromLegacyRentsHome(
  rentsHome: boolean | 'UNKNOWN' | null | undefined,
): HousingTenure | null {
  if (rentsHome === true) return 'RENT';
  if (rentsHome === false) return 'OTHER';
  if (rentsHome === 'UNKNOWN') return 'UNKNOWN';
  return null;
}

export function resolveHousingTenure(input: {
  housingTenure?: HousingTenure | null;
  rentsHome?: boolean | 'UNKNOWN' | null;
}): HousingTenure | null {
  if (input.housingTenure != null) return input.housingTenure;
  return housingTenureFromLegacyRentsHome(input.rentsHome);
}

export function calculatorHousingTenure(
  tenure: HousingTenure | null,
): 'RENTS' | 'DOES_NOT_RENT' | 'UNKNOWN' | null {
  if (tenure == null) return null;
  if (tenure === 'RENT') return 'RENTS';
  if (tenure === 'UNKNOWN') return 'UNKNOWN';
  return 'DOES_NOT_RENT';
}

export function ownerHomeShareBps(input: {
  share: OwnerHomeShare | null;
  customPercent: string;
  hasPartner: boolean | 'UNKNOWN' | null;
}): { bps: number; assumed: boolean } {
  if (input.hasPartner !== true) {
    return { bps: 10_000, assumed: false };
  }
  if (input.share === 'ALL') return { bps: 10_000, assumed: false };
  if (input.share === 'HALF') return { bps: 5_000, assumed: false };
  if (input.share === 'CUSTOM') {
    const n = Number.parseInt(input.customPercent.trim(), 10);
    if (Number.isInteger(n) && n >= 0 && n <= 100) {
      return { bps: n * 100, assumed: false };
    }
  }
  return { bps: 10_000, assumed: true };
}
