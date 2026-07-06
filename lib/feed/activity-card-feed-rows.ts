/**
 * Interleave activity cards into discovery feed display rows.
 * Uses discovery.futureSlots.activity_cards — never inside section ranking.
 */

import type { DiscoveryFeedPayload } from './discovery-feed-contract';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';

export type ActivityCardDisplayRow = {
  row: 'activity_card';
  card: ActivityCardFeedItem;
};

export type FeedRowWithActivity<T> =
  | { row: 'section'; sectionId: string; titleKey: string }
  | { row: 'sale'; item: T }
  | { row: 'insp'; slot: unknown }
  | ActivityCardDisplayRow;

export function getActivityCardsFromDiscovery(
  discovery: DiscoveryFeedPayload | null | undefined,
): ActivityCardFeedItem[] {
  if (!discovery?.futureSlots?.length) return [];
  const slot = discovery.futureSlots.find(
    (s): s is Extract<typeof s, { kind: 'activity_cards'; enabled: true }> =>
      s.kind === 'activity_cards' && s.enabled === true,
  );
  return slot?.cards ?? [];
}

export function getActivityCardSlotMeta(
  discovery: DiscoveryFeedPayload | null | undefined,
): {
  maxVisible: number;
  mobileSlots: readonly number[];
  maxSession: number;
} {
  const slot = discovery?.futureSlots?.find((s) => s.kind === 'activity_cards');
  const mobileSlots =
    slot && slot.kind === 'activity_cards' && slot.enabled
      ? (slot.mobileSlots ?? ACTIVITY_CARD_MOBILE_INSERTION)
      : ACTIVITY_CARD_MOBILE_INSERTION;
  const maxVisible =
    slot && slot.kind === 'activity_cards' && slot.enabled
      ? slot.maxVisible
      : 1;
  const maxSession =
    slot && slot.kind === 'activity_cards'
      ? slot.insertion.maxPerSession
      : 2;
  return { maxVisible, mobileSlots, maxSession };
}

/**
 * Insert activity cards into mobile feed rows after Nth sale item.
 */
export function interleaveMobileActivityCards<T>(
  rows: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
    | { row: 'insp'; slot: unknown }
  >,
  cards: ActivityCardFeedItem[],
  mobileSlots: readonly number[],
  maxCards: number,
): FeedRowWithActivity<T>[] {
  if (cards.length === 0 || maxCards <= 0) return rows;

  const out: FeedRowWithActivity<T>[] = [];
  let saleIndex = 0;
  let cardsInserted = 0;
  let cardQueue = [...cards];

  for (const row of rows) {
    out.push(row as FeedRowWithActivity<T>);
    if (row.row !== 'sale') continue;
    saleIndex += 1;
    if (cardsInserted >= maxCards || cardQueue.length === 0) continue;
    if (!mobileSlots.includes(saleIndex)) continue;
    const card = cardQueue.shift()!;
    out.push({ row: 'activity_card', card });
    cardsInserted += 1;
  }

  return out;
}

/**
 * Desktop: insert one activity card after each discovery section header (max bands).
 */
export function interleaveDesktopActivityCards<T>(
  rows: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
    | { row: 'insp'; slot: unknown }
  >,
  cards: ActivityCardFeedItem[],
  maxBands: number,
): FeedRowWithActivity<T>[] {
  if (cards.length === 0 || maxBands <= 0) return rows;

  const out: FeedRowWithActivity<T>[] = [];
  let cardsInserted = 0;
  let cardQueue = [...cards];

  for (const row of rows) {
    out.push(row as FeedRowWithActivity<T>);
    if (row.row !== 'section') continue;
    if (cardsInserted >= maxBands || cardQueue.length === 0) continue;
    const card = cardQueue.shift()!;
    out.push({ row: 'activity_card', card });
    cardsInserted += 1;
  }

  return out;
}
