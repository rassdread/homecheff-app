/**
 * AOW tax-regime domain for NL 2026. Birth cohort and transition month
 * are fiscal inputs, never inferred from a public anonymous dateOfBirth.
 */

export const AOW_BIRTH_COHORTS_2026 = [
  'BORN_BEFORE_1946',
  'BORN_ON_OR_AFTER_1946',
] as const;

export type AowBirthCohort2026 = (typeof AOW_BIRTH_COHORTS_2026)[number];

export const AOW_MONTHS_2026 = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const;

export type AowMonth2026 = (typeof AOW_MONTHS_2026)[number];

export const SINGLE_OLDER_PERSONS_CREDIT_ELIGIBILITY = [
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'UNKNOWN',
] as const;

export type SingleOlderPersonsCreditEligibility =
  (typeof SINGLE_OLDER_PERSONS_CREDIT_ELIGIBILITY)[number];

export const OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED =
  'OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED';

export type TransitionYearUnknownReason =
  typeof OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED;
