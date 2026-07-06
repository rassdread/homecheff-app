/**
 * Activity Card visibility rules — Phase 3A.
 * All cards are private (authenticated viewer only). No SEO, no public URLs.
 */

import type { ActivityCardSurface } from './activity-card-types';

export type ActivityCardVisibilityRule = {
  surface: ActivityCardSurface;
  /** Requires authenticated session. */
  requiresAuth: boolean;
  /** Never render on public/unauthenticated pages. */
  privateOnly: true;
  /** Indexed by search engines — always false. */
  indexable: false;
  /** Max cards on this surface per page load. */
  maxVisible: number;
  notes: string;
};

export const ACTIVITY_CARD_VISIBILITY_MATRIX: Record<
  ActivityCardSurface,
  ActivityCardVisibilityRule
> = {
  home_feed: {
    surface: 'home_feed',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 2,
    notes:
      'Inline after discovery sections; guests see no activity cards. Uses discovery.futureSlots.activity_cards.',
  },
  feed_mobile_insert: {
    surface: 'feed_mobile_insert',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 1,
    notes:
      'Extends resolveHomeMobileInsert cadence — separate from promos (verticals/pulse). Phase 3B slot after item 5.',
  },
  desktop_sidebar: {
    surface: 'desktop_sidebar',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 3,
    notes:
      'Future: stack below FeedSidebarFilters in right column. Prepared for sidebar redesign — no layout change in 3A.',
  },
  profile_owner: {
    surface: 'profile_owner',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 4,
    notes: 'Owner sidepanel / completeness block companion — not on public profile HTML.',
  },
  profile_visitor: {
    surface: 'profile_visitor',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 0,
    notes:
      'Visitor-facing profile: NO activity cards in Phase 3. Cards are self-actions only.',
  },
  messages_inbox: {
    surface: 'messages_inbox',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 1,
    notes: 'Top of inbox — conversation starters, review prompts.',
  },
  messages_thread: {
    surface: 'messages_thread',
    requiresAuth: true,
    privateOnly: true,
    indexable: false,
    maxVisible: 1,
    notes: 'Contextual: leave review after deal, respond to request.',
  },
};

export function getVisibilityForSurface(
  surface: ActivityCardSurface,
): ActivityCardVisibilityRule {
  return ACTIVITY_CARD_VISIBILITY_MATRIX[surface];
}

export function isActivityCardSurfaceAllowedForGuest(
  surface: ActivityCardSurface,
): boolean {
  const rule = ACTIVITY_CARD_VISIBILITY_MATRIX[surface];
  return !rule.requiresAuth;
}

/** All surfaces are private — no public card pages. */
export const ACTIVITY_CARDS_PUBLIC_VISIBILITY = false as const;
