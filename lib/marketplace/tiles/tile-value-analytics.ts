/**
 * Marketplace tile value-row analytics — Phase 5B-C.
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { MarketplaceTileModel } from './types';

export type TileValueAnalyticsDevice = 'desktop' | 'mobile';
export type TileValueAnalyticsSurface = 'feed' | 'profile' | 'favorites' | 'discovery' | 'other';

export function trackMarketplaceTileValueRowSeen(props: {
  listingId: string;
  listingKind: ListingKind;
  paymentMode: string;
  barterOpenness: string | null;
  acceptedValueCategoryCount: number;
  acceptedValueSubcategoryCount: number;
  surface: TileValueAnalyticsSurface;
  device: TileValueAnalyticsDevice;
}): void {
  trackEvent('marketplace_tile_value_row_seen', {
    listing_id: props.listingId,
    listing_kind: props.listingKind,
    payment_mode: props.paymentMode,
    barter_openness: props.barterOpenness ?? 'MONEY',
    accepted_value_category_count: props.acceptedValueCategoryCount,
    accepted_value_subcategory_count: props.acceptedValueSubcategoryCount,
    surface: props.surface,
    device: props.device,
  });
}

export function tileValueAnalyticsFromModel(
  model: MarketplaceTileModel,
  surface: TileValueAnalyticsSurface = 'feed',
  device: TileValueAnalyticsDevice = 'mobile',
): Parameters<typeof trackMarketplaceTileValueRowSeen>[0] {
  return {
    listingId: model.id,
    listingKind: model.listingKind,
    paymentMode: String(model.orderMethod ?? model.priceModel ?? 'unknown'),
    barterOpenness: model.barterOpenness,
    acceptedValueCategoryCount: model.acceptedValueCategories?.length ?? 0,
    acceptedValueSubcategoryCount: model.acceptedValueSubcategories?.length ?? 0,
    surface,
    device,
  };
}
