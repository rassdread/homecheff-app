/**
 * Prijs-gedreven feed-classificatie — re-exports voor backward compatibility.
 * Fase 5D: taxonomy + href in lib/feed/.
 */

import {
  deriveFeedTaxonomy,
  hasValidSalePrice,
  taxonomyToLegacyFeedKind,
} from '@/lib/feed/feed-taxonomy';
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

/** Legacy chip classificatie — derived from taxonomy, not authoritative. */
export function classifyFeedItem(
  item: import('@/lib/feed/feed-types').FeedClassifiable
): FeedItemKind {
  const tax = item.taxonomy ?? deriveFeedTaxonomy(item);
  return taxonomyToLegacyFeedKind(tax);
}

export { getSaleItemHref, getInspirationFeedItemHref, getFeedItemHref };
