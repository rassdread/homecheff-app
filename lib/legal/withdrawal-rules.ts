/**
 * LEGAL-3 — withdrawal treatment registry (platform information layer).
 * Not a legal ruling; does not invent trader status.
 */

export const WITHDRAWAL_RULES = [
  'STANDARD_14_DAY',
  'CUSTOM_OR_PERSONALISED_EXCEPTION',
  'PERISHABLE_EXCEPTION',
  'FULLY_PERFORMED_SERVICE_EXCEPTION',
  'NOT_APPLICABLE_PRIVATE_C2C',
  'NOT_APPLICABLE_FREE',
  'REQUIRES_REVIEW',
] as const;

export type WithdrawalRule = (typeof WITHDRAWAL_RULES)[number];

export function isWithdrawalRule(v: unknown): v is WithdrawalRule {
  return (
    typeof v === 'string' &&
    (WITHDRAWAL_RULES as readonly string[]).includes(v)
  );
}
