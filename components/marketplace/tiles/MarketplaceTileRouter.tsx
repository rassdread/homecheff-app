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
  type MarketplaceTileModel,
  type MarketplaceTileVariant,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import MarketplaceTileCompact from '@/components/marketplace/tiles/MarketplaceTileCompact';
import MarketplaceTileStandard from '@/components/marketplace/tiles/MarketplaceTileStandard';
import MarketplaceTileMini from '@/components/marketplace/tiles/MarketplaceTileMini';
import MarketplaceTileSidebar from '@/components/marketplace/tiles/MarketplaceTileSidebar';

export type MarketplaceTileRouterProps = {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TranslateFn;
  mode: 'sale' | 'inspiration';
  variant?: MarketplaceTileVariant;
  mediaRatio?: MarketplaceTileMediaRatio;
  inspirationApiItem?: InspirationItem;
  href?: string;
  /** Pass pre-built model for profile/favorites surfaces. */
  model?: MarketplaceTileModel;
  locale?: string;
  imageLoading?: 'lazy' | 'eager';
};

function useAutoFeedVariant(): 'compact' | 'standard' {
  const nativeMounted = useIsNativeAppMounted();
  const narrowViewport = useNarrowViewport();
  return nativeMounted || narrowViewport ? 'compact' : 'standard';
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

export default function MarketplaceTileRouter({
  item,
  baseUrl,
  t,
  mode,
  variant: variantOverride,
  mediaRatio,
  inspirationApiItem,
  href: hrefOverride,
  model: modelOverride,
  locale,
  imageLoading = 'lazy',
}: MarketplaceTileRouterProps) {
  const autoVariant = useAutoFeedVariant();
  const variant = variantOverride ?? autoVariant;

  const cardItem =
    mode === 'inspiration' && inspirationApiItem
      ? inspirationApiToCardItem(inspirationApiItem)
      : item;

  const href = resolveHref(item, mode, inspirationApiItem, hrefOverride);
  const inspirationCategoryLabel =
    mode === 'inspiration'
      ? resolveInspirationLabel(cardItem, inspirationApiItem, t)
      : undefined;

  const model =
    modelOverride ??
    mapGeoFeedCardToTileModel(cardItem, {
      href,
      mode,
      inspirationCategoryLabel,
    });

  if (variant === 'mini') {
    return <MarketplaceTileMini model={model} t={t} locale={locale} />;
  }

  if (variant === 'sidebar') {
    return <MarketplaceTileSidebar model={model} t={t} locale={locale} />;
  }

  if (variant === 'standard') {
    return (
      <MarketplaceTileStandard
        model={model}
        t={t}
        baseUrl={baseUrl}
        locale={locale}
        imageLoading={imageLoading}
      />
    );
  }

  const effectiveMediaRatio: MarketplaceTileMediaRatio =
    mediaRatio ?? '4:5';

  return (
    <MarketplaceTileCompact
      model={model}
      t={t}
      mediaRatio={effectiveMediaRatio}
      locale={locale}
      imageLoading={imageLoading}
    />
  );
}
