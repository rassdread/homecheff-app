/**
 * Product principles for VerdienCheck / VerdienWijzer.
 * Fase 5 UX-orchestrator must enforce these. 4C encodes them in domain + tests.
 */

export const HOMECHEFF_GUIDANCE_PRINCIPLE =
  'BEGINNEN MOGELIJK MAKEN, GROEI BEGELEIDEN';

export const LEGAL_GUIDANCE_PRINCIPLE = 'BEGELEIDEN, NIET BEWAKEN';

export const ASSESSMENT_ORDER =
  'INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION';

export const GUIDANCE_TIMINGS = ['NOW', 'SOON', 'LATER'] as const;
export type GuidanceTiming = (typeof GUIDANCE_TIMINGS)[number];
