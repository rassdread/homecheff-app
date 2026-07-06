/**
 * Interleave exchange suggestion feed inserts — Phase 4G.
 * Timed inserts only; never inside discovery ranking.
 */

import type { ExchangeSuggestionCard } from '@/lib/marketplace/exchange-suggestions';
import { EXCHANGE_SUGGESTION_CAPS } from '@/lib/marketplace/exchange-suggestions';

export type ExchangeFeedInsertRow = {
  row: 'exchange_feed_insert';
  card: ExchangeSuggestionCard;
  position: number;
};

export type FeedRowWithExchangeInsert<T> =
  | { row: 'section'; sectionId: string; titleKey: string }
  | { row: 'sale'; item: T }
  | { row: 'insp'; slot: unknown }
  | ExchangeFeedInsertRow
  | { row: string; [key: string]: unknown };

export const EXCHANGE_FEED_INSERT_INTERVAL =
  EXCHANGE_SUGGESTION_CAPS.feedInsertListingInterval;

/**
 * Insert one exchange suggestion after every Nth sale row.
 * Max inserts per session enforced by caller via card queue length.
 */
export function interleaveExchangeFeedInserts<T>(
  rows: Array<
    | { row: 'section'; sectionId: string; titleKey: string }
    | { row: 'sale'; item: T }
    | { row: 'insp'; slot: unknown }
    | { row: string; [key: string]: unknown }
  >,
  cards: ExchangeSuggestionCard[],
  maxInserts: number,
): FeedRowWithExchangeInsert<T>[] {
  if (cards.length === 0 || maxInserts <= 0) return rows as FeedRowWithExchangeInsert<T>[];

  const out: FeedRowWithExchangeInsert<T>[] = [];
  let saleIndex = 0;
  let insertsPlaced = 0;
  const seenIds = new Set<string>();
  let cardQueue = [...cards];

  for (const row of rows) {
    out.push(row as FeedRowWithExchangeInsert<T>);
    if (row.row !== 'sale') continue;
    saleIndex += 1;
    if (insertsPlaced >= maxInserts || cardQueue.length === 0) continue;
    if (saleIndex % EXCHANGE_FEED_INSERT_INTERVAL !== 0) continue;

    let card = cardQueue.shift();
    while (card && seenIds.has(card.id)) {
      card = cardQueue.shift();
    }
    if (!card) continue;

    seenIds.add(card.id);
    out.push({
      row: 'exchange_feed_insert',
      card,
      position: insertsPlaced,
    });
    insertsPlaced += 1;
  }

  return out;
}
