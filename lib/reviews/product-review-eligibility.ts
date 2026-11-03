/**
 * Product review eligibility for HomeCheff's mixed commerce model.
 *
 * VERIFIED_TRANSACTION — paid HomeCheff order for this product.
 * UNVERIFIED_EXPERIENCE — logged-in experience (cash, barter, free, offline, contact)
 * without inventing an order. Must stay clearly labelled in UI via isVerified=false.
 */

export type ProductReviewVerificationKind =
  | 'VERIFIED_TRANSACTION'
  | 'UNVERIFIED_EXPERIENCE';

/** Soft rate limit for experience (unverified) reviews per reviewer. */
export const EXPERIENCE_REVIEW_DAILY_LIMIT = 5;

/** Unverified experience reviews need a short note to reduce empty spam. */
export const EXPERIENCE_REVIEW_MIN_COMMENT_CHARS = 12;

export function resolveProductReviewVerification(input: {
  hasPurchasedOrder: boolean;
}): ProductReviewVerificationKind {
  return input.hasPurchasedOrder
    ? 'VERIFIED_TRANSACTION'
    : 'UNVERIFIED_EXPERIENCE';
}

export function experienceReviewContentAllowed(input: {
  kind: ProductReviewVerificationKind;
  comment: string;
}): { ok: true } | { ok: false; error: string } {
  if (input.kind === 'VERIFIED_TRANSACTION') return { ok: true };
  const text = input.comment.trim();
  if (text.length < EXPERIENCE_REVIEW_MIN_COMMENT_CHARS) {
    return {
      ok: false,
      error: `Beschrijf kort je ervaring (minimaal ${EXPERIENCE_REVIEW_MIN_COMMENT_CHARS} tekens) bij een review zonder HomeCheff-bestelling.`,
    };
  }
  return { ok: true };
}
