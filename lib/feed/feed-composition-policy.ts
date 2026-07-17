/**
 * Unified HomeCheff feed composition policy.
 *
 * Centralizes mix ratio, filter compatibility, geo eligibility for inspiration,
 * and controlled recirculation rules. Do not duplicate these constants in
 * first-paint vs pagination paths.
 */

import {
  isEligibleForNationalFeedScope,
  isKingdomCaribbeanPlaceLabel,
  type GeoCoords,
} from '@/lib/geo/netherlands-mainland';
import { haversineKm } from '@/lib/community/geoDistance';

/** Marketplace tiles between inspiration inserts (≈ 3–5 sales, then 1 insp). */
export const FEED_SALE_INSPIRATION_STRIDE = 4;

/**
 * Recirculation may start from a single unique seed.
 * 0 seeds → intentional empty state (no recirculation, no request loop).
 */
export const FEED_RECIRC_MIN_SEED = 1;

/** Target minimum gap between two occurrences of the same id (positions). */
export const FEED_RECIRC_MIN_SPACING = 6;

/** Max recirculated rows appended per load-more tick (bounded). */
export const FEED_RECIRC_BATCH_SIZE = 8;

/** Soft cap on retained display history for recirculation memory. */
export const FEED_RECIRC_HISTORY_CAP = 120;

/**
 * Inventory-size continuation contract.
 *
 * 0  → empty state; never recirculate or request-loop
 * 1  → spaced single-seed recirculation (1 card per batch)
 * 2  → safe alternation; no consecutive duplicate; flip order across batches
 * 3+ → least-recent + spacing policy
 */
export type InventoryContinuationMode =
  | 'empty_state'
  | 'single_seed_spaced'
  | 'pair_alternate'
  | 'standard_recirc';

export function resolveInventoryContinuationMode(
  uniqueEligibleCount: number,
): InventoryContinuationMode {
  if (uniqueEligibleCount <= 0) return 'empty_state';
  if (uniqueEligibleCount === 1) return 'single_seed_spaced';
  if (uniqueEligibleCount === 2) return 'pair_alternate';
  return 'standard_recirc';
}

export type FeedCompositionStage =
  | 'exact'
  | 'broadened'
  | 'recirculation'
  | 'empty';

/**
 * Filter compatibility matrix (product contract).
 *
 * appliesTo: marketplace | inspiration | both | ranking_only
 * notes: semantic meaning when filter does not apply to inspiration
 */
export const FEED_FILTER_COMPATIBILITY = [
  {
    filter: 'scope',
    appliesTo: 'both' as const,
    notes: 'Nearby/National/International geographic integrity for all tiles',
  },
  {
    filter: 'radius',
    appliesTo: 'both' as const,
    notes: 'Nearby only; inspiration without trustworthy coords excluded',
  },
  {
    filter: 'category / vertical (HomeCheff / Garden / Designer)',
    appliesTo: 'both' as const,
    notes: 'When metadata exists on the item',
  },
  {
    filter: 'search query (q / refine)',
    appliesTo: 'both' as const,
    notes: 'Text match on title/description/tags',
  },
  {
    filter: 'price min/max',
    appliesTo: 'marketplace' as const,
    notes: 'Inspiration remains eligible unless chip is sale-only',
  },
  {
    filter: 'feedChip=sale',
    appliesTo: 'marketplace' as const,
    notes: 'Explicit purchasable-only mode — hides inspiration by design',
  },
  {
    filter: 'feedChip=inspiration',
    appliesTo: 'inspiration' as const,
    notes: 'Inspiration-only view',
  },
  {
    filter: 'sort / discovery ranking',
    appliesTo: 'ranking_only' as const,
    notes: 'Does not exclude inspiration from the composed feed',
  },
  {
    filter: 'accepted values / discovery direction',
    appliesTo: 'marketplace' as const,
    notes: 'Reverse-discovery on sale offers',
  },
  {
    filter: 'delivery / pickup / dietary',
    appliesTo: 'marketplace' as const,
    notes: 'Purchase semantics; apply to inspiration only when metadata exists',
  },
] as const;

export type InspirationGeoInput = {
  lat?: number | null;
  lng?: number | null;
  place?: string | null;
};

export function inspirationCoords(
  input: InspirationGeoInput,
): GeoCoords | null {
  const lat = input.lat;
  const lng = input.lng;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return { lat, lng };
  }
  return null;
}

/**
 * Geographic eligibility for inspiration under the active scope.
 *
 * Nearby: requires trustworthy coords within radius (no worldwide fallback).
 * National: mainland NL contract (place/coords); Caribbean labels excluded.
 * International: all inspiration eligible.
 */
export function inspirationEligibleForFeedScope(input: {
  scope: string;
  item: InspirationGeoInput;
  viewer?: GeoCoords | null;
  radiusKm?: number;
}): boolean {
  const scope = input.scope;
  const coords = inspirationCoords(input.item);
  const place = input.item.place ?? null;

  if (scope === 'international') return true;

  if (scope === 'national') {
    return isEligibleForNationalFeedScope({
      coords,
      place,
      countryCode: null,
      isMarketplaceSale: false,
    });
  }

  if (scope === 'nearby') {
    // Product: no trustworthy location → exclude from Nearby (documented).
    if (!coords) return false;
    if (isKingdomCaribbeanPlaceLabel(place)) return false;
    const viewer = input.viewer;
    const radius = input.radiusKm ?? 0;
    if (!viewer || !(radius > 0)) return false;
    const d = haversineKm(viewer.lat, viewer.lng, coords.lat, coords.lng);
    return Number.isFinite(d) && d <= radius + 0.05;
  }

  return true;
}

export type ComposedRowKind = 'sale' | 'insp';

export type RecircSeedItem = {
  id: string;
  kind: ComposedRowKind;
};

/**
 * Interleave sales with inspiration at FEED_SALE_INSPIRATION_STRIDE.
 * Never reserves an empty inspiration slot.
 */
export function interleaveSaleInspirationRows<TSale, TInsp>(input: {
  sales: TSale[];
  inspiration: TInsp[];
  stride?: number;
}): Array<{ row: 'sale'; item: TSale } | { row: 'insp'; item: TInsp }> {
  const stride = Math.max(1, input.stride ?? FEED_SALE_INSPIRATION_STRIDE);
  const out: Array<
    { row: 'sale'; item: TSale } | { row: 'insp'; item: TInsp }
  > = [];
  let si = 0;
  let ii = 0;
  let streak = 0;

  while (si < input.sales.length) {
    out.push({ row: 'sale', item: input.sales[si++] });
    streak++;
    if (streak >= stride && ii < input.inspiration.length) {
      out.push({ row: 'insp', item: input.inspiration[ii++] });
      streak = 0;
    }
  }
  while (ii < input.inspiration.length) {
    out.push({ row: 'insp', item: input.inspiration[ii++] });
  }
  return out;
}

/**
 * Build a recirculation batch from previously shown eligible items.
 *
 * Inventory contract:
 * - 0 seeds → [] (caller shows empty state; no loop)
 * - 1 seed  → at most 1 card (viewport spacing via load-more batches)
 * - 2 seeds → alternate; never consecutive; flip order across batches
 * - 3+      → least-recent + min spacing + kind rotation
 */
export function buildRecirculationBatch(input: {
  seeds: RecircSeedItem[];
  recentIds: string[];
  lastDisplayedId: string | null;
  take?: number;
  minSpacing?: number;
  /** Increments each recirculation tick — used to flip pair order. */
  batchIndex?: number;
}): RecircSeedItem[] {
  const uniqueIds = [...new Set(input.seeds.map((s) => s.id))];
  const mode = resolveInventoryContinuationMode(uniqueIds.length);
  if (mode === 'empty_state') return [];

  // Deduplicate seeds by id (first occurrence wins for kind).
  const byId = new Map<string, RecircSeedItem>();
  for (const seed of input.seeds) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  const uniqueSeeds = [...byId.values()];

  if (mode === 'single_seed_spaced') {
    const only = uniqueSeeds[0];
    if (!only) return [];
    // One card per tick — avoids double-render in the same viewport.
    return [only];
  }

  if (mode === 'pair_alternate') {
    const [a, b] = uniqueSeeds;
    if (!a || !b) return uniqueSeeds.slice(0, 1);
    // One card per tick, alternating — avoids A-B viewport bursts and consecutive IDs.
    const flip = (input.batchIndex ?? 0) % 2 === 1;
    let pick = flip ? b : a;
    if (input.lastDisplayedId && pick.id === input.lastDisplayedId) {
      pick = pick.id === a.id ? b : a;
    }
    return [pick];
  }

  // standard_recirc (3+)
  const take = Math.max(1, input.take ?? FEED_RECIRC_BATCH_SIZE);
  const minSpacing = input.minSpacing ?? FEED_RECIRC_MIN_SPACING;
  const recent = input.recentIds.slice(-Math.max(minSpacing, 1));
  const recentSet = new Set(recent);
  const out: RecircSeedItem[] = [];
  let lastId = input.lastDisplayedId;
  let lastKind: ComposedRowKind | null = null;

  const scored = uniqueSeeds.map((seed, idx) => {
    const lastIdx = input.recentIds.lastIndexOf(seed.id);
    return { seed, lastIdx, idx };
  });
  scored.sort((a, b) => {
    if (a.lastIdx !== b.lastIdx) return a.lastIdx - b.lastIdx;
    return a.idx - b.idx;
  });

  const tryPick = (preferKindFlip: boolean): RecircSeedItem | null => {
    for (const { seed } of scored) {
      if (seed.id === lastId) continue;
      if (recentSet.has(seed.id) && scored.length > minSpacing) continue;
      if (preferKindFlip && lastKind && seed.kind === lastKind) continue;
      return seed;
    }
    for (const { seed } of scored) {
      if (seed.id === lastId) continue;
      return seed;
    }
    return scored[0]?.seed ?? null;
  };

  for (let i = 0; i < take; i++) {
    const pick = tryPick(i > 0);
    if (!pick) break;
    if (pick.id === lastId && out.length > 0) {
      const alt = scored.find((s) => s.seed.id !== lastId)?.seed;
      if (!alt) break;
      out.push(alt);
      lastId = alt.id;
      lastKind = alt.kind;
      recentSet.add(alt.id);
      continue;
    }
    out.push(pick);
    lastId = pick.id;
    lastKind = pick.kind;
    recentSet.add(pick.id);
  }

  return out;
}

export function trimDisplayHistory<T extends { id: string }>(
  history: T[],
  cap = FEED_RECIRC_HISTORY_CAP,
): T[] {
  if (history.length <= cap) return history;
  return history.slice(history.length - cap);
}
