/**
 * Discovery Activity Cards — canonical types (Phase 3A).
 * Activity cards drive real-world marketplace participation — NOT recommendations.
 * @see docs/architecture/DISCOVERY_ACTIVITY_CARDS.md
 */

/** Seven activation categories (taxonomy). */
export type ActivityCardCategory =
  | 'social_activation'
  | 'trust_activation'
  | 'marketplace_activation'
  | 'delivery_activation'
  | 'community_activation'
  | 'profile_completion'
  | 'local_activation';

/** Canonical card identifiers — stable across surfaces. */
export type ActivityCardId =
  // A — Social Activation
  | 'share_qr_code'
  | 'start_conversation'
  | 'become_a_fan'
  | 'invite_someone'
  // B — Trust Activation
  | 'ask_for_review'
  | 'leave_review_after_deal'
  | 'respond_to_review'
  // C — Marketplace Activation
  | 'publish_first_offer'
  | 'create_first_workshop'
  | 'respond_to_request'
  | 'add_listing_media'
  // D — Delivery Activation
  | 'request_delivery'
  | 'offer_delivery'
  | 'complete_delivery_profile'
  // E — Community Activation
  | 'publish_inspiration'
  | 'engage_with_neighbor'
  // F — Profile Completion
  | 'complete_profile'
  | 'add_profile_photo'
  | 'configure_accepted_values'
  | 'add_workspace_photos'
  | 'connect_stripe'
  // G — Local Activation
  | 'set_location'
  | 'explore_nearby_requests'
  | 'invite_nearby';

/** Surfaces where cards may render (all private — no SEO/public). */
export type ActivityCardSurface =
  | 'home_feed'
  | 'feed_mobile_insert'
  | 'desktop_sidebar'
  | 'profile_owner'
  | 'profile_visitor'
  | 'messages_inbox'
  | 'messages_thread';

export type ActivityCardPriority = 'critical' | 'high' | 'normal' | 'low';

export type ActivityCardCtaKind =
  | 'navigate'
  | 'open_create_flow'
  | 'open_share_sheet'
  | 'open_conversation'
  | 'dismiss_only';

export type ActivityCardDefinition = {
  id: ActivityCardId;
  category: ActivityCardCategory;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  ctaKind: ActivityCardCtaKind;
  /** Internal route or action target — never indexed. */
  ctaHref?: string;
  priority: ActivityCardPriority;
  /** Surfaces where this card is eligible (subject to trigger + visibility). */
  allowedSurfaces: readonly ActivityCardSurface[];
  /** Trigger ids that must all pass for eligibility. */
  requiredTriggers: readonly ActivityCardTriggerId[];
  /** Any of these triggers suppress the card. */
  suppressTriggers?: readonly ActivityCardTriggerId[];
};

/** Signals evaluated to decide card eligibility. */
export type ActivityCardTriggerId =
  | 'logged_in'
  | 'guest_only'
  | 'no_listings'
  | 'has_listings'
  | 'no_reviews_received'
  | 'has_reviews_received'
  | 'profile_incomplete'
  | 'profile_complete'
  | 'no_profile_photo'
  | 'has_profile_photo'
  | 'no_location'
  | 'has_location'
  | 'favorites_without_conversations'
  | 'completed_deal_without_review'
  | 'pending_review_request'
  | 'nearby_requests_available'
  | 'no_fans'
  | 'has_fans'
  | 'no_accepted_values'
  | 'has_accepted_values'
  | 'no_inspiration_posts'
  | 'has_inspiration_posts'
  | 'no_stripe_connected'
  | 'stripe_connected'
  | 'has_seller_role'
  | 'has_delivery_profile'
  | 'no_delivery_profile'
  | 'unread_messages'
  | 'no_unread_messages'
  | 'is_seller'
  | 'is_buyer_only';

export type ActivityCardTriggerState = Partial<
  Record<ActivityCardTriggerId, boolean>
>;

export type ActivityCardEligibilityResult = {
  cardId: ActivityCardId;
  eligible: boolean;
  reason?: string;
  category: ActivityCardCategory;
  priority: ActivityCardPriority;
};

export type ActivityCardDismissKey = `activity_card_dismiss:${ActivityCardId}`;

export type ActivityCardCooldownKey = `activity_card_cooldown:${ActivityCardId}`;

/** Client-persisted dismiss (Phase 3B — localStorage until schema optional). */
export type ActivityCardDismissRecord = {
  cardId: ActivityCardId;
  dismissedAt: string;
  surface: ActivityCardSurface;
  /** Permanent dismiss vs snooze */
  mode: 'dismiss' | 'snooze';
  snoozeUntil?: string;
};

export type ActivityCardFeedPayload = {
  cards: ActivityCardFeedItem[];
  maxVisible: number;
  insertion: ActivityCardInsertionPlan;
};

export type ActivityCardFeedItem = {
  id: string;
  /** Phase 3B canonical type (e.g. UPLOAD_FIRST_LISTING). */
  type?: string;
  category: ActivityCardCategory;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  ctaKind: ActivityCardCtaKind;
  ctaHref?: string;
  priority: ActivityCardPriority;
  icon?: string;
  dismissible?: boolean;
  cooldownDays?: number;
};

export type ActivityCardInsertionPlan = {
  /** Insert after every N feed items (mobile inline). */
  cadenceItems: number;
  /** Max cards per feed session. */
  maxPerSession: number;
  /** First insert after this many items (avoid above-fold spam). */
  minItemsBeforeFirst: number;
  /** Desktop sidebar: max stacked cards. */
  sidebarMaxVisible: number;
};
