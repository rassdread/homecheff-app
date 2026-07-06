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
