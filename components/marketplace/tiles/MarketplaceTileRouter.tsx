'use client';

import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { useNarrowViewport } from '@/hooks/useNarrowViewport';
import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { inspirationDetailHrefApi } from '@/components/feed/GeoFeedCards';
import { inspirationContentLabel } from '@/components/inspiratie/InspirationCard';
import { resolveFeedItemHref } from '@/lib/feed/feed-item-href';
import { deriveFeedTaxonomy } from '@/lib/feed/feed-taxonomy';
import {
  inspirationApiToCardItem,
  mapGeoFeedCardToTileModel,
  type MarketplaceTileMediaRatio,
  type MarketplaceTileVariant,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import MarketplaceTileCompact from '@/components/marketplace/tiles/MarketplaceTileCompact';
import MarketplaceTileStandard from '@/components/marketplace/tiles/MarketplaceTileStandard';

export type MarketplaceTileRouterProps = {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TranslateFn;
  mode: 'sale' | 'inspiration';
  /** Override auto variant selection when set. */
  variant?: MarketplaceTileVariant;
  mediaRatio?: MarketplaceTileMediaRatio;
  inspirationApiItem?: InspirationItem;
  href?: string;
};

function useMarketplaceTileVariant(
  override?: MarketplaceTileVariant,
): 'compact' | 'standard' {
  const nativeMounted = useIsNativeAppMounted();
  const narrowViewport = useNarrowViewport();
  const isMobileFeedUi = nativeMounted || narrowViewport;

  if (override === 'compact' || override === 'standard') return override;
  return isMobileFeedUi ? 'compact' : 'standard';
}

function resolveHref(
  item: GeoFeedCardItem,
  mode: 'sale' | 'inspiration',
  inspirationApiItem?: InspirationItem,
  hrefOverride?: string,
): string {
  if (hrefOverride) return hrefOverride;
  if (mode === 'inspiration' && inspirationApiItem) {
    return inspirationDetailHrefApi(inspirationApiItem);
  }
  return resolveFeedItemHref(item, item.taxonomy ?? deriveFeedTaxonomy(item));
}

function resolveInspirationLabel(
  item: GeoFeedCardItem,
  inspirationApiItem: InspirationItem | undefined,
  t: TranslateFn,
): string | undefined {
  if (inspirationApiItem) {
    return inspirationContentLabel(inspirationApiItem, t);
  }
  const cat = (item.category || 'CHEFF').toUpperCase() as InspirationItem['category'];
  return inspirationContentLabel({ category: cat } as InspirationItem, t);
}

/**
 * Single source of truth for feed/discovery tile variant selection.
 */
export default function MarketplaceTileRouter({
  item,
  baseUrl,
  t,
  mode,
  variant: variantOverride,
  mediaRatio,
  inspirationApiItem,
  href: hrefOverride,
}: MarketplaceTileRouterProps) {
  const variant = useMarketplaceTileVariant(variantOverride);
  const cardItem =
    mode === 'inspiration' && inspirationApiItem
      ? inspirationApiToCardItem(inspirationApiItem)
      : item;

  const href = resolveHref(item, mode, inspirationApiItem, hrefOverride);
  const inspirationCategoryLabel =
    mode === 'inspiration'
      ? resolveInspirationLabel(cardItem, inspirationApiItem, t)
      : undefined;

  const model = mapGeoFeedCardToTileModel(cardItem, {
    href,
    mode,
    inspirationCategoryLabel,
  });

  const effectiveMediaRatio: MarketplaceTileMediaRatio =
    mediaRatio ?? (variant === 'compact' ? '4:5' : '4:3');

  if (variant === 'standard') {
    return (
      <MarketplaceTileStandard model={model} t={t} baseUrl={baseUrl} />
    );
  }

  return (
    <MarketplaceTileCompact
      model={model}
      t={t}
      mediaRatio={effectiveMediaRatio}
    />
  );
}
