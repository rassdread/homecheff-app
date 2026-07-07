export type {
  ExchangeOfferModel,
  ExchangeAcceptanceModel,
  ExchangeListingProfile,
  ExchangeOverlapResult,
  ForbiddenExchangeScoreSignal,
} from './exchange-contract';

export {
  EXCHANGE_MATCHING_SPEC_VERSION,
  FORBIDDEN_EXCHANGE_SCORE_SIGNALS,
  exchangeProfileId,
  exchangeMatchId,
} from './exchange-contract';

export type {
  ExchangeMatchType,
  ExchangeMatchResult,
  ExchangeMatchDimension,
} from './exchange-match-types';

export {
  EXCHANGE_MATCH_TYPES,
  resolvePrimaryMatchType,
  matchTypePriority,
  describeMatchType,
} from './exchange-match-types';

export type {
  ExchangeEligibilityInput,
  ExchangeEligibilityResult,
} from './exchange-eligibility';

export {
  isValidBarterConfiguration,
  evaluateExchangeEligibility,
  profileIsExchangeEligible,
  bothProfilesEligibleForMatching,
} from './exchange-eligibility';

export {
  computeExchangeOverlap,
  mainCategoryFromTaxonomyIds,
  mainCategoryForSubcategory,
} from './exchange-overlap';

export type {
  ExchangeScoreSignals,
  ExchangeScoreWeights,
} from './exchange-match-score';

export {
  DEFAULT_EXCHANGE_SCORE_WEIGHTS,
  scoreCategoryOverlap,
  scoreSubcategoryOverlap,
  scoreDesiredExchangeOverlap,
  scoreDistance,
  scoreAvailability,
  scoreTrustEligibility,
  scoreRecency,
  buildExchangeScoreSignals,
  computeExchangeMatchScore,
  scorePayloadIsClean,
} from './exchange-match-score';

export type {
  ExchangeGraphNode,
  ExchangeGraphEdge,
  ExchangeGraph,
  ExchangeChainPath,
} from './exchange-graph';

export {
  EXCHANGE_GRAPH_MAX_CHAIN_LENGTH,
  graphNodeId,
  graphEdgeId,
  buildExchangeGraph,
  dedupeGraphEdges,
  validateExchangeGraphIntegrity,
  findExchangeChainPaths,
} from './exchange-graph';

export type { ExchangeSignalKind, ExchangeSignal } from './exchange-signals';

export {
  EXCHANGE_SIGNAL_KINDS,
  deriveExchangeSignals,
  listExchangeSignalKinds,
} from './exchange-signals';

export type {
  BuildExchangeProfileInput,
  ResolveExchangeMatchInput,
  ResolvedExchangeMatch,
} from './exchange-resolver';

export {
  buildExchangeOfferModel,
  buildExchangeAcceptanceModel,
  buildExchangeListingProfile,
  shouldSuppressMatchPair,
  resolveExchangeMatch,
  findExchangeMatchesForListing,
  buildExchangeGraphFromMatches,
  exchangeProfileSummary,
} from './exchange-resolver';

export {
  EXCHANGE_FUNNEL_EVENTS,
  buildExchangeFunnelPayload,
  getExchangeFunnelDevice,
  trackExchangeFunnelEvent,
  validateExchangeFunnelAnalyticsRegistry,
} from './exchange-funnel-analytics';

export type {
  ExchangeFunnelEventName,
  ExchangeFunnelSurface,
  ExchangeFunnelDevice,
  ExchangeFunnelTrackInput,
  ExchangeFunnelListingInput,
} from './exchange-funnel-analytics';
