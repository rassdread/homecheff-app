/**
 * NL-2026 huurtoeslag — Wet op de huurtoeslag 2026-01-01 + Stcrt. 2025/39783
 * + Besluit op de huurtoeslag art. 7 + Wet verlaging eigen bijdrage 2026.
 *
 * Art. 18/19 vervallen per 1 januari 2026: geen aparte ouderenformule.
 * Art. 14 norminkomen blijft in de wet staan maar wordt in 2026 niet meer
 * gebruikt in de berekeningsartikelen (hoogte = art. 21). Geen inkomenscliff
 * uit art. 14 toepassen.
 */

import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import {
  housingPersonCount,
  oldestResidentAgeYears,
  type HousingHousehold,
  type HousingResident,
} from '../domain/household';
import { MID_YEAR_CHANGE_NOT_SUPPORTED } from '../domain/household';
import {
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  HT_AFTOP_1_OR_2_CENTS,
  HT_AFTOP_3_PLUS_CENTS,
  HT_BASISHUUR_MULTI_CENTS,
  HT_BASISHUUR_SINGLE_CENTS,
  HT_CALC_CAP_NORMAL_CENTS,
  HT_CALC_CAP_YOUTH_CENTS,
  HT_CHILD_EXEMPTION_AGE_BELOW,
  HT_CHILD_INCOME_EXEMPTION_CENTS,
  HT_MINIMUM_AGE,
  HT_MIN_IJKPUNT_MULTI_CENTS,
  HT_MIN_IJKPUNT_SINGLE_CENTS,
  HT_PHASEOUT_MULTI,
  HT_PHASEOUT_SINGLE,
  HT_QUALITY_THRESHOLD_CENTS,
  HT_ROUNDING,
  HT_SLICE2_PCT,
  HT_SLICE3_PCT,
  HT_YOUTH_AGE_BELOW,
} from '../rulesets/nl/2026/housing-allowance-parameters';

export const HOUSING_ROUNDING_POLICY = HT_ROUNDING;

export type HousingAllowanceStatus =
  | 'OK'
  | 'ZERO'
  | 'UNKNOWN'
  | 'MID_YEAR_CHANGE_NOT_SUPPORTED'
  | 'MISSING_BARE_RENT';

export type HousingAllowanceResult = {
  status: HousingAllowanceStatus;
  monthlyCents: CentsOrUnknown;
  annualCents: CentsOrUnknown;
  calculationRentCents: CentsOrUnknown;
  reason: string | null;
  youthRegime: boolean | null;
};

export type HousingAllowanceInput = {
  midYearHouseholdChange?: boolean;
  onlyTotalRentKnown?: boolean;
  bareRentCentsPerMonth: number | null;
  household: HousingHousehold;
  /** Applicant toetsingsinkomen for this snapshot (A or B). */
  userAssessmentIncomeCents: number;
};

function fail(
  status: HousingAllowanceStatus,
  reason: string,
): HousingAllowanceResult {
  return {
    status,
    monthlyCents: status === 'ZERO' ? 0 : UNKNOWN,
    annualCents: status === 'ZERO' ? 0 : UNKNOWN,
    calculationRentCents: UNKNOWN,
    reason,
    youthRegime: null,
  };
}

function countableResidentIncomeCents(resident: HousingResident): CentsOrUnknown {
  if (resident.assessmentIncomeCents == null) return UNKNOWN;
  if (!Number.isInteger(resident.assessmentIncomeCents)) {
    throw new Error('housing assessment income must be integer cents');
  }
  if (resident.assessmentIncomeCents < 0) {
    throw new Error('housing assessment income must be >= 0');
  }
  const age = resident.ageYears;
  const isChild = resident.role === 'THUISWONEND_KIND';
  if (
    isChild &&
    age != null &&
    (age < HT_CHILD_EXEMPTION_AGE_BELOW || age === HT_CHILD_EXEMPTION_AGE_BELOW)
  ) {
    // Dienst Toeslagen 2026: vrijstelling tot 23, en nog in het jaar waarin het kind 23 wordt.
    const net = resident.assessmentIncomeCents - HT_CHILD_INCOME_EXEMPTION_CENTS;
    return net < 0 ? 0 : net;
  }
  if (isChild && age == null) return UNKNOWN;
  return resident.assessmentIncomeCents;
}

function usesYouthCap(household: HousingHousehold, oldest: number): boolean {
  const sharesWithChild = household.residents.some(
    (r) => r.role === 'THUISWONEND_KIND',
  );
  if (sharesWithChild) return false;
  return oldest < HT_YOUTH_AGE_BELOW;
}

function replaceApplicantIncome(
  household: HousingHousehold,
  userAssessmentIncomeCents: number,
): HousingHousehold {
  return {
    ...household,
    residents: household.residents.map((r) =>
      r.role === 'APPLICANT'
        ? { ...r, assessmentIncomeCents: userAssessmentIncomeCents }
        : r,
    ),
  };
}

export function calculateHousingAllowance2026(
  input: HousingAllowanceInput,
): HousingAllowanceResult {
  if (input.midYearHouseholdChange === true) {
    return fail(
      'MID_YEAR_CHANGE_NOT_SUPPORTED',
      MID_YEAR_CHANGE_NOT_SUPPORTED,
    );
  }
  if (input.onlyTotalRentKnown === true || input.bareRentCentsPerMonth == null) {
    return fail('MISSING_BARE_RENT', 'MISSING_BARE_RENT');
  }
  if (!Number.isInteger(input.bareRentCentsPerMonth)) {
    throw new Error('bareRentCentsPerMonth must be integer cents');
  }
  if (input.bareRentCentsPerMonth < 0) {
    throw new Error('bareRentCentsPerMonth must be >= 0');
  }
  if (!Number.isInteger(input.userAssessmentIncomeCents)) {
    throw new Error('userAssessmentIncomeCents must be integer cents');
  }

  const household = replaceApplicantIncome(
    input.household,
    input.userAssessmentIncomeCents,
  );
  const assets = household.housingAssetsEligibility;
  if (assets == null || assets === 'UNKNOWN') {
    return fail('UNKNOWN', 'housingAssetsEligibility=UNKNOWN');
  }
  if (assets === 'NOT_ELIGIBLE') {
    return fail('ZERO', 'housingAssetsEligibility=NOT_ELIGIBLE');
  }
  for (const r of household.residents) {
    if (r.assetsEligibility === 'NOT_ELIGIBLE') {
      return fail('ZERO', 'residentAssetsEligibility=NOT_ELIGIBLE');
    }
    if (r.assetsEligibility === 'UNKNOWN') {
      return fail('UNKNOWN', 'residentAssetsEligibility=UNKNOWN');
    }
  }

  if (household.residents.length === 0) {
    return fail('UNKNOWN', 'housingHouseholdEmpty');
  }
  const applicant = household.residents.find((r) => r.role === 'APPLICANT');
  if (!applicant) return fail('UNKNOWN', 'housingApplicantMissing');

  const oldest = oldestResidentAgeYears(household);
  if (oldest == null) return fail('UNKNOWN', 'oldestHouseholdResidentAge=UNKNOWN');
  if (oldest < HT_MINIMUM_AGE) {
    if (household.under18ExceptionGranted === true) {
      // explicit exception kept in the model; height still follows art. 21
    } else if (household.under18ExceptionGranted === false) {
      return fail('ZERO', 'UNDER_18_NO_RIGHT');
    } else {
      return fail('UNKNOWN', 'UNDER_18_EXCEPTION_UNKNOWN');
    }
  }

  const persons = housingPersonCount(household);
  const single = persons === 1;
  const youth = usesYouthCap(household, oldest);
  const cap = youth ? HT_CALC_CAP_YOUTH_CENTS : HT_CALC_CAP_NORMAL_CENTS;
  const calcRent = Math.min(input.bareRentCentsPerMonth, cap);
  const basishuur = single ? HT_BASISHUUR_SINGLE_CENTS : HT_BASISHUUR_MULTI_CENTS;
  const aftop =
    persons <= 2 ? HT_AFTOP_1_OR_2_CENTS : HT_AFTOP_3_PLUS_CENTS;
  const kkg = HT_QUALITY_THRESHOLD_CENTS;

  const slice1Base = Math.max(0, Math.min(calcRent, kkg) - basishuur);
  const slice2Base = Math.max(0, Math.min(calcRent, aftop) - kkg);
  const slice3Base = Math.max(0, Math.min(calcRent, cap) - aftop);

  const rawMonthlyScaled =
    fromCents(slice1Base) +
    mulRate(fromCents(slice2Base), HT_SLICE2_PCT.n, HT_SLICE2_PCT.d) +
    mulRate(fromCents(slice3Base), HT_SLICE3_PCT.n, HT_SLICE3_PCT.d);

  let householdIncome = 0;
  for (const r of household.residents) {
    const part = countableResidentIncomeCents(r);
    if (isUnknown(part)) return fail('UNKNOWN', 'residentAssessmentIncome=UNKNOWN');
    householdIncome += part;
  }

  const ijkpunt = single ? HT_MIN_IJKPUNT_SINGLE_CENTS : HT_MIN_IJKPUNT_MULTI_CENTS;
  const phase = single ? HT_PHASEOUT_SINGLE : HT_PHASEOUT_MULTI;
  const y = Math.max(0, householdIncome - ijkpunt);
  const reductionScaled = mulRate(
    mulRate(fromCents(y), phase.n, phase.d),
    BigInt(1),
    BigInt(12),
  );

  const monthlyCents = toCentsRoundHalfUp(
    max0Scaled(rawMonthlyScaled - reductionScaled),
  );
  const annualCents = monthlyCents * 12;

  return {
    status: monthlyCents === 0 ? 'ZERO' : 'OK',
    monthlyCents,
    annualCents,
    calculationRentCents: calcRent,
    reason: monthlyCents === 0 ? 'PHASED_OUT_OR_BELOW_BASISHUUR' : null,
    youthRegime: youth,
  };
}

export function housingAnnualOrUnknown(
  result: HousingAllowanceResult,
): CentsOrUnknown {
  return result.annualCents;
}
