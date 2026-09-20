/**
 * Compose certified personal-tax components for one situation snapshot.
 * Transition-year heffingskortingen stay UNKNOWN unless an official formula exists.
 */

import type { AgeTaxRegime2026 } from '../domain/income-bases';
import type {
  AowBirthCohort2026,
  AowMonth2026,
  SingleOlderPersonsCreditEligibility,
} from '../domain/aow';
import { OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED } from '../domain/aow';
import { resolveIackEligibility2026, type IackContext } from '../domain/iack';
import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import {
  calculateBox1Tax2026BelowAow,
  calculateBox1Tax2026FullYearAow,
  calculateBox1Tax2026ReachesAow,
} from './box1';
import {
  calculateGeneralTaxCredit2026BelowAow,
  calculateGeneralTaxCredit2026FullYearAow,
} from './general-tax-credit';
import {
  calculateEmploymentTaxCredit2026BelowAow,
  calculateEmploymentTaxCredit2026FullYearAow,
} from './employment-tax-credit';
import { calculateIack2026BelowAow, calculateIack2026FullYearAow } from './iack';
import { calculateOlderPersonsTaxCredit2026 } from './older-persons-credit';
import { calculateSingleOlderPersonsTaxCredit2026 } from './single-older-persons-credit';
import { netIncomeTaxAfterCredits } from './net-income-tax';
import { IACK_ZERO_THROUGH_CENTS } from '../rulesets/nl/2026/personal-tax-parameters';

export type PersonalTaxSlice = {
  taxBeforeCredits: CentsOrUnknown;
  generalTaxCredit: CentsOrUnknown;
  employmentTaxCredit: CentsOrUnknown;
  iack: CentsOrUnknown;
  olderPersonsTaxCredit: CentsOrUnknown;
  singleOlderPersonsTaxCredit: CentsOrUnknown;
  incomeTaxAfterCredits: CentsOrUnknown;
  missingInputs: string[];
  assumptions: string[];
};

function resolveIackAmount(input: {
  regime: AgeTaxRegime2026;
  context: IackContext | null | undefined;
  arbeidsinkomenCents: number;
}): { amount: CentsOrUnknown; missing: string[] } {
  if (!input.context) {
    return { amount: 0, missing: [] };
  }
  if (input.regime === 'REACHES_AOW_IN_2026') {
    return {
      amount: UNKNOWN,
      missing: [`iack:${OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED}`],
    };
  }
  const eligibility = resolveIackEligibility2026({
    context: input.context,
    userArbeidsinkomenCents: input.arbeidsinkomenCents,
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  if (eligibility.status === 'UNKNOWN') {
    return { amount: UNKNOWN, missing: [`iack:${eligibility.reason ?? 'UNKNOWN'}`] };
  }
  if (eligibility.status === 'NOT_ELIGIBLE') {
    return { amount: 0, missing: [] };
  }
  const amount =
    input.regime === 'FULL_YEAR_AOW_2026'
      ? calculateIack2026FullYearAow(input.arbeidsinkomenCents)
      : calculateIack2026BelowAow(input.arbeidsinkomenCents);
  return { amount, missing: [] };
}

export function calculatePersonalTax2026(input: {
  regime: AgeTaxRegime2026;
  aowBirthCohort?: AowBirthCohort2026 | null;
  aowMonth?: AowMonth2026 | null;
  box1Cents: number;
  aggregateCents: number;
  arbeidsinkomenCents: number;
  iackContext?: IackContext | null;
  singleOlderPersonsCreditEligibility?: SingleOlderPersonsCreditEligibility | null;
}): PersonalTaxSlice {
  const missingInputs: string[] = [];
  const assumptions: string[] = [];
  let taxBefore: CentsOrUnknown = UNKNOWN;
  let ahk: CentsOrUnknown = UNKNOWN;
  let ak: CentsOrUnknown = UNKNOWN;
  let older: CentsOrUnknown = 0;
  let singleOlder: CentsOrUnknown = 0;

  if (input.regime === 'BELOW_AOW_2026') {
    taxBefore = calculateBox1Tax2026BelowAow(input.box1Cents);
    ahk = calculateGeneralTaxCredit2026BelowAow(input.aggregateCents);
    ak = calculateEmploymentTaxCredit2026BelowAow(input.arbeidsinkomenCents);
    older = 0;
    singleOlder = 0;
  } else if (input.regime === 'FULL_YEAR_AOW_2026') {
    if (!input.aowBirthCohort) {
      missingInputs.push('aowBirthCohort');
    } else {
      taxBefore = calculateBox1Tax2026FullYearAow(
        input.box1Cents,
        input.aowBirthCohort,
      );
    }
    ahk = calculateGeneralTaxCredit2026FullYearAow(input.aggregateCents);
    ak = calculateEmploymentTaxCredit2026FullYearAow(input.arbeidsinkomenCents);
    older = calculateOlderPersonsTaxCredit2026(input.aggregateCents);
    singleOlder = calculateSingleOlderPersonsTaxCredit2026(
      input.singleOlderPersonsCreditEligibility,
    );
    if (
      input.singleOlderPersonsCreditEligibility == null ||
      input.singleOlderPersonsCreditEligibility === 'UNKNOWN'
    ) {
      missingInputs.push('singleOlderPersonsCreditEligibility');
    }
  } else {
    if (!input.aowMonth) {
      missingInputs.push('aowMonth');
    } else {
      taxBefore = calculateBox1Tax2026ReachesAow(input.box1Cents, input.aowMonth);
    }
    ahk = UNKNOWN;
    ak = UNKNOWN;
    missingInputs.push(`generalTaxCredit:${OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED}`);
    missingInputs.push(`employmentTaxCredit:${OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED}`);
    older = calculateOlderPersonsTaxCredit2026(input.aggregateCents);
    singleOlder = calculateSingleOlderPersonsTaxCredit2026(
      input.singleOlderPersonsCreditEligibility,
    );
    if (
      input.singleOlderPersonsCreditEligibility == null ||
      input.singleOlderPersonsCreditEligibility === 'UNKNOWN'
    ) {
      missingInputs.push('singleOlderPersonsCreditEligibility');
    }
    assumptions.push(OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED);
  }

  const iack = resolveIackAmount({
    regime: input.regime,
    context: input.iackContext,
    arbeidsinkomenCents: input.arbeidsinkomenCents,
  });
  missingInputs.push(...iack.missing);

  let incomeTax: CentsOrUnknown = UNKNOWN;
  if (
    typeof taxBefore === 'number' &&
    typeof ahk === 'number' &&
    typeof ak === 'number' &&
    typeof iack.amount === 'number' &&
    typeof older === 'number' &&
    typeof singleOlder === 'number'
  ) {
    incomeTax = netIncomeTaxAfterCredits({
      taxBeforeCreditsCents: taxBefore,
      generalTaxCreditCents: ahk,
      employmentTaxCreditCents: ak,
      additionalCreditsCents: iack.amount + older + singleOlder,
    });
  }

  return {
    taxBeforeCredits: taxBefore,
    generalTaxCredit: ahk,
    employmentTaxCredit: ak,
    iack: iack.amount,
    olderPersonsTaxCredit: older,
    singleOlderPersonsTaxCredit: singleOlder,
    incomeTaxAfterCredits: incomeTax,
    missingInputs,
    assumptions,
  };
}

export function isUnknownMaterialPersonalTax(slice: PersonalTaxSlice): boolean {
  return (
    isUnknown(slice.incomeTaxAfterCredits) ||
    isUnknown(slice.generalTaxCredit) ||
    isUnknown(slice.employmentTaxCredit) ||
    isUnknown(slice.iack) ||
    isUnknown(slice.olderPersonsTaxCredit) ||
    isUnknown(slice.singleOlderPersonsTaxCredit)
  );
}
