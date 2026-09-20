/**
 * IACK is an inkomstenbelasting heffingskorting.
 * Not kindgebonden budget, not kinderopvangtoeslag, not KGB ALO-kop.
 */

export const IACK_CO_PARENT_STATUS = [
  'HOUSEHOLD_MEMBER',
  'QUALIFYING_CO_PARENT',
  'NOT_QUALIFYING',
  'UNKNOWN',
] as const;

export type IackCoParentStatus = (typeof IACK_CO_PARENT_STATUS)[number];

export const IACK_HOUSEHOLD_DURATION = [
  'AT_LEAST_6_MONTHS',
  'LESS_THAN_6_MONTHS',
  'UNKNOWN',
] as const;

export type IackHouseholdDuration = (typeof IACK_HOUSEHOLD_DURATION)[number];

export const FISCAL_PARTNER_DURATION = [
  'NONE',
  'LESS_THAN_6_MONTHS',
  'MORE_THAN_6_MONTHS',
  'UNKNOWN',
] as const;

export type FiscalPartnerDuration = (typeof FISCAL_PARTNER_DURATION)[number];

export const IACK_RELATIVE_AGE = ['USER_OLDER', 'PARTNER_OLDER', 'UNKNOWN'] as const;

export type IackRelativeAge = (typeof IACK_RELATIVE_AGE)[number];

export const IACK_ELIGIBILITY = ['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as const;

export type IackEligibility = (typeof IACK_ELIGIBILITY)[number];

export type IackChild = {
  bornAfter2013_12_31: boolean | 'UNKNOWN';
  childUnder12On2026_01_01: boolean | 'UNKNOWN';
  householdDurationEligibility: IackHouseholdDuration;
  coParentEligibility: IackCoParentStatus;
};

export type IackContext = {
  children: readonly IackChild[];
  fiscalPartnerDuration: FiscalPartnerDuration;
  partnerArbeidsinkomenCents: number | null;
  relativeAge: IackRelativeAge | null;
};

export function iackChildFromAgeOn1Jan2026(input: {
  ageYears: number | null;
  householdDurationEligibility: IackHouseholdDuration;
  coParentEligibility: IackCoParentStatus;
}): IackChild {
  if (input.ageYears == null) {
    return {
      bornAfter2013_12_31: 'UNKNOWN',
      childUnder12On2026_01_01: 'UNKNOWN',
      householdDurationEligibility: input.householdDurationEligibility,
      coParentEligibility: input.coParentEligibility,
    };
  }
  const under12 = input.ageYears < 12;
  return {
    bornAfter2013_12_31: under12,
    childUnder12On2026_01_01: under12,
    householdDurationEligibility: input.householdDurationEligibility,
    coParentEligibility: input.coParentEligibility,
  };
}

function childQualifies(child: IackChild): IackEligibility {
  if (
    child.bornAfter2013_12_31 === false ||
    child.childUnder12On2026_01_01 === false
  ) {
    return 'NOT_ELIGIBLE';
  }
  if (
    child.bornAfter2013_12_31 === 'UNKNOWN' ||
    child.childUnder12On2026_01_01 === 'UNKNOWN'
  ) {
    return 'UNKNOWN';
  }

  if (child.householdDurationEligibility === 'AT_LEAST_6_MONTHS') {
    return 'ELIGIBLE';
  }
  if (child.coParentEligibility === 'QUALIFYING_CO_PARENT') {
    return 'ELIGIBLE';
  }
  if (child.coParentEligibility === 'HOUSEHOLD_MEMBER') {
    if (child.householdDurationEligibility === 'LESS_THAN_6_MONTHS') {
      return 'NOT_ELIGIBLE';
    }
    return 'UNKNOWN';
  }
  if (
    child.householdDurationEligibility === 'UNKNOWN' ||
    child.coParentEligibility === 'UNKNOWN'
  ) {
    return 'UNKNOWN';
  }
  return 'NOT_ELIGIBLE';
}

function qualifyingChildStatus(children: readonly IackChild[]): IackEligibility {
  if (children.length === 0) return 'NOT_ELIGIBLE';
  let sawUnknown = false;
  for (const child of children) {
    const status = childQualifies(child);
    if (status === 'ELIGIBLE') return 'ELIGIBLE';
    if (status === 'UNKNOWN') sawUnknown = true;
  }
  return sawUnknown ? 'UNKNOWN' : 'NOT_ELIGIBLE';
}

/**
 * Eligibility only. Amount is a separate function.
 * Partner missing data never assumes a comparison outcome.
 */
export function resolveIackEligibility2026(input: {
  context: IackContext | null | undefined;
  userArbeidsinkomenCents: number;
  incomeThresholdCents: number;
}): { status: IackEligibility; reason: string | null } {
  if (!input.context) {
    return { status: 'NOT_ELIGIBLE', reason: 'IACK_NOT_IN_SCOPE' };
  }
  const childStatus = qualifyingChildStatus(input.context.children);
  if (childStatus === 'NOT_ELIGIBLE') {
    return { status: 'NOT_ELIGIBLE', reason: 'NO_QUALIFYING_CHILD_FOR_IACK' };
  }
  if (childStatus === 'UNKNOWN') {
    return { status: 'UNKNOWN', reason: 'QUALIFYING_CHILD_UNKNOWN' };
  }
  if (input.userArbeidsinkomenCents <= input.incomeThresholdCents) {
    return { status: 'NOT_ELIGIBLE', reason: 'ARBEIDSINKOMEN_AT_OR_BELOW_THRESHOLD' };
  }

  const duration = input.context.fiscalPartnerDuration;
  if (duration === 'UNKNOWN') {
    return { status: 'UNKNOWN', reason: 'FISCAL_PARTNER_DURATION_UNKNOWN' };
  }
  if (duration === 'NONE' || duration === 'LESS_THAN_6_MONTHS') {
    return { status: 'ELIGIBLE', reason: null };
  }

  const partnerIncome = input.context.partnerArbeidsinkomenCents;
  if (partnerIncome == null) {
    return { status: 'UNKNOWN', reason: 'PARTNER_ARBEIDSINKOMEN_UNKNOWN' };
  }
  if (input.userArbeidsinkomenCents < partnerIncome) {
    return { status: 'ELIGIBLE', reason: null };
  }
  if (input.userArbeidsinkomenCents > partnerIncome) {
    return { status: 'NOT_ELIGIBLE', reason: 'USER_ARBEIDSINKOMEN_HIGHER_THAN_PARTNER' };
  }
  const relative = input.context.relativeAge;
  if (relative == null || relative === 'UNKNOWN') {
    return { status: 'UNKNOWN', reason: 'EQUAL_INCOME_TIE_BREAK_UNKNOWN' };
  }
  if (relative === 'USER_OLDER') {
    return { status: 'ELIGIBLE', reason: null };
  }
  return { status: 'NOT_ELIGIBLE', reason: 'EQUAL_INCOME_PARTNER_OLDER' };
}
