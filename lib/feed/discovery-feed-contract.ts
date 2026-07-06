/**
 * Discovery feed response contract — Phase 2E.
 * Extends flat feed items with section blocks; ready for activity cards + recommendations slots.
 */

import type { DiscoverySectionId } from '@/lib/discovery/sections';

/** One ranked discovery section in the feed payload. */
export type DiscoveryFeedSectionBlock = {
  sectionId: DiscoverySectionId;
  titleKey: string;
  rankingProfileId: string;
  /** Listing ids in ranked order (post-dedup). */
  listingIds: string[];
  /** Seller user ids represented in this section (audit / dedup). */
  sellerIds: string[];
};

/** Reserved slot types for future feed extensions. */
export type DiscoveryFeedFutureSlot =
  | { kind: 'activity_cards'; enabled: false }
  | { kind: 'recommendations'; enabled: false };

export type DiscoveryFeedInsertionSurface = 'mobile' | 'desktop';

export type DiscoveryFeedInsertionPlan = {
  surface: DiscoveryFeedInsertionSurface;
  /** Section ids in display order. */
  sectionOrder: DiscoverySectionId[];
  /** Mobile: min grid items between inline section bands. */
  itemsBetweenSections: number;
  /** Desktop: all sections render as leading bands. */
  leadingSectionsOnDesktop: boolean;
};

export type DiscoveryFeedDedupSummary = {
  listingsRemovedCrossSection: number;
  listingsRemovedPerSellerCap: number;
  sellersCapped: number;
};

export type DiscoveryFeedBuildMetrics = {
  candidateCount: number;
  marketplaceCount: number;
  sectionBuildMs: number;
  dedupMs: number;
  perSection: Partial<
    Record<DiscoverySectionId, { candidates: number; selected: number }>
  >;
};

/** Canonical discovery block on /api/feed responses. */
export type DiscoveryFeedPayload = {
  version: 1;
  sections: DiscoveryFeedSectionBlock[];
  /** Flat authoritative listing order when discovery smart mode is active. */
  orderedListingIds: string[];
  insertion: DiscoveryFeedInsertionPlan;
  dedup: DiscoveryFeedDedupSummary;
  metrics?: DiscoveryFeedBuildMetrics;
  futureSlots: DiscoveryFeedFutureSlot[];
};

export const DISCOVERY_FEED_CONTRACT_VERSION = 1 as const;

export const DISCOVERY_FEED_FUTURE_SLOTS: DiscoveryFeedFutureSlot[] = [
  { kind: 'activity_cards', enabled: false },
  { kind: 'recommendations', enabled: false },
];
