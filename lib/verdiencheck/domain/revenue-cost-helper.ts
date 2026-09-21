/**
 * Optional omzet − aftrekbare kosten → extra resultaat.
 * Does not classify costs. Does not run tax. UNKNOWN costs are never 0.
 */

import { commercialResultCents, parseEuroInputToCents, type Cents } from './money';
import { UNKNOWN, isUnknown, type CentsOrUnknown } from './unknown';

/** Presentation example only. Never a personal tax outcome. */
export const EXAMPLE_REVENUE_CENTS = 1_000_000;
export const EXAMPLE_COSTS_CENTS = 400_000;
export const EXAMPLE_RESULT_CENTS = commercialResultCents(
  EXAMPLE_REVENUE_CENTS,
  EXAMPLE_COSTS_CENTS,
);

export const SCENARIO_INPUT_MODES = ['RESULT', 'REVENUE_COST'] as const;
export type ScenarioInputMode = (typeof SCENARIO_INPUT_MODES)[number];

export type RevenueCostHelperResult =
  | { status: 'INCOMPLETE'; resultCents: null; revenueCents: Cents | null; costsCents: CentsOrUnknown | null }
  | { status: 'UNKNOWN_COSTS'; resultCents: typeof UNKNOWN; revenueCents: Cents | null; costsCents: typeof UNKNOWN }
  | { status: 'NEGATIVE'; resultCents: Cents; revenueCents: Cents; costsCents: Cents }
  | { status: 'ZERO'; resultCents: 0; revenueCents: Cents; costsCents: Cents }
  | { status: 'OK'; resultCents: Cents; revenueCents: Cents; costsCents: Cents };

export function mapRevenueAndAllowableCosts(input: {
  revenueEuro: string;
  costsEuro: string;
  costsUnknown: boolean;
}): RevenueCostHelperResult {
  const revenue = parseEuroInputToCents(input.revenueEuro);
  if (input.costsUnknown) {
    return {
      status: 'UNKNOWN_COSTS',
      resultCents: UNKNOWN,
      revenueCents: revenue,
      costsCents: UNKNOWN,
    };
  }
  const costsRaw = input.costsEuro.trim();
  if (costsRaw === '') {
    return {
      status: 'INCOMPLETE',
      resultCents: null,
      revenueCents: revenue,
      costsCents: null,
    };
  }
  const costs = parseEuroInputToCents(input.costsEuro);
  if (revenue == null || costs == null) {
    return {
      status: 'INCOMPLETE',
      resultCents: null,
      revenueCents: revenue,
      costsCents: costs,
    };
  }
  const result = revenue - costs;
  if (result < 0) {
    return { status: 'NEGATIVE', resultCents: result, revenueCents: revenue, costsCents: costs };
  }
  if (result === 0) {
    return { status: 'ZERO', resultCents: 0, revenueCents: revenue, costsCents: costs };
  }
  return { status: 'OK', resultCents: result, revenueCents: revenue, costsCents: costs };
}

export function helperFeedsCertifiedEngine(mapped: RevenueCostHelperResult): mapped is Extract<
  RevenueCostHelperResult,
  { status: 'OK' }
> {
  return mapped.status === 'OK' && mapped.resultCents > 0 && !isUnknown(mapped.resultCents);
}
