export type {
  DiscoverySectionId,
  SectionEligibilitySpec,
  DiscoverySectionDefinition,
  BuildSectionOptions,
  SectionEligibilityCounts,
  TrustedMakersAudit,
  DiscoverySectionAudit,
  DiscoverySectionResult,
} from './section-types';

export {
  DISCOVERY_SECTION_REGISTRY,
  DISCOVERY_SECTION_IDS,
  getDiscoverySectionDefinition,
  listDiscoverySectionDefinitions,
} from './section-registry';

export {
  filterSectionCandidates,
  buildDiscoverySection,
  buildAllDiscoverySections,
  auditDiscoverySection,
  auditAllDiscoverySections,
} from './build-section';

export type { BuildAllSectionsOptions } from './build-section';
