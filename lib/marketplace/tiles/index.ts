export type {
  MarketplaceTileModel,
  MarketplaceTileMode,
  MarketplaceTileVariant,
  MarketplaceTileMediaRatio,
  MarketplaceTilePerson,
  MarketplaceTileTrust,
  TileBadge,
  TileBadgeKind,
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
export type { BuildTileBadgesResult } from './build-tile-badges';

export {
  buildTileTrustCue,
  TILE_TRUST_CHANNEL_BY_KIND,
} from './build-tile-trust-cue';
export { buildTilePriceLine } from './build-tile-price-line';
export { formatWorkshopDateCompact } from './format-workshop-date';

export { mapGeoFeedCardToTileModel } from './map-to-tile-model';
export type { MapToTileModelOptions } from './map-to-tile-model';

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
