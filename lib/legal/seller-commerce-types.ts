/**
 * LEGAL-1 — HomeCheff seller commerce classification (platform state, not legal rulings).
 * Do not add isLegalTrader / consumerLawApplies here.
 */

export const SELLER_COMMERCE_DECLARATIONS = [
  'UNDECLARED',
  'PRIVATE_OCCASIONAL',
  'SELF_DECLARED_PROFESSIONAL',
] as const;

export type SellerCommerceDeclaration =
  (typeof SELLER_COMMERCE_DECLARATIONS)[number];

export const SELLER_COMMERCE_REVIEW_STATES = [
  'NONE',
  'REVIEW_REQUIRED',
  'UNDER_REVIEW',
  'REVIEWED',
] as const;

export type SellerCommerceReviewState =
  (typeof SELLER_COMMERCE_REVIEW_STATES)[number];

export const SELLER_COMMERCE_REVIEW_REASONS = [
  'KVK_PRESENT',
  'VAT_PRESENT',
  'COMPANY_NAME_PRESENT',
  'BUSINESS_RECORD_PRESENT',
  'STRIPE_CONNECT_PRESENT',
  'STRIPE_BUSINESS_TYPE_COMPANY',
  'BUSINESS_SUBSCRIPTION',
  'RECURRING_PAID_LISTINGS',
  'FOOD_ACTIVITY',
  'SERVICE_ACTIVITY',
] as const;

export type SellerCommerceReviewReason =
  (typeof SELLER_COMMERCE_REVIEW_REASONS)[number];

export type SellerCommerceActivities = {
  food: boolean;
  services: boolean;
};

/** Public-safe label keys — never expose review/internal reasons. */
export type SellerCommercePublicLabel =
  | 'particulier'
  | 'zakelijke_aanbieder'
  | 'geverifieerd_bedrijf'
  | null;

export type SellerCommerceContext = {
  declaration: SellerCommerceDeclaration;
  declaredAt: string | null;
  reviewState: SellerCommerceReviewState;
  reviewRequiredAt: string | null;
  /** Internal only — never serialize to public listing/feed payloads. */
  reviewReasons: SellerCommerceReviewReason[];
  registeredBusinessInfoPresent: boolean;
  verifiedBusiness: boolean;
  activities: SellerCommerceActivities;
  publicLabel: SellerCommercePublicLabel;
};

export function isSellerCommerceDeclaration(
  v: unknown,
): v is SellerCommerceDeclaration {
  return (
    typeof v === 'string' &&
    (SELLER_COMMERCE_DECLARATIONS as readonly string[]).includes(v)
  );
}

export function isSelectableCommerceDeclaration(
  v: unknown,
): v is Exclude<SellerCommerceDeclaration, 'UNDECLARED'> {
  return v === 'PRIVATE_OCCASIONAL' || v === 'SELF_DECLARED_PROFESSIONAL';
}

export function parseSellerCommerceDeclaration(
  v: unknown,
): SellerCommerceDeclaration {
  return isSellerCommerceDeclaration(v) ? v : 'UNDECLARED';
}

export function parseSellerCommerceReviewState(
  v: unknown,
): SellerCommerceReviewState {
  return typeof v === 'string' &&
    (SELLER_COMMERCE_REVIEW_STATES as readonly string[]).includes(v)
    ? (v as SellerCommerceReviewState)
    : 'NONE';
}
