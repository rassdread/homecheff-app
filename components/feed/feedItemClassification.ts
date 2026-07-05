/**
 * Prijs-gedreven feed-classificatie — re-exports voor backward compatibility.
 * Fase 5D: taxonomy + href in lib/feed/.
 */

import { hasValidSalePrice } from '@/lib/feed/feed-taxonomy';
import { isMarketplaceSaleItem } from '@/lib/feed/marketplace-sale';
import {
  getFeedItemHref,
  getInspirationFeedItemHref,
  getSaleItemHref,
  resolveFeedItemHref,
} from '@/lib/feed/feed-item-href';

export type { FeedClassifiable } from '@/lib/feed/feed-types';
export type { FeedTaxonomy } from '@/lib/feed/feed-taxonomy';

export { hasValidSalePrice, resolveFeedItemHref };

export type FeedItemKind = 'sale' | 'inspiration';

/** Legacy chip classificatie — uses central marketplace sale helper. */
export function classifyFeedItem(
  item: import('@/lib/feed/feed-types').FeedClassifiable
): FeedItemKind {
  return isMarketplaceSaleItem(item) ? 'sale' : 'inspiration';
}

export { getSaleItemHref, getInspirationFeedItemHref, getFeedItemHref };
