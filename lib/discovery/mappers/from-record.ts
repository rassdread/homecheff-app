import type { DiscoveryEntityType, DiscoveryReadModel } from '../contracts/discovery-read-model';
import { mapDishToDiscoveryReadModel } from './from-dish';
import { mapLegacyListingToDiscoveryReadModel } from './from-legacy-listing';
import { mapProductToDiscoveryReadModel } from './from-product';
import type { DiscoveryEnrichment } from './enrichment';
import { parseTrustBadges } from './enrichment';

export function inferDiscoveryEntityType(
  record: Record<string, unknown>,
): DiscoveryEntityType {
  const explicit = record.entityType;
  if (
    explicit === 'product' ||
    explicit === 'dish' ||
    explicit === 'listing' ||
    explicit === 'workspace'
  ) {
    return explicit;
  }

  const feedSource = String(record.feedSource ?? record.kind ?? '')
    .trim()
    .toUpperCase();
  if (feedSource === 'DISH') return 'dish';
  if (feedSource === 'LISTING') return 'listing';

  const type = String(record.type ?? '').trim().toLowerCase();
  if (type === 'dish') return 'dish';

  return 'product';
}

/** Build enrichment from common API/feed record fields. */
export function enrichmentFromRecord(
  record: Record<string, unknown>,
): DiscoveryEnrichment {
  const seller = record.seller as Record<string, unknown> | undefined;
  const user = record.User as Record<string, unknown> | undefined;

  return {
    productReviewCount:
      record.reviewCount != null ? Number(record.reviewCount) : undefined,
    listingIsActive:
      record.isActive !== false &&
      String(record.status ?? '').trim().toUpperCase() !== 'PRIVATE',
    favoriteCount:
      record.favoriteCount != null
        ? Number(record.favoriteCount)
        : record.propsCount != null
          ? Number(record.propsCount)
          : undefined,
    trustBadges: parseTrustBadges(record.sellerBadges),
    distanceKm:
      record.distanceKm != null ? Number(record.distanceKm) : undefined,
    sellerRoles: (seller?.sellerRoles ??
      user?.sellerRoles) as string[] | undefined,
    buyerRoles: (seller?.buyerTypes ??
      user?.buyerRoles) as string[] | undefined,
  };
}

/**
 * Unified mapper — routes Product, Dish, or Legacy Listing to DiscoveryReadModel.
 * Classification always via deriveListingKind() inside entity mappers.
 */
export function mapRecordToDiscoveryReadModel(
  record: Record<string, unknown>,
  enrichment?: DiscoveryEnrichment,
): DiscoveryReadModel {
  const entityType = inferDiscoveryEntityType(record);
  const merged = { ...enrichmentFromRecord(record), ...enrichment };

  switch (entityType) {
    case 'dish':
      return mapDishToDiscoveryReadModel(record as never, merged);
    case 'listing':
      return mapLegacyListingToDiscoveryReadModel(record as never, merged);
    case 'product':
    default:
      return mapProductToDiscoveryReadModel(record as never, merged);
  }
}

export function attachDiscoveryReadModel(
  record: Record<string, unknown>,
  enrichment?: DiscoveryEnrichment,
): DiscoveryReadModel {
  const model = mapRecordToDiscoveryReadModel(record, enrichment);
  record.discovery = model;
  return model;
}
