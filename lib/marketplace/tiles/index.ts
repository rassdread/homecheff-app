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

export { TILE_BADGE_PRIORITY, TILE_BADGE_MAX } from './tile-badge-priority';
export {
  TILE_TRUST_FORBIDDEN_FIELDS,
  getPrimaryTrustCount,
  shouldShowTrustCue,
  usesProductTrustChannel,
  usesDealTrustChannel,
} from './tile-trust-rules';

export { buildTileBadges } from './build-tile-badges';
export type { BuildTileBadgesResult } from './build-tile-badges';

export { buildTileTrustCue } from './build-tile-trust-cue';
export { buildTilePriceLine } from './build-tile-price-line';

export { mapGeoFeedCardToTileModel } from './map-to-tile-model';
export type { MapToTileModelOptions } from './map-to-tile-model';

export { inspirationApiToCardItem } from './map-inspiration-api';

/** Fixture listing kinds validated by scripts/validate-marketplace-tiles.ts */
export const TILE_FIXTURE_LISTING_KINDS = [
  'PRODUCT',
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
  'REQUEST',
  'INSPIRATION',
] as const;

export const TILE_VARIANTS = ['compact', 'standard'] as const;
