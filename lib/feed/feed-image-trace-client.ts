import { isFeedPerfBaselineEnabled } from '@/lib/feed/feed-performance-baseline';
import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { mapGeoFeedCardToTileModel } from '@/lib/marketplace/tiles/map-to-tile-model';

export type FeedImageTraceRow = {
  id: string;
  feedSource: string | null;
  rawProductImage: string | null;
  linkedDishPhoto: string | null;
  mappedImage: string | null;
  discoveryCoverImage: string | null;
  tileResolvedSrc: string | null;
};

function resolveTileCoverSrc(item: GeoFeedCardItem): string | null {
  return item.discovery?.coverImage ?? item.photo ?? null;
}

/**
 * Opt-in client trace — logs once per feed payload when perf baseline is enabled.
 */
export function logFeedImageTrace(
  rawItems: Record<string, unknown>[],
  cardItems: GeoFeedCardItem[],
  serverTrace?: FeedImageTraceRow[] | null,
): void {
  if (!isFeedPerfBaselineEnabled()) return;
  const rows = cardItems.slice(0, 20).map((card, index) => {
    const raw = rawItems[index] ?? {};
    const tileResolvedSrc = resolveTileCoverSrc(card);
    const serverRow = serverTrace?.find((r) => r.id === card.id);
    return {
      id: card.id,
      feedSource:
        serverRow?.feedSource ??
        (raw.feedSource != null ? String(raw.feedSource) : null),
      rawProductImage: serverRow?.rawProductImage ?? null,
      linkedDishPhoto: serverRow?.linkedDishPhoto ?? null,
      mappedImage:
        (typeof raw.image === 'string' ? raw.image : null) ??
        serverRow?.mappedImage ??
        card.photo,
      discoveryCoverImage:
        card.discovery?.coverImage ??
        serverRow?.discoveryCoverImage ??
        null,
      tileResolvedSrc,
    };
  });
  console.info('[HC-PERF] feed:image-trace', rows);
}

export function resolveTileModelCoverForDebug(
  item: GeoFeedCardItem,
  href: string,
): string | null {
  return mapGeoFeedCardToTileModel(item, { href, mode: 'sale' }).coverImage;
}
