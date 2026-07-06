/**
 * Activity Card data requirements — Phase 3A audit.
 * Lists signals needed for trigger evaluation. NO HCP signals.
 */

export type ActivityCardDataSignal = {
  id: string;
  description: string;
  source: string;
  batchable: boolean;
  /** Explicitly forbidden for activity card eligibility */
  forbidden: boolean;
};

/**
 * Required data signals for Phase 3B fetchers.
 * Grouped by domain — all batch-friendly where possible.
 */
export const ACTIVITY_CARD_DATA_SIGNALS: ActivityCardDataSignal[] = [
  // Profile
  {
    id: 'profile.completeness',
    description: 'Completeness percent + item checklist',
    source: 'computeCompletenessItems (profile-v2)',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'profile.photo',
    description: 'profileImage present',
    source: 'User.profileImage',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'profile.location',
    description: 'city, place, or lat/lng',
    source: 'User geo fields',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'profile.accepted_values',
    description: 'acceptedSpecializations on seller',
    source: 'SellerProfile / Product',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'profile.workspace_photos',
    description: 'Workspace photo counts per role',
    source: 'WorkspacePhotoCounts',
    batchable: true,
    forbidden: false,
  },
  // Trust (DiscoveryTrustContract — no blended rating)
  {
    id: 'trust.seller_tier',
    description: 'trust.sellerTier',
    source: 'DiscoveryTrustContract',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'trust.product_reviews',
    description: 'trust.product.reviewCount',
    source: 'DiscoveryTrustContract',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'trust.deal_reviews',
    description: 'trust.deal.reviewCount',
    source: 'DiscoveryTrustContract',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'trust.completed_deals',
    description: 'trust.completedDeals',
    source: 'DiscoveryTrustContract',
    batchable: true,
    forbidden: false,
  },
  // Social (no HCP)
  {
    id: 'social.fans_count',
    description: 'Followers as seller',
    source: 'Follow.sellerId count',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'social.favorites_given',
    description: 'User favorites count',
    source: 'Favorite table',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'social.conversations',
    description: 'Conversation participation count',
    source: 'Conversation / Message',
    batchable: true,
    forbidden: false,
  },
  // Marketplace
  {
    id: 'marketplace.listing_count',
    description: 'Active product + listing count',
    source: 'ProfileV2Stats.products',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'marketplace.inspiration_count',
    description: 'Published dish count',
    source: 'ProfileV2Stats.dishes',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'marketplace.nearby_requests',
    description: 'REQUEST listings within viewer radius',
    source: 'Feed pool + listingKind filter',
    batchable: true,
    forbidden: false,
  },
  // Deals & reviews
  {
    id: 'deals.completed_unreviewed',
    description: 'Completed orders without buyer review',
    source: 'Order + ProductReview',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'reviews.pending_response',
    description: 'Reviews awaiting seller response',
    source: 'ProductReview',
    batchable: true,
    forbidden: false,
  },
  // Delivery
  {
    id: 'delivery.profile',
    description: 'DeliveryProfile exists + verified',
    source: 'DeliveryProfile',
    batchable: true,
    forbidden: false,
  },
  {
    id: 'delivery.active_count',
    description: 'Active delivery assignments',
    source: 'DeliveryAssignment',
    batchable: true,
    forbidden: false,
  },
  // Messages
  {
    id: 'messages.unread_count',
    description: 'Unread message count',
    source: 'Conversation unread',
    batchable: true,
    forbidden: false,
  },
  // Payments
  {
    id: 'stripe.connected',
    description: 'Stripe Connect account linked',
    source: 'User.stripeConnectAccountId',
    batchable: true,
    forbidden: false,
  },
  // Explicitly forbidden
  {
    id: 'gamification.hcp_points',
    description: 'HCP balance or tier',
    source: 'GamificationState',
    batchable: false,
    forbidden: true,
  },
  {
    id: 'gamification.hcp_badges',
    description: 'HCP badge unlocks as card trigger',
    source: 'UserBadge',
    batchable: false,
    forbidden: true,
  },
  {
    id: 'analytics.view_count',
    description: 'View counts for card ranking',
    source: 'AnalyticsEvent',
    batchable: false,
    forbidden: true,
  },
];

export const FORBIDDEN_ACTIVITY_CARD_SIGNALS = ACTIVITY_CARD_DATA_SIGNALS.filter(
  (s) => s.forbidden,
).map((s) => s.id);

export const BATCHABLE_ACTIVITY_CARD_SIGNALS = ACTIVITY_CARD_DATA_SIGNALS.filter(
  (s) => s.batchable && !s.forbidden,
);
