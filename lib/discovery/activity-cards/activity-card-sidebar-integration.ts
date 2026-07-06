/**
 * Activity Card sidebar integration — Phase 3A design (no UI changes).
 */

import type { ActivityCardSurface } from './activity-card-types';

export type ActivityCardSidebarPlacement = {
  surface: 'desktop_sidebar';
  /** DOM anchor — future sidebar redesign */
  anchor: 'below_feed_filters' | 'above_community_pulse';
  maxStacked: 3;
  /** Collapse to single "actions" accordion when > 2 cards */
  collapseThreshold: 2;
  priorityOrder: ('profile_completion' | 'trust_activation' | 'marketplace_activation')[];
};

export const ACTIVITY_CARD_SIDEBAR_PLACEMENT: ActivityCardSidebarPlacement = {
  surface: 'desktop_sidebar',
  anchor: 'below_feed_filters',
  maxStacked: 3,
  collapseThreshold: 2,
  priorityOrder: [
    'profile_completion',
    'trust_activation',
    'marketplace_activation',
  ],
};

export type ActivityCardMobilePlacement = {
  surfaces: Extract<
    ActivityCardSurface,
    'feed_mobile_insert' | 'home_feed'
  >[];
  /** Shares feed insert pipeline with promos but separate resolver */
  resolver: 'resolveActivityCardMobileInsert';
  /** Never mix with promo:verticals at index 1 */
  minFeedIndex: 5;
  maxPerSession: 2;
};

export const ACTIVITY_CARD_MOBILE_PLACEMENT: ActivityCardMobilePlacement = {
  surfaces: ['feed_mobile_insert', 'home_feed'],
  resolver: 'resolveActivityCardMobileInsert',
  minFeedIndex: 5,
  maxPerSession: 2,
};

/**
 * Sidebar redesign readiness:
 * - FeedSidebarFilters stays filter-only in 3A
 * - ActivityCardSidebarStack component (3B) slots into `homeComposedLayout` right column
 * - No coupling to discovery section registry ranking
 */
