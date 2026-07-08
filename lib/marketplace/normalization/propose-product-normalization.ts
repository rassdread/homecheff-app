/**
 * Phase 10C — pure product normalization proposals.
 *
 * Uses existing canonical helpers only. No DB access. No side effects.
 */

import type { MarketplaceCategory, ProductCategory } from '@prisma/client';
import { prismaCategoryToCanonical } from '@/lib/marketplace/canonical-model';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import {
  legacyUrlCategoryToMarketplace,
  marketplaceToProductCategory,
} from '@/lib/marketplace/listing-taxonomy';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import {
  normalizeAcceptedTaxonomyIds,
  normalizeTaxonomyIds,
  primarySpecialization,
} from '@/lib/marketplace/taxonomy-normalize';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { isRequestListing } from '@/lib/marketplace/product-visibility';
import {
  isMarketplaceSaleItem,
  isMarketplaceServiceItem,
} from '@/lib/feed/marketplace-sale';

const SERVICE_LISTING_KINDS = new Set([
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
]);

const SERVICE_MARKETPLACE_CATEGORIES = new Set<MarketplaceCategory>([
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
  'DESIGN',
]);

export type ProductNormalizationRecord = {
  id: string;
  title: string;
  category: ProductCategory;
  listingIntent: string;
  marketplaceCategory: MarketplaceCategory | null;
  subcategory: string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  priceModel: string;
  priceCents: number;
  orderMethod: string;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  isActive: boolean;
  createdAt: Date;
  sellerStripeConnectReady?: boolean | null;
};

export type ProductNormalizationUpdate = {
  marketplaceCategory?: MarketplaceCategory;
  category?: ProductCategory;
  listingIntent?: 'OFFER' | 'REQUEST';
  specializations?: string[];
  subcategory?: string | null;
  acceptedSpecializations?: string[];
  acceptHomeCheffPayment?: boolean;
  acceptDirectContact?: boolean;
};

export type ProductNormalizationProposal = {
  productId: string;
  title: string;
  issues: string[];
  risks: string[];
  unmappedSpecializations: string[];
  unmappedAcceptedValues: string[];
  derived: {
    listingKind: string;
    canonicalCategory: string | null;
    viewIntent: 'OFFERED' | 'WANTED' | 'INSPIRATION';
    isServiceItem: boolean;
    settlementSelectable: {
      checkout: boolean;
      direct: boolean;
      barter: boolean;
      acceptedValues: boolean;
    };
  };
  updates: ProductNormalizationUpdate;
};

function inferMarketplaceCategoryFromSpecs(
  specs: string[],
  fallback: MarketplaceCategory | null,
): MarketplaceCategory | null {
  const fromRegistry = specs
    .map((id) => getMarketplaceTaxonomyItem(id)?.category)
    .filter((c): c is MarketplaceCategory => !!c);
  if (fromRegistry.length === 0) return fallback;
  const unique = [...new Set(fromRegistry)];
  if (unique.length === 1) return unique[0]!;
  for (const serviceCat of SERVICE_MARKETPLACE_CATEGORIES) {
    if (unique.includes(serviceCat)) return serviceCat;
  }
  return fromRegistry[0] ?? fallback;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function collectUnmappedSpecializations(
  raw: string[],
  normalized: string[],
): string[] {
  const normSet = new Set(normalized);
  return raw.filter((r) => {
    const t = r.trim();
    if (!t) return false;
    if (normSet.has(t)) return false;
    const canonical = normalizeTaxonomyIds([t], null);
    return canonical.length === 0;
  });
}

function collectUnmappedAccepted(
  raw: string[],
  normalized: string[],
): string[] {
  const normSet = new Set(normalized);
  return raw.filter((r) => {
    const t = r.trim();
    if (!t) return false;
    if (normSet.has(t)) return false;
    const canonical = normalizeAcceptedTaxonomyIds([t]);
    return canonical.length === 0;
  });
}

/** Build a normalization proposal for one Product row. */
export function proposeProductNormalization(
  product: ProductNormalizationRecord,
): ProductNormalizationProposal {
  const issues: string[] = [];
  const risks: string[] = [];
  const updates: ProductNormalizationUpdate = {};

  const baseMarketplaceCategory =
    product.marketplaceCategory ??
    legacyUrlCategoryToMarketplace(product.category);

  if (!product.marketplaceCategory) {
    issues.push('missing_marketplaceCategory');
    updates.marketplaceCategory = baseMarketplaceCategory;
  }

  const specsSource =
    product.specializations.length > 0
      ? product.specializations
      : product.subcategory
        ? [product.subcategory]
        : [];

  const normalizedSpecsForInference = normalizeTaxonomyIds(specsSource, null);

  const normalizedSpecs = normalizeTaxonomyIds(
    specsSource,
    updates.marketplaceCategory ?? baseMarketplaceCategory,
  );

  // When category filter dropped service/food ids, keep inference list for category repair.
  const specsForCategoryInference =
    normalizedSpecsForInference.length > 0
      ? normalizedSpecsForInference
      : normalizedSpecs;

  const unmappedSpecializations = collectUnmappedSpecializations(
    specsSource,
    normalizedSpecsForInference,
  );
  if (unmappedSpecializations.length > 0) {
    issues.push('unmapped_specializations');
  }

  if (
    product.specializations.length === 0 &&
    specsForCategoryInference.length > 0
  ) {
    issues.push('missing_specializations_array');
    updates.specializations = specsForCategoryInference;
  } else if (
    specsForCategoryInference.length > 0 &&
    !arraysEqual(product.specializations, specsForCategoryInference)
  ) {
    issues.push('stale_specializations');
    updates.specializations = specsForCategoryInference;
  }

  const primarySpec = primarySpecialization(
    updates.specializations ??
      (product.specializations.length > 0
        ? product.specializations
        : specsForCategoryInference),
  );
  if (primarySpec && product.subcategory !== primarySpec) {
    issues.push('subcategory_out_of_sync');
    updates.subcategory = primarySpec;
  }

  const normalizedAccepted = normalizeAcceptedTaxonomyIds(
    product.acceptedSpecializations,
  );
  const unmappedAcceptedValues = collectUnmappedAccepted(
    product.acceptedSpecializations,
    normalizedAccepted,
  );
  if (unmappedAcceptedValues.length > 0) {
    issues.push('unmapped_accepted_values');
  }
  if (
    normalizedAccepted.length > 0 &&
    !arraysEqual(product.acceptedSpecializations, normalizedAccepted)
  ) {
    issues.push('stale_accepted_values');
    updates.acceptedSpecializations = normalizedAccepted;
  }

  const effectiveMarketplaceCategory =
    updates.marketplaceCategory ??
    product.marketplaceCategory ??
    baseMarketplaceCategory;

  const inferredFromSpecs = inferMarketplaceCategoryFromSpecs(
    specsForCategoryInference,
    effectiveMarketplaceCategory,
  );

  const specsForKind =
    updates.specializations ??
    (product.specializations.length > 0
      ? product.specializations
      : specsForCategoryInference);

  const kindInput = {
    entityType: 'product' as const,
    listingIntent: product.listingIntent,
    marketplaceCategory:
      updates.marketplaceCategory ??
      inferredFromSpecs ??
      effectiveMarketplaceCategory,
    specializations: specsForKind,
    subcategory: updates.subcategory ?? product.subcategory,
    category: product.category,
  };

  const { listingKind } = deriveListingKind(kindInput);

  if (
    SERVICE_LISTING_KINDS.has(listingKind) &&
    effectiveMarketplaceCategory &&
    !SERVICE_MARKETPLACE_CATEGORIES.has(effectiveMarketplaceCategory) &&
    inferredFromSpecs &&
    SERVICE_MARKETPLACE_CATEGORIES.has(inferredFromSpecs)
  ) {
    issues.push('service_misclassified_category');
    updates.marketplaceCategory = inferredFromSpecs;
    risks.push('service_category_inferred_from_taxonomy');
  } else if (
    inferredFromSpecs &&
    inferredFromSpecs !== effectiveMarketplaceCategory &&
    SERVICE_MARKETPLACE_CATEGORIES.has(inferredFromSpecs)
  ) {
    issues.push('category_spec_mismatch');
    updates.marketplaceCategory = inferredFromSpecs;
    risks.push('marketplaceCategory_aligned_to_specs');
  }

  const resolvedMarketplaceCategory =
    updates.marketplaceCategory ?? effectiveMarketplaceCategory;
  const expectedLegacyCategory = marketplaceToProductCategory(
    resolvedMarketplaceCategory,
  );
  if (product.category !== expectedLegacyCategory) {
    issues.push('legacy_category_mismatch');
    updates.category = expectedLegacyCategory;
  }

  const order = String(product.orderMethod ?? '').toUpperCase();
  if (
    order === 'CONTACT' &&
    product.acceptDirectContact === false &&
    product.acceptHomeCheffPayment === true
  ) {
    issues.push('settlement_contact_order_method_mismatch');
    updates.acceptHomeCheffPayment = false;
    updates.acceptDirectContact = true;
    risks.push('settlement_derived_from_orderMethod_CONTACT');
  }

  if (isRequestListing(product) && product.listingIntent !== 'REQUEST') {
    issues.push('intent_should_be_request');
    updates.listingIntent = 'REQUEST';
  }

  const saleInput = {
    id: product.id,
    listingIntent: updates.listingIntent ?? product.listingIntent,
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    listingKind,
    feedSource: 'PRODUCT' as const,
  };

  const viewIntent = isRequestListing(saleInput)
    ? 'WANTED'
    : isMarketplaceSaleItem(saleInput)
      ? 'OFFERED'
      : 'INSPIRATION';

  const canonicalCategory = prismaCategoryToCanonical(
    resolvedMarketplaceCategory,
    primarySpec,
  );

  const settlement = resolveSettlementOptions({
    acceptHomeCheffPayment:
      updates.acceptHomeCheffPayment ?? product.acceptHomeCheffPayment,
    acceptDirectContact:
      updates.acceptDirectContact ?? product.acceptDirectContact,
    orderMethod: product.orderMethod,
    barterOpenness: product.barterOpenness,
    acceptedSpecializations:
      updates.acceptedSpecializations ?? product.acceptedSpecializations,
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    listingIntent: updates.listingIntent ?? product.listingIntent,
    stripeConnectReady: product.sellerStripeConnectReady,
  });

  if (
    settlement.acceptsHomeCheffCheckout &&
    product.sellerStripeConnectReady === false &&
    product.priceCents > 0
  ) {
    issues.push('checkout_needs_stripe_connect');
  }

  if (
    !settlement.acceptsHomeCheffCheckout &&
    !settlement.acceptsDirectContact &&
    !settlement.allowsBarter &&
    !settlement.hasAcceptedValues &&
    viewIntent === 'OFFERED'
  ) {
    issues.push('missing_settlement_path');
  }

  return {
    productId: product.id,
    title: product.title,
    issues,
    risks,
    unmappedSpecializations,
    unmappedAcceptedValues,
    derived: {
      listingKind,
      canonicalCategory,
      viewIntent,
      isServiceItem: isMarketplaceServiceItem({
        ...saleInput,
        listingKind,
      }),
      settlementSelectable: {
        checkout: settlement.acceptsHomeCheffCheckout,
        direct: settlement.acceptsDirectContact,
        barter: settlement.allowsBarter,
        acceptedValues: settlement.hasAcceptedValues,
      },
    },
    updates,
  };
}

export function isProductCanonical(
  proposal: ProductNormalizationProposal,
): boolean {
  return (
    proposal.issues.length === 0 && Object.keys(proposal.updates).length === 0
  );
}

export function hasWritableUpdates(
  proposal: ProductNormalizationProposal,
): boolean {
  return Object.keys(proposal.updates).length > 0;
}
