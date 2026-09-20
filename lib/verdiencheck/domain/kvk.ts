/**
 * KVK entrepreneurship is not income-tax entrepreneurship and not VAT entrepreneurship.
 * No isEntrepreneur mega-flag. No omzetdrempel.
 */

import type { ActivityContext } from './activity';
import type { TriState } from './tri-state';

export type KvkPrimaryCriteria = {
  independentlySuppliesGoodsOrServices: TriState;
  chargesWithEarningIntent: TriState;
  regularlySuppliesOutsideFamilyFriends: TriState;
};

export type KvkSupportingFactors = {
  investsTimeOrMoney: TriState;
  regularAndLongerTermActivity: TriState;
  multipleCustomersOrAcquisition: TriState;
  independentlyDeterminesWork: TriState;
};

export const KVK_ASSESSMENTS = [
  'CLEAR_REGISTRATION_INDICATION',
  'CLEAR_NON_BUSINESS_INDICATION',
  'REVIEW_RECOMMENDED',
  'INSUFFICIENT_INFORMATION',
] as const;

export type KvkEntrepreneurshipAssessment = (typeof KVK_ASSESSMENTS)[number];

export type KvkContext = {
  primary: KvkPrimaryCriteria;
  supporting: KvkSupportingFactors;
  alreadyRegistered: TriState;
};

function allYes(values: readonly TriState[]): boolean {
  return values.every((v) => v === 'YES');
}

function anyUnknown(values: readonly TriState[]): boolean {
  return values.some((v) => v === 'UNKNOWN');
}

export function deriveKvkPrimaryFromActivity(
  activity: ActivityContext,
): KvkPrimaryCriteria {
  const independently: TriState =
    activity.independence === true
      ? 'YES'
      : activity.independence === false
        ? 'NO'
        : 'UNKNOWN';

  let charges: TriState = 'UNKNOWN';
  if (activity.commercialIntent === 'HOBBY_COST_RECOVERY') charges = 'NO';
  else if (
    activity.commercialIntent === 'SIDE_INCOME' ||
    activity.commercialIntent === 'SERIOUS_SIDE_INCOME' ||
    activity.commercialIntent === 'BUILD_BUSINESS'
  ) {
    charges = 'YES';
  }

  let regularOutside: TriState = 'UNKNOWN';
  if (activity.customers === 'PRIVATE_CIRCLE') regularOutside = 'NO';
  else if (activity.frequency === 'ONE_OFF') regularOutside = 'NO';
  else if (
    activity.frequency === 'REGULAR' &&
    (activity.customers === 'PUBLIC' || activity.customers === 'MIXED')
  ) {
    regularOutside = 'YES';
  }

  return {
    independentlySuppliesGoodsOrServices: independently,
    chargesWithEarningIntent: charges,
    regularlySuppliesOutsideFamilyFriends: regularOutside,
  };
}

export function deriveKvkSupportingFromActivity(
  activity: ActivityContext,
): KvkSupportingFactors {
  return {
    investsTimeOrMoney:
      activity.timeOrMoneyInvested === true
        ? 'YES'
        : activity.timeOrMoneyInvested === false
          ? 'NO'
          : 'UNKNOWN',
    regularAndLongerTermActivity:
      activity.continuity === true
        ? 'YES'
        : activity.continuity === false
          ? 'NO'
          : 'UNKNOWN',
    multipleCustomersOrAcquisition:
      activity.customers === 'PUBLIC' &&
      (activity.frequency === 'REGULAR' ||
        (activity.transactionCount != null && activity.transactionCount > 1))
        ? 'YES'
        : activity.customers === 'PRIVATE_CIRCLE'
          ? 'NO'
          : 'UNKNOWN',
    independentlyDeterminesWork:
      activity.independence === true
        ? 'YES'
        : activity.independence === false
          ? 'NO'
          : 'UNKNOWN',
  };
}

/**
 * Official KVK: register when all three primary criteria are YES.
 * All four helper questions YES also indicates registration.
 * No probability score. Turnover is not an input.
 */
export function assessKvkEntrepreneurship(input: {
  primary: KvkPrimaryCriteria;
  supporting?: KvkSupportingFactors;
}): KvkEntrepreneurshipAssessment {
  const primaryValues: TriState[] = [
    input.primary.independentlySuppliesGoodsOrServices,
    input.primary.chargesWithEarningIntent,
    input.primary.regularlySuppliesOutsideFamilyFriends,
  ];

  if (allYes(primaryValues)) return 'CLEAR_REGISTRATION_INDICATION';

  if (input.supporting && allYes(Object.values(input.supporting))) {
    return 'CLEAR_REGISTRATION_INDICATION';
  }

  const clearlyHobby =
    input.primary.chargesWithEarningIntent === 'NO' ||
    input.primary.regularlySuppliesOutsideFamilyFriends === 'NO' ||
    input.primary.independentlySuppliesGoodsOrServices === 'NO';

  if (clearlyHobby && !primaryValues.includes('YES')) {
    return 'CLEAR_NON_BUSINESS_INDICATION';
  }
  if (
    input.primary.chargesWithEarningIntent === 'NO' &&
    input.primary.regularlySuppliesOutsideFamilyFriends === 'NO'
  ) {
    return 'CLEAR_NON_BUSINESS_INDICATION';
  }
  if (
    input.primary.regularlySuppliesOutsideFamilyFriends === 'NO' &&
    input.primary.independentlySuppliesGoodsOrServices !== 'YES'
  ) {
    return 'CLEAR_NON_BUSINESS_INDICATION';
  }
  if (input.primary.regularlySuppliesOutsideFamilyFriends === 'NO') {
    return 'CLEAR_NON_BUSINESS_INDICATION';
  }

  if (anyUnknown(primaryValues)) return 'INSUFFICIENT_INFORMATION';

  return 'REVIEW_RECOMMENDED';
}

export function kvkRegistrationObliged(
  assessment: KvkEntrepreneurshipAssessment,
): TriState {
  if (assessment === 'CLEAR_REGISTRATION_INDICATION') return 'YES';
  if (assessment === 'CLEAR_NON_BUSINESS_INDICATION') return 'NO';
  return 'UNKNOWN';
}
