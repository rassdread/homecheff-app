export type {
  DiscoveryReadModel,
  DiscoveryEntityType,
  DiscoveryListingIntent,
  DiscoveryTrustBlock,
  DiscoverySocialBlock,
  DiscoveryCapabilityBlock,
  DiscoveryTrustBadge,
  WithDiscoveryReadModel,
} from './contracts/discovery-read-model';

export type {
  TrustTierLevel,
  DiscoveryTrustChannelBlock,
  DiscoveryTrustContract,
  DiscoveryTrustForbiddenSignal,
} from './contracts/discovery-trust-contract';

export {
  TRUST_TIER_UNKNOWN,
  TRUST_TIER_PRESENT,
  TRUST_TIER_ACTIVE,
  TRUST_TIER_REVIEWED,
  TRUST_TIER_ESTABLISHED,
  TRUST_TIER_EXPERT,
  EMPTY_TRUST_CHANNEL,
  EMPTY_DISCOVERY_TRUST_CONTRACT,
  DISCOVERY_TRUST_FORBIDDEN_SIGNALS,
} from './contracts/discovery-trust-contract';

export type {
  DiscoveryRankingSignalId,
  DiscoveryRankingForbiddenSignalId,
  DiscoveryRankingInput,
  RankingSignalUse,
  DiscoveryRankingSignalRule,
} from './contracts/discovery-ranking-contract';

export {
  DISCOVERY_RANKING_FORBIDDEN_SIGNALS,
} from './contracts/discovery-ranking-contract';

export {
  EMPTY_DISCOVERY_TRUST,
  EMPTY_DISCOVERY_SOCIAL,
  EMPTY_DISCOVERY_CAPABILITY,
} from './contracts/discovery-read-model';

export {
  mapProductToDiscoveryReadModel,
  type ProductDiscoverySource,
} from './mappers/from-product';

export {
  mapDishToDiscoveryReadModel,
  type DishDiscoverySource,
} from './mappers/from-dish';

export {
  mapLegacyListingToDiscoveryReadModel,
  type LegacyListingDiscoverySource,
} from './mappers/from-legacy-listing';

export {
  mapRecordToDiscoveryReadModel,
  attachDiscoveryReadModel,
  inferDiscoveryEntityType,
  enrichmentFromRecord,
} from './mappers/from-record';

export type { DiscoveryEnrichment } from './mappers/enrichment';

export {
  marketplaceCategoryToLegacyVertical,
  getDiscoveryLegacyVerticalCategory,
  getDiscoveryListingKind,
  getDiscoveryListingIntent,
  getDiscoveryFavoriteCount,
  getDiscoveryProductReviewCount,
  getDiscoveryMarketplaceCategory,
  getDiscoverySpecializations,
  matchesDiscoveryVerticalSlug,
  toSearchableListingRecord,
  type WithOptionalDiscovery,
} from './consumer-accessors';
