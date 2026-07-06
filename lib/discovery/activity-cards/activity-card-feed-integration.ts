/**
 * Activity Card feed integration — Phase 3A slot strategy.
 * Uses discoveryFeed.futureSlots.activity_cards (Phase 2E contract).
 */

import type { ActivityCardInsertionPlan } from './activity-card-types';
import type { ActivityCardSurface } from './activity-card-types';

/** Default insertion when activity_cards slot is enabled (Phase 3B). */
export const DEFAULT_ACTIVITY_CARD_INSERTION: ActivityCardInsertionPlan = {
  /** Mobile: one card band every 8 feed items (after discovery section inserts). */
  cadenceItems: 8,
  maxPerSession: 3,
  /** Never before item 4 — avoid competing with hero discovery sections. */
  minItemsBeforeFirst: 4,
  sidebarMaxVisible: 3,
};

/**
 * Feed insert positions (mobile) — complements discovery section bands.
 * Discovery sections use itemsBetweenSections (6); activity cards offset to reduce clash.
 */
export const MOBILE_ACTIVITY_CARD_FEED_SLOTS = [
  { afterFeedIndex: 5, surface: 'feed_mobile_insert' as const },
  { afterFeedIndex: 13, surface: 'feed_mobile_insert' as const },
  { afterFeedIndex: 21, surface: 'feed_mobile_insert' as const },
] as const;

export type ActivityCardFeedIntegrationSpec = {
  /** Maps to DiscoveryFeedFutureSlot.kind === 'activity_cards' */
  contractSlot: 'activity_cards';
  enabled: false;
  insertion: ActivityCardInsertionPlan;
  /** Dedup: same card id not shown twice in one feed render. */
  dedupeByCardId: true;
  /** Dedup: max one card per category per feed session. */
  dedupeByCategory: true;
  /** Cross-section: activity cards never duplicate discovery section listing ids. */
  excludeDiscoveryListingIds: true;
  surfaces: {
    desktop: ActivityCardSurface[];
    mobile: ActivityCardSurface[];
  };
};

export const ACTIVITY_CARD_FEED_INTEGRATION: ActivityCardFeedIntegrationSpec = {
  contractSlot: 'activity_cards',
  enabled: false,
  insertion: DEFAULT_ACTIVITY_CARD_INSERTION,
  dedupeByCardId: true,
  dedupeByCategory: true,
  excludeDiscoveryListingIds: true,
  surfaces: {
    desktop: ['home_feed', 'desktop_sidebar'],
    mobile: ['home_feed', 'feed_mobile_insert'],
  },
};

/**
 * Phase 3B API shape extension (documentation only — not wired yet):
 *
 * discovery.futureSlots[activity_cards] → {
 *   kind: 'activity_cards',
 *   enabled: true,
 *   cards: ActivityCardFeedItem[],
 *   maxVisible: 2,
 *   insertion: ActivityCardInsertionPlan,
 * }
 */
