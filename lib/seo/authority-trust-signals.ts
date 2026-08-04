/**
 * Phase 2.2 — Public policy URLs for Organization trust / E-E-A-T signals.
 * Only link pages that already exist and are truthful.
 */

export const AUTHORITY_POLICY_PATHS = {
  publishingPrinciples: '/manifest',
  ethicsPolicy: '/community-guidelines',
  diversityPolicy: '/principles',
  correctionsPolicy: '/trust',
  privacyPolicy: '/privacy',
  safetyPolicy: '/safety',
  termsOfService: '/terms',
  about: '/over-ons',
  ownership: '/constitution',
} as const;

export function absoluteAuthorityPolicyUrls(domain: string): Record<keyof typeof AUTHORITY_POLICY_PATHS, string> {
  const base = domain.replace(/\/$/, '');
  return {
    publishingPrinciples: `${base}${AUTHORITY_POLICY_PATHS.publishingPrinciples}`,
    ethicsPolicy: `${base}${AUTHORITY_POLICY_PATHS.ethicsPolicy}`,
    diversityPolicy: `${base}${AUTHORITY_POLICY_PATHS.diversityPolicy}`,
    correctionsPolicy: `${base}${AUTHORITY_POLICY_PATHS.correctionsPolicy}`,
    privacyPolicy: `${base}${AUTHORITY_POLICY_PATHS.privacyPolicy}`,
    safetyPolicy: `${base}${AUTHORITY_POLICY_PATHS.safetyPolicy}`,
    termsOfService: `${base}${AUTHORITY_POLICY_PATHS.termsOfService}`,
    about: `${base}${AUTHORITY_POLICY_PATHS.about}`,
    ownership: `${base}${AUTHORITY_POLICY_PATHS.ownership}`,
  };
}
