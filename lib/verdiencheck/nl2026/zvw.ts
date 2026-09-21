import {
  fromCents,
  max0Scaled,
  minScaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  ZVW_MAX_CONTRIBUTION_INCOME_CENTS,
  ZVW_RATE,
} from '../rulesets/nl/2026/core-constants';

/**
 * Extra-ROW Zvw charges only remaining room under the 2026 contribution-income cap.
 * `baselineZvwContributionIncomeAlreadyUsedCents` is contribution income already
 * consumed (typically derived fiscal/employment wage on the employee path).
 * It is not a generic annualIncome copy and not the Zvw euro amount itself.
 * Certified 2026 rates/formulas are unchanged.
 */
export function calculateAdditionalZvw2026(input: {
  positiveTaxableRowCents: number;
  baselineZvwContributionIncomeAlreadyUsedCents: number;
}): {
  remainingRoomCents: number;
  additionalBaseCents: number;
  additionalZvwCents: number;
} {
  const { positiveTaxableRowCents, baselineZvwContributionIncomeAlreadyUsedCents } =
    input;
  if (
    !Number.isInteger(positiveTaxableRowCents) ||
    !Number.isInteger(baselineZvwContributionIncomeAlreadyUsedCents)
  ) {
    throw new Error('Zvw inputs must be integer cents');
  }
  if (positiveTaxableRowCents < 0) {
    throw new Error('positiveTaxableRowCents must be >= 0');
  }
  if (baselineZvwContributionIncomeAlreadyUsedCents < 0) {
    throw new Error('baseline Zvw income used must be >= 0');
  }

  const maxIncome = fromCents(ZVW_MAX_CONTRIBUTION_INCOME_CENTS);
  const used = fromCents(baselineZvwContributionIncomeAlreadyUsedCents);
  const remaining = max0Scaled(maxIncome - used);
  const row = fromCents(positiveTaxableRowCents);
  const base = minScaled(row, remaining);
  const contrib = mulRate(base, ZVW_RATE.n, ZVW_RATE.d);
  return {
    remainingRoomCents: toCentsRoundHalfUp(remaining),
    additionalBaseCents: toCentsRoundHalfUp(base),
    additionalZvwCents: toCentsRoundHalfUp(contrib),
  };
}
