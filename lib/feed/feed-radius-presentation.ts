/**
 * Presentation helpers for Nearby radius stage boundaries.
 *
 * Composition may still build a progressive local+wider pool; these helpers
 * keep exact-radius presentation honest and preserve local-first when sorting.
 */

import {
  composeProgressiveNearbySalePool,
} from '@/lib/feed/feed-composition-policy';
import {
  sortFeedSaleItems,
  type FeedClientSortField,
  type FeedClientSortOrder,
  type FeedSortableSale,
} from '@/lib/feed/feed-client-sort';
import { isLocalFeedItem } from '@/lib/geo/feed-radius-filter';

/**
 * Sort in-radius and outside-radius pools independently, then concatenate
 * local-first. Prevents distance/newest/price sorts from pulling 170km items
 * above valid nearby rows.
 */
export function sortProgressiveNearbyPoolsPreservingLocalFirst<
  T extends FeedSortableSale,
>(input: {
  local: readonly T[];
  wider: readonly T[];
  sortBy: FeedClientSortField;
  sortOrder: FeedClientSortOrder;
}): T[] {
  return composeProgressiveNearbySalePool({
    local: sortFeedSaleItems([...input.local], input.sortBy, input.sortOrder),
    wider: sortFeedSaleItems([...input.wider], input.sortBy, input.sortOrder),
  });
}

export type RadiusPresentationRowDistance = {
  distanceKm?: number | null;
};

/**
 * Resolve a distance for sale / inspiration-shaped feed rows.
 * Returns null when the row is not a distance-bearing listing row.
 */
export function feedRowDistanceKm(row: {
  row: string;
  item?: RadiusPresentationRowDistance & { distanceKm?: number };
  slot?: {
    kind?: string;
    item?:
      | (RadiusPresentationRowDistance & {
          distanceKm?: number;
          location?: { distanceKm?: number | null };
        })
      | null;
  };
}): number | null | undefined {
  if (row.row === 'sale' && row.item) {
    return row.item.distanceKm;
  }
  if (row.row === 'insp' && row.slot?.item) {
    const item = row.slot.item;
    if (
      item.location &&
      typeof item.location === 'object' &&
      'distanceKm' in item.location
    ) {
      return item.location.distanceKm;
    }
    return item.distanceKm;
  }
  return undefined;
}

export function isDistanceBearingFeedRow(row: { row: string }): boolean {
  return row.row === 'sale' || row.row === 'insp';
}

/**
 * Split composed feed rows into exact (in-radius) vs widened presentation.
 * Non-listing rows (activity/economy/etc.) stay with the exact stage so they
 * do not create a false "far" jump before the continuity band.
 */
export function splitFeedRowsByRadiusMembership<
  T extends { row: string },
>(
  rows: readonly T[],
  radiusKm: number,
): { exact: T[]; widened: T[] } {
  const exact: T[] = [];
  const widened: T[] = [];

  for (const row of rows) {
    if (!isDistanceBearingFeedRow(row)) {
      exact.push(row);
      continue;
    }
    const distanceKm = feedRowDistanceKm(
      row as T & {
        item?: RadiusPresentationRowDistance;
        slot?: {
          item?: RadiusPresentationRowDistance & {
            location?: { distanceKm?: number | null };
          };
        };
      },
    );
    if (isLocalFeedItem(distanceKm, radiusKm)) {
      exact.push(row);
    } else {
      widened.push(row);
    }
  }

  return { exact, widened };
}

/** Dedupe continuity/widened rows that already appeared in the exact stage. */
export function dedupeFeedRowsByListingId<
  T extends {
    row: string;
    item?: { id?: string };
    slot?: { item?: { id?: string } };
  },
>(rows: readonly T[], seenIds: ReadonlySet<string>): T[] {
  return rows.filter((row) => {
    const id =
      row.row === 'sale'
        ? row.item?.id
        : row.row === 'insp'
          ? row.slot?.item?.id
          : null;
    if (!id) return true;
    return !seenIds.has(id);
  });
}

/**
 * Paint rows for the post-band widened stage.
 *
 * Outside-radius / continuity discovery must not repeat exact-stage listing
 * ids. Historical recirculation intentionally re-shows those ids and must
 * NEVER be deduped against the exact set — that was the endless-feed runtime
 * regression after unique inventory exhaustion.
 */
export function composeWidenedStageRowsForPaint<
  T extends {
    row: string;
    item?: { id?: string };
    slot?: { item?: { id?: string } };
  },
>(input: {
  widenedRows: readonly T[];
  continuityRows: readonly T[];
  recirculatedRows: readonly T[];
  exactIds: ReadonlySet<string>;
}): T[] {
  const discovery = dedupeFeedRowsByListingId(
    [...input.widenedRows, ...input.continuityRows],
    input.exactIds,
  );
  return [...discovery, ...input.recirculatedRows];
}

export function collectFeedRowListingIds<
  T extends {
    row: string;
    item?: { id?: string };
    slot?: { item?: { id?: string } };
  },
>(rows: readonly T[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.row === 'sale' && row.item?.id) ids.add(row.item.id);
    else if (row.row === 'insp' && row.slot?.item?.id) {
      ids.add(row.slot.item.id);
    }
  }
  return ids;
}
