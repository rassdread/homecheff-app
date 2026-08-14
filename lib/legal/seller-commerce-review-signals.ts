/**
 * LEGAL-1 — review signals only.
 * Signals may set REVIEW_REQUIRED; they must NEVER set SELF_DECLARED_PROFESSIONAL.
 */

import type {
  SellerCommerceDeclaration,
  SellerCommerceReviewReason,
  SellerCommerceReviewState,
} from './seller-commerce-types';

export type ReviewSignalInput = {
  declaration: SellerCommerceDeclaration;
  reviewState: SellerCommerceReviewState;
  kvk?: string | null;
  btw?: string | null;
  companyName?: string | null;
  hasBusinessRecord?: boolean;
  stripeConnectAccountId?: string | null;
  /** From Stripe account.business_type when known — never used to set declaration. */
  stripeBusinessType?: string | null;
  hasBusinessSubscription?: boolean;
  paidListingCount?: number;
  foodActivity?: boolean;
  serviceActivity?: boolean;
};

/** Operational only — not a legal trader threshold / not DAC7. */
export const REVIEW_PAID_LISTING_SIGNAL_COUNT = 5;

export function collectCommerceReviewReasons(
  input: ReviewSignalInput,
): SellerCommerceReviewReason[] {
  const reasons: SellerCommerceReviewReason[] = [];
  if (input.kvk?.trim()) reasons.push('KVK_PRESENT');
  if (input.btw?.trim()) reasons.push('VAT_PRESENT');
  if (input.companyName?.trim()) reasons.push('COMPANY_NAME_PRESENT');
  if (input.hasBusinessRecord) reasons.push('BUSINESS_RECORD_PRESENT');
  if (input.stripeConnectAccountId?.trim()) {
    reasons.push('STRIPE_CONNECT_PRESENT');
  }
  const bt = (input.stripeBusinessType || '').toLowerCase();
  if (bt === 'company') reasons.push('STRIPE_BUSINESS_TYPE_COMPANY');
  if (input.hasBusinessSubscription) reasons.push('BUSINESS_SUBSCRIPTION');
  if ((input.paidListingCount ?? 0) >= REVIEW_PAID_LISTING_SIGNAL_COUNT) {
    reasons.push('RECURRING_PAID_LISTINGS');
  }
  if (input.foodActivity) reasons.push('FOOD_ACTIVITY');
  if (input.serviceActivity) reasons.push('SERVICE_ACTIVITY');
  return reasons;
}

/**
 * Whether HomeCheff should ask the user to reconfirm / queue review.
 * Never changes declaration. Does not suspend listings.
 */
export function shouldRequireCommerceReview(
  input: ReviewSignalInput,
  reasons: SellerCommerceReviewReason[] = collectCommerceReviewReasons(input),
): boolean {
  if (reasons.length === 0) return false;
  // Already declared professional — signals are informational; no force-upgrade path.
  if (input.declaration === 'SELF_DECLARED_PROFESSIONAL') {
    // Still surface review if already in a review pipeline; otherwise soft-signal only.
    return (
      input.reviewState === 'REVIEW_REQUIRED' ||
      input.reviewState === 'UNDER_REVIEW'
    );
  }
  // Private or undeclared with business-info / volume signals → ask to reconfirm.
  const strong = reasons.some((r) =>
    [
      'KVK_PRESENT',
      'VAT_PRESENT',
      'COMPANY_NAME_PRESENT',
      'BUSINESS_RECORD_PRESENT',
      'STRIPE_BUSINESS_TYPE_COMPANY',
      'BUSINESS_SUBSCRIPTION',
      'RECURRING_PAID_LISTINGS',
    ].includes(r),
  );
  return strong;
}

/**
 * Next persisted review state from signals — never touches declaration.
 */
export function nextCommerceReviewState(
  input: ReviewSignalInput,
): SellerCommerceReviewState {
  if (
    input.reviewState === 'UNDER_REVIEW' ||
    input.reviewState === 'REVIEWED'
  ) {
    return input.reviewState;
  }
  const reasons = collectCommerceReviewReasons(input);
  if (shouldRequireCommerceReview(input, reasons)) {
    return 'REVIEW_REQUIRED';
  }
  return input.reviewState === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'NONE';
}
