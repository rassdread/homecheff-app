/**
 * Build discovery feed payload from enriched marketplace items.
 * Phase 2E — server-authoritative section generation + dedup.
 */

import type { DiscoveryReadModel } from '@/lib/discovery/contracts/discovery-read-model';
import {
  buildAllDiscoverySections,
  type DiscoverySectionId,
} from '@/lib/discovery/sections';
import type { RankingViewerContext } from '@/lib/discovery/ranking';
import { isMarketplaceSaleItem } from '@/lib/feed/marketplace-sale';
import type {
  DiscoveryFeedPayload,
  DiscoveryFeedBuildMetrics,
} from './discovery-feed-contract';
import {
  DISCOVERY_FEED_CONTRACT_VERSION,
  DISCOVERY_FEED_FUTURE_SLOTS,
} from './discovery-feed-contract';
import {
  deduplicateDiscoverySections,
  DEFAULT_DISCOVERY_DEDUP_CONFIG,
} from './discovery-section-dedup';
import {
  buildDiscoveryInsertionPlan,
  DISCOVERY_SECTION_DISPLAY_ORDER,
} from './discovery-section-insertion';

export const FEED_DISCOVERY_POOL_CAP = 80;

export type BuildDiscoveryFeedInput = {
  items: Record<string, unknown>[];
  viewer?: RankingViewerContext;
  radiusKm: number;
  extractSellerUserId: (item: Record<string, unknown>) => string | null;
  surface?: 'mobile' | 'desktop';
};

function readDiscovery(
  item: Record<string, unknown>,
): DiscoveryReadModel | null {
  const d = item.discovery;
  if (!d || typeof d !== 'object') return null;
  return d as DiscoveryReadModel;
}

/**
 * Build canonical discovery feed blocks from enriched feed items.
 */
export function buildDiscoveryFeed(
  input: BuildDiscoveryFeedInput,
): DiscoveryFeedPayload | null {
  const t0 = performance.now();
  const marketplace = input.items
    .filter((item) => isMarketplaceSaleItem(item))
    .slice(0, FEED_DISCOVERY_POOL_CAP);

  const readModels: DiscoveryReadModel[] = [];
  const sellerIdByListingId = new Map<string, string>();

  for (const item of marketplace) {
    const rm = readDiscovery(item);
    if (!rm) continue;
    readModels.push(rm);
    const sellerId = input.extractSellerUserId(item);
    if (sellerId) sellerIdByListingId.set(rm.id, sellerId);
  }

  if (readModels.length === 0) return null;

  const viewer: RankingViewerContext = {
    ...input.viewer,
    radiusKm: input.viewer?.radiusKm ?? input.radiusKm,
  };

  const sectionT0 = performance.now();
  const rawSections = buildAllDiscoverySections(readModels, {
    viewer,
    sectionIds: DISCOVERY_SECTION_DISPLAY_ORDER,
  });
  const sectionBuildMs = performance.now() - sectionT0;

  const dedupT0 = performance.now();
  const { sections: deduped, summary } = deduplicateDiscoverySections(
    rawSections,
    sellerIdByListingId,
    DEFAULT_DISCOVERY_DEDUP_CONFIG,
  );
  const dedupMs = performance.now() - dedupT0;

  const orderedListingIds: string[] = [];
  const seen = new Set<string>();
  for (const section of deduped) {
    for (const id of section.listingIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      orderedListingIds.push(id);
    }
  }

  for (const rm of readModels) {
    if (!seen.has(rm.id)) {
      orderedListingIds.push(rm.id);
      seen.add(rm.id);
    }
  }

  const perSection: DiscoveryFeedBuildMetrics['perSection'] = {};
  for (const raw of rawSections) {
    const selected =
      deduped.find((d) => d.sectionId === raw.sectionId)?.listingIds.length ??
      0;
    perSection[raw.sectionId] = {
      candidates: raw.ranked.length,
      selected,
    };
  }

  const surface = input.surface ?? 'desktop';
  const availableIds = deduped.map((s) => s.sectionId);

  return {
    version: DISCOVERY_FEED_CONTRACT_VERSION,
    sections: deduped.map((s) => ({
      sectionId: s.sectionId,
      titleKey: s.titleKey,
      rankingProfileId: s.rankingProfileId,
      listingIds: s.listingIds,
      sellerIds: s.sellerIds,
    })),
    orderedListingIds,
    insertion: buildDiscoveryInsertionPlan(surface, availableIds),
    dedup: summary,
    metrics: {
      candidateCount: input.items.length,
      marketplaceCount: readModels.length,
      sectionBuildMs: Math.round(sectionBuildMs * 100) / 100,
      dedupMs: Math.round(dedupMs * 100) / 100,
      perSection,
    },
    futureSlots: DISCOVERY_FEED_FUTURE_SLOTS,
  };
}

/** Reorder feed items to match discovery authoritative order. */
export function reorderFeedItemsByDiscovery<T extends { id: string }>(
  items: T[],
  orderedListingIds: string[],
): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of orderedListingIds) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    out.push(item);
    seen.add(id);
  }
  for (const item of items) {
    if (!seen.has(item.id)) out.push(item);
  }
  return out;
}
