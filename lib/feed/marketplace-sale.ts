/**
 * Central marketplace sale classification — API debug, GeoFeed chip filter, empty states.
 * Single source of truth for "Te koop" visibility.
 */

import { deriveFeedTaxonomy, type FeedTaxonomy } from '@/lib/feed/feed-taxonomy';
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
  type?: string | null;
  kind?: string | null;
  feedSource?: MarketplaceSaleSource;
  taxonomy?: FeedTaxonomy;
  status?: string | null;
  isActive?: boolean | null;
  isPublic?: boolean | null;
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

/**
 * True when an item belongs in the Te koop / marketplace sale feed.
 * Does not treat feedSource=PRODUCT alone as sale (requires taxonomy, price, or contact).
 */
export function isMarketplaceSaleItem(item: MarketplaceSaleInput): boolean {
  if (item.taxonomy?.direction === 'OFFER' && item.taxonomy?.kind === 'PRODUCT') {
    return true;
  }

  const priceCents = resolveMarketplacePriceCents(item);
  if (priceCents != null && priceCents > 0) return true;

  if (isContactOnlyProduct(item)) return true;

  if (explicitKind(item) === 'LISTING' && priceCents != null && priceCents > 0) {
    return true;
  }

  const tax = deriveFeedTaxonomy({
    priceCents,
    orderMethod: item.orderMethod,
    category: null,
    type: item.type,
  });
  return tax.direction === 'OFFER' && tax.kind === 'PRODUCT';
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
    taxonomyKind: item.taxonomy?.kind ?? null,
    isSale: isMarketplaceSaleItem(item),
  }));
}
