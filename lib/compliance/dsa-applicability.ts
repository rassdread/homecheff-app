/**
 * LEGAL-4A — DSA applicability gate (Article 29 SME exclusion vs Article 30).
 *
 * Does NOT auto-declare legal micro/small status from runtime guesses.
 * Admin/configuration records a reviewed assessment only.
 */

export const DSA_APPLICABILITY_STATES = [
  'NOT_ASSESSED',
  'SME_EXCLUSION_EXPECTED',
  'ARTICLE_30_APPLIES',
  'COUNSEL_REVIEW_REQUIRED',
] as const;

export type DsaApplicabilityState =
  (typeof DSA_APPLICABILITY_STATES)[number];

export function isDsaApplicabilityState(
  v: unknown,
): v is DsaApplicabilityState {
  return (
    typeof v === 'string' &&
    (DSA_APPLICABILITY_STATES as readonly string[]).includes(v)
  );
}

export function parseDsaApplicabilityState(
  v: unknown,
): DsaApplicabilityState {
  return isDsaApplicabilityState(v) ? v : 'NOT_ASSESSED';
}

export type DsaApplicabilityAssessment = {
  state: DsaApplicabilityState;
  assessedAt: string | null;
  assessmentNote: string | null;
  reviewDueAt: string | null;
  updatedByUserId: string | null;
};

/** Full Art.30 trader pack onboarding is NOT active while SME exclusion is expected. */
export function article30OnboardingRequired(
  state: DsaApplicabilityState,
): boolean {
  return state === 'ARTICLE_30_APPLIES';
}

/**
 * Existing fields that MAY later feed Art.30 checks if applicability flips.
 * No ID copies / BSN / TIN / IBAN collection in LEGAL-4A.
 */
export const ARTICLE_30_REUSABLE_FIELD_KEYS = [
  'name',
  'address',
  'phone',
  'email',
  'companyName',
  'kvk',
  'vat',
  'businessRecord',
  'commerceDeclaration',
  'stripeConnectStatus',
] as const;
