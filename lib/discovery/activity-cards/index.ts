export type {
  ActivityCardCategory,
  ActivityCardId,
  ActivityCardSurface,
  ActivityCardPriority,
  ActivityCardCtaKind,
  ActivityCardDefinition,
  ActivityCardTriggerId,
  ActivityCardTriggerState,
  ActivityCardEligibilityResult,
  ActivityCardDismissRecord,
  ActivityCardFeedPayload,
  ActivityCardFeedItem,
  ActivityCardInsertionPlan,
} from './activity-card-types';

export type {
  ActivityCardType,
  ActivityCardContract,
  ActivityCardEligibilityInput,
  ActivityCardEligibilityMeta,
  ActivityCardTypeDefinition,
} from './activity-card-contract';

export {
  ACTIVITY_CARD_TYPES,
  activityCardInstanceId,
} from './activity-card-contract';

export {
  ACTIVITY_CARD_TYPE_REGISTRY,
  listActivityCardTypeDefinitions,
} from './activity-card-type-registry';

export {
  evaluateActivityCardTypeEligibility,
  resolveActivityCardContracts,
  ACTIVITY_CARD_SESSION_MAX,
  ACTIVITY_CARD_VISIBLE_MAX,
} from './resolve-activity-card-contracts';

export type {
  ActivityCardCooldownState,
  ResolveActivityCardsOptions,
} from './resolve-activity-card-contracts';

export { buildActivityCardsFeedSlot } from './build-activity-cards-feed-slot';

export {
  fetchActivityCardEligibilityInput,
  countNearbyRequestsInPool,
} from './fetch-activity-card-eligibility';

export {
  PHASE_3B_ACTIVITY_CARD_INSERTION,
  ACTIVITY_CARD_MOBILE_INSERTION,
  ACTIVITY_CARD_DESKTOP_INSERTION,
  shouldInsertActivityCardAfterSaleIndex,
} from './activity-card-insertion-planner';

export {
  readActivityCardSessionState,
  recordActivityCardShown,
  recordActivityCardDismissed,
  filterCardsForSession,
  readActivityCardCooldownState,
} from './activity-card-client-storage';

export { trackActivityCardEvent } from './activity-card-analytics';
export type { ActivityCardAnalyticsEvent } from './activity-card-analytics';

export {
  ACTIVITY_CARD_CATEGORIES,
  ACTIVITY_CARD_REGISTRY,
  ACTIVITY_CARD_IDS,
  getActivityCardDefinition,
  listActivityCardsByCategory,
} from './activity-card-taxonomy';

export {
  ACTIVITY_CARD_TRIGGER_MATRIX,
  TRIGGER_SIGNAL_SOURCES,
  evaluateActivityCardEligibility,
  evaluateAllActivityCards,
  selectEligibleActivityCards,
} from './activity-card-triggers';

export {
  ACTIVITY_CARD_VISIBILITY_MATRIX,
  ACTIVITY_CARDS_PUBLIC_VISIBILITY,
  getVisibilityForSurface,
  isActivityCardSurfaceAllowedForGuest,
} from './activity-card-visibility';

export type { ActivityCardVisibilityRule } from './activity-card-visibility';

export {
  DEFAULT_ACTIVITY_CARD_INSERTION,
  MOBILE_ACTIVITY_CARD_FEED_SLOTS,
  ACTIVITY_CARD_FEED_INTEGRATION,
} from './activity-card-feed-integration';

export type {
  ActivityCardFeedIntegrationSpec,
} from './activity-card-feed-integration';

export {
  ACTIVITY_CARD_SIDEBAR_PLACEMENT,
  ACTIVITY_CARD_MOBILE_PLACEMENT,
} from './activity-card-sidebar-integration';

export type {
  ActivityCardSidebarPlacement,
  ActivityCardMobilePlacement,
} from './activity-card-sidebar-integration';

export {
  DEFAULT_ACTIVITY_CARD_ANTI_SPAM,
  PRIORITY_COOLDOWN_OVERRIDES,
  ACTIVITY_CARD_DISMISS_STORAGE,
  dismissStorageKey,
  impressionStorageKey,
  isCardInCooldown,
} from './activity-card-anti-spam';

export type { ActivityCardAntiSpamConfig } from './activity-card-anti-spam';

export {
  ACTIVITY_CARD_DATA_SIGNALS,
  FORBIDDEN_ACTIVITY_CARD_SIGNALS,
  BATCHABLE_ACTIVITY_CARD_SIGNALS,
} from './activity-card-data-requirements';

export type { ActivityCardDataSignal } from './activity-card-data-requirements';
