export type {
  MarketplaceTileModel,
  MarketplaceTileMode,
  MarketplaceTileVariant,
  MarketplaceTileMediaRatio,
  MarketplaceTilePerson,
  MarketplaceTileTrust,
  TileBadge,
  TileBadgeKind,
  TileBadgeIconKind,
  TileBarterRenderSlot,
  BuildTileBadgesResult,
  TileTrustCue,
  TranslateFn,
} from './types';

export {
  TILE_BADGE_PRIORITY,
  TILE_BADGE_MAX,
  type TileBadgeVariant,
} from './tile-badge-priority';
export {
  TILE_TRUST_FORBIDDEN_FIELDS,
  getPrimaryTrustCount,
  shouldShowTrustCue,
  usesProductTrustChannel,
  usesDealTrustChannel,
  usesRequesterTrustChannel,
} from './tile-trust-rules';

export { buildTileBadges } from './build-tile-badges';

export {
  buildTileTrustCue,
  TILE_TRUST_CHANNEL_BY_KIND,
} from './build-tile-trust-cue';
export { buildTilePriceLine } from './build-tile-price-line';
export { buildTileValueRow } from './build-tile-value-row';
export type { TileValueRowData } from './build-tile-value-row';
export {
  buildTileAcceptedValueIcons,
  ACCEPTED_VALUE_ICON_MAX,
} from './build-tile-accepted-value-icons';
export type {
  TileAcceptedValueIcon,
  TileAcceptedValueIconsResult,
} from './build-tile-accepted-value-icons';
export { resolveTileOfferCategoryBadge } from './resolve-tile-offer-category-badge';
export type { TileOfferCategoryBadge } from './resolve-tile-offer-category-badge';
export {
  trackMarketplaceTileValueRowSeen,
  tileValueAnalyticsFromModel,
} from './tile-value-analytics';
export { formatWorkshopDateCompact } from './format-workshop-date';

export { mapGeoFeedCardToTileModel } from './map-to-tile-model';
export type { MapToTileModelOptions } from './map-to-tile-model';
export { resolveTileValueExchangeFields } from './resolve-tile-value-exchange';
export type { TileValueExchangeFields } from './resolve-tile-value-exchange';
export {
  resolveTileOfferTaxonomyBadge,
  resolveTileAcceptedTaxonomyBadges,
} from './resolve-tile-badge-icon';
export type { ResolvedTileTaxonomyBadge } from './resolve-tile-badge-icon';

export { mapProfileListingToTileModel } from './map-profile-listing-to-tile-model';
export type {
  ProfileListingInput,
  MapProfileListingOptions,
} from './map-profile-listing-to-tile-model';

export { mapFavoriteRecordToTileModel } from './map-favorite-to-tile-model';
export type { FavoriteApiRecord } from './map-favorite-to-tile-model';

export { inspirationApiToCardItem } from './map-inspiration-api';

export const TILE_FIXTURE_LISTING_KINDS = [
  'PRODUCT',
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
  'REQUEST',
  'INSPIRATION',
] as const;

export const TILE_VARIANTS = [
  'compact',
  'standard',
  'mini',
  'sidebar',
] as const;
