/**
 * Value-row impression telemetry is not part of the marketplace funnel.
 * It fired once per tile mount and attached a listing id, so it is not sent.
 */

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
  void props;
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
