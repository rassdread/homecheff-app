/**
 * Per-query trust snapshot timing (Phase 3C).
 */

export type TrustSnapshotQueryTiming = {
  key: string;
  label: string;
  wallMs: number;
  prismaMs: number;
  queryCount: number;
  models: string[];
  mode: 'batch' | 'per-seller';
  requiredForTile: boolean;
};

export type TrustSnapshotTimingReport = {
  totalWallMs: number;
  prismaTotalMs: number;
  queryCount: number;
  sellerCount: number;
  mode: 'minimal' | 'full';
  queries: TrustSnapshotQueryTiming[];
  assemblyMs: number;
};

export const TRUST_MINIMAL_TILE_QUERY_KEYS = [
  'seller_profiles',
  'delivery_profiles',
  'seller_products',
  'active_listings',
  'deal_reviews',
  'product_reviews',
  'delivery_reviews',
  'completed_as_seller',
  'completed_deliveries',
  'order_items',
  'repeat_customers_seller',
  'trust_badges',
] as const;

export const TRUST_EXTENDED_QUERY_KEYS = [
  'completed_as_buyer',
  'repeat_customers_buyer',
  'reviews_left_product',
  'reviews_left_deal',
  'reviews_left_delivery',
] as const;
