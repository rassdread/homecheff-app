/**
 * VAT entrepreneurship is assessed separately from KVK and income tax.
 * The €2.200 figure is only the small-entrepreneur registration threshold.
 */

import type { ActivityContext } from './activity';
import type { TriState } from './tri-state';
import { UNKNOWN, isUnknown, type CentsOrUnknown } from './unknown';

export const VAT_ENTREPRENEURSHIP_ASSESSMENTS = [
  'CLEAR_VAT_ENTREPRENEUR_INDICATION',
  'CLEAR_NON_VAT_ENTREPRENEUR_INDICATION',
  'VAT_ENTREPRENEURSHIP_REVIEW_REQUIRED',
] as const;

export type VatEntrepreneurshipAssessment =
  (typeof VAT_ENTREPRENEURSHIP_ASSESSMENTS)[number];

export type VatEntrepreneurshipContext = {
  independentlyPracticesBusinessOrProfession: TriState;
  regularIncomeFromActivities: TriState;
  regularlySellsGoodsViaInternet: TriState;
  exploitsAssetOrRight: TriState;
};

export const VAT_REGISTRATION_THRESHOLD_ELIGIBILITY = [
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'UNKNOWN',
] as const;

export type VatRegistrationThresholdEligibility =
  (typeof VAT_REGISTRATION_THRESHOLD_ELIGIBILITY)[number];

export type VatTurnoverInput = {
  homeCheffVatTurnoverCents: number | null;
  otherRelevantVatTurnoverCents: CentsOrUnknown | null;
};

export function totalRelevantVatTurnoverCents(
  input: VatTurnoverInput,
): CentsOrUnknown {
  if (input.homeCheffVatTurnoverCents == null) return UNKNOWN;
  if (
    input.otherRelevantVatTurnoverCents == null ||
    isUnknown(input.otherRelevantVatTurnoverCents)
  ) {
    return UNKNOWN;
  }
  return input.homeCheffVatTurnoverCents + input.otherRelevantVatTurnoverCents;
}

export function deriveVatEntrepreneurshipContext(
  activity: ActivityContext,
): VatEntrepreneurshipContext {
  const independently: TriState =
    activity.independence === true
      ? 'YES'
      : activity.independence === false
        ? 'NO'
        : 'UNKNOWN';
  const regularIncome: TriState =
    activity.frequency === 'REGULAR'
      ? 'YES'
      : activity.frequency === 'ONE_OFF'
        ? 'NO'
        : 'UNKNOWN';
  const internetGoods: TriState =
    activity.kinds.includes('PRODUCT') || activity.kinds.includes('FOOD')
      ? activity.frequency === 'REGULAR' && activity.customers !== 'PRIVATE_CIRCLE'
        ? 'YES'
        : activity.frequency === 'ONE_OFF'
          ? 'NO'
          : 'UNKNOWN'
      : 'NO';
  return {
    independentlyPracticesBusinessOrProfession: independently,
    regularIncomeFromActivities: regularIncome,
    regularlySellsGoodsViaInternet: internetGoods,
    exploitsAssetOrRight: 'UNKNOWN',
  };
}

export function assessVatEntrepreneurship(
  ctx: VatEntrepreneurshipContext,
): VatEntrepreneurshipAssessment {
  if (
    ctx.regularlySellsGoodsViaInternet === 'YES' &&
    ctx.independentlyPracticesBusinessOrProfession !== 'NO'
  ) {
    return 'CLEAR_VAT_ENTREPRENEUR_INDICATION';
  }
  if (
    ctx.independentlyPracticesBusinessOrProfession === 'YES' &&
    ctx.regularIncomeFromActivities === 'YES'
  ) {
    return 'CLEAR_VAT_ENTREPRENEUR_INDICATION';
  }
  if (
    ctx.regularIncomeFromActivities === 'NO' &&
    ctx.regularlySellsGoodsViaInternet === 'NO' &&
    ctx.exploitsAssetOrRight !== 'YES'
  ) {
    return 'CLEAR_NON_VAT_ENTREPRENEUR_INDICATION';
  }
  return 'VAT_ENTREPRENEURSHIP_REVIEW_REQUIRED';
}
