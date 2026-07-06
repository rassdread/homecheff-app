/**
 * Client helpers — apply server discovery feed order and section rows.
 */

import type { DiscoveryFeedPayload } from './discovery-feed-contract';
import {
  buildDiscoveryFeedDisplayRows,
  type FeedDisplayRow,
} from './discovery-section-insertion';

export type DiscoverySaleRow =
  | { row: 'section'; sectionId: string; titleKey: string }
  | { row: 'sale'; item: T }
  | { row: 'insp'; slot: unknown };

export function orderItemsFromDiscoveryFeed<T extends { id: string }>(
  items: T[],
  discovery: DiscoveryFeedPayload | null | undefined,
): T[] {
  if (!discovery?.orderedListingIds?.length) return items;
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of discovery.orderedListingIds) {
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

export function discoveryFeedActive(
  discovery: DiscoveryFeedPayload | null | undefined,
): boolean {
  return Boolean(discovery?.sections?.some((s) => s.listingIds.length > 0));
}

export function buildDiscoverySectionSaleRows<T extends { id: string }>(
  items: T[],
  discovery: DiscoveryFeedPayload | null | undefined,
  surface: 'mobile' | 'desktop',
): Array<
  | { row: 'section'; sectionId: string; titleKey: string }
  | { row: 'sale'; item: T }
> {
  if (!discovery || !discoveryFeedActive(discovery)) {
    return items.map((item) => ({ row: 'sale' as const, item }));
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const sectionListingIds = new Set(
    discovery.sections.flatMap((s) => s.listingIds),
  );
  const overflow = items
    .filter((i) => !sectionListingIds.has(i.id))
    .map((i) => i.id);

  const plan = {
    ...discovery.insertion,
    surface,
  };

  const displayRows = buildDiscoveryFeedDisplayRows(
    discovery.sections,
    [...overflow],
    plan,
  );

  const out: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
  > = [];

  for (const row of displayRows) {
    if (row.row === 'section') {
      out.push({
        row: 'section',
        sectionId: row.sectionId,
        titleKey: row.titleKey,
      });
      continue;
    }
    const item = byId.get(row.listingId);
    if (item) out.push({ row: 'sale', item });
  }

  return out;
}

export type { FeedDisplayRow };

/**
 * Interleave inspiration slots between discovery section sale cards.
 * Section headers stay in place; inspiration inserts after every N sale cards.
 */
export function interleaveDiscoverySectionsWithInspiration<
  T,
  S,
>(
  sectionRows: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
  >,
  inspirationSlots: S[],
  every = 4,
): Array<
  | { row: 'section'; sectionId: string; titleKey: string }
  | { row: 'sale'; item: T }
  | { row: 'insp'; slot: S }
> {
  if (inspirationSlots.length === 0) {
    return sectionRows;
  }
  const out: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
    | { row: 'insp'; slot: S }
  > = [];
  let saleCount = 0;
  let inspIdx = 0;
  for (const row of sectionRows) {
    out.push(row);
    if (row.row !== 'sale') continue;
    saleCount += 1;
    if (saleCount % every === 0 && inspIdx < inspirationSlots.length) {
      out.push({ row: 'insp', slot: inspirationSlots[inspIdx]! });
      inspIdx += 1;
    }
  }
  while (inspIdx < inspirationSlots.length) {
    out.push({ row: 'insp', slot: inspirationSlots[inspIdx]! });
    inspIdx += 1;
  }
  return out;
}
