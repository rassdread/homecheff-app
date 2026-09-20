/**
 * KOR is a VAT exemption for small entrepreneurs — not tax-free income,
 * not a KVK exemption, not a DAC7 exemption. One limit per ondernemer.
 */

import type { TriState } from './tri-state';
import type { CentsOrUnknown } from './unknown';

export const KOR_OUTCOMES = [
  'POTENTIALLY_ELIGIBLE',
  'NOT_ELIGIBLE',
  'ALREADY_PARTICIPATING',
  'REVIEW_REQUIRED',
] as const;

export type KorOutcome = (typeof KOR_OUTCOMES)[number];

export type KorActivityEligibility = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';

export type KorContext = {
  establishedInNetherlands: TriState;
  currentYearRelevantTurnoverCents: CentsOrUnknown | null;
  previousYearRelevantTurnoverCents: CentsOrUnknown | null;
  activityEligibility: KorActivityEligibility;
  currentlyParticipating: TriState;
};
