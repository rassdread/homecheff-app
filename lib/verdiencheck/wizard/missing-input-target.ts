/**
 * Map calculator missing inputs to the wizard step that can supply them.
 * The result CTA uses this so "Nog niet te berekenen" is never a dead end.
 */

import type { WizardStepId } from './schema';

const FISCAL_KEYS = [
  'baselineBox1TaxableIncomeCents',
  'baselineAggregateIncomeCents',
  'baselineArbeidsinkomenCents',
  'baselineZvwContributionIncomeAlreadyUsedCents',
  'baselineAssessmentIncomeCents',
] as const;

type Rule = {
  step: WizardStepId;
  match: (missing: readonly string[]) => boolean;
};

function hasKey(missing: readonly string[], key: string): boolean {
  return missing.some(
    (item) => item === key || item.startsWith(`${key}:`) || item.startsWith(`${key}.`),
  );
}

const RULES: readonly Rule[] = [
  {
    step: 'dutchHealthInsurance',
    match: (missing) => hasKey(missing, 'userHealthcareInsuranceStatus'),
  },
  {
    step: 'partner',
    match: (missing) => hasKey(missing, 'partnerContext.hasPartner'),
  },
  {
    step: 'partnerInsurance',
    match: (missing) => hasKey(missing, 'partnerHealthcareInsuranceStatus'),
  },
  {
    step: 'partnerIncome',
    match: (missing) => hasKey(missing, 'partnerAssessmentIncomeCents'),
  },
  {
    step: 'currentIncome',
    match: (missing) => FISCAL_KEYS.some((key) => hasKey(missing, key)),
  },
  {
    step: 'rentsHome',
    match: (missing) => hasKey(missing, 'housingTenure'),
  },
  {
    step: 'housingRent',
    match: (missing) => hasKey(missing, 'bareRentCentsPerMonth'),
  },
  {
    step: 'housingHousehold',
    match: (missing) =>
      hasKey(missing, 'housingHousehold') || missing.some((item) => item.startsWith('housing:')),
  },
  {
    step: 'hasChildren',
    match: (missing) => hasKey(missing, 'hasChildren'),
  },
  {
    step: 'children',
    match: (missing) => hasKey(missing, 'childBudgetHousehold'),
  },
  {
    step: 'childBudgetAssets',
    match: (missing) =>
      hasKey(missing, 'childBudgetAssetsEligibility') ||
      missing.some((item) => item.startsWith('childBudget:')),
  },
  {
    step: 'usesChildcare',
    match: (missing) => hasKey(missing, 'usesChildcare'),
  },
  {
    step: 'childcare',
    match: (missing) =>
      hasKey(missing, 'childcareHousehold') || missing.some((item) => item.startsWith('childcare:')),
  },
  {
    step: 'assets',
    match: (missing) => hasKey(missing, 'healthcareAssetsEligibility'),
  },
];

export function resolveVerdienCheckMissingStep(
  state: {
    advancedAccuracyRequested: boolean;
    currentIncomeUnknown: boolean;
    holidayPayUnresolved?: boolean;
  },
  missing: readonly string[],
): WizardStepId | null {
  if (state.holidayPayUnresolved || state.currentIncomeUnknown) return 'currentIncome';
  for (const rule of RULES) {
    if (!rule.match(missing)) continue;
    if (
      rule.step === 'currentIncome' &&
      state.advancedAccuracyRequested &&
      FISCAL_KEYS.some((key) => hasKey(missing, key))
    ) {
      return 'incomeBases';
    }
    return rule.step;
  }
  return null;
}
