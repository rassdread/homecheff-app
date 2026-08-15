/**
 * LEGAL-4A — compliance axes contract.
 * Axes must never overwrite each other.
 */

export const COMPLIANCE_AXES = [
  'LEGAL_1_COMMERCE_DECLARATION',
  'LEGAL_2_FOOD_ALLERGENS',
  'LEGAL_3_CONSUMER_COMMERCE',
  'TRUST_1_INTEGRITY',
  'TRUST_1_1_CONTRIBUTION',
  'STRIPE_PAYMENT_KYC',
  'DSA_APPLICABILITY',
  'DAC7_REPORTING_READINESS',
] as const;

export type ComplianceAxis = (typeof COMPLIANCE_AXES)[number];

/** Forbidden mega-booleans — do not introduce these as SSOT. */
export const FORBIDDEN_COMPLIANCE_MEGA_FLAGS = [
  'isBusiness',
  'isCompliant',
  'isLegalTrader',
  'isTaxable',
  'isDsaTrader',
] as const;
