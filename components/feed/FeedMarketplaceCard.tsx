'use client';

import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import {
  FeedInspirationCardApi,
  FeedInspirationCardFeed,
  FeedSaleCard,
  type GeoFeedCardItem,
} from '@/components/feed/GeoFeedCards';
import { resolveFeedItemHref } from '@/lib/feed/feed-item-href';
import {
  deriveFeedTaxonomy,
  type FeedTaxonomy,
} from '@/lib/feed/feed-taxonomy';

type TFn = (key: string, params?: Record<string, string | number>) => string;

export type FeedMarketplaceCardVariant =
  | 'sale'
  | 'inspiration-feed'
  | 'inspiration-api';

export type FeedMarketplaceCardProps = {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TFn;
  /** Which renderer to use (derived from row layout until full taxonomy routing). */
  variant: FeedMarketplaceCardVariant;
  inspirationApiItem?: InspirationItem;
};

function resolveCardTaxonomy(item: GeoFeedCardItem): FeedTaxonomy {
  return item.taxonomy ?? deriveFeedTaxonomy(item);
}

/**
 * Thin taxonomy-aware router — delegates to existing sale/inspiration cards.
 * REQUEST cards — TODO(Fase 5E+).
 */
export function FeedMarketplaceCard({
  item,
  baseUrl,
  t,
  variant,
  inspirationApiItem,
}: FeedMarketplaceCardProps) {
  const taxonomy = resolveCardTaxonomy(item);

  if (taxonomy.direction === 'REQUEST') {
    return <FeedSaleCard item={item} baseUrl={baseUrl} t={t} />;
  }

  switch (variant) {
    case 'sale':
      return <FeedSaleCard item={item} baseUrl={baseUrl} t={t} />;
    case 'inspiration-api':
      if (!inspirationApiItem) return null;
      return (
        <FeedInspirationCardApi
          item={inspirationApiItem}
          baseUrl={baseUrl}
          t={t}
        />
      );
    case 'inspiration-feed':
    default:
      return <FeedInspirationCardFeed item={item} baseUrl={baseUrl} t={t} />;
  }
}

/** Href for discover grid tiles — uses central resolver. */
export function feedMarketplaceItemHref(item: GeoFeedCardItem): string {
  return resolveFeedItemHref(item, item.taxonomy);
}
