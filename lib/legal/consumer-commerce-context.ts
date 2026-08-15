/**
 * LEGAL-3 — consumer commerce context (consumes LEGAL-1; does not replace it).
 *
 * Determines transaction characteristics and withdrawal treatment flags.
 * Never invents trader status from KvK / Stripe / revenue / counts.
 */

import type {
  SellerCommerceDeclaration,
  SellerCommercePublicLabel,
} from '@/lib/legal/seller-commerce-types';
import { parseSellerCommerceDeclaration } from '@/lib/legal/seller-commerce-types';
import { resolveSellerCommercePublicLabel } from '@/lib/legal/seller-commerce-public-label';
import type { WithdrawalRule } from '@/lib/legal/withdrawal-rules';

export type ConsumerCommerceProductInput = {
  priceCents?: number | null;
  priceModel?: string | null;
  barterOpenness?: string | null;
  category?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  /** Explicit seller declaration — NOT derived from TRUST PERSONALISED. */
  madeToConsumerSpecifications?: boolean | null;
  /** Explicit seller declaration for rapidly perishable goods. */
  rapidlyPerishable?: boolean | null;
  listingIntent?: string | null;
};

export type ConsumerCommerceSellerInput = {
  commerceDeclaration?: string | null;
  verifiedBusiness?: boolean | null;
};

export type ConsumerCommerceContext = {
  sellerCommerceDeclaration: SellerCommerceDeclaration;
  sellerVerifiedBusiness: boolean;
  publicLabel: SellerCommercePublicLabel;
  isProfessionalSellerPath: boolean;
  isPrivateSellerPath: boolean;
  isUndeclaredPath: boolean;
  isGoods: boolean;
  isService: boolean;
  isFood: boolean;
  isPreparedFood: boolean;
  isCustomOrPersonalised: boolean;
  isPerishable: boolean;
  isFree: boolean;
  isBarterOnly: boolean;
  hasMoneyComponent: boolean;
  isOnRequest: boolean;
  withdrawalRule: WithdrawalRule;
  consumerInformationRequired: boolean;
  /** Show pre-commit disclosure block (listing/checkout/proposal). */
  showConsumerDisclosure: boolean;
  /** Explicit ack only when service-start-during-withdrawal is requested. */
  serviceStartAckRequired: boolean;
};

const SERVICE_CATEGORIES = new Set([
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
]);

function isPreparedFoodCategory(input: ConsumerCommerceProductInput): boolean {
  const cat = (input.category || '').toUpperCase();
  const mcat = (input.marketplaceCategory || '').toUpperCase();
  if (mcat === 'CREATE') return true;
  if (cat === 'CHEFF' && mcat !== 'GROW') return true;
  return false;
}

function isGrowCategory(input: ConsumerCommerceProductInput): boolean {
  const cat = (input.category || '').toUpperCase();
  const mcat = (input.marketplaceCategory || '').toUpperCase();
  return mcat === 'GROW' || cat === 'GARDEN';
}

function isServiceCategory(input: ConsumerCommerceProductInput): boolean {
  const mcat = (input.marketplaceCategory || '').toUpperCase();
  if (SERVICE_CATEGORIES.has(mcat)) return true;
  // DESIGN alone may be goods or service — treat as goods unless service cats
  return false;
}

/**
 * Pure builder — unit-testable. Does not write DB or mutate LEGAL-1.
 */
export function buildConsumerCommerceContext(input: {
  seller?: ConsumerCommerceSellerInput | null;
  product?: ConsumerCommerceProductInput | null;
  /** When true, consumer is asking that a service begin during withdrawal period. */
  serviceStartDuringWithdrawalRequested?: boolean;
}): ConsumerCommerceContext {
  const product = input.product ?? {};
  const declaration = parseSellerCommerceDeclaration(
    input.seller?.commerceDeclaration,
  );
  const verifiedBusiness = Boolean(input.seller?.verifiedBusiness);
  const publicLabel = resolveSellerCommercePublicLabel({
    declaration,
    verifiedBusiness,
  });

  const priceCents = Number(product.priceCents ?? 0) || 0;
  const priceModel = (product.priceModel || 'FIXED').toUpperCase();
  const barter = (product.barterOpenness || 'MONEY').toUpperCase();
  const isBarterOnly = barter === 'BARTER_ONLY';
  const isOnRequest = priceModel === 'ON_REQUEST';
  const isVoluntary = priceModel === 'VOLUNTARY';

  const isPreparedFood = isPreparedFoodCategory(product);
  const isGrow = isGrowCategory(product);
  const isFood = isPreparedFood || isGrow;
  const isService = isServiceCategory(product);
  const isGoods = !isService;

  const isCustomOrPersonalised = product.madeToConsumerSpecifications === true;
  // Never auto-perishable for GROW; only explicit flag (typically prepared food).
  const isPerishable = product.rapidlyPerishable === true;

  const isProfessionalSellerPath =
    verifiedBusiness || declaration === 'SELF_DECLARED_PROFESSIONAL';
  const isPrivateSellerPath =
    declaration === 'PRIVATE_OCCASIONAL' && !verifiedBusiness;
  const isUndeclaredPath =
    declaration === 'UNDECLARED' && !verifiedBusiness;

  // Pure free sharing: voluntary / zero money, no barter contract
  const isPureFreeShare =
    priceCents <= 0 &&
    barter === 'MONEY' &&
    (isVoluntary || (!isOnRequest && priceModel === 'FIXED')) &&
    !isBarterOnly;

  let withdrawalRule: WithdrawalRule;
  if (isPureFreeShare && !isProfessionalSellerPath) {
    withdrawalRule = 'NOT_APPLICABLE_FREE';
  } else if (isProfessionalSellerPath) {
    if (isPureFreeShare) {
      withdrawalRule = 'NOT_APPLICABLE_FREE';
    } else if (isService) {
      withdrawalRule = 'FULLY_PERFORMED_SERVICE_EXCEPTION';
    } else if (isCustomOrPersonalised) {
      withdrawalRule = 'CUSTOM_OR_PERSONALISED_EXCEPTION';
    } else if (isPerishable && isPreparedFood) {
      withdrawalRule = 'PERISHABLE_EXCEPTION';
    } else {
      withdrawalRule = 'STANDARD_14_DAY';
    }
  } else if (isPrivateSellerPath) {
    withdrawalRule = 'NOT_APPLICABLE_PRIVATE_C2C';
  } else if (isUndeclaredPath) {
    withdrawalRule = 'REQUIRES_REVIEW';
  } else {
    withdrawalRule = 'REQUIRES_REVIEW';
  }

  const consumerInformationRequired =
    isProfessionalSellerPath ||
    isPrivateSellerPath ||
    isUndeclaredPath;

  const showConsumerDisclosure =
    withdrawalRule === 'NOT_APPLICABLE_FREE' && !isProfessionalSellerPath
      ? false
      : consumerInformationRequired || isProfessionalSellerPath;

  const serviceStartAckRequired =
    isProfessionalSellerPath &&
    isService &&
    Boolean(input.serviceStartDuringWithdrawalRequested);

  return {
    sellerCommerceDeclaration: declaration,
    sellerVerifiedBusiness: verifiedBusiness,
    publicLabel,
    isProfessionalSellerPath,
    isPrivateSellerPath,
    isUndeclaredPath,
    isGoods,
    isService,
    isFood,
    isPreparedFood,
    isCustomOrPersonalised,
    isPerishable,
    isFree: isPureFreeShare,
    isBarterOnly,
    hasMoneyComponent:
      isBarterOnly ||
      priceCents > 0 ||
      isOnRequest ||
      barter === 'MONEY_AND_BARTER' ||
      priceModel === 'FROM_PRICE' ||
      priceModel === 'HOURLY' ||
      priceModel === 'DAILY',
    isOnRequest,
    withdrawalRule,
    consumerInformationRequired,
    showConsumerDisclosure,
    serviceStartAckRequired,
  };
}

/** Merge multiple cart line contexts — most protective disclosure wins. */
export function mergeConsumerCommerceContexts(
  contexts: ConsumerCommerceContext[],
): ConsumerCommerceContext | null {
  if (contexts.length === 0) return null;
  if (contexts.length === 1) return contexts[0]!;

  const anyProfessional = contexts.some((c) => c.isProfessionalSellerPath);
  const anyPrivate = contexts.some((c) => c.isPrivateSellerPath);
  const anyUndeclared = contexts.some((c) => c.isUndeclaredPath);
  const anyService = contexts.some((c) => c.isService);
  const anyCustom = contexts.some((c) => c.isCustomOrPersonalised);
  const anyPerishable = contexts.some((c) => c.isPerishable && c.isPreparedFood);
  const allFree = contexts.every((c) => c.isFree);

  // Prefer showing the strictest professional rule present
  let withdrawalRule: WithdrawalRule = 'REQUIRES_REVIEW';
  if (allFree && !anyProfessional) {
    withdrawalRule = 'NOT_APPLICABLE_FREE';
  } else if (anyProfessional) {
    if (anyService) withdrawalRule = 'FULLY_PERFORMED_SERVICE_EXCEPTION';
    else if (anyCustom) withdrawalRule = 'CUSTOM_OR_PERSONALISED_EXCEPTION';
    else if (anyPerishable) withdrawalRule = 'PERISHABLE_EXCEPTION';
    else withdrawalRule = 'STANDARD_14_DAY';
  } else if (anyPrivate && !anyUndeclared) {
    withdrawalRule = 'NOT_APPLICABLE_PRIVATE_C2C';
  }

  const base = contexts.find((c) => c.isProfessionalSellerPath) ?? contexts[0]!;
  return {
    ...base,
    isProfessionalSellerPath: anyProfessional,
    isPrivateSellerPath: anyPrivate && !anyProfessional,
    isUndeclaredPath: anyUndeclared && !anyProfessional,
    isService: anyService,
    isCustomOrPersonalised: anyCustom,
    isPerishable: anyPerishable,
    isFree: allFree,
    withdrawalRule,
    showConsumerDisclosure:
      withdrawalRule !== 'NOT_APPLICABLE_FREE' || anyProfessional,
    consumerInformationRequired: true,
    serviceStartAckRequired: contexts.some((c) => c.serviceStartAckRequired),
  };
}
