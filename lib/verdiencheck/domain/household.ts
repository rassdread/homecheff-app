/**
 * Allowance-specific household context.
 * Huurtoeslag medebewoners ≠ zorgtoeslag partner ≠ KGB partner.
 */

import type { AssetsEligibility } from '../calculator/types';
import type { Cents } from './money';

export const CALCULATION_PERIOD = {
  FULL_YEAR_STABLE_SITUATION: 'FULL_YEAR_STABLE_SITUATION',
} as const;

export type CalculationPeriod =
  (typeof CALCULATION_PERIOD)[keyof typeof CALCULATION_PERIOD];

export const MID_YEAR_CHANGE_NOT_SUPPORTED = 'MID_YEAR_CHANGE_NOT_SUPPORTED';

export type HousingResidentRole =
  | 'APPLICANT'
  | 'TOESLAGPARTNER'
  | 'MEDEBEWONER'
  | 'THUISWONEND_KIND';

export type HousingResident = {
  localKey: string;
  role: HousingResidentRole;
  ageYears: number | null;
  assessmentIncomeCents: Cents | null;
  assetsEligibility?: AssetsEligibility | null;
};

export type HousingHousehold = {
  residents: readonly HousingResident[];
  housingAssetsEligibility: AssetsEligibility | null;
  under18ExceptionGranted?: boolean | null;
  midYearHouseholdChange?: boolean;
};

export function oldestResidentAgeYears(
  household: HousingHousehold,
): number | null {
  let oldest: number | null = null;
  for (const r of household.residents) {
    if (r.ageYears == null) return null;
    if (oldest == null || r.ageYears > oldest) oldest = r.ageYears;
  }
  return oldest;
}

export function housingPersonCount(household: HousingHousehold): number {
  return household.residents.length;
}
