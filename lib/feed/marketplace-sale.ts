/**
 * Central marketplace sale classification — API debug, GeoFeed chip filter, empty states.
 * Single source of truth for "Te koop" visibility.
 */

import type { FeedTaxonomy } from '@/lib/feed/feed-taxonomy';
import {
  isOfferListing,
  isRequestListing,
} from '@/lib/marketplace/product-visibility';
import { isContactOnlyProduct } from '@/lib/product/order-method';

export type MarketplaceSaleSource =
  | 'PRODUCT'
  | 'LISTING'
  | 'DISH'
  | string
  | null
  | undefined;

export type MarketplaceSaleInput = {
  id?: string | null;
  priceCents?: number | null;
  /** Legacy cents or euro field from older payloads. */
  price?: number | null;
  orderMethod?: string | null;
  listingIntent?: string | null;
  priceModel?: string | null;
  type?: string | null;
  kind?: string | null;
  feedSource?: MarketplaceSaleSource;
  listingKind?: string | null;
  taxonomy?: FeedTaxonomy;
  status?: string | null;
  isActive?: boolean | null;
  isPublic?: boolean | null;
  /** Phase 1C: canonical classification — preferred over heuristics. */
  discovery?: { listingKind?: string | null; listingIntent?: string | null } | null;
};

/** Resolve price in cents from mixed API shapes. */
export function resolveMarketplacePriceCents(
  item: MarketplaceSaleInput
): number | null {
  const raw = item.priceCents;
  if (raw != null && raw !== '' && typeof raw !== 'object') {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.round(n);
  }
  const legacy = item.price;
  if (legacy != null && legacy !== '' && typeof legacy !== 'object') {
    const n = Number(legacy);
    if (!Number.isFinite(n)) return null;
    return n >= 100 ? Math.round(n) : Math.round(n * 100);
  }
  return null;
}

function explicitKind(item: MarketplaceSaleInput): string {
  return String(item.kind ?? item.type ?? item.feedSource ?? '')
    .trim()
    .toUpperCase();
}

function isMarketplaceProductLike(item: MarketplaceSaleInput): boolean {
  const kind = explicitKind(item);
  return (
    item.feedSource === 'PRODUCT' ||
    kind === 'PRODUCT' ||
    kind === 'LISTING'
  );
}

function isInspirationFeedItem(item: MarketplaceSaleInput): boolean {
  if (item.discovery?.listingKind === 'INSPIRATION') return true;
  const source = String(item.feedSource ?? item.type ?? item.kind ?? '')
    .trim()
    .toUpperCase();
  if (source === 'DISH') return true;
  if (item.listingKind === 'INSPIRATION') return true;
  if (item.taxonomy?.kind === 'INSPIRATION') return true;
  return false;
}

/**
 * True when an item belongs in the Te koop / marketplace sale feed.
 * Uses discovery.listingKind when present; otherwise legacy listingIntent rules.
 */
export function isMarketplaceSaleItem(item: MarketplaceSaleInput): boolean {
  if (item.discovery?.listingKind === 'INSPIRATION') return false;
  if (item.discovery?.listingKind === 'REQUEST') return false;
  if (isInspirationFeedItem(item)) return false;
  if (isRequestListing(item)) return false;
  if (item.discovery?.listingIntent === 'REQUEST') return false;
  if (item.taxonomy?.direction === 'REQUEST') return false;

  if (item.taxonomy?.direction === 'OFFER' && item.taxonomy?.kind === 'PRODUCT') {
    return true;
  }

  if (isOfferListing(item) && isMarketplaceProductLike(item)) {
    return true;
  }

  const priceCents = resolveMarketplacePriceCents(item);
  if (priceCents != null && priceCents > 0) return true;

  if (isContactOnlyProduct(item)) return true;

  return false;
}

export function countMarketplaceSaleItems(
  items: MarketplaceSaleInput[]
): number {
  return items.filter(isMarketplaceSaleItem).length;
}

export function marketplaceSaleAuditSample(
  items: MarketplaceSaleInput[],
  limit = 5
): Array<Record<string, unknown>> {
  return items.slice(0, limit).map((item) => ({
    id: item.id,
    priceCents: resolveMarketplacePriceCents(item),
    orderMethod: item.orderMethod ?? null,
    feedSource: item.feedSource ?? explicitKind(item) ?? null,
    listingIntent: item.listingIntent ?? null,
    priceModel: item.priceModel ?? null,
    listingKind: item.listingKind ?? null,
    taxonomyKind: item.taxonomy?.kind ?? null,
    isSale: isMarketplaceSaleItem(item),
  }));
}
