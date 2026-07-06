/**
 * Discovery feed response contract — Phase 2E + 3A activity card slot.
 * Extends flat feed items with section blocks; activity cards architecture defined in 3A.
 */

import type { DiscoverySectionId } from '@/lib/discovery/sections';
/**
 * Discovery activity cards slot — Phase 3B enabled.
 */

import type { ActivityCardInsertionPlan } from '@/lib/discovery/activity-cards/activity-card-types';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import { PHASE_3B_ACTIVITY_CARD_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { SURFACE_ROUTER_SPEC_VERSION } from '@/lib/discovery/surfaces/surface-contract';

/** Activity cards slot — Phase 3B via discovery.futureSlots.activity_cards. */
export type DiscoveryActivityCardsSlot =
  | {
      kind: 'activity_cards';
      enabled: false;
      specVersion: 1 | 2;
      insertion: ActivityCardInsertionPlan;
    }
  | {
      kind: 'activity_cards';
      enabled: true;
      specVersion: 2;
      cards: ActivityCardFeedItem[];
      maxVisible: number;
      insertion: ActivityCardInsertionPlan;
      mobileSlots?: readonly number[];
      desktopBetweenSections?: { betweenSections: boolean; maxBands: number };
    };

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

/** Surface router slot — Phase 3E via discovery.futureSlots.surfaces. */
export type DiscoverySurfacesSlot =
  | {
      kind: 'surfaces';
      enabled: false;
      specVersion: typeof SURFACE_ROUTER_SPEC_VERSION;
    }
  | {
      kind: 'surfaces';
      enabled: true;
      specVersion: typeof SURFACE_ROUTER_SPEC_VERSION;
      plan: ResolvedSurfacePlan;
    };

/** Reserved slot types for future feed extensions. */
export type DiscoveryFeedFutureSlot =
  | DiscoveryActivityCardsSlot
  | DiscoverySurfacesSlot
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
  {
    kind: 'activity_cards',
    enabled: false,
    specVersion: 2,
    insertion: PHASE_3B_ACTIVITY_CARD_INSERTION,
  },
  {
    kind: 'surfaces',
    enabled: false,
    specVersion: SURFACE_ROUTER_SPEC_VERSION,
  },
  { kind: 'recommendations', enabled: false },
];
