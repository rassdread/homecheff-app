/**
 * Distinct income bases — never collapse into one “annualIncome”.
 */

export const AGE_TAX_REGIMES_2026 = [
  'BELOW_AOW_2026',
  'REACHES_AOW_IN_2026',
  'FULL_YEAR_AOW_2026',
] as const;

export type AgeTaxRegime2026 = (typeof AGE_TAX_REGIMES_2026)[number];

export const UNSUPPORTED_TAX_CREDIT_IDS = [
  'IACK',
  'JONGGEHANDICAPTENKORTING',
  'OUDERENKORTING',
  'ALLEENSTAANDE_OUDERENKORTING',
] as const;

export type UnsupportedTaxCreditId = (typeof UNSUPPORTED_TAX_CREDIT_IDS)[number];

export type IncomeBases = {
  baselineGrossEmploymentIncomeCents: number | null;
  baselineBox1TaxableIncomeCents: number | null;
  baselineAggregateIncomeCents: number | null;
  baselineArbeidsinkomenCents: number | null;
  baselineAssessmentIncomeCents: number | null;
  baselineZvwContributionIncomeAlreadyUsedCents: number | null;
  partnerAssessmentIncomeCents: number | null;
};

export const CALCULATION_ASSUMPTION_ROW =
  'Voor deze berekening gaan we ervan uit dat dit resultaat uit overig werk is.';

export const CALCULATION_ASSUMPTION_COSTS =
  'Voor deze berekening gaan we ervan uit dat de ingevulde kosten aftrekbaar zijn.';
