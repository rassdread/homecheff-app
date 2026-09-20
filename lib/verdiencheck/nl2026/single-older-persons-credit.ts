/**
 * Alleenstaandeouderenkorting 2026.
 * Eligibility is the official single-AOW condition, never hasPartner=false.
 */

import type { SingleOlderPersonsCreditEligibility } from '../domain/aow';
import { UNKNOWN, type CentsOrUnknown } from '../domain/unknown';
import { ALLEENSTAANDE_OUDERENKORTING_CENTS } from '../rulesets/nl/2026/personal-tax-parameters';

export function calculateSingleOlderPersonsTaxCredit2026(
  eligibility: SingleOlderPersonsCreditEligibility | null | undefined,
): CentsOrUnknown {
  if (eligibility == null || eligibility === 'UNKNOWN') return UNKNOWN;
  if (eligibility === 'NOT_ELIGIBLE') return 0;
  return ALLEENSTAANDE_OUDERENKORTING_CENTS;
}
