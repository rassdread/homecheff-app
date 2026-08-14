/**
 * LEGAL-1 — central seller commerce interpretation.
 * Factual platform state only — never isLegalTrader / consumerLawApplies.
 */

import {
  collectCommerceReviewReasons,
  nextCommerceReviewState,
  type ReviewSignalInput,
} from './seller-commerce-review-signals';
import { resolveSellerCommercePublicLabel } from './seller-commerce-public-label';
import {
  parseSellerCommerceDeclaration,
  parseSellerCommerceReviewState,
  type SellerCommerceActivities,
  type SellerCommerceContext,
  type SellerCommerceDeclaration,
  type SellerCommerceReviewReason,
  type SellerCommerceReviewState,
} from './seller-commerce-types';

export type SellerCommerceProfileSlice = {
  commerceDeclaration?: string | null;
  commerceDeclaredAt?: Date | string | null;
  commerceReviewState?: string | null;
  commerceReviewRequiredAt?: Date | string | null;
  commerceReviewReasons?: string[] | null;
  kvk?: string | null;
  btw?: string | null;
  companyName?: string | null;
};

export type SellerCommerceActivitySource = {
  category?: string | null;
  marketplaceCategory?: string | null;
  priceCents?: number | null;
  isActive?: boolean | null;
};

/**
 * Legacy feed/listing approximation — registered business info present.
 * NOT a legal-trader determination. Do not rename globally to “isLegalTrader”.
 */
export function registeredBusinessInfoPresent(seller: {
  kvk?: string | null;
  companyName?: string | null;
}): boolean {
  return Boolean(seller.kvk?.trim() && seller.companyName?.trim());
}

export function deriveSellerCommerceActivities(
  products: SellerCommerceActivitySource[] | null | undefined,
): SellerCommerceActivities {
  let food = false;
  let services = false;
  for (const p of products ?? []) {
    const cat = (p.category || '').toUpperCase();
    const mcat = (p.marketplaceCategory || '').toUpperCase();
    if (cat === 'CHEFF' || mcat === 'CREATE') food = true;
    if (
      cat === 'DESIGNER' ||
      mcat === 'ARTISTIC_SERVICE' ||
      mcat === 'PRACTICAL_SERVICE' ||
      mcat === 'KNOWLEDGE' ||
      mcat === 'DESIGN'
    ) {
      services = true;
    }
  }
  return { food, services };
}

function toIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type BuildSellerCommerceContextInput = {
  seller?: SellerCommerceProfileSlice | null;
  /** Business.verified — currently rarely true; do not inflate meaning. */
  businessVerified?: boolean;
  hasBusinessRecord?: boolean;
  stripeConnectAccountId?: string | null;
  stripeBusinessType?: string | null;
  hasBusinessSubscription?: boolean;
  products?: SellerCommerceActivitySource[] | null;
  /** Optional override when activities already derived. */
  activities?: SellerCommerceActivities;
};

/**
 * Pure builder — safe for unit tests. Does not write DB.
 * Account-level for LEGAL-1; listing-level overrides remain possible later.
 */
export function buildSellerCommerceContext(
  input: BuildSellerCommerceContextInput,
): SellerCommerceContext {
  const seller = input.seller ?? {};
  const declaration = parseSellerCommerceDeclaration(seller.commerceDeclaration);
  const reviewState = parseSellerCommerceReviewState(seller.commerceReviewState);
  const activities =
    input.activities ?? deriveSellerCommerceActivities(input.products);
  const paidListingCount = (input.products ?? []).filter(
    (p) => (p.priceCents ?? 0) > 0 && p.isActive !== false,
  ).length;

  const signalInput: ReviewSignalInput = {
    declaration,
    reviewState,
    kvk: seller.kvk,
    btw: seller.btw,
    companyName: seller.companyName,
    hasBusinessRecord: input.hasBusinessRecord,
    stripeConnectAccountId: input.stripeConnectAccountId,
    stripeBusinessType: input.stripeBusinessType,
    hasBusinessSubscription: input.hasBusinessSubscription,
    paidListingCount,
    foodActivity: activities.food,
    serviceActivity: activities.services,
  };

  const computedReasons = collectCommerceReviewReasons(signalInput);
  const storedReasons = (seller.commerceReviewReasons ?? []).filter(
    (r): r is SellerCommerceReviewReason => typeof r === 'string',
  );
  const reviewReasons =
    storedReasons.length > 0 ? storedReasons : computedReasons;

  const effectiveReviewState = nextCommerceReviewState({
    ...signalInput,
    reviewState,
  });

  const verifiedBusiness = Boolean(input.businessVerified);
  const registered = registeredBusinessInfoPresent(seller);

  return {
    declaration,
    declaredAt: toIso(seller.commerceDeclaredAt),
    reviewState: effectiveReviewState,
    reviewRequiredAt: toIso(seller.commerceReviewRequiredAt),
    reviewReasons,
    registeredBusinessInfoPresent: registered,
    verifiedBusiness,
    activities,
    publicLabel: resolveSellerCommercePublicLabel({
      declaration,
      verifiedBusiness,
    }),
  };
}

/** Public subset — never includes reviewReasons / review internals. */
export function toPublicSellerCommerceView(ctx: SellerCommerceContext): {
  declaration: SellerCommerceDeclaration;
  publicLabel: SellerCommerceContext['publicLabel'];
  registeredBusinessInfoPresent: boolean;
  verifiedBusiness: boolean;
  activities: SellerCommerceActivities;
} {
  return {
    declaration: ctx.declaration,
    publicLabel: ctx.publicLabel,
    registeredBusinessInfoPresent: ctx.registeredBusinessInfoPresent,
    verifiedBusiness: ctx.verifiedBusiness,
    activities: ctx.activities,
  };
}

/** Owner payload for settings / create gate (includes review state, not reasons to client UI optionally). */
export function toOwnerSellerCommerceView(ctx: SellerCommerceContext): {
  declaration: SellerCommerceDeclaration;
  declaredAt: string | null;
  reviewState: SellerCommerceReviewState;
  needsDeclaration: boolean;
  needsReviewConfirm: boolean;
  publicLabel: SellerCommerceContext['publicLabel'];
  registeredBusinessInfoPresent: boolean;
  verifiedBusiness: boolean;
  activities: SellerCommerceActivities;
} {
  return {
    declaration: ctx.declaration,
    declaredAt: ctx.declaredAt,
    reviewState: ctx.reviewState,
    needsDeclaration: ctx.declaration === 'UNDECLARED',
    needsReviewConfirm: ctx.reviewState === 'REVIEW_REQUIRED',
    publicLabel: ctx.publicLabel,
    registeredBusinessInfoPresent: ctx.registeredBusinessInfoPresent,
    verifiedBusiness: ctx.verifiedBusiness,
    activities: ctx.activities,
  };
}

/**
 * Apply user declaration — never derived from KvK/Stripe/revenue.
 * Review reasons remain signals; declaration is explicit only.
 */
export function applyCommerceDeclarationUpdate(input: {
  previous: SellerCommerceProfileSlice | null | undefined;
  nextDeclaration: Exclude<
    SellerCommerceDeclaration,
    'UNDECLARED'
  >;
  now?: Date;
}): {
  commerceDeclaration: SellerCommerceDeclaration;
  commerceDeclaredAt: Date;
  commerceReviewState: SellerCommerceReviewState;
  commerceReviewRequiredAt: Date | null;
  commerceReviewReasons: string[];
} {
  const now = input.now ?? new Date();
  const prev = input.previous ?? {};
  const previousDeclaration = parseSellerCommerceDeclaration(
    prev.commerceDeclaration,
  );
  const previousReview = parseSellerCommerceReviewState(prev.commerceReviewState);

  let reviewState: SellerCommerceReviewState = previousReview;
  // User reconfirmed after REVIEW_REQUIRED → REVIEWED (still keeps their chosen declaration).
  if (previousReview === 'REVIEW_REQUIRED' || previousReview === 'UNDER_REVIEW') {
    reviewState = 'REVIEWED';
  }

  return {
    commerceDeclaration: input.nextDeclaration,
    commerceDeclaredAt: now,
    commerceReviewState: reviewState,
    commerceReviewRequiredAt:
      reviewState === 'REVIEWED' ? null : prev.commerceReviewRequiredAt
        ? new Date(prev.commerceReviewRequiredAt)
        : null,
    commerceReviewReasons: Array.isArray(prev.commerceReviewReasons)
      ? [...prev.commerceReviewReasons]
      : [],
  };
}
