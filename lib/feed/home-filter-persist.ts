/**
 * Homepage discovery filter persistence — Phase 10D.
 *
 * Single snapshot shape for `hc_feed_surfaces_v2` → surface `home`.
 * Composes legacy scope migration + canonical category/chip migration.
 */

import type { DiscoveryDirection } from '@/components/feed/DiscoveryDirectionToggle';
import type { FeedScope } from '@/lib/feed/feed-scope';
import { migrateHomeFeedPersist } from '@/lib/feed/feed-scope';
import {
  migrateLegacyServicesViewChip,
  normalizeDiscoveryCategorySlug,
} from '@/lib/marketplace/canonical-model';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';

export type HomeFeedChip = 'all' | 'sale' | 'inspiration' | 'gezocht';

export type HomeFilterPersist = {
  feedChip?: unknown;
  radius?: number;
  scope?: string;
  nationalView?: boolean;
  radiusMode?: string;
  category?: string;
  sortBy?: 'newest' | 'price' | 'views' | 'distance';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  q?: string;
  place?: string;
  priceMin?: string;
  priceMax?: string;
  showFilters?: boolean;
  /** Phase 10D — reverse-discovery direction (want | offer). */
  discoveryDirection?: unknown;
  /** Phase 10D — accepted-value taxonomy ids (OR filter). */
  acceptedValues?: unknown;
};

export function normalizeHomeFeedChip(chip: unknown): HomeFeedChip {
  if (chip === 'services') return 'sale';
  if (
    chip === 'all' ||
    chip === 'sale' ||
    chip === 'inspiration' ||
    chip === 'gezocht'
  ) {
    return chip;
  }
  return 'all';
}

export function normalizeDiscoveryDirection(value: unknown): DiscoveryDirection {
  return value === 'offer' ? 'offer' : 'want';
}

export function normalizePersistedAcceptedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return normalizeAcceptedTaxonomyIds(
    value.filter((v): v is string => typeof v === 'string'),
  );
}

/** Restore-safe migration for persisted home filter blobs. */
export function migrateHomeFilterPersist(raw: HomeFilterPersist) {
  const base = migrateHomeFeedPersist(raw);
  const legacy = migrateLegacyServicesViewChip(
    typeof base.feedChip === 'string' ? base.feedChip : null,
    typeof base.category === 'string' ? base.category : undefined,
  );
  return {
    ...base,
    feedChip: legacy?.chip ?? normalizeHomeFeedChip(base.feedChip),
    category: legacy?.category ?? normalizeDiscoveryCategorySlug(base.category),
    discoveryDirection: normalizeDiscoveryDirection(base.discoveryDirection),
    acceptedValues: normalizePersistedAcceptedValues(base.acceptedValues),
  };
}

export function snapshotHomeFilterPersist(input: {
  feedChip: HomeFeedChip;
  appliedRadius: number;
  appliedScope: FeedScope;
  appliedCategory: string;
  appliedSortBy: 'newest' | 'price' | 'views' | 'distance';
  appliedSortOrder: 'asc' | 'desc';
  appliedSearchQuery: string;
  appliedQ: string;
  appliedPlace: string;
  appliedPriceRange: { min: string; max: string };
  showFilters: boolean;
  discoveryDirection: DiscoveryDirection;
  appliedAcceptedValues: string[];
}): HomeFilterPersist {
  return {
    feedChip: input.feedChip,
    radius: input.appliedRadius,
    scope: input.appliedScope,
    category: input.appliedCategory,
    sortBy: input.appliedSortBy,
    sortOrder: input.appliedSortOrder,
    searchQuery: input.appliedSearchQuery,
    q: input.appliedQ.trim(),
    place: input.appliedPlace.trim().slice(0, 200),
    priceMin: input.appliedPriceRange.min,
    priceMax: input.appliedPriceRange.max,
    showFilters: input.showFilters,
    discoveryDirection: input.discoveryDirection,
    acceptedValues: input.appliedAcceptedValues,
  };
}
