import type { MarketplaceCategory } from '@prisma/client';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { inferListingKindEntityType } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import type {
  SearchResultClassification,
  SearchResultEntityType,
  SearchableListingRecord,
} from './contracts/search-contract';

export function classifySearchResult(
  item: SearchableListingRecord,
  entityType?: SearchResultEntityType,
): SearchResultClassification {
  const resolvedEntity =
    entityType ??
    item.entityType ??
    inferListingKindEntityType(item);

  const { listingKind } = deriveListingKind({
    entityType: resolvedEntity,
    listingIntent: item.listingIntent ?? null,
    marketplaceCategory: item.marketplaceCategory ?? null,
    specializations: item.specializations ?? null,
    subcategory: item.subcategory ?? null,
    category: item.category ?? null,
    feedSource: item.feedSource ?? null,
    type: item.type ?? null,
  });

  const intentRaw = String(item.listingIntent ?? '').trim().toUpperCase();
  const listingIntent =
    intentRaw === 'REQUEST' ? 'REQUEST' : intentRaw === 'OFFER' ? 'OFFER' : listingKind === 'REQUEST' ? 'REQUEST' : 'OFFER';

  return {
    listingKind,
    listingIntent,
    marketplaceCategory: (item.marketplaceCategory as MarketplaceCategory | null) ?? null,
    specializations: item.specializations ?? [],
    entityType: resolvedEntity,
  };
}

export function attachSearchClassification<T extends SearchableListingRecord>(
  item: T,
  entityType?: SearchResultEntityType,
): T & SearchResultClassification {
  const classification = classifySearchResult(item, entityType);
  return {
    ...item,
    ...classification,
  };
}

export function attachSearchClassificationToRecord(
  item: Record<string, unknown>,
  entityType?: SearchResultEntityType,
): SearchResultClassification {
  const attached = attachSearchClassification(
    item as SearchableListingRecord,
    entityType,
  );
  item.listingKind = attached.listingKind;
  item.listingIntent = attached.listingIntent;
  item.marketplaceCategory = attached.marketplaceCategory;
  item.specializations = attached.specializations;
  item.entityType = attached.entityType;
  return {
    listingKind: attached.listingKind,
    listingIntent: attached.listingIntent,
    marketplaceCategory: attached.marketplaceCategory,
    specializations: attached.specializations,
    entityType: attached.entityType,
  };
}
