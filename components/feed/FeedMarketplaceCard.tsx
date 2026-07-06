'use client';

import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import { MarketplaceTileRouter } from '@/components/marketplace/tiles';
import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { resolveFeedItemHref } from '@/lib/feed/feed-item-href';
import type { MarketplaceTileMediaRatio } from '@/lib/marketplace/tiles';

type TFn = (key: string, params?: Record<string, string | number>) => string;

export type FeedMarketplaceCardVariant =
  | 'sale'
  | 'inspiration-feed'
  | 'inspiration-api';

export type FeedMarketplaceCardProps = {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TFn;
  variant: FeedMarketplaceCardVariant;
  inspirationApiItem?: InspirationItem;
  mediaRatio?: MarketplaceTileMediaRatio;
};

/**
 * Taxonomy-aware router — delegates to MarketplaceTileRouter (T1).
 */
export function FeedMarketplaceCard({
  item,
  baseUrl,
  t,
  variant,
  inspirationApiItem,
  mediaRatio,
}: FeedMarketplaceCardProps) {
  const mode =
    variant === 'sale' ? 'sale' : ('inspiration' as const);

  return (
    <MarketplaceTileRouter
      item={item}
      baseUrl={baseUrl}
      t={t}
      mode={mode}
      mediaRatio={mediaRatio}
      inspirationApiItem={inspirationApiItem}
    />
  );
}

/** Href for discover grid tiles — uses central resolver. */
export function feedMarketplaceItemHref(item: GeoFeedCardItem): string {
  return resolveFeedItemHref(item, item.taxonomy);
}
