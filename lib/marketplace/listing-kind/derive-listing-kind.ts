import type { MarketplaceCategory } from '@prisma/client';
import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  isPhysicalCreateTaxonomyId,
  isWorkshopTaxonomyId,
} from '@/lib/marketplace/form-config';
import { legacyUrlCategoryToMarketplace } from '@/lib/marketplace/listing-taxonomy';
import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';
import { isRequestListing } from '@/lib/marketplace/product-visibility';
import { logListingKindDerivation } from './audit';
import type { DeriveListingKindInput, DeriveListingKindResult } from './types';

const COACHING_TAXONOMY_IDS = new Set(['knowledge.coaching']);

const SERVICE_MARKETPLACE_CATEGORIES = new Set<MarketplaceCategory>([
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
  'DESIGN',
]);

function resolveSpecIds(input: DeriveListingKindInput): string[] {
  if (input.specializations?.length) {
    return input.specializations.filter(Boolean);
  }
  if (input.subcategory?.trim()) {
    const canonical = toCanonicalTaxonomyId(input.subcategory);
    return canonical ? [canonical] : [];
  }
  return [];
}

function resolveMarketplaceCategory(
  input: DeriveListingKindInput,
): MarketplaceCategory | null {
  const raw = input.marketplaceCategory;
  if (raw && typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    if (
      upper === 'CREATE' ||
      upper === 'GROW' ||
      upper === 'DESIGN' ||
      upper === 'ARTISTIC_SERVICE' ||
      upper === 'PRACTICAL_SERVICE' ||
      upper === 'KNOWLEDGE'
    ) {
      return upper as MarketplaceCategory;
    }
  }
  if (input.category) {
    return legacyUrlCategoryToMarketplace(input.category);
  }
  return null;
}

function isInspirationEntity(input: DeriveListingKindInput): boolean {
  const entity = String(input.entityType ?? '').trim().toLowerCase();
  if (entity === 'dish' || entity === 'workspace') return true;

  const feedSource = String(input.feedSource ?? '').trim().toUpperCase();
  if (feedSource === 'DISH') return true;

  const type = String(input.type ?? '').trim().toLowerCase();
  if (type === 'dish') return true;

  return false;
}

function isCoachingSpec(specs: string[]): boolean {
  return specs.some((id) => COACHING_TAXONOMY_IDS.has(id));
}

function isWorkshopSpec(
  category: MarketplaceCategory | null,
  specs: string[],
): boolean {
  if (category === 'KNOWLEDGE') {
    return specs.some((id) => isWorkshopTaxonomyId(id));
  }
  return specs.some((id) => isWorkshopTaxonomyId(id));
}

function hasPhysicalCreateSpec(
  category: MarketplaceCategory | null,
  specs: string[],
): boolean {
  if (category !== 'DESIGN' && category !== 'CREATE') return false;
  return specs.some((id) => isPhysicalCreateTaxonomyId(id));
}

/**
 * Canonical ListingKind derivation — single source of truth.
 * Precedence per LISTING_KIND_SPEC.md.
 */
export function deriveListingKind(
  input: DeriveListingKindInput,
): DeriveListingKindResult {
  if (isInspirationEntity(input)) {
    const result: DeriveListingKindResult = {
      listingKind: INSPIRATION_LISTING_KIND,
      derivationPath: 'entity:inspiration',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  if (isRequestListing(input)) {
    const result: DeriveListingKindResult = {
      listingKind: 'REQUEST',
      derivationPath: 'listingIntent:REQUEST',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  const specs = resolveSpecIds(input);
  const category = resolveMarketplaceCategory(input);

  if (isWorkshopSpec(category, specs)) {
    const result: DeriveListingKindResult = {
      listingKind: 'WORKSHOP',
      derivationPath: 'specializations:workshop',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  if (isCoachingSpec(specs)) {
    const result: DeriveListingKindResult = {
      listingKind: 'COACHING',
      derivationPath: 'specializations:coaching',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  if (category === 'PRACTICAL_SERVICE') {
    const result: DeriveListingKindResult = {
      listingKind: 'TASK',
      derivationPath: 'marketplaceCategory:PRACTICAL_SERVICE',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  if (hasPhysicalCreateSpec(category, specs)) {
    const result: DeriveListingKindResult = {
      listingKind: 'PRODUCT',
      derivationPath: 'specializations:physical_create',
    };
    logListingKindDerivation(input, result);
    return result;
  }

  if (category && SERVICE_MARKETPLACE_CATEGORIES.has(category)) {
    const result: DeriveListingKindResult = {
      listingKind: 'SERVICE',
      derivationPath: `marketplaceCategory:${category}`,
    };
    logListingKindDerivation(input, result);
    return result;
  }

  const result: DeriveListingKindResult = {
    listingKind: 'PRODUCT',
    derivationPath: category
      ? `default:PRODUCT(category=${category})`
      : 'default:PRODUCT',
  };
  logListingKindDerivation(input, result);
  return result;
}

/** Batch derive with stable ordering for audits. */
export function deriveListingKindBatch(
  inputs: DeriveListingKindInput[],
): DeriveListingKindResult[] {
  return inputs.map(deriveListingKind);
}

/**
 * Infer entity type from mixed feed/API payloads.
 */
export function inferListingKindEntityType(
  raw: Pick<
    DeriveListingKindInput,
    'feedSource' | 'type' | 'entityType'
  >,
): ListingKindEntityType {
  if (raw.entityType) return raw.entityType;
  const feedSource = String(raw.feedSource ?? '').trim().toUpperCase();
  if (feedSource === 'DISH') return 'dish';
  if (feedSource === 'LISTING') return 'listing';
  const type = String(raw.type ?? '').trim().toLowerCase();
  if (type === 'dish') return 'dish';
  return 'product';
}

export function buildListingKindInputFromFeedItem(
  item: Record<string, unknown>,
): DeriveListingKindInput {
  const feedSource =
    item.feedSource != null
      ? String(item.feedSource)
      : item.kind != null
        ? String(item.kind)
        : null;

  return {
    entityType: inferListingKindEntityType({
      feedSource,
      type: item.type != null ? String(item.type) : null,
      entityType: item.entityType as DeriveListingKindInput['entityType'],
    }),
    listingIntent:
      item.listingIntent != null ? String(item.listingIntent) : null,
    marketplaceCategory:
      item.marketplaceCategory != null
        ? String(item.marketplaceCategory)
        : null,
    specializations: Array.isArray(item.specializations)
      ? item.specializations.filter((v): v is string => typeof v === 'string')
      : null,
    subcategory:
      item.subcategory != null ? String(item.subcategory) : null,
    category: item.category != null ? String(item.category) : null,
    fulfillmentOptions: item.fulfillmentOptions,
    feedSource,
    type: item.type != null ? String(item.type) : null,
  };
}
