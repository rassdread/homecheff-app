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
export { mergeDiscoveryTrust } from './mappers/enrichment';

export {
  buildDiscoveryTrust,
  fetchSellerTrustSnapshots,
  fetchSellerTrustBundles,
  discoveryEnrichmentFromBundle,
  filterTrustBadges,
  DISCOVERY_TRUST_BADGE_SLUGS,
  type SellerTrustSnapshot,
  type BuildDiscoveryTrustInput,
} from './trust';

export {
  marketplaceCategoryToLegacyVertical,
  getDiscoveryLegacyVerticalCategory,
  getDiscoveryListingKind,
  getDiscoveryListingIntent,
  getDiscoveryFavoriteCount,
  getDiscoveryProductReviewCount,
  getDiscoverySellerTier,
  getDiscoveryTrustBadges,
  getDiscoveryMarketplaceCategory,
  getDiscoverySpecializations,
  matchesDiscoveryVerticalSlug,
  toSearchableListingRecord,
  type WithOptionalDiscovery,
} from './consumer-accessors';

export type {
  DiscoveryRankingProfileId,
  RankDiscoveryOptions,
  RankedDiscoveryItem,
  RankingViewerContext,
  DiscoveryRankingProfile,
} from './ranking';

export {
  rankDiscoveryItems,
  rankDiscoveryReadModels,
  sortDiscoveryReadModels,
  scoreDiscoveryItem,
  getRankingProfile,
  listRankingProfiles,
  toDiscoveryRankingInput,
  assertRankingInputPurity,
  FAVORITE_RANK_CAP,
  forbiddenRankingSignals,
  LEGACY_FORBIDDEN_RANKING_KEYS,
} from './ranking';

export type {
  DiscoverySectionId,
  SectionEligibilitySpec,
  DiscoverySectionDefinition,
  BuildSectionOptions,
  BuildAllSectionsOptions,
  SectionEligibilityCounts,
  TrustedMakersAudit,
  DiscoverySectionAudit,
  DiscoverySectionResult,
} from './sections';

export {
  DISCOVERY_SECTION_REGISTRY,
  DISCOVERY_SECTION_IDS,
  getDiscoverySectionDefinition,
  listDiscoverySectionDefinitions,
  filterSectionCandidates,
  buildDiscoverySection,
  buildAllDiscoverySections,
  auditDiscoverySection,
  auditAllDiscoverySections,
} from './sections';
