/**
 * Activity Card trigger evaluation — Phase 3A.
 * Pure functions over a trigger state snapshot (no DB in this module).
 */

import type {
  ActivityCardDefinition,
  ActivityCardEligibilityResult,
  ActivityCardId,
  ActivityCardSurface,
  ActivityCardTriggerId,
  ActivityCardTriggerState,
} from './activity-card-types';
import {
  ACTIVITY_CARD_IDS,
  ACTIVITY_CARD_REGISTRY,
  getActivityCardDefinition,
} from './activity-card-taxonomy';

const PRIORITY_RANK = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
} as const;

/**
 * Trigger matrix — documents which signals each card depends on.
 * Rows = card id; columns = trigger ids (see docs/audits/ACTIVITY_CARD_TRIGGER_MATRIX.md).
 */
export const ACTIVITY_CARD_TRIGGER_MATRIX: Record<
  ActivityCardId,
  {
    required: readonly ActivityCardTriggerId[];
    suppress?: readonly ActivityCardTriggerId[];
  }
> = Object.fromEntries(
  ACTIVITY_CARD_IDS.map((id) => {
    const def = ACTIVITY_CARD_REGISTRY[id];
    return [
      id,
      {
        required: def.requiredTriggers,
        suppress: def.suppressTriggers,
      },
    ];
  }),
) as Record<
  ActivityCardId,
  {
    required: readonly ActivityCardTriggerId[];
    suppress?: readonly ActivityCardTriggerId[];
  }
>;

function triggersPass(
  required: readonly ActivityCardTriggerId[],
  state: ActivityCardTriggerState,
): { pass: boolean; reason?: string } {
  for (const trigger of required) {
    if (state[trigger] !== true) {
      return { pass: false, reason: `missing_trigger:${trigger}` };
    }
  }
  return { pass: true };
}

function triggersSuppressed(
  suppress: readonly ActivityCardTriggerId[] | undefined,
  state: ActivityCardTriggerState,
): boolean {
  if (!suppress?.length) return false;
  return suppress.some((t) => state[t] === true);
}

export function evaluateActivityCardEligibility(
  cardId: ActivityCardId,
  state: ActivityCardTriggerState,
  surface: ActivityCardSurface,
): ActivityCardEligibilityResult {
  const def = getActivityCardDefinition(cardId);

  if (!def.allowedSurfaces.includes(surface)) {
    return {
      cardId,
      eligible: false,
      reason: 'surface_not_allowed',
      category: def.category,
      priority: def.priority,
    };
  }

  if (triggersSuppressed(def.suppressTriggers, state)) {
    return {
      cardId,
      eligible: false,
      reason: 'suppressed',
      category: def.category,
      priority: def.priority,
    };
  }

  const { pass, reason } = triggersPass(def.requiredTriggers, state);
  return {
    cardId,
    eligible: pass,
    reason: pass ? undefined : reason,
    category: def.category,
    priority: def.priority,
  };
}

export function evaluateAllActivityCards(
  state: ActivityCardTriggerState,
  surface: ActivityCardSurface,
): ActivityCardEligibilityResult[] {
  return ACTIVITY_CARD_IDS.map((id) =>
    evaluateActivityCardEligibility(id, state, surface),
  );
}

export function selectEligibleActivityCards(
  state: ActivityCardTriggerState,
  surface: ActivityCardSurface,
  limit: number,
): ActivityCardDefinition[] {
  const eligible = evaluateAllActivityCards(state, surface)
    .filter((r) => r.eligible)
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.cardId.localeCompare(b.cardId),
    )
    .slice(0, limit)
    .map((r) => getActivityCardDefinition(r.cardId));

  return eligible;
}

/** Documented signal → trigger id mapping for Phase 3B data fetchers. */
export const TRIGGER_SIGNAL_SOURCES: Record<
  ActivityCardTriggerId,
  { signal: string; source: string; forbidden?: string[] }
> = {
  logged_in: { signal: 'session.user.id', source: 'next-auth session' },
  guest_only: { signal: '!session', source: 'next-auth session' },
  no_listings: {
    signal: 'productCount === 0',
    source: 'ProfileV2Stats / seller products',
  },
  has_listings: {
    signal: 'productCount > 0',
    source: 'ProfileV2Stats / seller products',
  },
  no_reviews_received: {
    signal: 'trust.product.reviewCount === 0',
    source: 'DiscoveryTrustContract',
  },
  has_reviews_received: {
    signal: 'trust.product.reviewCount > 0',
    source: 'DiscoveryTrustContract',
  },
  profile_incomplete: {
    signal: 'completenessPercent < 100',
    source: 'computeCompletenessItems',
  },
  profile_complete: {
    signal: 'completenessPercent === 100',
    source: 'computeCompletenessItems',
  },
  no_profile_photo: {
    signal: '!profileImage',
    source: 'User.profileImage',
  },
  has_profile_photo: {
    signal: 'profileImage',
    source: 'User.profileImage',
  },
  no_location: {
    signal: '!city && !place && !lat',
    source: 'User geo fields',
  },
  has_location: {
    signal: 'city || place || lat',
    source: 'User geo fields',
  },
  favorites_without_conversations: {
    signal: 'favoriteCount > 0 && conversationCount === 0',
    source: 'Favorite + Conversation',
  },
  completed_deal_without_review: {
    signal: 'completedDeals > 0 && !buyerReviewed',
    source: 'Order + ProductReview',
  },
  pending_review_request: {
    signal: 'unansweredReviewExists',
    source: 'ProductReview seller response',
  },
  nearby_requests_available: {
    signal: 'nearbyRequestCount > 0',
    source: 'Feed listingKind REQUEST + radius',
  },
  no_fans: {
    signal: 'fansCount === 0',
    source: 'Follow where sellerId = user',
    forbidden: ['hcpPoints'],
  },
  has_fans: {
    signal: 'fansCount > 0',
    source: 'Follow',
    forbidden: ['hcpPoints'],
  },
  no_accepted_values: {
    signal: '!acceptedSpecializations.length',
    source: 'SellerProfile specializations',
  },
  has_accepted_values: {
    signal: 'acceptedSpecializations.length > 0',
    source: 'SellerProfile',
  },
  no_inspiration_posts: {
    signal: 'dishCount === 0',
    source: 'ProfileV2Stats',
  },
  has_inspiration_posts: {
    signal: 'dishCount > 0',
    source: 'ProfileV2Stats',
  },
  no_stripe_connected: {
    signal: '!stripeConnectAccountId',
    source: 'User / SellerProfile',
  },
  stripe_connected: {
    signal: 'stripeConnectAccountId',
    source: 'User / SellerProfile',
  },
  has_seller_role: {
    signal: 'sellerRoles.length > 0',
    source: 'User.sellerRoles',
  },
  has_delivery_profile: {
    signal: 'deliveryProfile != null',
    source: 'DeliveryProfile',
  },
  no_delivery_profile: {
    signal: '!deliveryProfile',
    source: 'DeliveryProfile',
  },
  unread_messages: {
    signal: 'unreadMessagesCount > 0',
    source: 'Conversation unread',
  },
  no_unread_messages: {
    signal: 'unreadMessagesCount === 0',
    source: 'Conversation unread',
  },
  is_seller: {
    signal: 'hasSellerProfile',
    source: 'SellerProfile exists',
  },
  is_buyer_only: {
    signal: '!hasSellerProfile',
    source: 'SellerProfile',
  },
};
